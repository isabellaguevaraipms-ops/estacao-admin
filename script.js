
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

// Garante que todas as categorias existam.
Object.keys(initialData).forEach(key => {
  if (!Array.isArray(data[key])) {
    data[key] = [];
  }
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
// CONEXÃO COM AS TABELAS DO SUPABASE
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

  if (error) {
    throw error;
  }

  data[type] = (rows || []).map(row =>
    fromDatabase(type, row)
  );
}

async function refreshCloudData() {
  try {
    await Promise.all([
      loadCloudItems("eventos"),
      loadCloudItems("promocoes"),
      loadCloudItems("avisos")
    ]);

    updateStats();

    // Atualiza a seção que estiver aberta.
    const activePage = document.querySelector(
      ".nav-item.active"
    )?.dataset.page;

    if (
      activePage &&
      cloudTables[activePage] &&
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
            Eventos, promoções e avisos são carregados
            do banco de dados do Supabase.
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
          <strong>Banco de dados:</strong>
          Supabase
        </p>
        <p>
          <strong>Galeria de fotos:</strong>
          armazenamento local neste navegador.
        </p>
      </div>`;
    return;
  }

  renderManager(page);
}

// ==========================================
// FORMULÁRIOS DE CADASTRO
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
              ? "As fotos ficam salvas somente neste navegador nesta etapa."
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

  const date = String(
    formData.get("date") || ""
  );

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
    // FOTOS: continuam salvas localmente nesta etapa.
    if (type === "fotos") {
      const file = formData.get("image");

      if (!file || !file.type.startsWith("image/")) {
        alert("Selecione um arquivo de imagem válido.");
        return;
      }

      if (file.size > 700 * 1024) {
        alert("Escolha uma imagem de até 700 KB.");
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        data.fotos.unshift({
          id: crypto.randomUUID(),
          title,
          description,
          image: reader.result,
          createdAt: new Date().toISOString()
        });

        saveData();
        renderPage(type);
      };

      reader.onerror = () => {
        alert("Não foi possível ler a imagem.");
      };

      reader.readAsDataURL(file);
      return;
    }

    // EVENTOS, PROMOÇÕES E AVISOS: SUPABASE.
    const table = cloudTables[type];

    if (!table) {
      alert("Tipo de publicação inválido.");
      return;
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
      error.message
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
            ? `<img src="${item.image}" alt="${escapeHTML(item.title)}">`
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

        if (!confirm("Deseja realmente excluir esta publicação?")) {
          return;
        }

        button.disabled = true;

        try {
          if (cloudTables[type]) {
            const { error } = await supabaseClient
              .from(cloudTables[type])
              .delete()
              .eq("id", id);

            if (error) throw error;

            await loadCloudItems(type);
          } else {
            data[type] = data[type].filter(
              item => item.id !== id
            );

            saveData();
          }

          updateStats();
          renderPage(type);

        } catch (error) {
          console.error("Erro ao excluir:", error);

          alert(
            "Não foi possível excluir a publicação.\n\n" +
            error.message
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
          Atualize a página e tente novamente.
        </div>
      `;
    }
  }
}

// ==========================================
// EVENTOS DO MENU E DO PAINEL
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

const SUPABASE_URL =
  "https://ggxhghszthcgnkecoiir.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_EohrXK6tulCPMKavk5GQfw_OxIQkxgQ";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

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

    if (/already registered|already exists|user already/i.test(message)) {
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
    // Carrega as publicações da nuvem depois do login.
    setTimeout(() => {
      refreshCloudData();
    }, 0);
  }

  if (event === "SIGNED_OUT") {
    authForm.reset();
    showAuthMessage("Você saiu da sua conta.");
  }
});

// Recupera a sessão salva ao abrir ou atualizar a página.
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
