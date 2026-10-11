
"use strict";

/* =========================================================
   ESTAÇÃO ALEGRIA — PAINEL ADMINISTRATIVO
   Mantidos: login, fotos/vídeos, eventos, promoções e avisos.
   Removidos: configurações, troca de senha, minha conta
   e exclusão de conta.
   ========================================================= */

/* 1. SUPABASE
   Cole abaixo a Publishable key atual do seu projeto.
   Não use uma chave secret ou service_role.
*/
const SUPABASE_URL = "https://ggxhghszthcgnkecoiir.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_EohrXK6tulCPMKavk5GQfw_OxIQkxgQ";

const MEDIA_BUCKET = "foto";
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const TABLES = {
  eventos: "eventos",
  promocoes: "promocoes",
  avisos: "avisos",
  fotos: "fotos",
  avaliacoes: "avaliacoes"
};

const TITLES = {
  inicio: "Visão geral",
  fotos: "Fotos e vídeos",
  eventos: "Eventos",
  promocoes: "Promoções",
  avisos: "Avisos",
  avaliacoes: "Avaliações"
};

const SECTION_TITLES = {
  inicio: "Conteúdo do estabelecimento",
  fotos: "Galeria de fotos e vídeos",
  eventos: "Gerenciar eventos",
  promocoes: "Gerenciar promoções",
  avisos: "Gerenciar avisos",
  avaliacoes: "Moderar avaliações dos visitantes"
};
};

const state = {
  page: "inicio",
  eventos: [],
  promocoes: [],
  avisos: [],
  fotos: [],
  busy: false,
  authMode: "login"
};

let supabaseClient = null;
let authSubscription = null;

/* 2. ELEMENTOS E UTILITÁRIOS */

const $ = (selector) => document.querySelector(selector);

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function showMessage(message, isError = false) {
  const element = $("#global-message");
  if (!element) return;

  element.textContent = message;
  element.style.color = isError ? "#c53d3d" : "#16845e";
}

function showAuthMessage(message, isError = true) {
  const element = $("#auth-message");
  if (!element) return;

  element.textContent = message;
  element.style.color = isError ? "#b33b3b" : "#16845e";
}

function setBusy(value) {
  state.busy = value;

  document.querySelectorAll(
    ".form-card button, .item-actions button, #auth-submit"
  ).forEach((button) => {
    button.disabled = value;
  });
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function isVideoFile(file) {
  return Boolean(file && file.type.startsWith("video/"));
}

function isImageFile(file) {
  return Boolean(file && file.type.startsWith("image/"));
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(file) {
  const name = file.name || "";
  const match = name.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : "";
}

function makeSafeFileName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(-100);
}

function getDateField(type) {
  return type === "eventos" ? "data_evento" : "validade";
}

function mapDatabaseRow(type, row) {
  const dateField = getDateField(type);

  return {
    id: row.id,
    titulo: row.titulo || "",
    descricao: row.descricao || "",
    data: row[dateField] || "",
    created_at: row.created_at || ""
  };
}

function getCurrentList(type) {
  return state[type] || [];
}

/* 3. INICIALIZAÇÃO DO SUPABASE */

function initializeSupabase() {
  if (!window.supabase || !window.supabase.createClient) {
    throw new Error(
      "A biblioteca do Supabase não carregou. Atualize a página e tente novamente."
    );
  }

  if (
    !SUPABASE_PUBLISHABLE_KEY ||
    SUPABASE_PUBLISHABLE_KEY === "COLE_AQUI_SUA_PUBLISHABLE_KEY"
  ) {
    throw new Error(
      "Falta configurar a Publishable key do Supabase no script.js."
    );
  }

  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
}

/* 4. LOGIN E CADASTRO */

function updateAuthMode() {
  const isSignup = state.authMode === "signup";

  $("#auth-title").textContent = isSignup
    ? "Criar uma conta"
    : "Bem-vindo de volta!";

  $("#auth-description").textContent = isSignup
    ? "Cadastre-se para acessar o painel administrativo."
    : "Entre para administrar seu estabelecimento.";

  $("#auth-submit").textContent = isSignup ? "Criar conta" : "Entrar";

  $("#auth-switch").textContent = isSignup
    ? "Já tem uma conta? Entrar"
    : "Ainda não tem conta? Cadastre-se";

  $("#auth-password").autocomplete = isSignup
    ? "new-password"
    : "current-password";

  showAuthMessage("");
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  if (!supabaseClient || state.busy) return;

  const email = $("#auth-email").value.trim();
  const password = $("#auth-password").value;

  if (!email || !password) {
    showAuthMessage("Preencha o e-mail e a senha.");
    return;
  }

  setBusy(true);
  showAuthMessage("");

  try {
    let result;

    if (state.authMode === "signup") {
      result = await supabaseClient.auth.signUp({
        email,
        password
      });

      if (result.error) throw result.error;

      if (result.data.session) {
        showAuthMessage("Conta criada. Acessando o painel...", false);
      } else {
        showAuthMessage(
          "Cadastro recebido. Confira seu e-mail para confirmar a conta.",
          false
        );
      }
    } else {
      result = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (result.error) throw result.error;
    }
  } catch (error) {
    showAuthMessage(error.message || "Não foi possível entrar.");
  } finally {
    setBusy(false);
  }
}

async function handleLogout() {
  if (!supabaseClient) return;

  const confirmed = window.confirm("Deseja sair do painel?");
  if (!confirmed) return;

  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    showMessage(`Não foi possível sair: ${error.message}`, true);
  }
}

