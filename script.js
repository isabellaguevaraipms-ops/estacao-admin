
const storageKey = "estacaoAlegriaAdminDemo";

const initialData = {
  fotos: [],
  eventos: [],
  promocoes: [],
  avisos: []
};

let data;

try {
  data = JSON.parse(localStorage.getItem(storageKey)) || {
    ...initialData
  };
} catch {
  data = { ...initialData };
}

Object.keys(initialData).forEach(key => {
  if (!Array.isArray(data[key])) data[key] = [];
});

const titles = {
  inicio: "Visão geral",
  fotos: "Galeria de fotos e vídeos",
  eventos: "Eventos",
  promocoes: "Promoções",
  avisos: "Avisos",
  configuracoes: "Configurações"
};

const cloudTables = {
  eventos: "eventos",
  promocoes: "promocoes",
  avisos: "avisos"
};

const pageContent = document.getElementById("page-content");

// ==========================================
// DADOS E ESTATÍSTICAS
// ==========================================

function saveData() {
  localStorage.setItem(storageKey, JSON.stringify(data));
  updateStats();
}

function updateStats() {
  document.getElementById("total-fotos").textContent =
    data.fotos.length;

  document.getElementById("total-eventos").textContent =
    data.eventos.length;

  document.getElementById("total-promocoes").textContent =
    data.promocoes.length;

  document.getElementById("total-avisos").textContent =
    data.avisos.length;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// ==========================================
// IDENTIFICAR FOTOS E VÍDEOS
// ==========================================

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const PHOTO_BUCKET = "foto";

const allowedImageExtensions = [
  "jpg", "jpeg", "png", "webp", "gif", "avif"
];

const allowedVideoExtensions = [
  "mp4", "webm", "mov", "m4v", "ogv", "ogg"
];

function getExtension(filename = "") {
  return filename.split(".").pop().toLowerCase();
}

function isVideoFile(filename = "", mimeType = "") {
  const extension = getExtension(filename);

  return (
    mimeType.startsWith("video/") ||
    allowedVideoExtensions.includes(extension)
  );
}

function isAllowedFile(file) {
  const extension = getExtension(file.name);

  const allowedExtensions = [
    ...allowedImageExtensions,
    ...allowedVideoExtensions
  ];

  if (!allowedExtensions.includes(extension)) {
    return false;
  }

  // Se o navegador não informar o MIME, usamos a extensão.
  if (!file.type) return true;

  if (allowedImageExtensions.includes(extension)) {
    return file.type.startsWith("image/");
  }

  if (allowedVideoExtensions.includes(extension)) {
    return file.type.startsWith("video/");
  }

  return false;
}

// ==========================================
// SUPABASE
// ==========================================

const SUPABASE_URL =
  "https://ggxhghszthcgnkecoiir.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_EohrXK6tulCPMKavk5G5Gfw_OxIQkxgQ";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

// ==========================================
// CARREGAR DADOS DO BANCO
// ==========================================

function fromDatabase(type, row) {
  return {
    id: row.id,
    title: row.titulo,
    description: row.descricao || "",
    date:
      type === "eventos"
        ? row.data_evento || ""
        : type === "promocoes"
          ? row.validade || ""
          : "",
    image: row.imagem_url || "",
    createdAt: row.created_at
  };
}

async function loadCloudItems(type) {
  if (!cloudTables[type]) return;

  const { data: rows, error } = await supabaseClient
    .from(cloudTables[type])
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  data[type] = (rows || []).map(row =>
    fromDatabase(type, row)
  );
}

async function loadPhotos() {
  const { data: rows, error } = await supabaseClient
    .from("fotos")
    .select("id, nome, imagem_url, storage_path, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  data.fotos = (rows || []).map(row => ({
    id: row.id,
    title: row.nome || "",
    description: "",
    image: row.imagem_url || "",
    storagePath: row.storage_path || "",
    createdAt: row.created_at,
    isVideo: isVideoFile(row.storage_path || row.imagem_url || "")
  }));

  updateStats();
}

