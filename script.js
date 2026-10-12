
/* Estação Alegria — painel administrativo sem tela de login.
   Atenção: sem autenticação, a segurança depende das políticas do Supabase.
   Use somente a chave publicável no navegador; nunca use service_role/secret key. */

const SUPABASE_URL = 'https://ggxhghszthcgnkecoiir.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_EohrXK6tulCPMKavpK5GQfw_OxIQkxgQ';
const TABLES = { fotos: 'fotos', eventos: 'eventos', promocoes: 'promocoes', avisos: 'avisos' };
const BUCKET = 'foto';

const state = {
  page: 'inicio',
  editing: null,
  data: { fotos: [], eventos: [], promocoes: [], avisos: [] },
  dark: false
};

const $ = selector => document.querySelector(selector);

const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

const prettyDate = value => {
  if (!value) return 'Sem data';
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR');
};

function notify(message, error = false) {
  let toast = $('#toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.setAttribute('role', 'status');

    Object.assign(toast.style, {
      position: 'fixed',
      right: '18px',
      bottom: '18px',
      zIndex: '9999',
      maxWidth: 'min(420px, calc(100vw - 36px))',
      padding: '14px 18px',
      borderRadius: '12px',
      color: '#fff',
      background: error ? '#b42318' : '#168653',
      boxShadow: '0 8px 30px #0002',
      fontWeight: '700'
    });

    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.background = error ? '#b42318' : '#168653';
  toast.hidden = false;

  window.clearTimeout(notify.timer);
  notify.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 4500);
}

