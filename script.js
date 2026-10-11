
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
  fotos: "Galeria de fotos",
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
// SUPABASE
// ==========================================

const SUPABASE_URL =
  "https://ggxhghszthcgnkecoiir.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_EohrXK6tulCPMKavk5GQfw_OxIQkxgQ";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

// Nome do bucket de imagens: foto
// Nome da tabela de registros: fotos

const PHOTO_BUCKET = "foto";

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
    storagePath: row.storage_path,
    createdAt: row.created_at
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
            Use o menu lateral para cadastrar fotos,
            eventos, promoções e avisos.
          </p>
          <button class="primary-btn" data-go="fotos">
            Adicionar fotos
          </button>
        </div>

        <div class="form-card">
          <h3>Publicações na nuvem 🔗</h3>
          <p>
            Fotos, eventos, promoções e avisos são
            carregados do Supabase.
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
          <strong>Galeria de fotos:</strong>
          armazenamento em nuvem pelo Supabase.
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
      title: "Adicionar foto",
      fields: `
        <div class="field">
          <label for="item-title">Título da foto</label>
          <input
            id="item-title"
            name="title"
            placeholder="Ex.: Nossa piscina"
            required
          >
        </div>

        <div class="field">
          <label for="item-image">Selecionar imagem</label>
          <input
            id="item-image"
            name="image"
            type="file"
            accept="image/*"
            required
          >
        </div>

        <div class="field">
          <label for="item-description">Descrição</label>
          <textarea
            id="item-description"
            name="description"
            placeholder="Conte um pouco sobre a foto"
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
              ? "As fotos são enviadas ao Supabase e ficam disponíveis na galeria pública."
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

  renderItems(type);
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
    // FOTOS: upload para Storage e registro na tabela.
    if (type === "fotos") {
      const file = formData.get("image");

      if (
        !file ||
        typeof file.type !== "string" ||
        !file.type.startsWith("image/")
      ) {
        throw new Error("Selecione uma imagem válida.");
      }

      if (file.size > 700 * 1024) {
        throw new Error(
          "Escolha uma imagem de até 700 KB."
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

      const extensionMatch = file.name.match(
        /\.([a-zA-Z0-9]+)$/
      );

      const extension = extensionMatch
        ? extensionMatch[1].toLowerCase()
        : "jpg";

      const storagePath =
        `${crypto.randomUUID()}.${extension}`;

      // IMPORTANTE: bucket no singular: foto
      const { error: uploadError } =
        await supabaseClient.storage
          .from(PHOTO_BUCKET)
          .upload(storagePath, file, {
            contentType: file.type,
            upsert: false
          });

      if (uploadError) throw uploadError;

      // Gera o endereço público do arquivo enviado.
      const { data: publicData } =
        supabaseClient.storage
          .from(PHOTO_BUCKET)
          .getPublicUrl(storagePath);

      if (!publicData?.publicUrl) {
        throw new Error(
          "Não foi possível gerar o endereço da imagem."
        );
      }

      // IMPORTANTE: a tabela continua no plural: fotos
      const { error: insertError } =
        await supabaseClient
          .from("fotos")
          .insert({
            nome: title,
            imagem_url: publicData.publicUrl,
            storage_path: storagePath
          });

      if (insertError) {
        // Tenta remover o arquivo caso o registro falhe.
        const { error: cleanupError } =
          await supabaseClient.storage
            .from(PHOTO_BUCKET)
            .remove([storagePath]);

        if (cleanupError) {
          console.error(
            "Não foi possível remover o arquivo enviado:",
            cleanupError
          );
        }

        throw insertError;
      }

      await loadPhotos();
      updateStats();
      renderPage("fotos");

      alert("Foto publicada com sucesso!");
      return;
    }

    // EVENTOS, PROMOÇÕES E AVISOS.
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
// LISTAR E EXCLUIR PUBLICAÇÕES
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

    list.innerHTML = items.map(item => `
      <article class="item-card">
        ${
          type === "fotos" && item.image
            ? `<img
                 src="${escapeHTML(item.image)}"
                 alt="${escapeHTML(item.title)}"
               >`
            : ""
        }

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
          >
            Excluir
          </button>
        </div>
      </article>
    `).join("");

    list.querySelectorAll("[data-delete]").forEach(button => {
      button.addEventListener("click", async () => {
        const id = button.dataset.delete;

        if (
          !confirm(
            "Deseja realmente excluir esta publicação?"
          )
        ) {
          return;
        }

        button.disabled = true;

        try {
          if (type === "fotos") {
            const photo = data.fotos.find(
              item => String(item.id) === String(id)
            );

            if (!photo) {
              throw new Error("Foto não encontrada.");
            }

            if (!photo.storagePath) {
              throw new Error(
                "Esta foto não possui caminho registrado no Storage. Ela não foi excluída."
              );
            }

            // Remove a imagem do bucket foto.
            const { error: storageError } =
              await supabaseClient.storage
                .from(PHOTO_BUCKET)
                .remove([photo.storagePath]);

            if (storageError) throw storageError;

            // Remove o registro da tabela fotos.
            const { error: deleteError } =
              await supabaseClient
                .from("fotos")
                .delete()
                .eq("id", id);

            if (deleteError) {
              throw new Error(
                "O arquivo foi removido, mas o registro não pôde ser apagado: " +
                deleteError.message
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
      "Na próxima etapa, conectaremos aqui o endereço do site público da Estação Alegria."
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

// Atualiza a interface quando o login muda.
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

// ==========================================
// RECUPERAR SESSÃO
// ==========================================

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