async function refreshCloudData() {
  try {
    await Promise.all([
      loadCloudItems("eventos"),
      loadCloudItems("promocoes"),
      loadCloudItems("avisos"),
      loadPhotos()
    ]);

    updateStats();

    const activePage = document.querySelector(
      ".nav-item.active"
    )?.dataset.page;

    if (
      activePage &&
      document.getElementById("item-list")
    ) {
      renderItems(activePage);
    }
  } catch (error) {
    console.error(
      "Erro ao atualizar os dados do Supabase:",
      error
    );
  }
}

// ==========================================
// NAVEGAÇÃO E PÁGINAS
// ==========================================

function renderPage(page) {
  if (!titles[page]) return;

  document.getElementById("page-title").textContent =
    titles[page];

  document.getElementById("section-title").textContent =
    page === "inicio"
      ? "Conteúdo do estabelecimento"
      : titles[page];

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  if (page === "inicio") {
    pageContent.innerHTML = `
      <div class="content-grid">
        <div class="form-card">
          <h3>Comece por aqui ☀️</h3>
          <p>
            Cadastre fotos, vídeos, eventos, promoções
            e avisos para os visitantes.
          </p>
          <button class="primary-btn" data-go="fotos">
            Adicionar foto ou vídeo
          </button>
        </div>

        <div class="form-card">
          <h3>Publicações na nuvem 🔗</h3>
          <p>
            Os conteúdos são carregados do Supabase
            e podem aparecer no site dos clientes.
          </p>
          <button class="primary-btn" data-go="eventos">
            Cadastrar evento
          </button>
        </div>
      </div>`;
    return;
  }

  if (page === "configuracoes") {
    pageContent.innerHTML = `
      <div class="form-card">
        <h3>Informações do estabelecimento</h3>
        <p>
          Nesta seção, futuramente você poderá editar
          as informações de contato e os dados do clube.
        </p>
        <p>
          <strong>Instagram:</strong>
          @estacao_alegria_oficial
        </p>
        <p>
          <strong>Banco de dados:</strong> Supabase
        </p>
        <p>
          <strong>Galeria:</strong> fotos e vídeos na nuvem.
        </p>
      </div>`;
    return;
  }

  renderManager(page);
}

// ==========================================
// FORMULÁRIOS
// ==========================================

function renderManager(type) {
  const config = {
    fotos: {
      title: "Adicionar foto ou vídeo",
      fields: `
        <div class="field">
          <label for="item-title">Título ou legenda</label>
          <input
            id="item-title"
            name="title"
            placeholder="Ex.: Nossa piscina no verão"
            maxlength="160"
            required
          >
        </div>

        <div class="field">
          <label for="item-image">Selecionar foto ou vídeo</label>
          <input
            id="item-image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime,video/x-m4v,video/ogg"
            required
          >
          <small>
            Fotos: JPG, PNG, WEBP, GIF ou AVIF.
            Vídeos: MP4, WEBM, MOV ou OGG.
            Limite de 50 MB por arquivo.
          </small>
        </div>

        <div class="field" id="media-preview-container" hidden>
          <label>Pré-visualização</label>
          <div id="media-preview"></div>
        </div>

        <div class="field">
          <label for="item-description">Descrição (opcional)</label>
          <textarea
            id="item-description"
            name="description"
            placeholder="Conte um pouco sobre o conteúdo"
          ></textarea>
        </div>`
    },

    eventos: {
      title: "Cadastrar evento",
      fields: `
        <div class="field">
          <label for="item-title">Nome do evento</label>
          <input
            id="item-title"
            name="title"
            placeholder="Ex.: Domingo em família"
            required
          >
        </div>

        <div class="field">
          <label for="item-date">Data</label>
          <input id="item-date" name="date" type="date">
        </div>

        <div class="field">
          <label for="item-description">Descrição</label>
          <textarea
            id="item-description"
            name="description"
            placeholder="Horário, atrações e detalhes"
            required
          ></textarea>
        </div>`
    },

    promocoes: {
      title: "Criar promoção",
      fields: `
        <div class="field">
          <label for="item-title">Título da promoção</label>
          <input
            id="item-title"
            name="title"
            placeholder="Ex.: Promoção para famílias"
            required
          >
        </div>

        <div class="field">
          <label for="item-date">Válida até</label>
          <input id="item-date" name="date" type="date">
        </div>

        <div class="field">
          <label for="item-description">Detalhes</label>
          <textarea
            id="item-description"
            name="description"
            placeholder="Descreva a oferta"
            required
          ></textarea>
        </div>`
    },

    avisos: {
      title: "Publicar aviso",
      fields: `
        <div class="field">
          <label for="item-title">Título do aviso</label>
          <input
            id="item-title"
            name="title"
            placeholder="Ex.: Horário de funcionamento"
            required
          >
        </div>

        <div class="field">
          <label for="item-description">Mensagem</label>
          <textarea
            id="item-description"
            name="description"
            placeholder="Escreva o aviso para os visitantes"
            required
          ></textarea>
        </div>`
    }
  };

  const current = config[type];

  if (!current) return;

  pageContent.innerHTML = `
    <div class="content-grid">
      <form class="form-card" id="item-form">
        <h3>${current.title}</h3>
        ${current.fields}

        <button class="primary-btn" type="submit">
          Salvar publicação
        </button>
      </form>

      <div class="form-card">
        <h3>Sobre as publicações</h3>
        <p>
          ${
            type === "fotos"
              ? "Fotos e vídeos são enviados ao Supabase Storage e registrados na tabela fotos."
              : "Os dados são salvos no banco de dados do Supabase."
          }
        </p>
      </div>
    </div>

    <div class="item-list" id="item-list"></div>
  `;

  document
    .getElementById("item-form")
    .addEventListener("submit", handleSubmit);

  if (type === "fotos") {
    setupMediaPreview();
  }

  renderItems(type);
}

