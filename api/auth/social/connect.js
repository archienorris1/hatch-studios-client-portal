// /api/auth/social/connect.js
// Builds the OAuth authorization URL for each platform and redirects the user.
// Query params: ?platform=instagram|tiktok|youtube|linkedin|twitter&state=<base64>

const PLATFORM_CONFIGS = {
  instagram: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    clientIdEnv: 'INSTAGRAM_CLIENT_ID',
    scopes: 'instagram_basic,instagram_content_publish,instagram_manage_insights',
    responseType: 'code',
  },
  tiktok: {
    authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    clientIdEnv: 'TIKTOK_CLIENT_ID',
    scopes: 'user.info.basic,video.upload,video.list',
    responseType: 'code',
    clientKeyParam: 'client_key', // TikTok uses client_key instead of client_id
  },
  youtube: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientIdEnv: 'YOUTUBE_CLIENT_ID',
    scopes: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/yt-analytics.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' '),
    responseType: 'code',
    extras: { access_type: 'offline', prompt: 'consent' },
  },
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    clientIdEnv: 'LINKEDIN_CLIENT_ID',
    scopes: 'r_liteprofile w_member_social r_organization_social',
    responseType: 'code',
  },
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    clientIdEnv: 'TWITTER_CLIENT_ID',
    scopes: 'tweet.read tweet.write users.read offline.access',
    responseType: 'code',
    extras: { code_challenge: 'challenge', code_challenge_method: 'plain' },
  },
}

module.exports = function handler(req, res) {
  const { platform, state } = req.query

  if (!platform || !PLATFORM_CONFIGS[platform]) {
    return res.status(400).json({ error: `Unknown platform: ${platform}` })
  }

  const config = PLATFORM_CONFIGS[platform]
  const clientId = process.env[config.clientIdEnv]

  if (!clientId) {
    return res.status(503).json({
      error: `${platform} is not yet configured. Add ${config.clientIdEnv} to your Vercel environment variables.`,
    })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://upper-floor-client-portal.vercel.app'
  const redirectUri = `${siteUrl}/api/auth/social/callback?platform=${platform}`

  const params = new URLSearchParams({
    [config.clientKeyParam || 'client_id']: clientId,
    redirect_uri: redirectUri,
    response_type: config.responseType,
    scope: config.scopes,
    state: state || '',
    ...config.extras,
  })

  return res.redirect(302, `${config.authUrl}?${params.toString()}`)
}
