/**
 * Boombox app for qb-phone (works with mz_boombox_bridge + mri_QBoombox)
 * Layout mobile + tema verde (estilo da sua NUI)
 * Fixes:
 * - Toggle do player inferior faz play/pause de verdade
 * - Botão Play dos cards inicia URL ou a fila (nextSong)
 * - Prev/Next unificados para card e player inferior
 * - Mantém seleção entre atualizações da lista
 * - Auto-poll leve na aba "Caixas"
 */
let BBX = {
  inited: false,
  speakers: [],
  selectedRepro: null,
  ytEnabled: false,
  searching: false,
  now: { title: "Pronto para tocar", sub: "—", thumb: "" },
  activeTab: "list",
  poll: null, // setInterval id
};

function bbxFmtTime(sec) {
  sec = Math.max(0, Math.floor(Number(sec || 0)));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return (
    (h ? h + ":" : "") +
    String(m).padStart(2, "0") +
    ":" +
    String(s).padStart(2, "0")
  );
}

/* ===== Layout sizing ===== */
function bbxResize() {
  const $app = $(".boombox-app");
  if ($app.length === 0) return;

  const styles = getComputedStyle($app[0]);
  const safeTop = parseInt(styles.getPropertyValue("--safe-top")) || 0;
  const safeBottom = parseInt(styles.getPropertyValue("--safe-bottom")) || 0;

  const hHeader = $(".bbx-header").outerHeight() || 0;
  const hPlayer = $(".bbx-player").outerHeight() || 0;
  const gap = 10;

  $(".bbx-content").css(
    "height",
    `calc(100% - ${hHeader + hPlayer + gap + safeTop + safeBottom}px)`
  );

  $(".bbx-view:visible").each(function () {
    const $view = $(this);
    const hToolbar = $view.find(".bbx-toolbar").outerHeight() || 0;
    $view.find(".bbx-list").css("height", `calc(100% - ${hToolbar + 6}px)`);
  });
}

/* ===== Auto polling (só na aba "Caixas") ===== */
function bbxStartPoll() {
  if (BBX.poll) return;
  BBX.poll = setInterval(() => {
    if (BBX.activeTab === "list") bbxLoadSpeakers();
  }, 2000);
}
function bbxStopPoll() {
  if (!BBX.poll) return;
  clearInterval(BBX.poll);
  BBX.poll = null;
}

/* ===== Now Playing ===== */
function bbxUpdateNow(meta = {}) {
  BBX.now = { ...BBX.now, ...meta };
  $(".bbx-now-title").text(BBX.now.title || "Pronto para tocar");
  $(".bbx-now-sub").text(BBX.now.sub || "—");
  if (BBX.now.thumb) $(".bbx-now-thumb").attr("src", BBX.now.thumb).show();
  else $(".bbx-now-thumb").hide();
}

/* ===== Helpers de reprodução ===== */
function bbxGetActiveUrl() {
  return String($(".bbx-card.active .bbx-url").val() || "").trim();
}
function bbxEnsureSelection() {
  if (BBX.selectedRepro != null) return true;
  const first = $(".bbx-card").first();
  if (!first.length) return false;
  BBX.selectedRepro = Number(first.data("id")) - 1;
  $(".bbx-card").removeClass("active");
  first.addClass("active");
  return true;
}
function bbxUISetPlaying(on) {
  $(".bbx-player").toggleClass("is-playing", !!on);
  $(".bbx-toggle i").toggleClass("fa-play", !on).toggleClass("fa-pause", !!on);
}
function bbxPlayActive() {
  if (!bbxEnsureSelection()) return;
  const url = bbxGetActiveUrl();
  if (url && url.length > 4) {
    $.post(
      "https://mz_boombox_bridge/boombox:playSong",
      JSON.stringify({ repro: BBX.selectedRepro, url }),
      function () {}
    );
    bbxUpdateNow({ title: url, sub: `Caixa #${BBX.selectedRepro + 1}` });
  } else {
    // sem URL: tenta iniciar a fila do servidor
    $.post(
      "https://mz_boombox_bridge/boombox:nextSong",
      JSON.stringify({ repro: BBX.selectedRepro }),
      function () {}
    );
  }
  bbxUISetPlaying(true);
}
function bbxPauseActive() {
  if (!bbxEnsureSelection()) return;
  $.post(
    "https://mz_boombox_bridge/boombox:pauseSong",
    JSON.stringify({ repro: BBX.selectedRepro }),
    function () {}
  );
  bbxUISetPlaying(false);
}

