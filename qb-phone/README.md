# mz_boombox_bridge

### O que é

> **Este módulo é uma extensão para vincular o script ao `qb-phone` (aplicativo Boombox).**  
> Bridge leve entre o **mri_QBoombox** e UIs do servidor — com foco no **qb-phone (Boombox App)** — expondo endpoints NUI para criar caixas, tocar/pausar, avançar/voltar faixas, volume, distância e busca no YouTube.

### Instalação rápida

1. Baixe e coloque a pasta `mz_boombox_bridge` em `resources/`.
2. Garanta a ordem de start no `server.cfg`:

## Como adicionar o app no `qb-phone`

Abra `qb-phone/config.lua` e **adicione** este bloco dentro de `Config.PhoneApplications` (use um `slot` livre – no exemplo abaixo usamos o 16):

```lua
['boombox'] = {
    app = 'boombox',
    color = '#8e44ad',
    icon = 'fas fa-music',
    tooltipText = 'Boombox',
    tooltipPos = 'top',
    style = '',
    job = false,
    blockedjobs = {},
    slot = 16, -- troque para um slot livre
    Alerts = 0,
    password = false,
    creator = 'Mazus',
    title = 'Boombox',
},
```

- adicionar no final do index.html do qb-phone

```html
<script src="./js/boombox.js"></script>
```

> Dica: se todos os slots 1..16 estiverem ocupados, substitua algum app que você não use (ex.: `territory`).
> Não é necessário editar `app.js`. O arquivo `html/js/boombox.js` cria a interface e integra automaticamente.

```cfg
ensure mri_Qboombox
ensure mz_boombox_bridge
ensure qb-phone
```

## 🔗 Dependências

- [mri_QBoombox](https://github.com/Mazus-Ofc/mri_QBoombox)
- [qb-phone](https://github.com/qbcore-framework/qb-phone)