/* 5. CONTROLE DA SESSÃO */

function setAuthenticated(authenticated) {
  document.body.classList.toggle("authenticated", authenticated);
  $("#auth-screen").hidden = authenticated;

  if (!authenticated) {
    clearData();
    renderStats();
    renderPage("inicio");
  }
}

function clearData() {
  state.eventos = [];
  state.promocoes = [];
  state.avisos = [];
  state.fotos = [];
}

async function restoreAuthSession() {
  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;

    setAuthenticated(Boolean(data.session));

    if (data.session) {
      await refreshAllData();
    }
  } catch (error) {
    setAuthenticated(false);
    showAuthMessage(
      error.message || "Não foi possível verificar sua sessão."
    );
  }
}

function listenForAuthChanges() {
  const { data } = supabaseClient.auth.onAuthStateChange(
    async (event, session) => {
      setAuthenticated(Boolean(session));

      if (event === "SIGNED_IN" && session) {
        await refreshAllData();
      }

      if (event === "SIGNED_OUT") {
        clearData();
        renderStats();
        renderPage("inicio");
      }
    }
  );

  authSubscription = data.subscription;
}

/* 6. CARREGAMENTO DE EVENTOS, PROMOÇÕES E AVISOS */

async function loadContent(type) {
  const { data, error } = await supabaseClient
    .from(TABLES[type])
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  state[type] = (data || []).map((row) => mapDatabaseRow(type, row));
}

async function loadPhotos() {
  const { data, error } = await supabaseClient
    .from(TABLES.fotos)
    .select("id, nome, imagem_url, storage_path, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  state.fotos = (data || []).map((row) => ({
    id: row.id,
    nome: row.nome || "Arquivo",
    imagem_url: row.imagem_url || "",
    storage_path: row.storage_path || "",
    created_at: row.created_at || ""
  }));
}

async function refreshAllData() {
  if (!supabaseClient) return;

  try {
    await Promise.all([
      loadContent("eventos"),
      loadContent("promocoes"),
      loadContent("avisos"),
      loadPhotos()
    ]);

    renderStats();
    renderPage(state.page);
    showMessage("Conteúdo atualizado.");
  } catch (error) {
    showMessage(
      `Erro ao carregar conteúdo: ${error.message}. Confira as tabelas e as permissões do Supabase.`,
      true
    );
  }
}

