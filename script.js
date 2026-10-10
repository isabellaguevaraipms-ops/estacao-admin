
const storageKey = "estacaoAlegriaAdminDemo";

const initialData = {
  fotos: [],
  eventos: [],
  promocoes: [],
  avisos: []
};

let data;

try {
  data = JSON.parse(localStorage.getItem(storageKey)) || initialData;
} catch {
  data = initialData;
}

const titles = {
  inicio: "Visão geral",
  fotos: "Galeria de fotos",
  eventos: "Eventos",
  promocoes: "Promoções",
  avisos: "Avisos",
  configuracoes: "Configurações"
};

const pageContent = document.getElementById("page-content");

function saveData() {
  localStorage.setItem(storageKey, JSON.stringify(data));
  updateStats();
}

function updateStats() {
  document.getElementById("total-fotos").textContent = data.fotos.length;
  document.getElementById("total-eventos").textContent = data.eventos.length;
  document.getElementById("total-promocoes").textContent = data.promocoes.length;
  document.getElementById("total-avisos").textContent = data.avisos.length;
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

function renderPage(page) {
  document.getElementById("page-title").textContent = titles[page];
  document.getElementById("section-title").textContent =
    page === "inicio" ? "Conteúdo do estabelecimento" : titles[page];

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  if (page === "inicio") {
    pageContent.innerHTML = `
      <div class="content-grid">
        <div class="form-card">
          <h3>Comece por aqui ☀️</h3>
          <p>Use o menu lateral para cadastrar fotos, eventos, promoções e avisos.</p>
          <button class="primary-btn" data-go="fotos">Adicionar fotos</button>
        </div>
        <div class="form-card">
          <h3>Próxima etapa 🔗</h3>
          <p>Vamos conectar este painel ao banco de dados e ao site público, para que as publicações apareçam para os visitantes.</p>
          <button class="primary-btn" data-go="eventos">Cadastrar evento</button>
        </div>
      </div>`;
    return;
  }

  if (page === "configuracoes") {
    pageContent.innerHTML = `
      <div class="form-card">
        <h3>Informações do estabelecimento</h3>
        <p>Na próxima etapa, vamos permitir que o proprietário altere informações de contato, links e dados do clube.</p>
        <p><strong>Instagram:</strong> @estacao_alegria_oficial</p>
        <p><strong>Armazenamento:</strong> demonstração local, ainda sem nuvem.</p>
      </div>`;
    return;
  }

  renderManager(page);
}

function renderManager(type) {
  const config = {
    fotos: {
      title: "Adicionar foto",
      fields: `
        <div class="field">
          <label for="item-title">Título da foto</label>
          <input id="item-title" name="title" placeholder="Ex.: Nossa piscina" required>
        </div>
        <div class="field">
          <label for="item-image">Selecionar imagem</label>
          <input id="item-image" name="image" type="file" accept="image/*" required>
        </div>
        <div class="field">
          <label for="item-description">Descrição</label>
          <textarea id="item-description" name="description" placeholder="Conte um pouco sobre a foto"></textarea>
        </div>`
    },
    eventos: {
      title: "Cadastrar evento",
      fields: `
        <div class="field">
          <label for="item-title">Nome do evento</label>
          <input id="item-title" name="title" placeholder="Ex.: Domingo em família" required>
        </div>
        <div class="field">
          <label for="item-date">Data</label>
          <input id="item-date" name="date" type="date">
        </div>
        <div class="field">
          <label for="item-description">Descrição</label>
          <textarea id="item-description" name="description" placeholder="Horário, atrações e detalhes" required></textarea>
        </div>`
    },
    promocoes: {
      title: "Criar promoção",
      fields: `
        <div class="field">
          <label for="item-title">Título da promoção</label>
          <input id="item-title" name="title" placeholder="Ex.: Promoção para famílias" required>
        </div>
        <div class="field">
          <label for="item-date">Válida até</label>
          <input id="item-date" name="date" type="date">
        </div>
        <div class="field">
          <label for="item-description">Detalhes</label>
          <textarea id="item-description" name="description" placeholder="Descreva a oferta" required></textarea>
        </div>`
    },
    avisos: {
      title: "Publicar aviso",
      fields: `
        <div class="field">
          <label for="item-title">Título do aviso</label>
          <input id="item-title" name="title" placeholder="Ex.: Horário de funcionamento" required>
        </div>
        <div class="field">
          <label for="item-description">Mensagem</label>
          <textarea id="item-description" name="description" placeholder="Escreva o aviso para os visitantes" required></textarea>
        </div>`
    }
  };

  const current = config[type];

  pageContent.innerHTML = `
    <div class="content-grid">
      <form class="form-card" id="item-form">
        <h3>${current.title}</h3>
        ${current.fields}
        <button class="primary-btn" type="submit">Salvar nesta demonstração</button>
      </form>
      <div class="form-card">
        <h3>Sobre as publicações</h3>
        <p>Os itens cadastrados aparecem na lista abaixo. Nesta versão de teste, eles ficam somente neste navegador.</p>
      </div>
    </div>
    <div class="item-list" id="item-list"></div>`;

  document.getElementById("item-form").addEventListener("submit", handleSubmit);
  renderItems(type);
}

function handleSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const type = document.querySelector(".nav-item.active")?.dataset.page;
  const formData = new FormData(form);
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const date = String(formData.get("date") || "");

  if (!title) {
    alert("Informe um título.");
    return;
  }

  if (type === "fotos") {
    const file = formData.get("image");

    if (!file || !file.type.startsWith("image/")) {
      alert("Selecione um arquivo de imagem.");
      return;
    }

    // Demonstração local: a imagem é convertida para uma URL de dados.
    // Para publicação real, usaremos o armazenamento do Supabase.
    if (file.size > 700 * 1024) {
      alert("Para esta demonstração, escolha uma imagem de até 700 KB. Na versão conectada usaremos armazenamento na nuvem.");
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
    reader.readAsDataURL(file);
    return;
  }

  data[type].unshift({
    id: crypto.randomUUID(),
    title,
    description,
    date,
    createdAt: new Date().toISOString()
  });

  saveData();
  renderPage(type);
}

function renderItems(type) {
  const list = document.getElementById("item-list");
  if (!list) return;

  const items = data[type];

  if (!items.length) {
    list.innerHTML = `<div class="empty">Nenhum item cadastrado ainda. Use o formulário para adicionar o primeiro.</div>`;
    return;
  }

  list.innerHTML = items.map(item => `
    <article class="item-card">
      ${type === "fotos" && item.image
        ? `<img src="${item.image}" alt="${escapeHTML(item.title)}">`
        : ""}
      <h3>${escapeHTML(item.title)}</h3>
      ${item.date ? `<p>Data: ${escapeHTML(item.date)}</p>` : ""}
      <p>${escapeHTML(item.description || "Sem descrição.")}</p>
      <div class="item-actions">
        <button class="delete-btn" data-delete="${escapeHTML(item.id)}">Excluir</button>
      </div>
    </article>
  `).join("");

  list.querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.delete;
      data[type] = data[type].filter(item => item.id !== id);
      saveData();
      renderPage(type);
    });
  });
}

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => renderPage(button.dataset.page));
});

document.getElementById("preview-link").addEventListener("click", event => {
  event.preventDefault();
  alert("Na próxima etapa, conectaremos aqui o endereço do site público da Estação Alegria.");
});

pageContent.addEventListener("click", event => {
  const button = event.target.closest("[data-go]");
  if (button) renderPage(button.dataset.go);
});

updateStats();
renderPage("inicio");