// ==========================================
// PRÉ-VISUALIZAÇÃO DO ARQUIVO
// ==========================================

let previewObjectUrl = null;

function setupMediaPreview() {
  const input = document.getElementById("item-image");
  const container = document.getElementById(
    "media-preview-container"
  );
  const preview = document.getElementById("media-preview");

  input.addEventListener("change", () => {
    preview.innerHTML = "";

    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      previewObjectUrl = null;
    }

    const file = input.files?.[0];

    if (!file) {
      container.hidden = true;
      return;
    }

    if (file.size > MAX_FILE_SIZE || !isAllowedFile(file)) {
      container.hidden = true;
      input.value = "";
      alert(
        "Arquivo inválido. Escolha uma foto ou um vídeo permitido de até 50 MB."
      );
      return;
    }

    previewObjectUrl = URL.createObjectURL(file);
    container.hidden = false;

    if (isVideoFile(file.name, file.type)) {
      preview.innerHTML = `
        <video
          src="${previewObjectUrl}"
          controls
          playsinline
          preload="metadata"
          style="max-width:100%;max-height:320px;border-radius:12px"
        ></video>
      `;
    } else {
      preview.innerHTML = `
        <img
          src="${previewObjectUrl}"
          alt="Pré-visualização da foto"
          style="max-width:100%;max-height:320px;object-fit:contain;border-radius:12px"
        >
      `;
    }
  });
}

// ==========================================
// SALVAR PUBLICAÇÕES
// ==========================================