/* 7. CONTADORES */

function renderStats() {
  $("#total-fotos").textContent = state.fotos.length;
  $("#total-eventos").textContent = state.eventos.length;
  $("#total-promocoes").textContent = state.promocoes.length;
  $("#total-avisos").textContent = state.avisos.length;
}

/* 8. NAVEGAÇÃO */

function navigateTo(page) {
  if (!TITLES[page]) return;

  state.page = page;

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  renderPage(page);
}

function renderPage(page) {
  const container = $("#page-content");
  if (!container) return;

  state.page = page;
  $("#page-title").textContent = TITLES[page] || TITLES.inicio;
  $("#section-title").textContent =
    SECTION_TITLES[page] || SECTION_TITLES.inicio;

  if (page === "inicio") {
    container.innerHTML = renderHome();
  } else if (page === "fotos") {
    container.innerHTML = renderPhotosPage();
  } else {
    container.innerHTML = renderContentPage(page);
  }

  attachPageEvents();
}

function renderHome() {
  return `
    <div class="content-grid">
      <article class="form-card">
        <h3>☀️ Bem-vindo ao painel!</h3>
        <p>Use o menu para publicar as novidades da Estação Alegria.</p>
        <p>Você pode adicionar fotos e vídeos à galeria, cadastrar eventos, divulgar promoções e publicar avisos.</p>
      </article>
      <article class="form-card">
        <h3>📌 Seus conteúdos</h3>
        <p>Fotos e vídeos: <strong>${state.fotos.length}</strong></p>
        <p>Eventos: <strong>${state.eventos.length}</strong></p>
        <p>Promoções: <strong>${state.promocoes.length}</strong></p>
        <p>Avisos: <strong>${state.avisos.length}</strong></p>
        <button class="primary-btn" id="refresh-content" type="button">Atualizar conteúdo</button>
      </article>
    </div>
  `;
}

/* 9. FOTOS E VÍDEOS */

function renderPhotosPage() {
  const cards = state.fotos.map((photo) => {
    const video = /\.(mp4|webm|ogg|mov|m4v)$/i.test(
      `${photo.nome} ${photo.imagem_url}`
    );

    const media = video
      ? `<video src="${escapeHTML(photo.imagem_url)}" controls preload="metadata"></video>`
      : `<img src="${escapeHTML(photo.imagem_url)}" alt="${escapeHTML(photo.nome)}" loading="lazy">`;

    return `
      <article class="item-card">
        ${media}
        <h3>${escapeHTML(photo.nome)}</h3>
        <p>Publicado na galeria</p>
        <div class="item-actions">
          <button class="delete-btn" type="button" data-delete-photo="${escapeHTML(photo.id)}">Excluir arquivo</button>
        </div>
      </article>
    `;
  }).join("");

  return `
    <div class="content-grid">
      <form class="form-card" id="photo-form">
        <h3>Adicionar fotos ou vídeos</h3>
        <p>Selecione arquivos para publicar na galeria.</p>

        <div class="field">
          <label for="photo-title">Nome ou legenda</label>
          <input id="photo-title" name="titulo" type="text" maxlength="120" placeholder="Ex.: Nossa piscina" required>
        </div>

        <div class="field">
          <label for="photo-file">Arquivo de imagem ou vídeo</label>
          <input id="photo-file" name="arquivo" type="file" accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime" required>
          <small>Limite de 50 MB por arquivo.</small>
        </div>

        <div id="file-preview" class="file-preview"></div>
        <button class="primary-btn" type="submit">Publicar arquivo</button>
      </form>

      <article class="form-card">
        <h3>📸 Sua galeria</h3>
        <p>Os arquivos publicados aparecem abaixo. A exibição no site dos visitantes depende de ele consultar a mesma tabela e o mesmo bucket do Supabase.</p>
        <p><strong>${state.fotos.length}</strong> arquivo(s) cadastrado(s).</p>
      </article>
    </div>

    <div class="item-list">
      ${cards || '<div class="empty">Nenhuma foto ou vídeo publicado ainda.</div>'}
    </div>
  `;
}