function bbxEnsureDom() {
  if (document.querySelector(".boombox-app")) return;

  // inject CSS
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "./css/boombox.css";
  document.head.appendChild(link);

  // container (tema verde)
  const container = document.createElement("div");
  container.className = "boombox-app theme-green";
  container.style.display = "none";
  container.innerHTML = `
  <div class="bbx-header">
    <div class="bbx-title">
      <i class="fas fa-music"></i> Boombox
    </div>
    <div class="bbx-tabs bbx-tabs-icons">
      <button class="bbx-tab active" data-tab="list"    title="Caixas"><i class="fas fa-border-all"></i></button>
      <button class="bbx-tab"        data-tab="search"  title="Buscar"><i class="fas fa-search"></i></button>
      <button class="bbx-tab"        data-tab="library" title="Playlist"><i class="fas fa-list-ul"></i></button>
    </div>
  </div>

  <div class="bbx-content">
    <!-- LISTA DE CAIXAS -->
    <div class="bbx-view bbx-view-list">
      <div class="bbx-toolbar">
        <button id="bbx-refresh" class="bbx-btn"><i class="fas fa-sync-alt"></i> Atualizar</button>
        <button id="bbx-create"  class="bbx-btn"><i class="fas fa-plus"></i> Criar caixa</button>
      </div>
      <div id="bbx-speaker-list" class="bbx-list"></div>
    </div>

    <!-- BUSCA -->
    <div class="bbx-view bbx-view-search" style="display:none">
      <div class="bbx-toolbar">
        <input id="bbx-search-input" placeholder="Buscar no YouTube (título, artista...)" spellcheck="false"/>
        <button id="bbx-search-btn" class="bbx-btn"><i class="fas fa-search"></i></button>
      </div>
      <div id="bbx-search-info" class="bbx-helper"></div>
      <div id="bbx-search-results" class="bbx-list"></div>
    </div>

    <!-- PLAYLIST -->
    <div class="bbx-view bbx-view-library" style="display:none">
      <div class="bbx-toolbar">
        <input id="bbx-pl-name" placeholder="Nome da playlist" spellcheck="false"/>
        <button id="bbx-pl-create" class="bbx-btn"><i class="fas fa-save"></i> Criar/Carregar</button>
      </div>
      <div id="bbx-pl-actions" class="bbx-helper">Use a aba Buscar para adicionar músicas.</div>
    </div>
  </div>

  <!-- PLAYER FIXO -->
  <div class="bbx-player">
    <div class="bbx-now">
      <img class="bbx-now-thumb" alt="" style="display:none"/>
      <div class="bbx-now-meta">
        <div class="bbx-now-title">Pronto para tocar</div>
        <div class="bbx-now-sub">—</div>
      </div>
    </div>
    <div class="bbx-player-center">
      <button class="bbx-btn-icon bbx-prev" title="Anterior"><i class="fas fa-step-backward"></i></button>
      <button class="bbx-btn-icon bbx-toggle" title="Play/Pause"><i class="fas fa-play"></i></button>
      <button class="bbx-btn-icon bbx-next" title="Próxima"><i class="fas fa-step-forward"></i></button>
    </div>
    <div class="bbx-player-right">
      <i class="fas fa-volume-up"></i>
      <input type="range" class="bbx-volume bbx-volume-global" min="0" max="100" value="50"/>
    </div>
  </div>
`;

  document.querySelector(".phone-application-container").appendChild(container);
  setTimeout(bbxResize, 0);
  bbxUpdateNow();

  // Tabs
  $(document).on("click", ".bbx-tab", function (e) {
    e.preventDefault();
    const tab = $(this).data("tab");
    BBX.activeTab = tab;
    $(".bbx-tab").removeClass("active");
    $(this).addClass("active");
    $(".bbx-view").hide();
    if (tab === "list") {
      $(".bbx-view-list").show();
      bbxStartPoll();
    }
    if (tab === "search") {
      $(".bbx-view-search").show();
      bbxStopPoll();
    }
    if (tab === "library") {
      $(".bbx-view-library").show();
      bbxStopPoll();
    }
    bbxResize();
  });

  // Actions
  $(document).on("click", "#bbx-refresh", function (e) {
    e.preventDefault();
    bbxLoadSpeakers();
  });

  $(document).on("click", "#bbx-create", function (e) {
    e.preventDefault();
    $.post(
      "https://mz_boombox_bridge/boombox:createSpeaker",
      JSON.stringify({}),
      function () {}
    );
    QB.Phone.Notifications.Add(
      "fa fa-info",
      "Boombox",
      "Se nada aconteceu, use o item no inventário ou desative useItem no mri_QBoombox.",
      "#f39c12",
      2750
    );
    setTimeout(bbxLoadSpeakers, 1500);
  });

  // Selecionar card
  $(document).on("click", ".bbx-card", function (e) {
    e.preventDefault();
    const id = Number($(this).data("id"));
    BBX.selectedRepro = id - 1; // server usa +1 internamente
    $(".bbx-card").removeClass("active");
    $(this).addClass("active");

    const url = $(this).find(".bbx-url").val() || "";
    bbxUpdateNow({
      title: url || "Pronto para tocar",
      sub: `Caixa #${id}`,
      thumb: "",
    });
    const v = $(this).find(".bbx-volume").val();
    if (v != null) $(".bbx-volume-global").val(v);
  });

  // PLAY/PAUSE nos cards
  $(document).on("click", ".bbx-play", function (e) {
    e.preventDefault();
    // se clicar em Play no card, usa a lógica centralizada
    bbxPlayActive();
  });
  $(document).on("click", ".bbx-pause", function (e) {
    e.preventDefault();
    bbxPauseActive();
  });

  // Prev/Next (vale para cards e player inferior)
  $(document).on("click", ".bbx-prev", function (e) {
    e.preventDefault();
    if (!bbxEnsureSelection()) return;
    $.post(
      "https://mz_boombox_bridge/boombox:prevSong",
      JSON.stringify({ repro: BBX.selectedRepro }),
      function () {}
    );
  });
  $(document).on("click", ".bbx-next", function (e) {
    e.preventDefault();
    if (!bbxEnsureSelection()) return;
    $.post(
      "https://mz_boombox_bridge/boombox:nextSong",
      JSON.stringify({ repro: BBX.selectedRepro }),
      function () {}
    );
  });

  // Volume/Distância
  $(document).on("input change", ".bbx-volume", function () {
    if (!bbxEnsureSelection()) return;
    const volume = Number($(this).val());
    $.post(
      "https://mz_boombox_bridge/boombox:setVolume",
      JSON.stringify({ repro: BBX.selectedRepro, volume }),
      function () {}
    );
    $(".bbx-volume-global").val(volume);
  });
  $(document).on("input change", ".bbx-distance", function () {
    if (!bbxEnsureSelection()) return;
    const dist = Number($(this).val());
    $.post(
      "https://mz_boombox_bridge/boombox:setDistance",
      JSON.stringify({ repro: BBX.selectedRepro, dist }),
      function () {}
    );
  });

  /* ===== Player inferior: toggle play/pause de verdade ===== */
  $(document).on("click", ".bbx-toggle", function (e) {
    e.preventDefault();
    if ($(".bbx-player").hasClass("is-playing")) bbxPauseActive();
    else bbxPlayActive();
  });

  // Volume global
  $(document).on("input change", ".bbx-volume-global", function () {
    if (!bbxEnsureSelection()) return;
    const volume = Number($(this).val());
    $.post(
      "https://mz_boombox_bridge/boombox:setVolume",
      JSON.stringify({ repro: BBX.selectedRepro, volume }),
      function () {}
    );
    $(".bbx-card.active .bbx-volume").val(volume);
  });

  /* ===== Search ===== */
  $(document).on("click", "#bbx-search-btn", function (e) {
    e.preventDefault();
    bbxDoSearch();
  });
  $(document).on("keypress", "#bbx-search-input", function (e) {
    if (e.which === 13) bbxDoSearch();
  });

  /* ===== Playlist ===== */
  $(document).on("click", "#bbx-pl-create", function (e) {
    e.preventDefault();
    const name = $("#bbx-pl-name").val()?.trim();
    if (!name) return;
    $.post(
      "https://mz_boombox_bridge/boombox:getOrCreatePlaylist",
      JSON.stringify({ name }),
      function () {
        QB.Phone.Notifications.Add(
          "fa fa-check",
          "Boombox",
          "Playlist carregada/criada!",
          "#1abc9c",
          1750
        );
      }
    );
  });

  /* ===== Add from search ===== */
  $(document).on("click", ".bbx-add", function (e) {
    e.preventDefault();
    if (!bbxEnsureSelection()) return;
    const vid = $(this).data("video");
    const title = $(this).data("title");
    const channel = $(this).data("channel");
    const duration = Number($(this).data("duration") || 0);
    const url = "https://www.youtube.com/watch?v=" + vid;
    $.post(
      "https://mz_boombox_bridge/boombox:addSongToPlaylist",
      JSON.stringify({
        playlistActive: 0,
        url,
        maxDuration: duration,
        name: title,
        author: channel,
      }),
      function () {
        QB.Phone.Notifications.Add(
          "fa fa-plus",
          "Boombox",
          "Música adicionada!",
          "#27ae60",
          1750
        );
      }
    );
  });

  // Play direto do resultado da busca
  $(document).on("click", ".bbx-result .bbx-play", function () {
    if (!bbxEnsureSelection()) return;
    const $res = $(this).closest(".bbx-result");
    const vid = $res.find(".bbx-add").data("video");
    const title = $res.find(".bbx-title").text() || "Reproduzindo";
    const channel = $res.find(".bbx-sub").text() || "";
    const thumb = $res.find("img").attr("src") || "";
    $.post(
      "https://mz_boombox_bridge/boombox:playSong",
      JSON.stringify({
        repro: BBX.selectedRepro,
        url: "https://www.youtube.com/watch?v=" + vid,
      }),
      function () {}
    );
    bbxUISetPlaying(true);
    bbxUpdateNow({ title, sub: channel, thumb });
  });

  /* ===== Escuta opcional de mensagens do bridge ===== */
  window.addEventListener("message", (e) => {
    const data = e.data || {};
    if (data.action === "boombox:updateSpeakers") {
      bbxLoadSpeakers();
    }
  });
}