function getClient() {
  if (!window.supabase?.createClient) {
    throw new Error(
      'A biblioteca do Supabase não carregou. Confira os scripts do index.html.'
    );
  }

  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

let supabaseClient;

const pageNames = {
  inicio: 'Visão geral',
  fotos: 'Fotos e vídeos',
  eventos: 'Eventos',
  promocoes: 'Promoções',
  avisos: 'Avisos'
};

function updateStats() {
  for (const type of Object.keys(TABLES)) {
    const element = document.getElementById(`total-${type}`);
    if (element) element.textContent = state.data[type].length;
  }
}

async function refreshCloudData() {
  await Promise.all([
    loadItems('eventos'),
    loadItems('promocoes'),
    loadItems('avisos'),
    loadPhotos()
  ]);

  updateStats();
}

async function loadItems(type) {
  const { data, error } = await supabaseClient
    .from(TABLES[type])
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  state.data[type] = (data || []).map(row => ({
    ...row,
    title: row.titulo || row.nome || '',
    description: row.descricao || '',
    date: row.data_evento || row.validade || '',
    image: row.imagem_url || ''
  }));
}

async function loadPhotos() {
  const { data, error } = await supabaseClient
    .from('fotos')
    .select('id,nome,imagem_url,storage_path,created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;

  state.data.fotos = (data || []).map(row => ({
    ...row,
    title: row.nome || '',
    description: '',
    image: row.imagem_url || '',
    storagePath: row.storage_path || ''
  }));

  updateStats();
}

function renderPage(page = state.page) {
  state.page = pageNames[page] ? page : 'inicio';
  state.editing = null;

  const title = $('#page-title');
  const sectionTitle = $('#section-title');

  if (title) title.textContent = pageNames[state.page];

  if (sectionTitle) {
    sectionTitle.textContent =
      state.page === 'inicio'
        ? 'Conteúdo do estabelecimento'
        : pageNames[state.page];
  }

  document.querySelectorAll('.nav-item').forEach(button => {
    button.classList.toggle(
      'active',
      button.dataset.page === state.page
    );
  });

  if (state.page === 'inicio') {
    renderDashboard();
  } else {
    renderManager(state.page);
  }
}

function renderDashboard() {
  const content = $('#page-content');
  if (!content) return;

  content.innerHTML = `
    <div class="notice">
      <strong>Gerencie seu estabelecimento:</strong>
      acompanhe fotos, vídeos, eventos, promoções e avisos salvos no Supabase.
    </div>

    <section class="stats">
      ${[
        ['fotos', 'Fotos e vídeos'],
        ['eventos', 'Eventos'],
        ['promocoes', 'Promoções'],
        ['avisos', 'Avisos']
      ].map(([key, label]) => `
        <article class="stat-card">
          <span>${label}</span>
          <strong>${state.data[key].length}</strong>
        </article>
      `).join('')}
    </section>

    <section class="content-panel">
      <div class="panel-heading">
        <h2>Acesso rápido</h2>
      </div>

      <p>Escolha o que deseja atualizar no site público.</p>

      <div class="quick-links">
        <button class="primary-btn" data-go="fotos" type="button">
          ＋ Adicionar foto
        </button>

        <button class="primary-btn" data-go="eventos" type="button">
          ＋ Criar evento
        </button>

        <button class="primary-btn" data-go="promocoes" type="button">
          ＋ Criar promoção
        </button>

        <button class="primary-btn" data-go="avisos" type="button">
          ＋ Publicar aviso
        </button>
      </div>
    </section>
  `;
}

function renderManager(type) {
  const content = $('#page-content');
  if (!content) return;

  const labels = {
    fotos: 'foto ou vídeo',
    eventos: 'evento',
    promocoes: 'promoção',
    avisos: 'aviso'
  };

  const label = labels[type];
  const editing = state.editing;

  content.innerHTML = `
    <section class="content-panel">
      <div class="panel-heading">
        <div>
          <h2>${editing ? 'Editar' : 'Adicionar'} ${label}</h2>
          <p>As alterações serão salvas no Supabase.</p>
        </div>
      </div>

      <form id="item-form" data-type="${type}">
        <div class="form-grid">
          <div class="field wide">
            <label for="item-title">
              ${type === 'fotos' ? 'Nome/legenda' : 'Título'} *
            </label>

            <input
              id="item-title"
              name="title"
              maxlength="160"
              required
              placeholder="Digite o ${label}"
              value="${esc(editing?.title || '')}"
            >
          </div>

          ${type !== 'fotos' ? `
            <div class="field wide">
              <label for="item-description">Descrição</label>
              <textarea
                id="item-description"
                name="description"
                maxlength="5000"
                placeholder="Escreva os detalhes"
              >${esc(editing?.description || '')}</textarea>
            </div>
          ` : ''}

          ${type === 'eventos' ? `
            <div class="field">
              <label for="item-date">Data do evento</label>
              <input
                id="item-date"
                name="date"
                type="date"
                value="${esc(editing?.data_evento || '')}"
              >
            </div>
          ` : ''}

          ${type === 'promocoes' ? `
            <div class="field">
              <label for="item-date">Validade da promoção</label>
              <input
                id="item-date"
                name="date"
                type="date"
                value="${esc(editing?.validade || '')}"
              >
            </div>
          ` : ''}

          ${type === 'fotos' ? `
            <div class="field wide">
              <label for="item-image">
                Arquivo ${editing ? '(opcional para manter o atual)' : '*'}
              </label>

              <input
                id="item-image"
                name="image"
                type="file"
                accept="image/*,video/mp4,video/webm,video/quicktime,video/x-m4v,video/ogg"
                ${editing ? '' : 'required'}
              >

              <p>Imagens ou vídeos. Tamanho máximo: 50 MB.</p>

              ${editing?.image ? `
                <img
                  src="${esc(editing.image)}"
                  alt="Arquivo atual"
                  style="max-width:180px;max-height:120px;object-fit:cover;border-radius:10px"
                >
              ` : ''}
            </div>
          ` : ''}
        </div>

        <div class="form-actions">
          <button class="primary-btn" type="submit">
            ${editing ? 'Salvar alterações' : 'Publicar'}
          </button>

          <button class="secondary-btn" id="clear-form" type="button">
            Limpar
          </button>
        </div>
      </form>
    </section>

    <section class="content-panel">
      <div class="panel-heading">
        <div>
          <h2>Conteúdo cadastrado</h2>
          <p>${state.data[type].length} item(ns)</p>
        </div>

        <button class="secondary-btn" id="reload-items" type="button">
          ↻ Atualizar
        </button>
      </div>

      ${state.data[type].length
        ? `<div class="items-grid">
            ${state.data[type].map(item => itemCard(type, item)).join('')}
          </div>`
        : `<div class="empty-state">
            <strong>Nenhum ${label} cadastrado ainda.</strong>
            <p>Use o formulário acima para adicionar o primeiro.</p>
          </div>`
      }
    </section>
  `;

  $('#item-form')?.addEventListener('submit', handleSubmit);

  $('#clear-form')?.addEventListener('click', () => {
    state.editing = null;
    renderManager(type);
  });

  $('#reload-items')?.addEventListener('click', async () => {
    try {
      if (type === 'fotos') {
        await loadPhotos();
      } else {
        await loadItems(type);
      }

      renderManager(type);
      notify('Lista atualizada.');
    } catch (error) {
      notify(error.message || 'Não foi possível atualizar.', true);
    }
  });

  content.querySelectorAll('[data-edit]').forEach(button => {
    button.addEventListener('click', () => {
      state.editing = state.data[type].find(
        item => String(item.id) === button.dataset.edit
      );

      renderManager(type);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  content.querySelectorAll('[data-delete]').forEach(button => {
    button.addEventListener('click', () => {
      deleteItem(type, button.dataset.delete);
    });
  });
}

function itemCard(type, item) {
  const title = item.title || 'Sem título';
  const description = item.description || '';
  let meta = '';

  if (type === 'eventos') {
    meta = `Data: ${prettyDate(item.data_evento)}`;
  }

  if (type === 'promocoes') {
    meta = `Validade: ${prettyDate(item.validade)}`;
  }

  if (type === 'fotos') {
    meta = `Adicionada em ${prettyDate(item.created_at)}`;
  }

  let media = '';

  if (type === 'fotos' && item.image) {
    media = isVideo(item.storagePath, item.image)
      ? `<video src="${esc(item.image)}" controls playsinline preload="metadata" aria-label="${esc(title)}"></video>`
      : `<img src="${esc(item.image)}" alt="${esc(title)}" loading="lazy">`;
  } else if (item.image) {
    media = `<img src="${esc(item.image)}" alt="${esc(title)}" loading="lazy">`;
  }

  return `
    <article class="item-card">
      ${media}

      <div class="item-body">
        <h3>${esc(title)}</h3>

        ${description ? `<p>${esc(description)}</p>` : ''}
        ${meta ? `<div class="item-meta">${esc(meta)}</div>` : ''}

        <div class="item-actions">
          <button
            class="secondary-btn"
            data-edit="${esc(item.id)}"
            type="button"
          >Editar</button>

          <button
            class="danger-btn"
            data-delete="${esc(item.id)}"
            type="button"
          >Excluir</button>
        </div>
      </div>
    </article>
  `;
}

function isVideo(path = '', url = '') {
  return /\.(mp4|webm|mov|m4v|ogv|ogg)(?:$|[?#])/i.test(`${path} ${url}`);
}

async function handleSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const type = form.dataset.type;
  const title = form.elements.title.value.trim();
  const description = form.elements.description?.value.trim() || '';
  const date = form.elements.date?.value || null;
  const submit = form.querySelector('[type="submit"]');
  const wasEditing = Boolean(state.editing);

  submit.disabled = true;
  submit.textContent = 'Salvando...';

  try {
    if (!title) throw new Error('Digite um título ou nome.');

    if (type === 'fotos') {
      await savePhoto(title, form.elements.image.files[0] || null);
    } else {
      const payload = {
        titulo: title,
        descricao: description
      };

      if (type === 'eventos') payload.data_evento = date;
      if (type === 'promocoes') payload.validade = date;

      if (state.editing) {
        const { error } = await supabaseClient
          .from(TABLES[type])
          .update(payload)
          .eq('id', state.editing.id);

        if (error) throw error;
      } else {
        const { error } = await supabaseClient
          .from(TABLES[type])
          .insert(payload);

        if (error) throw error;
      }

      await loadItems(type);
    }

    state.editing = null;
    await refreshCloudData();
    renderManager(type);
    notify('Salvo com sucesso!');
  } catch (error) {
    console.error(error);
    notify(
      error.message || 'Não foi possível salvar. Confira as políticas do Supabase.',
      true
    );
  } finally {
    if (submit.isConnected) {
      submit.disabled = false;
      submit.textContent = wasEditing ? 'Salvar alterações' : 'Publicar';
    }
  }
}

async function savePhoto(title, file) {
  if (state.editing && !file) {
    const { error } = await supabaseClient
      .from('fotos')
      .update({ nome: title })
      .eq('id', state.editing.id);

    if (error) throw error;
    return;
  }

  if (!file) throw new Error('Escolha uma imagem ou vídeo.');

  if (file.size > 50 * 1024 * 1024) {
    throw new Error('O arquivo precisa ter no máximo 50 MB.');
  }

  const allowedExt = [
    'jpg', 'jpeg', 'png', 'webp', 'gif', 'avif',
    'mp4', 'webm', 'mov', 'm4v', 'ogv', 'ogg'
  ];

  const ext = (file.name.split('.').pop() || '').toLowerCase();

  if (!allowedExt.includes(ext)) {
    throw new Error(
      'Formato não permitido. Use JPG, PNG, WEBP, GIF, MP4, WEBM, MOV ou OGG.'
    );
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabaseClient
    .storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabaseClient
    .storage
    .from(BUCKET)
    .getPublicUrl(path);

  const imageUrl = urlData.publicUrl;

  try {
    if (state.editing) {
      const old = state.editing;

      const { error } = await supabaseClient
        .from('fotos')
        .update({
          nome: title,
          imagem_url: imageUrl,
          storage_path: path
        })
        .eq('id', old.id);

      if (error) throw error;

      if (old.storagePath) {
        const { error: removeError } = await supabaseClient
          .storage
          .from(BUCKET)
          .remove([old.storagePath]);

        if (removeError) {
          console.warn('Arquivo antigo não removido:', removeError.message);
        }
      }
    } else {
      const { error } = await supabaseClient
        .from('fotos')
        .insert({
          nome: title,
          imagem_url: imageUrl,
          storage_path: path
        });

      if (error) throw error;
    }
  } catch (error) {
    await supabaseClient.storage.from(BUCKET).remove([path]);
    throw error;
  }
}

async function deleteItem(type, id) {
  const item = state.data[type].find(
    row => String(row.id) === String(id)
  );

  if (!item || !window.confirm(
    `Tem certeza que deseja excluir ${type === 'fotos' ? 'esta foto/vídeo' : 'este item'}?`
  )) return;

  try {
    if (type === 'fotos' && item.storagePath) {
      const { error } = await supabaseClient
        .storage
        .from(BUCKET)
        .remove([item.storagePath]);

      if (error) throw error;
    }

    const { error } = await supabaseClient
      .from(TABLES[type])
      .delete()
      .eq('id', id);

    if (error) throw error;

    if (type === 'fotos') {
      await loadPhotos();
    } else {
      await loadItems(type);
    }

    updateStats();
    renderManager(type);
    notify('Item excluído.');
  } catch (error) {
    console.error(error);
    notify(
      error.message || 'Não foi possível excluir. Confira as políticas do Supabase.',
      true
    );
  }
}

/* Cria o botão de tema mesmo se ele tiver sumido do HTML. */
function setupThemeToggle() {
  let themeButton = document.getElementById('theme-toggle');

  if (!themeButton) {
    const topbar = document.querySelector('.topbar');

    if (topbar) {
      themeButton = document.createElement('button');
      themeButton.id = 'theme-toggle';
      themeButton.type = 'button';
      themeButton.innerHTML = '<span id="theme-icon">☀️</span>';
      themeButton.setAttribute('aria-label', 'Ativar modo escuro');
      themeButton.title = 'Alternar modo claro/escuro';
      topbar.appendChild(themeButton);
    }
  }

  if (!themeButton) {
    console.warn('Botão de tema não criado: elemento .topbar não encontrado.');
    return;
  }

  if (!document.getElementById('theme-fix-styles')) {
    const style = document.createElement('style');
    style.id = 'theme-fix-styles';

    style.textContent = `
      #theme-toggle {
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        margin: 0 8px;
        border: 1px solid #d1d5db;
        border-radius: 12px;
        background: #fff;
        color: #111827;
        cursor: pointer;
        font-size: 22px;
        position: relative;
        z-index: 10;
      }

      body.theme-dark {
        background: #111827 !important;
        color: #f3f4f6 !important;
      }

      body.theme-dark .sidebar,
      body.theme-dark .topbar,
      body.theme-dark .content-panel,
      body.theme-dark .stat-card,
      body.theme-dark .notice,
      body.theme-dark .item-card {
        background: #1f2937 !important;
        color: #f3f4f6 !important;
        border-color: #374151 !important;
      }

      body.theme-dark .main,
      body.theme-dark #page-content {
        color: #f3f4f6 !important;
      }

      body.theme-dark h1,
      body.theme-dark h2,
      body.theme-dark h3,
      body.theme-dark p,
      body.theme-dark label,
      body.theme-dark span {
        color: inherit;
      }

      body.theme-dark input,
      body.theme-dark textarea,
      body.theme-dark select {
        background: #111827 !important;
        color: #f3f4f6 !important;
        border-color: #4b5563 !important;
      }

      body.theme-dark #theme-toggle {
        background: #374151 !important;
        color: #fff !important;
        border-color: #4b5563 !important;
      }

      .quick-links {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .quick-links button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 12px 16px;
        border: 0;
        border-radius: 10px;
        cursor: pointer;
      }
    `;

    document.head.appendChild(style);
  }

  if (!themeButton.dataset.themeHandlerAttached) {
    themeButton.dataset.themeHandlerAttached = 'true';

    themeButton.addEventListener('click'image) {
    media = isVideo(item.storagePath, item.image)
      ? `<video src="${esc(item.image)}" controls playsinline preload="metadata" aria-label="${esc(title)}"></video>`
      : `<img src="${esc(item.image)}" alt="${esc(title)}" loading="lazy">`;
  } else if (item.image) {
    media = `<img src="${esc(item.image)}" alt="${esc(title)}" loading="lazy">`;
  }

  return `<article class="item-card">
    ${media}
    <div class="item-body">
      <h3>${esc(title)}</h3>
      ${description ? `<p>${esc(description)}</p>` : ''}
      ${meta ? `<div class="item-meta">${esc(meta)}</div>` : ''}
      <div class="item-actions">
        <button class="secondary-btn" data-edit="${esc(item.id)}" type="button">Editar</button>
        <button class="danger-btn" data-delete="${esc(item.id)}" type="button">Excluir</button>
      </div>
    </div>
  </article>`;
}

function isVideo(path = '', url = '') {
  return /\.(mp4|webm|mov|m4v|ogv|ogg)(?:$|[?#])/i.test(`${path} ${url}`);
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const type = form.dataset.type;
  const title = form.elements.title.value.trim();
  const description = form.elements.description?.value.trim() || '';
  const date = form.elements.date?.value || null;
  const submit = form.querySelector('[type="submit"]');

  submit.disabled = true;
  submit.textContent = 'Salvando...';

  try {
    if (!title) throw new Error('Digite um título ou nome.');

    if (type === 'fotos') {
      await savePhoto(title, form.elements.image.files[0] || null);
    } else {
      const payload = { titulo: title, descricao: description };
      if (type === 'eventos') payload.data_evento = date;
      if (type === 'promocoes') payload.validade = date;

      if (state.editing) {
        const { error } = await supabaseClient.from(TABLES[type])
          .update(payload).eq('id', state.editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseClient.from(TABLES[type]).insert(payload);
        if (error) throw error;
      }
      await loadItems(type);
    }

    state.editing = null;
    await refreshCloudData();
    renderManager(type);
    notify('Salvo com sucesso!');
  } catch (error) {
    console.error(error);
    notify(error.message || 'Não foi possível salvar. Confira as políticas do Supabase.', true);
  } finally {
    if (submit.isConnected) {
      submit.disabled = false;
      submit.textContent = state.editing ? 'Salvar alterações' : 'Publicar';
    }
  }
}

async function savePhoto(title, file) {
  if (state.editing && !file) {
    const { error } = await supabaseClient.from('fotos')
      .update({ nome: title }).eq('id', state.editing.id);
    if (error) throw error;
    return;
  }
  if (!file) throw new Error('Escolha uma imagem ou vídeo.');
  if (file.size > 50 * 1024 * 1024) throw new Error('O arquivo precisa ter no máximo 50 MB.');

  const allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'mp4', 'webm', 'mov', 'm4v', 'ogv', 'ogg'];
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!allowedExt.includes(ext)) throw new Error('Formato não permitido. Use JPG, PNG, WEBP, GIF, MP4, WEBM, MOV ou OGG.');

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabaseClient.storage.from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabaseClient.storage.from(BUCKET).getPublicUrl(path);
  const imageUrl = urlData.publicUrl;

  try {
    if (state.editing) {
      const old = state.editing;
      const { error } = await supabaseClient.from('fotos')
        .update({ nome: title, imagem_url: imageUrl, storage_path: path }).eq('id', old.id);
      if (error) throw error;
      if (old.storagePath) {
        const { error: removeError } = await supabaseClient.storage.from(BUCKET).remove([old.storagePath]);
        if (removeError) console.warn('Arquivo antigo não removido:', removeError.message);
      }
    } else {
      const { error } = await supabaseClient.from('fotos')
        .insert({ nome: title, imagem_url: imageUrl, storage_path: path });
      if (error) throw error;
    }
  } catch (error) {
    await supabaseClient.storage.from(BUCKET).remove([path]);
    throw error;
  }
}

async function deleteItem(type, id) {
  const item = state.data[type].find(row => String(row.id) === String(id));
  if (!item || !window.confirm(`Tem certeza que deseja excluir ${type === 'fotos' ? 'esta foto/vídeo' : 'este item'}?`)) return;

  try {
    if (type === 'fotos' && item.storagePath) {
      const { error } = await supabaseClient.storage.from(BUCKET).remove([item.storagePath]);
      if (error) throw error;
    }
    const { error } = await supabaseClient.from(TABLES[type]).delete().eq('id', id);
    if (error) throw error;

    if (type === 'fotos') await loadPhotos();
    else await loadItems(type);

    updateStats();
    renderManager(type);
    notify('Item excluído.');
  } catch (error) {
    console.error(error);
    notify(error.message || 'Não foi possível excluir. Confira as políticas do Supabase.', true);
  }
}

function initPanel() {
  // Retira qualquer tela de login remanescente no HTML.
  $('#auth-screen')?.remove();

  // O HTML enviado não tem um contêiner #app: usa o layout existente diretamente.
  const main = $('main.main');
  if (main) main.hidden = false;
  document.body.classList.add('authenticated');

  document.querySelectorAll('.nav-item').forEach(button => {
    button.addEventListener('click', () => renderPage(button.dataset.page));
  });

  $('#page-content')?.addEventListener('click', event => {
    const button = event.target.closest('[data-go]');
    if (button) renderPage(button.dataset.go);
  });

  $('#theme-toggle')?.addEventListener('click', () => {
    state.dark = !state.dark;
    document.body.classList.toggle('theme-dark', state.dark);
    const icon = $('#theme-icon');
    if (icon) icon.textContent = state.dark ? '🌙' : '☀️';
  });

  // Sem autenticação, o botão de sair não tem função; removê-lo evita confusão.
  $('#logout-btn')?.remove();

  const preview = $('#preview-link');
  if (preview) preview.href = 'https://estacao-alegria-site-2.vercel.app/';

  renderPage('inicio');

  try {
    supabaseClient = getClient();
  } catch (error) {
    notify(error.message, true);
    return;
  }

  refreshCloudData()
    .then(() => renderPage(state.page))
    .catch(error => {
      console.error(error);
      notify(error.message || 'Erro ao carregar dados do Supabase.', true);
    });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPanel);
} else {
  initPanel();
}
2n renderPhotosPage() {
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
          <button class="delete-btn" type="button"
            data-delete-photo="${escapeHTML(photo.id)}">
            Excluir arquivo
          </button>
        </div>
      </article>`;
  }).join("");

  return `
    <div class="content-grid">
      <form class="form-card" id="photo-form">
        <h3>Adicionar fotos ou vídeos</h3>
        <p>Selecione arquivos para publicar na galeria.</p>
        <div class="field">
          <label for="photo-title">Nome ou legenda</label>
          <input id="photo-title" name="titulo" type="text"
            maxlength="120" placeholder="Ex.: Nossa piscina" required>
        </div>
        <div class="field">
          <label for="photo-file">Arquivo de imagem ou vídeo</label>
          <input id="photo-file" name="arquivo" type="file"
            accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime" required>
          <small>Limite de 50 MB por arquivo.</small>
        </div>
        <div id="file-preview" class="file-preview"></div>
        <button class="primary-btn" type="submit">Publicar arquivo</button>
      </form>
      <article class="form-card">
        <h3>📸 Sua galeria</h3>
        <p>${state.fotos.length} arquivo(s) cadastrado(s).</p>
      </article>
    </div>
    <div class="item-list">
      ${cards || '<div class="empty">Nenhuma foto ou vídeo publicado ainda.</div>'}
    </div>`;
}

async function uploadPhoto(event) {
  event.preventDefault();
  if (state.busy) return;

  const title = $("#photo-title")?.value.trim();
  const file = $("#photo-file")?.files?.[0];

  if (!title || !file) {
    showMessage("Informe uma legenda e selecione um arquivo.", true);
    return;
  }

  if (!isImageFile(file) && !isVideoFile(file)) {
    showMessage("Escolha uma imagem ou vídeo compatível.", true);
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    showMessage("O arquivo ultrapassa 50 MB.", true);
    return;
  }

  const allowed = [
    "jpg", "jpeg", "png", "gif", "webp", "avif",
    "mp4", "webm", "ogg", "mov", "m4v"
  ];

  if (!allowed.includes(getFileExtension(file))) {
    showMessage("A extensão desse arquivo não é permitida.", true);
    return;
  }

  setBusy(true);
  showMessage("Enviando arquivo...");

  const storagePath =
    `${Date.now()}-${crypto.randomUUID()}-${makeSafeFileName(file.name)}`;

  let uploadSucceeded = false;

  try {
    const { error: uploadError } = await supabaseClient.storage
      .from(MEDIA_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type
      });

    if (uploadError) throw uploadError;
    uploadSucceeded = true;

    const { data: publicData } = supabaseClient.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(storagePath);

    const publicUrl = publicData?.publicUrl;
    if (!publicUrl) throw new Error("Não foi possível obter a URL pública.");

    const { error: insertError } = await supabaseClient
      .from(TABLES.fotos)
      .insert([{
        nome: title,
        imagem_url: publicUrl,
        storage_path: storagePath
      }]);

    if (insertError) throw insertError;

    $("#photo-form")?.reset();
    const preview = $("#file-preview");
    if (preview) preview.innerHTML = "";

    await loadPhotos();
    renderStats();
    renderPage("fotos");
    showMessage("Arquivo publicado com sucesso.");
  } catch (error) {
    if (uploadSucceeded) {
      showMessage(
        `Erro ao publicar. O arquivo pode estar no armazenamento: ${error.message}`,
        true
      );
    } else {
      showMessage(`Erro ao enviar arquivo: ${error.message}`, true);
    }
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
    preview.textContent = "Selecione uma imagem ou vídeo compatível.";
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
          `Registro excluído, mas o arquivo não foi removido do armazenamento: ${storageError.message}`,
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
      ${item.data
        ? `<p><strong>${escapeHTML(dateLabel)}:</strong> ${escapeHTML(formatDate(item.data))}</p>`
        : ""}
      <div class="item-actions">
        <button class="delete-btn" type="button"
          data-delete-content="${escapeHTML(type)}"
          data-id="${escapeHTML(item.id)}">
          Excluir publicação
        </button>
      </div>
    </article>
  `).join("");

  return `
    <div class="content-grid">
      <form class="form-card" id="content-form" data-type="${escapeHTML(type)}">
        <h3>${isEvent ? "Adicionar evento" : isPromotion ? "Adicionar promoção" : "Publicar aviso"}</h3>
        <div class="field">
          <label for="content-title">Título</label>
          <input id="content-title" name="titulo" maxlength="150" required
            placeholder="${isEvent ? "Ex.: Música ao vivo" : isPromotion ? "Ex.: Promoção de fim de semana" : "Ex.: Horário de funcionamento"}">
        </div>
        <div class="field">
          <label for="content-description">Descrição</label>
          <textarea id="content-description" name="descricao"
            maxlength="5000" required placeholder="Escreva os detalhes"></textarea>
        </div>
        ${isEvent || isPromotion ? `
          <div class="field">
            <label for="content-date">${escapeHTML(dateLabel)}</label>
            <input id="content-date" name="${dateField}" type="date" required>
          </div>` : ""}
        <button class="primary-btn" type="submit">Publicar</button>
      </form>
      <article class="form-card">
        <h3>📌 Dica</h3>
        <p>${isEvent
          ? "Informe a data e os detalhes do evento."
          : isPromotion
            ? "Descreva a oferta e a validade."
            : "Use avisos para comunicar informações importantes."}</p>
        <p><strong>${list.length}</strong> publicação(ões) cadastrada(s).</p>
      </article>
    </div>
    <div class="item-list">
      ${cards || '<div class="empty">Nenhuma publicação cadastrada nesta seção.</div>'}
    </div>`;
}

async function saveContent(event) {
  event.preventDefault();
  if (state.busy) return;

  const form = event.currentTarget;
  const type = form.dataset.type;

  if (!TABLES[type] || type === "fotos") {
    showMessage("Tipo de publicação inválido.", true);
    return;
  }

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
    const { error } = await supabaseClient.from(TABLES[type]).insert([row]);
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

async function dec="${escapeHTML(photo.imagem_url)}" alt="${escapeHTML(photo.nome)}" loading="lazy">`;  

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
${Date.now()}-${crypto.randomUUID()}-${makeSafeFileName(file.name)};

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
showMessage(Erro ao publicar arquivo: ${error.message}, true);
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
details.textContent = ${file.name} · ${formatFileSize(file.size)};
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
showMessage(Erro ao excluir arquivo: ${error.message}, true);
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

const cards = list.map((item) =>   <article class="item-card">   <h3>${escapeHTML(item.titulo)}</h3>   <p>${escapeHTML(item.descricao)}</p>   ${item.data ?<p><strong>${escapeHTML(dateLabel)}:</strong> ${escapeHTML(formatDate(item.data))}</p>: ""}   <div class="item-actions">   <button class="delete-btn" type="button" data-delete-content="${escapeHTML(type)}" data-id="${escapeHTML(item.id)}">Excluir publicação</button>   </div>   </article>  ).join("");

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
showMessage(Erro ao publicar: ${error.message}, true);
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
showMessage(Erro ao excluir publicação: ${error.message}, true);
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
refreshButton.addEventListnderStats() {
  const counters = {
    "#total-fotos": state.fotos.length,
    "#total-eventos": state.eventos.length,
    "#total-promocoes": state.promocoes.length,
    "#total-avisos": state.avisos.length
  };

  Object.entries(counters).forEach(([selector, value]) => {
    const element = $(selector);
    if (element) element.textContent = value;
  });
}

/* =========================================================
   6. NAVEGAÇÃO E PÁGINAS
   ========================================================= */

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
  } else if (page === "avaliacoes") {
    container.innerHTML = renderReviewsPage();
  } else if (["eventos", "promocoes", "avisos"].includes(page)) {
    container.innerHTML = renderContentPage(page);
  } else {
    container.innerHTML = renderHome();
  }

  attachPageEvents();
}

function renderHome() {
  return `
    <div class="content-grid">
      <article class="form-card">
        <h3>☀️ Bem-vindo ao painel!</h3>
        <p>Use o menu para publicar as novidades da Estação Alegria.</p>
        <p>Adicione fotos e vídeos, cadastre eventos, divulgue promoções,
        publique avisos e modere as avaliações dos visitantes.</p>
      </article>

      <article class="form-card">
        <h3>📌 Seus conteúdos</h3>
        <p>Fotos e vídeos: <strong>${state.fotos.length}</strong></p>
        <p>Eventos: <strong>${state.eventos.length}</strong></p>
        <p>Promoções: <strong>${state.promocoes.length}</strong></p>
        <p>Avisos: <strong>${state.avisos.length}</strong></p>
        <p>Avaliações: <strong>${state.avaliacoes.length}</strong></p>
        <button class="primary-btn" id="refresh-content" type="button">
          Atualizar conteúdo
        </button>
      </article>
    </div>
  `;
}

/* =========================================================
   7. MODERAÇÃO DE AVALIAÇÕES
   ========================================================= */

function renderReviewsPage() {
  const reviews = state.avaliacoes;

  const pending = reviews.filter(
    (item) => item.status === "pendente"
  ).length;

  const approved = reviews.filter(
    (item) => item.status === "aprovada"
  ).length;

  const rejected = reviews.filter(
    (item) => item.status === "rejeitada"
  ).length;

  const cards = reviews.map((review) => {
    const rating = Math.max(1, Math.min(5, Number(review.nota) || 1));

    const status = ["pendente", "aprovada", "rejeitada"].includes(
      review.status
    ) ? review.status : "pendente";

    const statusLabels = {
      pendente: "Pendente",
      aprovada: "Aprovada",
      rejeitada: "Rejeitada"
    };

    return `
      <article class="item-card">
        <h3>
          <span aria-label="${rating} de 5 estrelas">
            ${"★".repeat(rating)}${"☆".repeat(5 - rating)}
          </span>
          ${rating}/5
        </h3>

        <p>${escapeHTML(review.comentario || "Sem comentário.")}</p>

        <p><strong>Nome:</strong>
          ${escapeHTML(review.nome_publico || "Anônimo")}
        </p>

        <p><strong>Data:</strong>
          ${escapeHTML(formatReviewDate(review.created_at))}
        </p>

        <p><strong>Status:</strong>
          ${escapeHTML(statusLabels[status])}
        </p>

        <div class="item-actions">
          <button class="primary-btn" type="button"
            data-review-action="aprovada"
            data-id="${escapeHTML(review.id)}"
            ${status === "aprovada" ? "disabled" : ""}>
            Aprovar
          </button>

          <button class="delete-btn" type="button"
            data-review-action="rejeitada"
            data-id="${escapeHTML(review.id)}"
            ${status === "rejeitada" ? "disabled" : ""}>
            Rejeitar
          </button>

          ${
            status !== "pendente"
              ? `<button type="button"
                  data-review-action="pendente"
                  data-id="${escapeHTML(review.id)}">
                  Voltar para pendente
                </button>`
              : ""
          }
        </div>
      </article>
    `;
  }).join("");

  return `
    <div class="content-grid">
      <article class="form-card">
        <h3>📊 Resumo das avaliações</h3>
        <p>Total: <strong>${reviews.length}</strong></p>
        <p>Pendentes: <strong>${pending}</strong></p>
        <p>Aprovadas: <strong>${approved}</strong></p>
        <p>Rejeitadas: <strong>${rejected}</strong></p>
      </article>

      <article class="form-card">
        <h3>⭐ Moderação</h3>
        <p>Somente aprove avaliações que você deseja exibir publicamente.</p>
        <p>As avaliações rejeitadas não devem aparecer na área pública.</p>
        <button class="primary-btn" id="refresh-reviews" type="button">
          Atualizar avaliações
        </button>
      </article>
    </div>

    <div class="item-list">
      ${cards || '<div class="empty">Nenhuma avaliação encontrada.</div>'}
    </div>
  `;
}

async function moderateReview(id, status) {
  if (state.busy) return;

  const actions = {
    aprovada: "aprovar",
    rejeitada: "rejeitar",
    pendente: "devolver para pendente"
  };

  if (!actions[status]) return;

  const review = state.avaliacoes.find(
    (item) => String(item.id) === String(id)
  );

  if (!review) {
    showMessage("Avaliação não encontrada na lista.", true);
    return;
  }

  if (!window.confirm(
    `Deseja ${actions[status]} a avaliação de ${
      review.nome_publico || "um visitante"
    }?`
  )) return;

  setBusy(true);

  try {
    const { error } = await supabaseClient.rpc("moderar_avaliacao", {
      review_id: id,
      novo_status: status
    });

    if (error) throw error;

    await loadReviews();
    renderPage("avaliacoes");
    showMessage("Status da avaliação atualizado com sucesso.");
  } catch (error) {
    showMessage(`Erro ao moderar avaliação: ${error.message}`, true);
  } finally {
    setBusy(false);
  }
}

/* =========================================================
   8. FOTOS E VÍDEOS
   ========================================================= */

function renderPhotosPage() {
  const cards = state.fotos.map((photo) => {
    const video = /\.(mp4|webm|ogg|mov|m4v)$/i.test(
      `${photo.nome} ${photo.imagem_url}`
    );

    const media = video
      ? `<video src="${escapeHTML(photo.imagem_url)}" controls preload="metadata"></video>`
      : `<img src="${escapeHTML(photo.imagem_url)}"
          alt="${escapeHTML(photo.nome)}" loading="lazy">`;

    return `
      <article class="item-card">
        ${media}
        <h3>${escapeHTML(photo.nome)}</h3>
        <p>Publicado na galeria</p>
        <div class="item-actions">
          <button class="delete-btn" type="button"
            data-delete-photo="${escapeHTML(photo.id)}">
            Excluir arquivo
          </button>
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
          <input id="photo-title" name="titulo" type="text"
            maxlength="120" placeholder="Ex.: Nossa piscina" required>
        </div>

        <div class="field">
          <label for="photo-file">Arquivo de imagem ou vídeo</label>
          <input id="photo-file" name="arquivo" type="file"
            accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime"
            required>
          <small>Limite de 50 MB por arquivo.</small>
        </div>

        <div id="file-preview" class="file-preview"></div>
        <button class="primary-btn" type="submit">Publicar arquivo</button>
      </form>

      <article class="form-card">
        <h3>📸 Sua galeria</h3>
        <p>Arquivos cadastrados: <strong>${state.fotos.length}</strong></p>
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
    showMessage("Escolha uma imagem ou vídeo compatível.", true);
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
   isos.</p>
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
      showMessage("PreenchrStats() {
  const counters = {
    "#total-fotos": state.fotos.length,
    "#total-eventos": state.eventos.length,
    "#total-promocoes": state.promocoes.length,
    "#total-avisos": state.avisos.length
  };

  Object.entries(counters).forEach(([selector, value]) => {
    const element = $(selector);
    if (element) element.textContent = value;
  });
}

/* =========================================================
   6. NAVEGAÇÃO E PÁGINAS
   ========================================================= */

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
  } else if (page === "avaliacoes") {
    container.innerHTML = renderReviewsPage();
  } else if (["eventos", "promocoes", "avisos"].includes(page)) {
    container.innerHTML = renderContentPage(page);
  } else {
    container.innerHTML = renderHome();
  }

  attachPageEvents();
}

function renderHome() {
  return `
    <div class="content-grid">
      <article class="form-card">
        <h3>☀️ Bem-vindo ao painel!</h3>
        <p>Use o menu para publicar as novidades da Estação Alegria.</p>
        <p>Adicione fotos e vídeos, cadastre eventos, divulgue promoções,
        publique avisos e modere as avaliações dos visitantes.</p>
      </article>

      <article class="form-card">
        <h3>📌 Seus conteúdos</h3>
        <p>Fotos e vídeos: <strong>${state.fotos.length}</strong></p>
        <p>Eventos: <strong>${state.eventos.length}</strong></p>
        <p>Promoções: <strong>${state.promocoes.length}</strong></p>
        <p>Avisos: <strong>${state.avisos.length}</strong></p>
        <p>Avaliações: <strong>${state.avaliacoes.length}</strong></p>
        <button class="primary-btn" id="refresh-content" type="button">
          Atualizar conteúdo
        </button>
      </article>
    </div>
  `;
}

/* =========================================================
   7. MODERAÇÃO DE AVALIAÇÕES
   ========================================================= */

function renderReviewsPage() {
  const reviews = state.avaliacoes;

  const pending = reviews.filter(
    (item) => item.status === "pendente"
  ).length;

  const approved = reviews.filter(
    (item) => item.status === "aprovada"
  ).length;

  const rejected = reviews.filter(
    (item) => item.status === "rejeitada"
  ).length;

  const cards = reviews.map((review) => {
    const rating = Math.max(1, Math.min(5, Number(review.nota) || 1));

    const status = ["pendente", "aprovada", "rejeitada"].includes(
      review.status
    ) ? review.status : "pendente";

    const statusLabels = {
      pendente: "Pendente",
      aprovada: "Aprovada",
      rejeitada: "Rejeitada"
    };

    return `
      <article class="item-card">
        <h3>
          <span aria-label="${rating} de 5 estrelas">
            ${"★".repeat(rating)}${"☆".repeat(5 - rating)}
          </span>
          ${rating}/5
        </h3>

        <p>${escapeHTML(review.comentario || "Sem comentário.")}</p>

        <p><strong>Nome:</strong>
          ${escapeHTML(review.nome_publico || "Anônimo")}
        </p>

        <p><strong>Data:</strong>
          ${escapeHTML(formatReviewDate(review.created_at))}
        </p>

        <p><strong>Status:</strong>
          ${escapeHTML(statusLabels[status])}
        </p>

        <div class="item-actions">
          <button class="primary-btn" type="button"
            data-review-action="aprovada"
            data-id="${escapeHTML(review.id)}"
            ${status === "aprovada" ? "disabled" : ""}>
            Aprovar
          </button>

          <button class="delete-btn" type="button"
            data-review-action="rejeitada"
            data-id="${escapeHTML(review.id)}"
            ${status === "rejeitada" ? "disabled" : ""}>
            Rejeitar
          </button>

          ${
            status !== "pendente"
              ? `<button type="button"
                  data-review-action="pendente"
                  data-id="${escapeHTML(review.id)}">
                  Voltar para pendente
                </button>`
              : ""
          }
        </div>
      </article>
    `;
  }).join("");

  return `
    <div class="content-grid">
      <article class="form-card">
        <h3>📊 Resumo das avaliações</h3>
        <p>Total: <strong>${reviews.length}</strong></p>
        <p>Pendentes: <strong>${pending}</strong></p>
        <p>Aprovadas: <strong>${approved}</strong></p>
        <p>Rejeitadas: <strong>${rejected}</strong></p>
      </article>

      <article class="form-card">
        <h3>⭐ Moderação</h3>
        <p>Somente aprove avaliações que você deseja exibir publicamente.</p>
        <p>As avaliações rejeitadas não devem aparecer na área pública.</p>
        <button class="primary-btn" id="refresh-reviews" type="button">
          Atualizar avaliações
        </button>
      </article>
    </div>

    <div class="item-list">
      ${cards || '<div class="empty">Nenhuma avaliação encontrada.</div>'}
    </div>
  `;
}

async function moderateReview(id, status) {
  if (state.busy) return;

  const actions = {
    aprovada: "aprovar",
    rejeitada: "rejeitar",
    pendente: "devolver para pendente"
  };

  if (!actions[status]) return;

  const review = state.avaliacoes.find(
    (item) => String(item.id) === String(id)
  );

  if (!review) {
    showMessage("Avaliação não encontrada na lista.", true);
    return;
  }

  if (!window.confirm(
    `Deseja ${actions[status]} a avaliação de ${
      review.nome_publico || "um visitante"
    }?`
  )) return;

  setBusy(true);

  try {
    const { error } = await supabaseClient.rpc("moderar_avaliacao", {
      review_id: id,
      novo_status: status
    });

    if (error) throw error;

    await loadReviews();
    renderPage("avaliacoes");
    showMessage("Status da avaliação atualizado com sucesso.");
  } catch (error) {
    showMessage(`Erro ao moderar avaliação: ${error.message}`, true);
  } finally {
    setBusy(false);
  }
}

/* =========================================================
   8. FOTOS E VÍDEOS
   ========================================================= */

function renderPhotosPage() {
  const cards = state.fotos.map((photo) => {
    const video = /\.(mp4|webm|ogg|mov|m4v)$/i.test(
      `${photo.nome} ${photo.imagem_url}`
    );

    const media = video
      ? `<video src="${escapeHTML(photo.imagem_url)}" controls preload="metadata"></video>`
      : `<img src="${escapeHTML(photo.imagem_url)}"
          alt="${escapeHTML(photo.nome)}" loading="lazy">`;

    return `
      <article class="item-card">
        ${media}
        <h3>${escapeHTML(photo.nome)}</h3>
        <p>Publicado na galeria</p>
        <div class="item-actions">
          <button class="delete-btn" type="button"
            data-delete-photo="${escapeHTML(photo.id)}">
            Excluir arquivo
          </button>
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
          <input id="photo-title" name="titulo" type="text"
            maxlength="120" placeholder="Ex.: Nossa piscina" required>
        </div>

        <div class="field">
          <label for="photo-file">Arquivo de imagem ou vídeo</label>
          <input id="photo-file" name="arquivo" type="file"
            accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime"
            required>
          <small>Limite de 50 MB por arquivo.</small>
        </div>

        <div id="file-preview" class="file-preview"></div>
        <button class="primary-btn" type="submit">Publicar arquivo</button>
      </form>

      <article class="form-card">
        <h3>📸 Sua galeria</h3>
        <p>Arquivos cadastrados: <strong>${state.fotos.length}</strong></p>
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
    showMessage("Escolha uma imagem ou vídeo compatível.", true);
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
      await supabaseClient.storage
        .from(MEDIA_BUCKET)
        .remove([storagePath]);

      throw insertError;
    }

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
    preview.textContent = "Selecione uma imagem ou vídeo compatível.";
    return;
  }

  const url = URL.createObjectURL(file);
  const element = document.createElement(
    isVideoFile(file) ? "video" : "img"
  );

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
    const photo = state.fotos.find(
      (item) => String(item.id) === String(id)
    );

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
          `Registro removido, mas o arquivo não pôde ser apagado: ${storageError.message}`,
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

/* =========================================================
   9. EVENTOS, PROMOÇÕES E AVISOS
   ========================================================= */

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
      ${item.data
        ? `<p><strong>${escapeHTML(dateLabel)}:</strong> ${escapeHTML(formatDate(item.data))}</p>`
        : ""}
      <div class="item-actions">
        <button class="delete-btn" type="button"
          data-delete-content="${escapeHTML(type)}"
          data-id="${escapeHTML(item.id)}">
          Excluir publicação
        </button>
      </div>
    </article>
  `).join("");

  return `
    <div class="content-grid">
      <form class="form-card" id="content-form"
        data-type="${escapeHTML(type)}">

        <h3>${isEvent ? "Adicionar evento" : isPromotion ? "Adicionar promoção" : "Publicar aviso"}</h3>

        <div class="field">
          <label for="content-title">Título</label>
          <input id="content-title" name="titulo" maxlength="150"
            required
            placeholder="${isEvent ? "Ex.: Música ao vivo" : isPromotion ? "Ex.: Promoção de fim de semana" : "Ex.: Horário de funcionamento"}">
        </div>

        <div class="field">
          <label for="content-description">Descrição</label>
          <textarea id="content-description" name="descricao"
            maxlength="5000" required
            placeholder="Escreva os detalhes da publicação"></textarea>
        </div>

        ${isEvent || isPromotion ? `
          <div class="field">
            <label for="content-date">${escapeHTML(dateLabel)}</label>
            <input id="content-date" name="${dateField}"
              type="date" required>
          </div>
        ` : ""}

        <button class="primary-btn" type="submit">Publicar</button>
      </form>

      <article class="form-card">
        <h3>📌 Dica</h3>
        <p>${isEvent
          ? "Informe a data e os detalhes do evento."
          : isPromotion
            ? "Descreva a oferta e informe a validade."
            : "Use avisos para comunicar novidades importantes."}</p>
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
  if (!["eventos", "promocoes", "avisos"].includes(type)) return;

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

/* =========================================================
   10. EVENTOS DOS BOTÕES E FORMULÁRIOS
   ========================================================= */

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

  const refreshReviewsButton = $("#refresh-reviews");

  if (refreshReviewsButton) {
    refreshReviewsButton.addEventListener("click", async () => {
      if (state.busy) return;

      setBusy(true);

      try {
        await loadReviews();
        renderPage("avaliacoes");
        showMessage("Avaliações atualizadas.");
      } catch (error) {
        showMessage(
          `Erro ao atualizar avaliações: ${error.message}`,
          true
        );
      } finally {
        setBusy(false);
      }
    });
  }

  document.querySelectorAll("[data-review-action]").forEach((button) => {
    button.addEventListener("click", () => {
      moderateReview(
        button.dataset.id,
        button.dataset.reviewAction
      );
    });
  });

  document.querySelectorAll("[data-delete-photo]").forEach((button) => {
    button.addEventListener("click", () => {
      deletePhoto(button.dataset.deletePhoto);
    });
  });

  document.querySelectorAll("[data-delete-content]").forEach((button) => {
    button.addEventListener("click", () => {
      deleteContent(
        button.dataset.deleteContent,
        button.dataset.id
      );
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

/* =========================================================
   11. TEMA CLARO E ESCURO
   ========================================================= */

function setupTheme() {
  let savedTheme = null;

  try {
    savedTheme = localStorage.getItem("estacaoAlegriaTheme");
  } catch (error) {
    // O painel continua funcionando se o armazenamento estiver bloqueado.
  }

  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
  }

  updateThemeIcon();

  const toggle = $("#theme-toggle");
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");

    try {
      localStorage.setItem(
        "estacaoAlegriaTheme",
        document.body.classList.contains("dark-theme") ? "dark" : "light"
      );
    } catch (error) {
      // A mudança visual continua funcionando sem armazenamento.
    }

    updateThemeIcon();
  });
}

function updateThemeIcon() {
  const isDark = document.body.classList.contains("dark-theme");
  const icon = $("#theme-icon");
  const toggle = $("#theme-toggle");

  if (icon) icon.textContent = isDark ? "🌙" : "☀️";

  if (toggle) {
    toggle.setAttribute(
      "aria-label",
      isDark ? "Ativar tema claro" : "Ativar tema escuro"
    );
  }
}

/* =========================================================
   12. LINK PARA O SITE PÚBLICO
   ========================================================= */

function setupPreviewLink() {
  const link = $("#preview-link");
  if (!link) return;

  // Coloque aqui o endereço público do site dos visitantes.
  const PUBLIC_SITE_URL = "";

  if (PUBLIC_SITE_URL) {
    link.href = PUBLIC_SITE_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  } else {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      showMessage(
        "Configure o endereço público em setupPreviewLink().",
        true
      );
    });
  }
}

/* =========================================================
   13. INICIALIZAÇÃO DO PAINEL
   ========================================================= */

async function initializeApp() {
  setupNavigation();
  setupTheme();
  setupPreviewLink();

  const authForm = $("#auth-form");
  const authSwitch = $("#auth-switch");
  const logoutButton = $("#logout-btn");

  if (authForm) {
    authForm.addEventListener("submit", handleAuthSubmit);
  }

  if (authSwitch) {
    authSwitch.addEventListener("click", () => {
      state.authMode = state.authMode === "login" ? "signup" : "login";
      updateAuthMode();
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", handleLogout);
  }

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