async function uploadPhoto(event) {
  event.preventDefault();
  if (state.busy) return;

  const title = $("#photo-title").value.trim();
  const file = $("#photo-file").files[0];

  if (!title || !file) {
    showMessage("Informe uma legenda e selecione um arquivo.", true);
    return;
  }

  if (!isImageFile(file) && !isVideoFile(file)) {
    showMessage("Escolha um arquivo de imagem ou vídeo compatível.", true);
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    showMessage("O arquivo ultrapassa o limite de 50 MB.", true);
    return;
  }

  const allowedExtensions = [
    "jpg", "jpeg", "png", "gif", "webp", "avif",
    "mp4", "webm", "ogg", "mov", "m4v"
  ];

  if (!allowedExtensions.includes(getFileExtension(file))) {
    showMessage("A extensão desse arquivo não é permitida.", true);
    return;
  }

  setBusy(true);
  showMessage("Enviando arquivo... aguarde.");

  const storagePath =
    `${Date.now()}-${crypto.randomUUID()}-${makeSafeFileName(file.name)}`;

  try {
    const { error: uploadError } = await supabaseClient.storage
      .from(MEDIA_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type
      });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabaseClient.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(storagePath);

    const publicUrl = publicData?.publicUrl;

    if (!publicUrl) {
      throw new Error("Não foi possível obter a URL pública do arquivo.");
    }

    const { error: insertError } = await supabaseClient
      .from(TABLES.fotos)
      .insert([{
        nome: title,
        imagem_url: publicUrl,
        storage_path: storagePath
      }]);

    if (insertError) {
      await supabaseClient.storage.from(MEDIA_BUCKET).remove([storagePath]);
      throw insertError;
    }

    $("#photo-form").reset();
    $("#file-preview").innerHTML = "";

    await loadPhotos();
    renderStats();
    renderPage("fotos");
    showMessage("Arquivo publicado com sucesso.");
  } catch (error) {
    showMessage(`Erro ao publicar arquivo: ${error.message}`, true);
  } finally {
    setBusy(false);
  }
}

function previewSelectedFile() {
  const file = $("#photo-file")?.files?.[0];
  const preview = $("#file-preview");

  if (!preview) return;
  preview.innerHTML = "";

  if (!file) return;

  if (file.size > MAX_FILE_SIZE) {
    preview.textContent = "O arquivo ultrapassa 50 MB.";
    return;
  }

  if (!isImageFile(file) && !isVideoFile(file)) {
    preview.textContent = "Selecione uma imagem ou um vídeo compatível.";
    return;
  }

  const url = URL.createObjectURL(file);
  const element = document.createElement(isVideoFile(file) ? "video" : "img");

  element.src = url;
  element.style.maxWidth = "100%";
  element.style.maxHeight = "220px";
  element.style.borderRadius = "12px";

  if (isVideoFile(file)) {
    element.controls = true;
  } else {
    element.alt = "Pré-visualização do arquivo";
  }

  preview.appendChild(element);
  const details = document.createElement("p");
  details.textContent = `${file.name} · ${formatFileSize(file.size)}`;
  preview.appendChild(details);
}

