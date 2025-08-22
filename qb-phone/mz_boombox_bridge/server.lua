local QBCore = exports['qb-core']:GetCoreObject()

-- YouTube search endpoint for the phone app
RegisterNUICallback('boombox:searchYouTube', function(data, cb)
    if not Config.UseYouTubeSearch or Config.YouTubeApiKey == '' then
        cb({ ok = false, error = 'search_disabled' })
        return
    end
    local query = data and data.query or ''
    if query == '' then
        cb({ ok = true, items = {} })
        return
    end

    local encoded = query:gsub(' ', '%%20')
    local url = ("https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=%d&q=%s&regionCode=%s&safeSearch=%s&key=%s"):
        format(Config.YouTubeMaxResults, encoded, Config.YouTubeRegionCode, Config.SafeSearch, Config.YouTubeApiKey)

    PerformHttpRequest(url, function(statusCode, body, headers)
        local items = {}
        if statusCode == 200 and body then
            local ok, data = pcall(json.decode, body)
            if ok and data and data.items then
                -- Collect video IDs to fetch durations
                local ids = {}
                for _, it in ipairs(data.items) do
                    if it.id and it.id.videoId then
                        table.insert(ids, it.id.videoId)
                    end
                end

                local durUrl = ("https://www.googleapis.com/youtube/v3/videos?part=contentDetails%%2Csnippet&id=%s&key=%s"):format(table.concat(ids, ","), Config.YouTubeApiKey)
                PerformHttpRequest(durUrl, function(code2, body2)
                    if code2 == 200 and body2 then
                        local ok2, data2 = pcall(json.decode, body2)
                        if ok2 and data2 and data2.items then
                            for _, v in ipairs(data2.items) do
                                local thumb = v.snippet and v.snippet.thumbnails and (v.snippet.thumbnails.medium or v.snippet.thumbnails.default) or {}
                                local duration = 0
                                if v.contentDetails and v.contentDetails.duration then
                                    duration = ParseISODurationToSeconds(v.contentDetails.duration)
                                end
                                table.insert(items, {
                                    videoId = v.id,
                                    title = v.snippet and v.snippet.title or 'Unknown',
                                    channelTitle = v.snippet and v.snippet.channelTitle or 'Unknown',
                                    thumbnail = thumb and thumb.url or nil,
                                    duration = duration
                                })
                            end
                        end
                    end
                    cb({ ok = true, items = items })
                end, 'GET')
                return
            end
        end
        cb({ ok = true, items = {} })
    end, 'GET')
end)

function ParseISODurationToSeconds(duration)
    -- PT#H#M#S
    local hours = tonumber(duration:match("(%d+)H")) or 0
    local minutes = tonumber(duration:match("(%d+)M")) or 0
    local seconds = tonumber(duration:match("(%d+)S")) or 0
    return hours * 3600 + minutes * 60 + seconds
end