async function handleSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;

  const type = document.querySelector(
    ".nav-item.active"
  )?.dataset.page;

  const formData = new FormData(form);

  const title = String(
    formData.get("title") || ""
  ).trim();

  const description = String(
    formData.get("description") || ""
  ).trim();

  const date = String(formData.get("date") || "");

  if (!title) {
    alert("Informe um título.");
    return;
  }

  const submitButton = form.querySelector(
    'button[type="submit"]'
  );

  submitButton.disabled = true;
  submitButton.textContent = "Salvando...";

  try {
    if (type === "fotos") {
      const file = formData.get("image");

      if (!file || !file.name) {
        throw new Error("Selecione uma foto ou um vídeo.");
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error(
          "O arquivo excede o limite de 50 MB."
        );
      }

      if (!isAllowedFile(file)) {
        throw new Error(
          "Formato não permitido. Use JPG, PNG, WEBP, GIF, AVIF, MP4, WEBM, MOV ou OGG."
        );
      }

      const { data: sessionData, error: sessionError } =
        await supabaseClient.auth.getSession();

      if (sessionError) throw sessionError;

      if (!sessionData.session) {
        throw new Error(
          "Sua sessão expirou. Entre novamente no painel."
        );
      }

      const extension = getExtension(file.name);
      const storagePath =
        `${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } =
        await supabaseClient.storage
          .from(PHOTO_BUCKET)
          .upload(storagePath, file, {
            contentType: file.type || undefined,
            cacheControl: "3600",
            upsert: false
          });

      if (uploadError) throw uploadError;

      const { data: publicData } =
        supabaseClient.storage
          .from(PHOTO_BUCKET)
          .getPublicUrl(storagePath);

      if (!publicData?.publicUrl) {
        await supabaseClient.storage
          .from(PHOTO_BUCKET)
          .remove([storagePath]);

        throw new Error(
          "Não foi possível gerar o endereço público do arquivo."
        );
      }

      const { error: insertError } =
        await supabaseClient
          .from("fotos")
          .insert({
            nome: title,
            imagem_url: publicData.publicUrl,
            storage_path: storagePath
          });

      if (insertError) {
        await supabaseClient.storage
          .from(PHOTO_BUCKET)
          .remove([storagePath]);

        throw insertError;
      }

      await loadPhotos();
      updateStats();
      renderPage("fotos");

      alert(
        isVideoFile(file.name, file.type)
          ? "Vídeo publicado com sucesso!"
          : "Foto publicada com sucesso!"
      );

      return;
    }

    const table = cloudTables[type];

    if (!table) {
      throw new Error("Tipo de publicação inválido.");
    }

    const record = {
      titulo: title,
      descricao: description
    };

    if (type === "eventos") {
      record.data_evento = date || null;
    }

    if (type === "promocoes") {
      record.validade = date || null;
    }

    const { error } = await supabaseClient
      .from(table)
      .insert(record);

    if (error) throw error;

    await loadCloudItems(type);
    updateStats();
    renderPage(type);

    alert("Publicação salva com sucesso!");

  } catch (error) {
    console.error("Erro ao salvar:", error);

    alert(
      "Não foi possível salvar a publicação.\n\n" +
      (error.message || "Erro desconhecido.")
    );

  } finally {
    if (submitButton.isConnected) {
      submitButton.disabled = false;
      submitButton.textContent = "Salvar publicação";
    }
  }
}

// ==========================================
// LISTAR PUBLICAÇÕES
// ==========================================

async function renderItems(type) {
  const list = document.getElementById("item-list");

  if (!list) return;

  list.innerHTML = `
    <div class="empty">Carregando publicações...</div>
  `;

  try {
    if (cloudTables[type]) {
      await loadCloudItems(type);
    } else if (type === "fotos") {
      await loadPhotos();
    }

    if (!list.isConnected) return;

    const items = data[type] || [];

    if (!items.length) {
      list.innerHTML = `
        <div class="empty">
          Nenhum item cadastrado ainda.
          Use o formulário para adicionar o primeiro.
        </div>
      `;
      return;
    }

    list.innerHTML = items.map(item => {
      const media = type === "fotos" && item.image
        ? (
            isVideoFile(
              item.storagePath || item.image,
              ""
            )
              ? `<video
                   src="${escapeHTML(item.image)}"
                   controls
                   playsinline
                   preload="metadata"
                   style="width:100%;max-height:260px;object-fit:contain;border-radius:12px"
                 ></video>`
              : `<img
                   src="${escapeHTML(item.image)}"
                   alt="${escapeHTML(item.title)}"
                   loading="lazy"
                 >`
          )
        : "";

      return `
        <article class="item-card">
          ${media}

          <h3>${escapeHTML(item.title)}</h3>

          ${
            item.date
              ? `<p>Data: ${escapeHTML(item.date)}</p>`
              : ""
          }

          <p>${escapeHTML(item.description || "Sem descrição.")}</p>

          <div class="item-actions">
            <button
              class="delete-btn"
              data-delete="${escapeHTML(item.id)}"
              type="button"
            >
              Excluir
            </button>
          </div>
        </article>
      `;
    }).join("");

    list.querySelectorAll("[data-delete]").forEach(button => {
      button.addEventListener("click", async () => {
        const id = button.dataset.delete;

        if (!confirm("Deseja realmente excluir esta publicação?")) {
          return;
        }

        button.disabled = true;

        try {
          if (type === "fotos") {
            const photo = data.fotos.find(
              item => String(item.id) === String(id)
            );

            if (!photo) {
              throw new Error("Arquivo não encontrado.");
            }

            if (!photo.storagePath) {
              throw new Error(
                "O caminho do arquivo não está registrado no Supabase."
              );
            }

            const { error: deleteError } =
              await supabaseClient
                .from("fotos")
                .delete()
                .eq("id", id);

            if (deleteError) throw deleteError;

            const { error: storageError } =
              await supabaseClient.storage
                .from(PHOTO_BUCKET)
                .remove([photo.storagePath]);

            if (storageError) {
              console.error(
                "O registro foi excluído, mas o arquivo não pôde ser removido:",
                storageError
              );
            }

            await loadPhotos();

          } else if (cloudTables[type]) {
            const { error } = await supabaseClient
              .from(cloudTables[type])
              .delete()
              .eq("id", id);

            if (error) throw error;

            await loadCloudItems(type);

          } else {
            data[type] = data[type].filter(
              item => String(item.id) !== String(id)
            );

            saveData();
          }

          updateStats();
          renderPage(type);

          alert("Publicação excluída.");

        } catch (error) {
          console.error("Erro ao excluir:", error);

          alert(
            "Não foi possível concluir a exclusão.\n\n" +
            (error.message || "Erro desconhecido.")
          );

          button.disabled = false;
        }
      });
    });

  } catch (error) {
    console.error("Erro ao carregar publicações:", error);

    if (list.isConnected) {
      list.innerHTML = `
        <div class="empty">
          Não foi possível carregar os dados.
          Verifique sua conexão e as permissões do Supabase.
        </div>
      `;
    }
  }
}

// ==========================================
// MENU E PAINEL
// ==========================================

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    renderPage(button.dataset.page);
  });
});

document
  .getElementById("preview-link")
  .addEventListener("click", event => {
    event.preventDefault();

    alert(
      "Configure o endereço público do site neste link."
    );
  });

pageContent.addEventListener("click", event => {
  const button = event.target.closest("[data-go]");

  if (button) {
    renderPage(button.dataset.go);
  }
});

// ==========================================
// TEMA CLARO E ESCURO
// ==========================================

const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");

function applyTheme(isDark) {
  document.body.classList.toggle("dark-theme", isDark);

  themeIcon.textContent = isDark ? "🌙" : "☀️";

  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Ativar tema claro" : "Ativar tema escuro"
  );

  localStorage.setItem(
    "estacaoAlegriaTheme",
    isDark ? "dark" : "light"
  );
}

const savedTheme = localStorage.getItem("estacaoAlegriaTheme");

applyTheme(savedTheme === "dark");

themeToggle.addEventListener("click", () => {
  const isDark = !document.body.classList.contains("dark-theme");
  applyTheme(isDark);
});

// ==========================================
// AUTENTICAÇÃO SUPABASE
// ==========================================

const authScreen = document.getElementById("auth-screen");
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authDescription = document.getElementById("auth-description");
const authSubmit = document.getElementById("auth-submit");
const authSwitch = document.getElementById("auth-switch");
const authMessage = document.getElementById("auth-message");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");

let isSignUpMode = false;
let authBusy = false;

const topbar = document.querySelector(".topbar");

const logoutButton = document.createElement("button");

logoutButton.type = "button";
logoutButton.id = "auth-logout";
logoutButton.className = "preview-link";
logoutButton.textContent = "Sair da conta";
logoutButton.style.border = "0";
logoutButton.style.cursor = "pointer";
logoutButton.style.display = "none";

topbar.appendChild(logoutButton);

function showAuthMessage(message, success = false) {
  authMessage.textContent = message;
  authMessage.style.color = success
    ? "#21865c"
    : "#b33b3b";
}

function updateAuthMode() {
  authTitle.textContent = isSignUpMode
    ? "Crie sua conta"
    : "Bem-vindo de volta!";

  authDescription.textContent = isSignUpMode
    ? "Cadastre seu e-mail para acessar o painel."
    : "Entre para administrar seu estabelecimento.";

  authSubmit.textContent = isSignUpMode
    ? "Criar conta"
    : "Entrar";

  authSwitch.textContent = isSignUpMode
    ? "Já tem uma conta? Entre aqui"
    : "Ainda não tem conta? Cadastre-se";

  authPassword.autocomplete = isSignUpMode
    ? "new-password"
    : "current-password";

  authPassword.minLength = 6;

  showAuthMessage("");
}

function setAuthenticated(isAuthenticated) {
  document.body.classList.toggle(
    "authenticated",
    isAuthenticated
  );

  authScreen.hidden = isAuthenticated;

  logoutButton.style.display = isAuthenticated
    ? "inline-block"
    : "none";
}

authSwitch.addEventListener("click", () => {
  isSignUpMode = !isSignUpMode;
  updateAuthMode();
});

authForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (authBusy) return;

  const email = authEmail.value.trim();
  const password = authPassword.value;

  authBusy = true;
  authSubmit.disabled = true;
  authSubmit.textContent = "Aguarde...";

  showAuthMessage("");

  try {
    if (isSignUpMode) {
      const { data: result, error } =
        await supabaseClient.auth.signUp({
          email,
          password
        });

      if (error) throw error;

      if (result.session) {
        showAuthMessage(
          "Conta criada com sucesso!",
          true
        );
      } else {
        showAuthMessage(
          "Cadastro recebido! Confira seu e-mail para confirmar a conta antes de entrar.",
          true
        );
      }

    } else {
      const { error } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

      if (error) throw error;

      showAuthMessage("Login realizado!", true);
    }

  } catch (error) {
    const message = String(error.message || "");

    if (
      /already registered|already exists|user already/i.test(message)
    ) {
      showAuthMessage(
        "Este e-mail já possui cadastro. Tente entrar."
      );
    } else if (/invalid login credentials/i.test(message)) {
      showAuthMessage("E-mail ou senha incorretos.");
    } else if (/email not confirmed/i.test(message)) {
      showAuthMessage("Confirme seu e-mail antes de entrar.");
    } else if (/password should be at least/i.test(message)) {
      showAuthMessage(
        "A senha precisa ter pelo menos 6 caracteres."
      );
    } else {
      showAuthMessage(
        "Não foi possível concluir. " + message
      );
    }

  } finally {
    authBusy = false;
    authSubmit.disabled = false;

    authSubmit.textContent = isSignUpMode
      ? "Criar conta"
      : "Entrar";
  }
});

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;

  try {
    const { error } = await supabaseClient.auth.signOut();

    if (error) throw error;

  } catch (error) {
    alert(
      "Não foi possível sair da conta: " +
      error.message
    );

  } finally {
    logoutButton.disabled = false;
  }
});

// ==========================================
// RECUPERAR SESSÃO
// ==========================================

supabaseClient.auth.onAuthStateChange((event, session) => {
  setAuthenticated(Boolean(session));

  if (event === "SIGNED_IN") {
    setTimeout(() => {
      refreshCloudData();
    }, 0);
  }

  if (event === "SIGNED_OUT") {
    authForm.reset();
    showAuthMessage("Você saiu da sua conta.");

    data.fotos = [];
    data.eventos = [];
    data.promocoes = [];
    data.avisos = [];

    updateStats();
  }
});

async function restoreAuthSession() {
  setAuthenticated(false);

  const { data: sessionData, error } =
    await supabaseClient.auth.getSession();

  if (error) {
    showAuthMessage(
      "Não foi possível verificar sua sessão. Atualize a página."
    );
    return;
  }

  const isAuthenticated = Boolean(sessionData.session);

  setAuthenticated(isAuthenticated);

  if (isAuthenticated) {
    await refreshCloudData();
  }
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================

updateStats();
renderPage("inicio");
updateAuthMode();
restoreAuthSession();
