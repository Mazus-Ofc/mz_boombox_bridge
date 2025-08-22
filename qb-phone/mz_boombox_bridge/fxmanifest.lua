fx_version 'cerulean'
game 'gta5'
lua54 'yes'
author 'Mazus + ChatGPT'
description 'Bridge NUI callbacks for qb-phone Boombox app to control mri_QBoombox'
version '1.0.0'

client_scripts {
    'client.lua',
    'config.lua'
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server.lua',
    'config.lua'
}

dependencies {
    'qb-core',
    'mri_QBoombox'
}
