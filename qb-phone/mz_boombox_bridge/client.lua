local QBCore = exports['qb-core']:GetCoreObject()

-- Simple proxy of callbacks/events so the qb-phone UI can talk to mri_QBoombox

-- Helper for the local callback pattern used by mri_QBoombox
local _clientCbs = {}
RegisterNetEvent('TriggerCallback', function(name, ...)
    if _clientCbs[name] then
        _clientCbs[name](...)
        _clientCbs[name] = nil
    end
end)
local function TriggerCb(name, cb, ...)
    _clientCbs[name] = cb
    TriggerServerEvent('TriggerCallback', name, ...)
end

-- Expose: getSpeakers -> returns the speakers table from mri_QBoombox
RegisterNUICallback('boombox:getSpeakers', function(_, cb)
    TriggerCb('mri_Qboombox:callback:getBoomboxs', function(result)
        cb(result or {})
    end)
end)

-- Expose: canMove (not used by phone but available if needed)
RegisterNUICallback('boombox:canMove', function(data, cb)
    TriggerCb('mri_Qboombox:callback:canMove', function(canMove)
        cb({ ok = canMove })
    end, data.id)
end)

-- Play / Pause / Next / Prev / Volume / Distance mapping to server events
RegisterNUICallback('boombox:playSong', function(data, cb)
    -- data: { repro = number, url = string }
    TriggerServerEvent('mri_Qboombox:server:Playsong', data)
    cb({ ok = true })
end)

RegisterNUICallback('boombox:pauseSong', function(data, cb)
    TriggerServerEvent('mri_Qboombox:server:pauseSong', data)
    cb({ ok = true })
end)

RegisterNUICallback('boombox:nextSong', function(data, cb)
    TriggerServerEvent('mri_Qboombox:server:nextSong', data)
    cb({ ok = true })
end)

RegisterNUICallback('boombox:prevSong', function(data, cb)
    TriggerServerEvent('mri_Qboombox:server:prevSong', data)
    cb({ ok = true })
end)

RegisterNUICallback('boombox:setVolume', function(data, cb)
    -- data: { repro = number, volume = number (0-100) }
    TriggerServerEvent('mri_Qboombox:server:SyncNewVolume', data)
    cb({ ok = true })
end)

RegisterNUICallback('boombox:setDistance', function(data, cb)
    -- data: { repro = number, dist = number (2-50) }
    TriggerServerEvent('mri_Qboombox:server:SyncNewDist', data)
    cb({ ok = true })
end)

-- Playlists (use mri callbacks directly)
RegisterNUICallback('boombox:getOrCreatePlaylist', function(data, cb)
    -- data: { name: string }
    TriggerCb('mri_Qboombox:callback:getNewPlaylist', function(result)
        cb(result)
    end, data)
end)

RegisterNUICallback('boombox:importPlaylist', function(data, cb)
    -- data: playlistId (number)
    TriggerServerEvent('mri_Qboombox:server:importNewPlaylist', data)
    cb({ ok = true })
end)

RegisterNUICallback('boombox:deletePlaylist', function(data, cb)
    -- data: playlistId (number)
    TriggerServerEvent('mri_Qboombox:server:deletePlayList', data)
    cb({ ok = true })
end)

RegisterNUICallback('boombox:addSongToPlaylist', function(data, cb)
    -- data: { playlistActive: number, url: string, maxDuration?: number, name?: string, author?: string }
    TriggerServerEvent('mri_Qboombox:server:addSong', data)
    cb({ ok = true })
end)

-- Spawn / hide / delete are limited actions; we only trigger native events already present in mri_QBoombox.
RegisterNUICallback('boombox:createSpeaker', function(_, cb)
    if not Config.AllowCreateFromPhone then
        cb({ ok = false, error = 'disabled' })
        return
    end
    -- Use existing command flow: just execute the command on the client
    -- You must have the item configured in mri_QBoombox (Config.itemName).
    ExecuteCommand('createSpeaker')
    cb({ ok = true })
end)

RegisterNUICallback('boombox:deleteSpeaker', function(data, cb)
    -- expects { id = number } (server uses +1 indexing internally)
    TriggerServerEvent('mri_Qboombox:server:deleteSpeaker', data.id)
    cb({ ok = true })
end)

RegisterNUICallback('boombox:hideSpeaker', function(data, cb)
    -- expects { id = number }
    TriggerServerEvent('mri_Qboombox:server:hideSpeaker', data.id)
    cb({ ok = true })
end)

-- Simple config exposure to NUI
RegisterNUICallback('boombox:getConfig', function(_, cb)
    cb({
        UseYouTubeSearch = Config.UseYouTubeSearch
    })
end)