async function deletePhoto(id) {
  if (!window.confirm("Deseja excluir este arquivo da galeria?")) return;

  setBusy(true);

  try {
    const photo = state.fotos.find((item) => String(item.id) === String(id));

    if (!photo) throw new Error("Arquivo não encontrado.");

    const { error: rowError } = await supabaseClient
      .from(TABLES.fotos)
      .delete()
      .eq("id", id);

    if (rowError) throw rowError;

    if (photo.storage_path) {
      const { error: storageError } = await supabaseClient.storage
        .from(MEDIA_BUCKET)
        .remove([photo.storage_path]);

      if (storageError) {
        showMessage(
          `Registro removido, mas o arquivo no armazenamento não pôde ser apagado: ${storageError.message}`,
          true
        );
      }
    }

    await loadPhotos();
    renderStats();
    renderPage("fotos");
    showMessage("Arquivo removido da galeria.");
  } catch (error) {
    showMessage(`Erro ao excluir arquivo: ${error.message}`, true);
  } finally {
    setBusy(false);
  }
}

/* 10. EVENTOS, PROMOÇÕES E AVISOS */

function renderContentPage(type) {
  const list = getCurrentList(type);
  const isEvent = type === "eventos";
  const isPromotion = type === "promocoes";
  const dateLabel = isEvent ? "Data do evento" : "Validade";
  const dateField = getDateField(type);

  const cards = list.map((item) => `
    <article class="item-card">
      <h3>${escapeHTML(item.titulo)}</h3>
      <p>${escapeHTML(item.descricao)}</p>
      ${item.data ? `<p><strong>${escapeHTML(dateLabel)}:</strong> ${escapeHTML(formatDate(item.data))}</p>` : ""}
      <div class="item-actions">
        <button class="delete-btn" type="button" data-delete-content="${escapeHTML(type)}" data-id="${escapeHTML(item.id)}">Excluir publicação</button>
      </div>
    </article>
  `).join("");

  return `
    <div class="content-grid">
      <form class="form-card" id="content-form" data-type="${escapeHTML(type)}">
        <h3>${isEvent ? "Adicionar evento" : isPromotion ? "Adicionar promoção" : "Publicar aviso"}</h3>

        <div class="field">
          <label for="content-title">Título</label>
          <input id="content-title" name="titulo" maxlength="150" required placeholder="${isEvent ? "Ex.: Música ao vivo" : isPromotion ? "Ex.: Promoção de fim de semana" : "Ex.: Horário de funcionamento"}">
        </div>

        <div class="field">
          <label for="content-description">Descrição</label>
          <textarea id="content-description" name="descricao" maxlength="5000" required placeholder="Escreva os detalhes da publicação"></textarea>
        </div>

        ${isEvent || isPromotion ? `
          <div class="field">
            <label for="content-date">${escapeHTML(dateLabel)}</label>
            <input id="content-date" name="${dateField}" type="date" required>
          </div>
        ` : ""}

        <button class="primary-btn" type="submit">Publicar</button>
      </form>

      <article class="form-card">
        <h3>📌 Dica</h3>
        <p>${isEvent
          ? "Informe a data e os detalhes para que os visitantes saibam quando o evento acontecerá."
          : isPromotion
            ? "Descreva a oferta e informe até quando a promoção é válida."
            : "Use avisos para comunicar novidades e informações importantes aos visitantes."}</p>
        <p><strong>${list.length}</strong> publicação(ões) cadastrada(s).</p>
      </article>
    </div>

    <div class="item-list">
      ${cards || '<div class="empty">Nenhuma publicação cadastrada nesta seção.</div>'}
    </div>
  `;
}

