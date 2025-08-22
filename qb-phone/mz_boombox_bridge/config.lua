Config = Config or {}

-- Toggle YouTube search inside the phone app. If false, the "Buscar" tab still appears but will show a message.
Config.UseYouTubeSearch = false        -- set to true to enable server-side YouTube API search
Config.YouTubeApiKey = ''              -- required if UseYouTubeSearch = true (Google Cloud -> YouTube Data API v3)
Config.YouTubeMaxResults = 8
Config.YouTubeRegionCode = 'BR'
Config.SafeSearch = 'none'             -- 'none' | 'moderate' | 'strict'

-- Optional: Restrict who can spawn a speaker from the phone (requires item). Set to false to disable from phone.
Config.AllowCreateFromPhone = true
