# mz_boombox_bridge — qb-phone

![status](https://img.shields.io/badge/status-em%20constru%C3%A7%C3%A3o-yellow)

## Visão Geral

**mz_boombox_bridge** é uma extensão (bridge) que integra a funcionalidade da boombox ao aplicativo **Boombox** do **qb-phone**. Ela faz a ponte com o recurso **mri_Qboombox**, expondo ações como criar caixas, controlar reprodução (tocar/pausar, próxima/anterior), ajustar volume, definir distância e realizar buscas (opcional).

---

## Requisitos

- **mri_Qboombox** devidamente configurado e funcional.
- **qb-phone** ativo (HTML padrão, sem builds customizados).

---

## Instalação

1. Copie a pasta **`mz_boombox_bridge`** para o diretório `resources/`.
2. No arquivo `server.cfg`, garanta a ordem correta de inicialização:
   ```cfg
   ensure mri_Qboombox
   ensure qb-phone
   ensure mz_boombox_bridge
   ```
3. **Adicione o App Boombox ao qb-phone:**

   - Abra `qb-phone/config.lua` e inclua o seguinte em `Config.PhoneApplications` (utilize um slot livre):
     ```lua
     ['boombox'] = {
           app = 'boombox',
           color = '#44ad52ff',
           icon = 'fas fa-music',
           tooltipText = 'Boombox',
           tooltipPos = 'top',
           style = '',
           job = false,
           blockedjobs = {},
           slot = 16, -- utilize um slot disponível
           Alerts = 0,
           password = false,
           creator = 'Mazus',
           title = 'Boombox',
     },
     ```
   - **Dica:** Se todos os slots estiverem ocupados, substitua um app não utilizado.

4. **Inclua o JavaScript do app no HTML do qb-phone:**
   - Caminho do arquivo: `qb-phone/html/js/boombox.js`
   - No final do arquivo `qb-phone/html/index.html`, adicione:
     ```html
     <script src="./js/boombox.js"></script>
     ```

> **Nota:** Não é necessário editar o `app.js`; o arquivo `boombox.js` já gerencia a interface e integração.

---

## Dependências

- [mri_QBoombox](https://github.com/Mazus-Ofc/mri_QBoombox)
- [qb-phone](https://github.com/qbcore-framework/qb-phone)

---

## Suporte e Solução de Problemas

- **App não aparece?**  
  Verifique se há um slot livre e se o `<script>` foi adicionado ao `index.html`.
- **Nada acontece ao clicar?**  
  Confirme se o `mri_Qboombox` foi iniciado antes da bridge.
- **Problemas de cache NUI?**  
  Reinicie o servidor/cliente após alterações no HTML/JS.

---

Para dúvidas ou sugestões, abra uma issue no repositório.