async function saveContent(event) {
  event.preventDefault();
  if (state.busy) return;

  const form = event.currentTarget;
  const type = form.dataset.type;
  const formData = new FormData(form);

  const titulo = String(formData.get("titulo") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim();

  if (!titulo || !descricao) {
    showMessage("Preencha o título e a descrição.", true);
    return;
  }

  const row = { titulo, descricao };
  const dateField = getDateField(type);
  const dateValue = String(formData.get(dateField) || "");

  if (type === "eventos" || type === "promocoes") {
    if (!dateValue) {
      showMessage("Preencha a data solicitada.", true);
      return;
    }

    row[dateField] = dateValue;
  }

  setBusy(true);

  try {
    const { error } = await supabaseClient
      .from(TABLES[type])
      .insert([row]);

    if (error) throw error;

    await loadContent(type);
    renderStats();
    renderPage(type);
    showMessage("Publicação salva com sucesso.");
  } catch (error) {
    showMessage(`Erro ao publicar: ${error.message}`, true);
  } finally {
    setBusy(false);
  }
}

async function deleteContent(type, id) {
  if (!TABLES[type]) return;

  if (!window.confirm("Tem certeza de que deseja excluir esta publicação?")) {
    return;
  }

  setBusy(true);

  try {
    const { error } = await supabaseClient
      .from(TABLES[type])
      .delete()
      .eq("id", id);

    if (error) throw error;

    await loadContent(type);
    renderStats();
    renderPage(type);
    showMessage("Publicação excluída.");
  } catch (error) {
    showMessage(`Erro ao excluir publicação: ${error.message}`, true);
  } finally {
    setBusy(false);
  }
}

/* 11. EVENTOS DOS FORMULÁRIOS E BOTÕES */

function attachPageEvents() {
  const contentForm = $("#content-form");
  if (contentForm) {
    contentForm.addEventListener("submit", saveContent);
  }

  const photoForm = $("#photo-form");
  if (photoForm) {
    photoForm.addEventListener("submit", uploadPhoto);
  }

  const fileInput = $("#photo-file");
  if (fileInput) {
    fileInput.addEventListener("change", previewSelectedFile);
  }

  const refreshButton = $("#refresh-content");
  if (refreshButton) {
    refreshButton.addEventListener("click", refreshAllData);
  }

  document.querySelectorAll("[data-delete-photo]").forEach((button) => {
    button.addEventListener("click", () => {
      deletePhoto(button.dataset.deletePhoto);
    });
  });

  document.querySelectorAll("[data-delete-content]").forEach((button) => {
    button.addEventListener("click", () => {
      deleteContent(button.dataset.deleteContent, button.dataset.id);
    });
  });
}

function setupNavigation() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      navigateTo(button.dataset.page);
    });
  });
}

function setupTheme() {
  const savedTheme = localStorage.getItem("estacaoAlegriaTheme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
  }

  updateThemeIcon();

  $("#theme-toggle").addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");

    localStorage.setItem(
      "estacaoAlegriaTheme",
      document.body.classList.contains("dark-theme") ? "dark" : "light"
    );

    updateThemeIcon();
  });
}

function updateThemeIcon() {
  const isDark = document.body.classList.contains("dark-theme");
  $("#theme-icon").textContent = isDark ? "🌙" : "☀️";
  $("#theme-toggle").setAttribute(
    "aria-label",
    isDark ? "Ativar tema claro" : "Ativar tema escuro"
  );
}

function setupPreviewLink() {
  const link = $("#preview-link");

  // Troque pelo endereço público verdadeiro do site dos visitantes.
  const PUBLIC_SITE_URL = "";

  if (PUBLIC_SITE_URL) {
    link.href = PUBLIC_SITE_URL;
    link.target = "_blank";
  } else {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      showMessage(
        "Configure o endereço público do site dos visitantes em setupPreviewLink().",
        true
      );
    });
  }
}

/* 12. INÍCIO */

async function initializeApp() {
  setupNavigation();
  setupTheme();
  setupPreviewLink();

  $("#auth-form").addEventListener("submit", handleAuthSubmit);

  $("#auth-switch").addEventListener("click", () => {
    state.authMode = state.authMode === "login" ? "signup" : "login";
    updateAuthMode();
  });

  $("#logout-btn").addEventListener("click", handleLogout);

  renderStats();
  renderPage("inicio");

  try {
    initializeSupabase();
    listenForAuthChanges();
    await restoreAuthSession();
  } catch (error) {
    setAuthenticated(false);
    showAuthMessage(error.message || "Erro ao iniciar o painel.");
  }
}

document.addEventListener("DOMContentLoaded", initializeApp);
