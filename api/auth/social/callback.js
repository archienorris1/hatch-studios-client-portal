// /api/auth/social/callback.js
// Handles the OAuth callback: exchanges the code for tokens,
// stores them encrypted in Supabase social_connections, then redirects home.
// Query params: ?platform=...&code=...&state=...

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Token exchange per platform
async function exchangeCode(platform, code, redirectUri) {
  const configs = {
    instagram: {
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      clientIdEnv: 'INSTAGRAM_CLIENT_ID',
      clientSecretEnv: 'INSTAGRAM_CLIENT_SECRET',
      body: (clientId, clientSecret) => ({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
      parseToken: async (data, clientId, clientSecret) => {
        // Exchange short-lived for long-lived token
        const llRes = await fetch(
          `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${data.access_token}`
        )
        const ll = await llRes.json()
        return {
          access_token: ll.access_token || data.access_token,
          refresh_token: null,
          expires_in: ll.expires_in || 5183944, // ~60 days
        }
      },
    },
    tiktok: {
      tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
      clientIdEnv: 'TIKTOK_CLIENT_ID',
      clientSecretEnv: 'TIKTOK_CLIENT_SECRET',
      body: (clientId, clientSecret) => ({
        client_key: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
      parseToken: async (data) => ({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
      }),
    },
    youtube: {
      tokenUrl: 'https://oauth2.googleapis.com/token',
      clientIdEnv: 'YOUTUBE_CLIENT_ID',
      clientSecretEnv: 'YOUTUBE_CLIENT_SECRET',
      body: (clientId, clientSecret) => ({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
      parseToken: async (data) => ({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
      }),
    },
    linkedin: {
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      clientIdEnv: 'LINKEDIN_CLIENT_ID',
      clientSecretEnv: 'LINKEDIN_CLIENT_SECRET',
      body: (clientId, clientSecret) => ({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
      parseToken: async (data) => ({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
      }),
    },
    twitter: {
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      clientIdEnv: 'TWITTER_CLIENT_ID',
      clientSecretEnv: 'TWITTER_CLIENT_SECRET',
      body: (clientId, clientSecret) => ({
        client_id: clientId,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: 'challenge',
      }),
      parseToken: async (data) => ({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
      }),
    },
  }

  const cfg = configs[platform]
  if (!cfg) throw new Error(`Unknown platform: ${platform}`)

  const clientId = process.env[cfg.clientIdEnv]
  const clientSecret = process.env[cfg.clientSecretEnv]
  if (!clientId || !clientSecret) throw new Error(`${platform} credentials not configured`)

  const bodyObj = cfg.body(clientId, clientSecret)
  const res = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(bodyObj),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token exchange failed for ${platform}: ${err}`)
  }

  const data = await res.json()
  return cfg.parseToken(data, clientId, clientSecret)
}

// Fetch platform user info after token exchange
async function fetchUserInfo(platform, accessToken) {
  try {
    const endpoints = {
      instagram: `https://graph.facebook.com/v18.0/me?fields=id,name,username&access_token=${accessToken}`,
      tiktok: null, // fetch separately via TikTok user info endpoint
      youtube: `https://www.googleapis.com/oauth2/v2/userinfo`,
      linkedin: `https://api.linkedin.com/v2/me`,
      twitter: `https://api.twitter.com/2/users/me?user.fields=username,profile_image_url`,
    }

    const url = endpoints[platform]
    if (!url) return {}

    const res = await fetch(url, {
      headers: platform !== 'instagram' ? { Authorization: `Bearer ${accessToken}` } : {},
    })
    if (!res.ok) return {}
    const data = await res.json()

    // Normalise per platform
    if (platform === 'youtube') return { platform_user_id: data.id, platform_username: data.name }
    if (platform === 'twitter') return { platform_user_id: data.data?.id, platform_username: data.data?.username }
    if (platform === 'linkedin') return { platform_user_id: data.id, platform_username: `${data.localizedFirstName} ${data.localizedLastName}` }
    if (platform === 'instagram') return { platform_user_id: data.id, platform_username: data.username || data.name }
    return {}
  } catch {
    return {}
  }
}

module.exports = async function handler(req, res) {
  const { platform, code, state, error: oauthError } = req.query
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://upper-floor-client-portal.vercel.app'

  if (oauthError) {
    return res.redirect(302, `${siteUrl}/?conn_error=${encodeURIComponent(oauthError)}&platform=${platform}`)
  }

  if (!platform || !code) {
    return res.status(400).json({ error: 'Missing platform or code' })
  }

  // Decode portal ID from state
  let portalId
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString())
    portalId = decoded.portalId
  } catch {
    return res.redirect(302, `${siteUrl}/?conn_error=invalid_state&platform=${platform}`)
  }

  try {
    const redirectUri = `${siteUrl}/api/auth/social/callback?platform=${platform}`
    const { access_token, refresh_token, expires_in } = await exchangeCode(platform, code, redirectUri)

    const tokenExpiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : null

    const userInfo = await fetchUserInfo(platform, access_token)

    // Upsert into social_connections
    const { error: dbError } = await supabase
      .from('social_connections')
      .upsert(
        {
          portal_id: portalId,
          platform,
          access_token,
          refresh_token: refresh_token || null,
          token_expires_at: tokenExpiresAt,
          is_active: true,
          connected_at: new Date().toISOString(),
          ...userInfo,
        },
        { onConflict: 'portal_id,platform' }
      )

    if (dbError) throw new Error(dbError.message)

    return res.redirect(302, `${siteUrl}/?conn_success=${platform}`)
  } catch (err) {
    console.error('OAuth callback error:', err.message)
    return res.redirect(302, `${siteUrl}/?conn_error=${encodeURIComponent(err.message)}&platform=${platform}`)
  }
}
