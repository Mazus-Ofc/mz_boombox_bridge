# mz_boombox_bridge

Bridge de callbacks NUI para integrar **mri_QBoombox** com o **qb-phone** através de um app "Boombox".
- Sem mexer no mri_QBoombox.
- Opcional: busca no YouTube (YouTube Data API v3).

## Instalação

1. Coloque a pasta `mz_boombox_bridge` em `resources/[standalone]/` e inicie no `server.cfg` **depois** de `mri_QBoombox`:
   ```cfg
   ensure mri_QBoombox
   ensure mz_boombox_bridge
   ```

2. (Opcional) Habilite busca do YouTube em `config.lua` e coloque sua chave:
   ```lua
   Config.UseYouTubeSearch = true
   Config.YouTubeApiKey = 'SUA_API_KEY'
   ```

3. Adicione o aplicativo no `qb-phone/config.lua` (veja abaixo).

4. Coloque os arquivos `boombox.js` e `boombox.css` dentro de `qb-phone/html/js` e `qb-phone/html/css` respectivamente.

## Eventos NUI expostos

- `boombox:getSpeakers` -> retorna a tabela de caixas do mri_QBoombox
- `boombox:playSong`, `boombox:pauseSong`, `boombox:nextSong`, `boombox:prevSong`
- `boombox:setVolume`, `boombox:setDistance`
- `boombox:getOrCreatePlaylist`, `boombox:importPlaylist`, `boombox:deletePlaylist`, `boombox:addSongToPlaylist`
- `boombox:createSpeaker`, `boombox:hideSpeaker`, `boombox:deleteSpeaker`
- `boombox:getConfig` -> { UseYouTubeSearch = bool }
- `boombox:searchYouTube` -> { ok, items = [] }