function bbxInitOnce() {
  if (BBX.inited) return;
  BBX.inited = true;
  bbxEnsureDom();
  $.post(
    "https://mz_boombox_bridge/boombox:getConfig",
    JSON.stringify({}),
    function (res) {
      BBX.ytEnabled = !!(res && res.UseYouTubeSearch);
      $("#bbx-search-info").text(
        BBX.ytEnabled ? "" : "Busca do YouTube desativada pelo servidor."
      );
    }
  );
  bbxLoadSpeakers();
  setTimeout(bbxResize, 50);
  $(window).off("resize.bbx").on("resize.bbx", bbxResize);
  bbxStartPoll(); // tab padrão é "list"
}

/* ===== Carrega lista de caixas (preserva seleção quando possível) ===== */
function bbxLoadSpeakers() {
  const prevSel = BBX.selectedRepro; // guarda seleção antes de recarregar
  $.post(
    "https://mz_boombox_bridge/boombox:getSpeakers",
    JSON.stringify({}),
    function (list) {
      BBX.speakers = Array.isArray(list) ? list : [];
      const el = $("#bbx-speaker-list");
      el.empty();

      if (BBX.speakers.length === 0) {
        el.append(
          '<div class="bbx-helper">Nenhuma caixa ativa. Use "Criar caixa" (requer item) ou aproxime-se de uma.</div>'
        );
        BBX.selectedRepro = null;
        bbxUISetPlaying(false);
        bbxResize();
        return;
      }

      BBX.speakers.forEach(function (s, idx) {
        if (s?.deleted || s?.isDeleted === true || s?.exists === false) return;
        const id = idx + 1;
        const isPlaying = s.isPlaying
          ? '<span class="bbx-badge playing">tocando</span>'
          : '<span class="bbx-badge">pausado</span>';
        const vol = s.volume ?? 50;
        const dist = s.maxDistance ?? 10;
        const url = s.url || "";
        const x = Math.floor(s.coords?.x || 0);
        const y = Math.floor(s.coords?.y || 0);

        const card = `
        <div class="bbx-card" data-id="${id}">
          <div class="bbx-row">
            <div class="bbx-left">
              <div class="bbx-id">#${id}</div>
              <div class="bbx-status">${isPlaying}</div>
              <div class="bbx-pos">~ ${x}, ${y}</div>
            </div>
            <div class="bbx-right">
              <div class="bbx-controls">
                <input class="bbx-url" placeholder="URL do YouTube" value="${url}"/>
                <div class="bbx-buttons">
                  <button class="bbx-btn bbx-play"><i class="fas fa-play"></i></button>
                  <button class="bbx-btn bbx-pause"><i class="fas fa-pause"></i></button>
                  <button class="bbx-btn bbx-prev"><i class="fas fa-step-backward"></i></button>
                  <button class="bbx-btn bbx-next"><i class="fas fa-step-forward"></i></button>
                </div>
                <div class="bbx-sliders">
                  <label>Vol <input type="range" class="bbx-volume" min="0" max="100" value="${vol}"/></label>
                  <label>Dist <input type="range" class="bbx-distance" min="2" max="50" value="${dist}"/></label>
                </div>
              </div>
            </div>
          </div>
        </div>`;
        el.append(card);
      });

      // Restaura seleção anterior, se existir; senão seleciona primeira
      let targetIdx = 0;
      if (prevSel != null && prevSel >= 0 && prevSel < BBX.speakers.length)
        targetIdx = prevSel;
      BBX.selectedRepro = targetIdx;
      $(".bbx-card").removeClass("active");
      $(`.bbx-card[data-id="${targetIdx + 1}"]`).addClass("active");

      $(".bbx-volume-global").val(
        $(".bbx-card.active .bbx-volume").val() || 50
      );
      const url0 = $(".bbx-card.active .bbx-url").val() || "";
      bbxUpdateNow({
        title: url0 || "Pronto para tocar",
        sub: `Caixa #${targetIdx + 1}`,
        thumb: "",
      });

      bbxResize();
    }
  );
}

/* ===== Busca YouTube ===== */
function bbxDoSearch() {
  if (!BBX.ytEnabled) {
    $("#bbx-search-info").text("Busca do YouTube está desativada no servidor.");
    return;
  }
  if (BBX.searching) return;
  const q = $("#bbx-search-input").val()?.trim();
  if (!q) return;
  BBX.searching = true;
  $("#bbx-search-info").text("Buscando...");
  $("#bbx-search-results").empty();
  $.post(
    "https://mz_boombox_bridge/boombox:searchYouTube",
    JSON.stringify({ query: q }),
    function (res) {
      BBX.searching = false;
      if (!res || !res.ok) {
        $("#bbx-search-info").text("Erro na busca.");
        return;
      }
      $("#bbx-search-info").text(res.items.length ? "" : "Nada encontrado.");
      const list = $("#bbx-search-results");
      res.items.forEach(function (v) {
        const safeTitle = String(v.title || "").replace(/"/g, "&quot;");
        const safeChannel = String(v.channelTitle || "").replace(
          /"/g,
          "&quot;"
        );
        const item = `
        <div class="bbx-result">
          <img src="${v.thumbnail || ""}" alt="thumb" />
          <div class="bbx-meta">
            <div class="bbx-title">${safeTitle}</div>
            <div class="bbx-sub">${safeChannel} • ${bbxFmtTime(
          v.duration || 0
        )}</div>
          </div>
          <div class="bbx-actions">
            <button class="bbx-btn bbx-add" data-video="${
              v.videoId
            }" data-title="${safeTitle}" data-channel="${safeChannel}" data-duration="${
          v.duration || 0
        }"><i class="fas fa-plus"></i></button>
            <button class="bbx-btn bbx-play"><i class="fas fa-play"></i></button>
          </div>
        </div>`;
        list.append(item);
      });
    }
  );
}

// Hook into app open to init
$(document).on("click", ".phone-application", function () {
  const app = $(this).data("app");
  if (app === "boombox") setTimeout(bbxInitOnce, 50);
});
