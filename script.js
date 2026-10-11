
const storageKey = "estacaoAlegriaAdminDemo";
const languageStorageKey = "estacaoAlegriaLanguage";

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
// IDIOMAS
// ==========================================

const translations = {
  "pt-BR": {
    inicio: "Visão geral",
    fotos: "Galeria de fotos e vídeos",
    eventos: "Eventos",
    promocoes: "Promoções",
    avisos: "Avisos",
    configuracoes: "Configurações",
    account: "Minha conta",
    email: "E-mail conectado",
    connected: "Conta conectada",
    password: "Alterar senha",
    currentPassword: "Senha atual",
    newPassword: "Nova senha",
    confirmPassword: "Confirmar nova senha",
    updatePassword: "Atualizar senha",
    language: "Idioma do painel",
    chooseLanguage: "Escolha seu idioma",
    security: "Segurança",
    securityDescription: "Conta protegida pela autenticação do Supabase.",
    logout: "Sair da conta",
    passwordUpdated: "Senha alterada com sucesso!",
    passwordMismatch: "As novas senhas não coincidem.",
    passwordShort: "A senha precisa ter pelo menos 6 caracteres.",
    wrongPassword: "A senha atual está incorreta.",
    passwordError: "Não foi possível alterar a senha.",
    languageSaved: "Idioma salvo neste navegador.",
    loadingEmail: "Carregando e-mail...",
    emailError: "Não foi possível carregar a conta.",
    wait: "Aguarde...",
    startHere: "Comece por aqui ☀️",
    startDescription: "Cadastre fotos, vídeos, eventos, promoções e avisos para os visitantes.",
    addMedia: "Adicionar foto ou vídeo",
    cloudTitle: "Publicações na nuvem 🔗",
    cloudDescription: "Os conteúdos são carregados do Supabase e podem aparecer no site dos clientes.",
    addEvent: "Cadastrar evento",
    establishment: "Conteúdo do estabelecimento",
    addPhoto: "Adicionar foto ou vídeo",
    photoTitle: "Título ou legenda",
    selectMedia: "Selecionar foto ou vídeo",
    description: "Descrição",
    optional: "(opcional)",
    save: "Salvar publicação",
    saving: "Salvando...",
    delete: "Excluir",
    date: "Data",
    noDescription: "Sem descrição.",
    noItems: "Nenhum item cadastrado ainda. Use o formulário para adicionar o primeiro.",
    loadingItems: "Carregando publicações...",
    loadError: "Não foi possível carregar os dados.",
    deleteConfirm: "Deseja realmente excluir esta publicação?",
    deleted: "Publicação excluída.",
    saved: "Publicação salva com sucesso!",
    invalidTitle: "Informe um título.",
    selectFile: "Selecione uma foto ou um vídeo.",
    fileTooLarge: "O arquivo excede o limite de 50 MB.",
    invalidFile: "Formato de arquivo não permitido.",
    sessionExpired: "Sua sessão expirou. Entre novamente no painel.",
    photoPublished: "Foto publicada com sucesso!",
    videoPublished: "Vídeo publicado com sucesso!",
    accountCreated: "Conta criada com sucesso!",
    createAccount: "Crie sua conta",
    welcome: "Bem-vindo de volta!",
    registerDescription: "Cadastre seu e-mail para acessar o painel.",
    loginDescription: "Entre para administrar seu estabelecimento.",
    create: "Criar conta",
    login: "Entrar",
    alreadyHaveAccount: "Já tem uma conta? Entre aqui",
    noAccount: "Ainda não tem conta? Cadastre-se",
    loginSuccess: "Login realizado!",
    logoutSuccess: "Você saiu da sua conta.",
    waitLogin: "Aguarde...",
    loginError: "E-mail ou senha incorretos.",
    emailUnconfirmed: "Confirme seu e-mail antes de entrar.",
    passwordMin: "A senha precisa ter pelo menos 6 caracteres.",
    signupReceived: "Cadastro recebido! Confira seu e-mail para confirmar a conta antes de entrar.",
    preview: "Visualizar site ↗",
    selectLanguage: "Idioma"
  },

  en: {
    inicio: "Overview",
    fotos: "Photo and video gallery",
    eventos: "Events",
    promocoes: "Promotions",
    avisos: "Announcements",
    configuracoes: "Settings",
    account: "My account",
    email: "Connected email",
    connected: "Account connected",
    password: "Change password",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    updatePassword: "Update password",
    language: "Dashboard language",
    chooseLanguage: "Choose your language",
    security: "Security",
    securityDescription: "Account protected by Supabase authentication.",
    logout: "Sign out",
    passwordUpdated: "Password changed successfully!",
    passwordMismatch: "The new passwords do not match.",
    passwordShort: "Password must contain at least 6 characters.",
    wrongPassword: "The current password is incorrect.",
    passwordError: "Could not change the password.",
    languageSaved: "Language saved in this browser.",
    loadingEmail: "Loading email...",
    emailError: "Could not load the account.",
    wait: "Please wait...",
    startHere: "Start here ☀️",
    startDescription: "Add photos, videos, events, promotions and announcements for visitors.",
    addMedia: "Add photo or video",
    cloudTitle: "Cloud publications 🔗",
    cloudDescription: "Content is loaded from Supabase and can appear on the customer website.",
    addEvent: "Add event",
    establishment: "Business content",
    addPhoto: "Add photo or video",
    photoTitle: "Title or caption",
    selectMedia: "Select photo or video",
    description: "Description",
    optional: "(optional)",
    save: "Save publication",
    saving: "Saving...",
    delete: "Delete",
    date: "Date",
    noDescription: "No description.",
    noItems: "No items yet. Use the form to add the first one.",
    loadingItems: "Loading publications...",
    loadError: "Could not load data.",
    deleteConfirm: "Are you sure you want to delete this publication?",
    deleted: "Publication deleted.",
    saved: "Publication saved successfully!",
    invalidTitle: "Enter a title.",
    selectFile: "Select a photo or video.",
    fileTooLarge: "The file exceeds the 50 MB limit.",
    invalidFile: "File format not allowed.",
    sessionExpired: "Your session expired. Sign in again.",
    photoPublished: "Photo published successfully!",
    videoPublished: "Video published successfully!",
    accountCreated: "Account created successfully!",
    createAccount: "Create your account",
    welcome: "Welcome back!",
    registerDescription: "Register your email to access the dashboard.",
    loginDescription: "Sign in to manage your business.",
    create: "Create account",
    login: "Sign in",
    alreadyHaveAccount: "Already have an account? Sign in",
    noAccount: "Don't have an account? Register",
    loginSuccess: "Login successful!",
    logoutSuccess: "You have signed out.",
    waitLogin: "Please wait...",
    loginError: "Incorrect email or password.",
    emailUnconfirmed: "Confirm your email before signing in.",
    passwordMin: "Password must contain at least 6 characters.",
    signupReceived: "Registration received! Check your email to confirm your account.",
    preview: "View website ↗",
    selectLanguage: "Language"
  },

  "zh-CN": {
    inicio: "总览",
    fotos: "照片和视频图库",
    eventos: "活动",
    promocoes: "优惠",
    avisos: "公告",
    configuracoes: "设置",
    account: "我的账户",
    email: "已登录邮箱",
    connected: "账户已连接",
    password: "修改密码",
    currentPassword: "当前密码",
    newPassword: "新密码",
    confirmPassword: "确认新密码",
    updatePassword: "更新密码",
    language: "面板语言",
    chooseLanguage: "选择语言",
    security: "安全",
    securityDescription: "账户由 Supabase 身份验证保护。",
    logout: "退出账户",
    passwordUpdated: "密码修改成功！",
    passwordMismatch: "两次输入的新密码不一致。",
    passwordShort: "密码至少需要 6 个字符。",
    wrongPassword: "当前密码不正确。",
    passwordError: "无法修改密码。",
    languageSaved: "语言已保存在此浏览器中。",
    loadingEmail: "正在加载邮箱...",
    emailError: "无法加载账户。",
    wait: "请稍候...",
    startHere: "从这里开始 ☀️",
    startDescription: "添加照片、视频、活动、优惠和公告。",
    addMedia: "添加照片或视频",
    cloudTitle: "云端发布 🔗",
    cloudDescription: "内容来自 Supabase，可以显示在客户网站上。",
    addEvent: "添加活动",
    establishment: "商家内容",
    addPhoto: "添加照片或视频",
    photoTitle: "标题或说明",
    selectMedia: "选择照片或视频",
    description: "描述",
    optional: "（可选）",
    save: "保存发布",
    saving: "正在保存...",
    delete: "删除",
    date: "日期",
    noDescription: "没有描述。",
    noItems: "暂无内容。请使用表单添加第一项。",
    loadingItems: "正在加载内容...",
    loadError: "无法加载数据。",
    deleteConfirm: "确定要删除此内容吗？",
    deleted: "内容已删除。",
    saved: "内容保存成功！",
    invalidTitle: "请输入标题。",
    selectFile: "请选择照片或视频。",
    fileTooLarge: "文件超过 50 MB 限制。",
    invalidFile: "不支持此文件格式。",
    sessionExpired: "登录已过期，请重新登录。",
    photoPublished: "照片发布成功！",
    videoPublished: "视频发布成功！",
    accountCreated: "账户创建成功！",
    createAccount: "创建账户",
    welcome: "欢迎回来！",
    registerDescription: "注册邮箱以访问管理面板。",
    loginDescription: "登录以管理您的商家。",
    create: "创建账户",
    login: "登录",
    alreadyHaveAccount: "已有账户？点击登录",
    noAccount: "没有账户？注册",
    loginSuccess: "登录成功！",
    logoutSuccess: "您已退出账户。",
    waitLogin: "请稍候...",
    loginError: "邮箱或密码错误。",
    emailUnconfirmed: "请先确认邮箱再登录。",
    passwordMin: "密码至少需要 6 个字符。",
    signupReceived: "注册已提交！请检查邮箱以确认账户。",
    preview: "查看网站 ↗",
    selectLanguage: "语言"
  },

  es: {
    inicio: "Resumen",
    fotos: "Galería de fotos y vídeos",
    eventos: "Eventos",
    promocoes: "Promociones",
    avisos: "Avisos",
    configuracoes: "Configuración",
    account: "Mi cuenta",
    email: "Correo conectado",
    connected: "Cuenta conectada",
    password: "Cambiar contraseña",
    currentPassword: "Contraseña actual",
    newPassword: "Nueva contraseña",
    confirmPassword: "Confirmar nueva contraseña",
    updatePassword: "Actualizar contraseña",
    language: "Idioma del panel",
    chooseLanguage: "Elige tu idioma",
    security: "Seguridad",
    securityDescription: "Cuenta protegida por la autenticación de Supabase.",
    logout: "Cerrar sesión",
    passwordUpdated: "¡Contraseña cambiada correctamente!",
    passwordMismatch: "Las nuevas contraseñas no coinciden.",
    passwordShort: "La contraseña debe tener al menos 6 caracteres.",
    wrongPassword: "La contraseña actual es incorrecta.",
    passwordError: "No se pudo cambiar la contraseña.",
    languageSaved: "Idioma guardado en este navegador.",
    loadingEmail: "Cargando correo...",
    emailError: "No se pudo cargar la cuenta.",
    wait: "Espera...",
    startHere: "Empieza aquí ☀️",
    startDescription: "Añade fotos, vídeos, eventos, promociones y avisos para los visitantes.",
    addMedia: "Añadir foto o vídeo",
    cloudTitle: "Publicaciones en la nube 🔗",
    cloudDescription: "El contenido se carga desde Supabase y puede aparecer en el sitio web.",
    addEvent: "Añadir evento",
    establishment: "Contenido del establecimiento",
    addPhoto: "Añadir foto o vídeo",
    photoTitle: "Título o descripción",
    selectMedia: "Seleccionar foto o vídeo",
    description: "Descripción",
    optional: "(opcional)",
    save: "Guardar publicación",
    saving: "Guardando...",
    delete: "Eliminar",
    date: "Fecha",
    noDescription: "Sin descripción.",
    noItems: "Todavía no hay elementos. Usa el formulario para añadir el primero.",
    loadingItems: "Cargando publicaciones...",
    loadError: "No se pudieron cargar los datos.",
    deleteConfirm: "¿Seguro que quieres eliminar esta publicación?",
    deleted: "Publicación eliminada.",
    saved: "¡Publicación guardada correctamente!",
    invalidTitle: "Introduce un título.",
    selectFile: "Selecciona una foto o un vídeo.",
    fileTooLarge: "El archivo supera el límite de 50 MB.",
    invalidFile: "Formato de archivo no permitido.",
    sessionExpired: "Tu sesión ha caducado. Inicia sesión de nuevo.",
    photoPublished: "¡Foto publicada correctamente!",
    videoPublished: "¡Vídeo publicado correctamente!",
    accountCreated: "¡Cuenta creada correctamente!",
    createAccount: "Crear cuenta",
    welcome: "¡Bienvenido de nuevo!",
    registerDescription: "Registra tu correo para acceder al panel.",
    loginDescription: "Inicia sesión para administrar tu establecimiento.",
    create: "Crear cuenta",
    login: "Entrar",
    alreadyHaveAccount: "¿Ya tienes una cuenta? Entra aquí",
    noAccount: "¿No tienes cuenta? Regístrate",
    loginSuccess: "¡Inicio de sesión correcto!",
    logoutSuccess: "Has cerrado sesión.",
    waitLogin: "Espera...",
    loginError: "Correo o contraseña incorrectos.",
    emailUnconfirmed: "Confirma tu correo antes de entrar.",
    passwordMin: "La contraseña debe tener al menos 6 caracteres.",
    signupReceived: "¡Registro recibido! Revisa tu correo para confirmar la cuenta.",
    preview: "Ver sitio web ↗",
    selectLanguage: "Idioma"
  },

  fr: {
    inicio: "Vue d'ensemble",
    fotos: "Galerie de photos et vidéos",
    eventos: "Événements",
    promocoes: "Promotions",
    avisos: "Annonces",
    configuracoes: "Paramètres",
    account: "Mon compte",
    email: "E-mail connecté",
    connected: "Compte connecté",
    password: "Changer le mot de passe",
    currentPassword: "Mot de passe actuel",
    newPassword: "Nouveau mot de passe",
    confirmPassword: "Confirmer le nouveau mot de passe",
    updatePassword: "Mettre à jour le mot de passe",
    language: "Langue du tableau de bord",
    chooseLanguage: "Choisissez votre langue",
    security: "Sécurité",
    securityDescription: "Compte protégé par l'authentification Supabase.",
    logout: "Se déconnecter",
    passwordUpdated: "Mot de passe modifié avec succès !",
    passwordMismatch: "Les nouveaux mots de passe ne correspondent pas.",
    passwordShort: "Le mot de passe doit contenir au moins 6 caractères.",
    wrongPassword: "Le mot de passe actuel est incorrect.",
    passwordError: "Impossible de modifier le mot de passe.",
    languageSaved: "Langue enregistrée dans ce navigateur.",
    loadingEmail: "Chargement de l'e-mail...",
    emailError: "Impossible de charger le compte.",
    wait: "Veuillez patienter...",
    startHere: "Commencez ici ☀️",
    startDescription: "Ajoutez des photos, vidéos, événements, promotions et annonces.",
    addMedia: "Ajouter une photo ou vidéo",
    cloudTitle: "Publications dans le cloud 🔗",
    cloudDescription: "Le contenu est chargé depuis Supabase et peut apparaître sur le site client.",
    addEvent: "Ajouter un événement",
    establishment: "Contenu de l'établissement",
    addPhoto: "Ajouter une photo ou vidéo",
    photoTitle: "Titre ou légende",
    selectMedia: "Sélectionner une photo ou vidéo",
    description: "Description",
    optional: "(facultatif)",
    save: "Enregistrer la publication",
    saving: "Enregistrement...",
    delete: "Supprimer",
    date: "Date",
    noDescription: "Aucune description.",
    noItems: "Aucun élément. Utilisez le formulaire pour ajouter le premier.",
    loadingItems: "Chargement des publications...",
    loadError: "Impossible de charger les données.",
    deleteConfirm: "Voulez-vous vraiment supprimer cette publication ?",
    deleted: "Publication supprimée.",
    saved: "Publication enregistrée avec succès !",
    invalidTitle: "Saisissez un titre.",
    selectFile: "Sélectionnez une photo ou une vidéo.",
    fileTooLarge: "Le fichier dépasse la limite de 50 Mo.",
    invalidFile: "Format de fichier non autorisé.",
    sessionExpired: "Votre session a expiré. Connectez-vous à nouveau.",
    photoPublished: "Photo publiée avec succès !",
    videoPublished: "Vidéo publiée avec succès !",
    accountCreated: "Compte créé avec succès !",
    createAccount: "Créer votre compte",
    welcome: "Bon retour !",
    registerDescription: "Enregistrez votre e-mail pour accéder au tableau de bord.",
    loginDescription: "Connectez-vous pour gérer votre établissement.",
    create: "Créer un compte",
    login: "Se connecter",
    alreadyHaveAccount: "Vous avez déjà un compte ? Connectez-vous",
    noAccount: "Pas de compte ? Inscrivez-vous",
    loginSuccess: "Connexion réussie !",
    logoutSuccess: "Vous êtes déconnecté.",
    waitLogin: "Veuillez patienter...",
    loginError: "E-mail ou mot de passe incorrect.",
    emailUnconfirmed: "Confirmez votre e-mail avant de vous connecter.",
    passwordMin: "Le mot de passe doit contenir au moins 6 caractères.",
    signupReceived: "Inscription reçue ! Vérifiez votre e-mail pour confirmer le compte.",
    preview: "Voir le site ↗",
    selectLanguage: "Langue"
  }
};

function getSelectedLanguage() {
  const saved = localStorage.getItem(languageStorageKey);
  return translations[saved] ? saved : "pt-BR";
}

function t(key) {
  const language = getSelectedLanguage();
  return translations[language]?.[key] ||
    translations["pt-BR"][key] ||
    key;
}

// ==========================================
// DADOS E ESTATÍSTICAS
// ==========================================

function saveData() {
  localStorage.setItem(storageKey, JSON.stringify(data));
  updateStats();
}

function updateStats() {
  const photos = document.getElementById("total-fotos");
  const events = document.getElementById("total-eventos");
  const promotions = document.getElementById("total-promocoes");
  const notices = document.getElementById("total-avisos");

  if (photos) photos.textContent = data.fotos.length;
  if (events) events.textContent = data.eventos.length;
  if (promotions) promotions.textContent = data.promocoes.length;
  if (notices) notices.textContent = data.avisos.length;
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
// ARQUIVOS DE FOTO E VÍDEO
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
  return mimeType.startsWith("video/") ||
    allowedVideoExtensions.includes(extension);
}

function isAllowedFile(file) {
  const extension = getExtension(file.name);
  const allowedExtensions = [
    ...allowedImageExtensions,
    ...allowedVideoExtensions
  ];

  if (!allowedExtensions.includes(extension)) return false;
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
  "sb_publishable_EohrXK6tulCPMKav5kGQfw_OxIQkxqGQ";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

// ==========================================
// CARREGAR DADOS
// ==========================================

function fromDatabase(type, row) {
  return {
    id: row.id,
    title: row.titulo,
    description: row.descricao || "",
    date: type === "eventos"
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

  data[type] = (rows || []).map(row => fromDatabase(type, row));
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

    const activePage = document.querySelector(".nav-item.active")?.dataset.page;

    if (activePage && document.getElementById("item-list")) {
      renderItems(activePage);
    }
  } catch (error) {
    console.error("Erro ao atualizar os dados do Supabase:", error);
  }
}

// ==========================================
// CONFIGURAÇÕES
// ==========================================

function renderSettings() {
  pageContent.innerHTML = `
    <div class="content-grid">
      <div class="form-card">
        <h3>👤 ${t("account")}</h3>

        <div class="field">
          <label for="settings-email">${t("email")}</label>
          <input
            id="settings-email"
            type="email"
            readonly
            placeholder="${t("loadingEmail")}"
          >
        </div>

        <p id="settings-account-status">${t("loadingEmail")}</p>
      </div>

      <form class="form-card" id="settings-password-form">
        <h3>🔐 ${t("password")}</h3>

        <div class="field">
          <label for="settings-current-password">${t("currentPassword")}</label>
          <input
            id="settings-current-password"
            type="password"
            autocomplete="current-password"
            required
          >
        </div>

        <div class="field">
          <label for="settings-new-password">${t("newPassword")}</label>
          <input
            id="settings-new-password"
            type="password"
            minlength="6"
            autocomplete="new-password"
            required
          >
        </div>

        <div class="field">
          <label for="settings-confirm-password">${t("confirmPassword")}</label>
          <input
            id="settings-confirm-password"
            type="password"
            minlength="6"
            autocomplete="new-password"
            required
          >
        </div>

        <button class="primary-btn" type="submit">${t("updatePassword")}</button>
        <p id="settings-password-message" role="status"></p>
      </form>

      <div class="form-card">
        <h3>🌐 ${t("language")}</h3>

        <div class="field">
          <label for="settings-language">${t("chooseLanguage")}</label>

          <select id="settings-language">
            <option value="pt-BR">🇧🇷 Português</option>
            <option value="en">🇺🇸 English</option>
            <option value="zh-CN">🇨🇳 中文（简体）</option>
            <option value="es">🇪🇸 Español</option>
            <option value="fr">🇫🇷 Français</option>
          </select>
        </div>

        <p id="settings-language-message" role="status">${t("languageSaved")}</p>
      </div>

      <div class="form-card">
        <h3>🛡️ ${t("security")}</h3>
        <p>${t("securityDescription")}</p>

        <button class="primary-btn" id="settings-logout" type="button">
          ${t("logout")}
        </button>
      </div>
    </div>
  `;

  setupSettings();
}

function setupSettings() {
  const emailInput = document.getElementById("settings-email");
  const accountStatus = document.getElementById("settings-account-status");
  const passwordForm = document.getElementById("settings-password-form");
  const passwordMessage = document.getElementById("settings-password-message");
  const languageSelect = document.getElementById("settings-language");
  const logout = document.getElementById("settings-logout");

  const language = getSelectedLanguage();

  languageSelect.value = language;

  supabaseClient.auth.getUser().then(({ data: result, error }) => {
    if (error || !result.user) {
      accountStatus.textContent = t("emailError");
      return;
    }

    emailInput.value = result.user.email || "";
    accountStatus.textContent = t("connected");
  });

  languageSelect.addEventListener("change", () => {
    localStorage.setItem(languageStorageKey, languageSelect.value);
    renderPage("configuracoes");
  });

  passwordForm.addEventListener("submit", async event => {
    event.preventDefault();

    const currentPassword =
      document.getElementById("settings-current-password").value;

    const newPassword =
      document.getElementById("settings-new-password").value;

    const confirmPassword =
      document.getElementById("settings-confirm-password").value;

    const submitButton =
      passwordForm.querySelector('button[type="submit"]');

    passwordMessage.textContent = "";

    if (newPassword.length < 6) {
      passwordMessage.textContent = t("passwordShort");
      return;
    }

    if (newPassword !== confirmPassword) {
      passwordMessage.textContent = t("passwordMismatch");
      return;
    }

    if (newPassword === currentPassword) {
      passwordMessage.textContent =
        "Escolha uma senha diferente da atual.";
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = t("wait");

    try {
      const { data: userData, error: userError } =
        await supabaseClient.auth.getUser();

      if (userError) throw userError;

      const email = userData.user?.email;

      if (!email) {
        throw new Error("Não foi possível identificar o e-mail da conta.");
      }

      const { error: loginError } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password: currentPassword
        });

      if (loginError) {
        passwordMessage.textContent = t("wrongPassword");
        return;
      }

      const { error: updateError } =
        await supabaseClient.auth.updateUser({
          password: newPassword
        });

      if (updateError) throw updateError;

      passwordForm.reset();
      passwordMessage.textContent = t("passwordUpdated");

    } catch (error) {
      console.error("Erro ao alterar senha:", error);

      passwordMessage.textContent =
        t("passwordError") +
        (error.message ? " " + error.message : "");

    } finally {
      submitButton.disabled = false;
      submitButton.textContent = t("updatePassword");
    }
  });

  logout.addEventListener("click", async () => {
    logout.disabled = true;

    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
    } catch (error) {
      alert(t("logout") + ": " + (error.message || ""));
    } finally {
      logout.disabled = false;
    }
  });
}

// ==========================================
// NAVEGAÇÃO
// ==========================================

function renderPage(page) {
  if (!titles[page]) return;

  document.getElementById("page-title").textContent = t(page);

  document.getElementById("section-title").textContent =
    page === "inicio" ? t("establishment") : t(page);

 
document.querySelectorAll(".nav-item").forEach(button => {
  button.classList.toggle(
    "active",
    button.dataset.page === page
  );
});

    }
  });

  if (page === "inicio") {
    pageContent.innerHTML = `
      <div class="content-grid">
        <div class="form-card">
          <h3>${t("startHere")}</h3>
          <p>${t("startDescription")}</p>
          <button class="primary-btn" data-go="fotos">${t("addMedia")}</button>
        </div>

        <div class="form-card">
          <h3>${t("cloudTitle")}</h3>
          <p>${t("cloudDescription")}</p>
          <button class="primary-btn" data-go="eventos">${t("addEvent")}</button>
        </div>
      </div>`;
    return;
  }

  if (page === "configuracoes") {
    renderSettings();
    return;
  }

  renderManager(page);
}

// ==========================================
// FORMULÁRIOS DE PUBLICAÇÃO
// ==========================================

function renderManager(type) {
  const config = {
    fotos: {
      title: t("addPhoto"),
      fields: `
        <div class="field">
          <label for="item-title">${t("photoTitle")}</label>
          <input id="item-title" name="title"
            placeholder="Ex.: Nossa piscina no verão"
            maxlength="160" required>
        </div>

        <div class="field">
          <label for="item-image">${t("selectMedia")}</label>
          <input id="item-image" name="image" type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime,video/x-m4v,video/ogg"
            required>
          <small>
            Fotos: JPG, PNG, WEBP, GIF ou AVIF.
            Vídeos: MP4, WEBM, MOV ou OGG. Limite de 50 MB.
          </small>
        </div>

        <div class="field" id="media-preview-container" hidden>
          <label>Pré-visualização</label>
          <div id="media-preview"></div>
        </div>

        <div class="field">
          <label for="item-description">${t("description")} ${t("optional")}</label>
          <textarea id="item-description" name="description"
            placeholder="Conte um pouco sobre o conteúdo"></textarea>
        </div>`
    },

    eventos: {
      title: t("addEvent"),
      fields: `
        <div class="field">
          <label for="item-title">Nome do evento</label>
          <input id="item-title" name="title"
            placeholder="Ex.: Domingo em família" required>
        </div>

        <div class="field">
          <label for="item-date">${t("date")}</label>
          <input id="item-date" name="date" type="date">
        </div>

        <div class="field">
          <label for="item-description">${t("description")}</label>
          <textarea id="item-description" name="description"
            placeholder="Horário, atrações e detalhes" required></textarea>
        </div>`
    },

    promocoes: {
      title: "Criar promoção",
      fields: `
        <div class="field">
          <label for="item-title">Título da promoção</label>
          <input id="item-title" name="title"
            placeholder="Ex.: Promoção para famílias" required>
        </div>

        <div class="field">
          <label for="item-date">Válida até</label>
          <input id="item-date" name="date" type="date">
        </div>

        <div class="field">
          <label for="item-description">${t("description")}</label>
          <textarea id="item-description" name="description"
            placeholder="Descreva a oferta" required></textarea>
        </div>`
    },

    avisos: {
      title: "Publicar aviso",
      fields: `
        <div class="field">
          <label for="item-title">Título do aviso</label>
          <input id="item-title" name="title"
            placeholder="Ex.: Horário de funcionamento" required>
        </div>

        <div class="field">
          <label for="item-description">Mensagem</label>
          <textarea id="item-description" name="description"
            placeholder="Escreva o aviso para os visitantes" required></textarea>
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
        <button class="primary-btn" type="submit">${t("save")}</button>
      </form>

      <div class="form-card">
        <h3>Sobre as publicações</h3>
        <p>
          ${type === "fotos"
            ? "Fotos e vídeos são enviados ao Supabase Storage e registrados na tabela fotos."
            : "Os dados são salvos no banco de dados do Supabase."}
        </p>
      </div>
    </div>

    <div class="item-list" id="item-list"></div>
  `;

  document.getElementById("item-form")
    .addEventListener("submit", handleSubmit);

  if (type === "fotos") setupMediaPreview();

  renderItems(type);
}

// ==========================================
// PRÉ-VISUALIZAÇÃO
// ==========================================

let previewObjectUrl = null;

function setupMediaPreview() {
  const input = document.getElementById("item-image");
  const container = document.getElementById("media-preview-container");
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
      alert("Arquivo inválido. Escolha uma foto ou vídeo permitido de até 50 MB.");
      return;
    }

    previewObjectUrl = URL.createObjectURL(file);
    container.hidden = false;

    if (isVideoFile(file.name, file.type)) {
      preview.innerHTML = `
        <video src="${previewObjectUrl}" controls playsinline preload="metadata"
          style="max-width:100%;max-height:320px;border-radius:12px"></video>`;
    } else {
      preview.innerHTML = `
        <img src="${previewObjectUrl}" alt="Pré-visualização da foto"
          style="max-width:100%;max-height:320px;object-fit:contain;border-radius:12px">`;
    }
  });
}

// ==========================================
// SALVAR PUBLICAÇÕES
// ==========================================

async function handleSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const type = document.querySelector(".nav-item.active")?.dataset.page;
  const formData = new FormData(form);

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const date = String(formData.get("date") || "");

  if (!title) {
    alert(t("invalidTitle"));
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = t("saving");

  try {
    if (type === "fotos") {
      const file = formData.get("image");

      if (!file || !file.name) throw new Error(t("selectFile"));
      if (file.size > MAX_FILE_SIZE) throw new Error(t("fileTooLarge"));
      if (!isAllowedFile(file)) throw new Error(t("invalidFile"));

      const { data: sessionData, error: sessionError } =
        await supabaseClient.auth.getSession();

      if (sessionError) throw sessionError;
      if (!sessionData.session) throw new Error(t("sessionExpired"));

      const extension = getExtension(file.name);
      const storagePath = `${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabaseClient.storage
        .from(PHOTO_BUCKET)
        .upload(storagePath, file, {
          contentType: file.type || undefined,
          cacheControl: "3600",
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabaseClient.storage
        .from(PHOTO_BUCKET)
        .getPublicUrl(storagePath);

      if (!publicData?.publicUrl) {
        await supabaseClient.storage.from(PHOTO_BUCKET).remove([storagePath]);
        throw new Error("Não foi possível gerar o endereço público do arquivo.");
      }

      const { error: insertError } = await supabaseClient
        .from("fotos")
        .insert({
          nome: title,
          imagem_url: publicData.publicUrl,
          storage_path: storagePath
        });

      if (insertError) {
        await supabaseClient.storage.from(PHOTO_BUCKET).remove([storagePath]);
        throw insertError;
      }

      await loadPhotos();
      updateStats();
      renderPage("fotos");

      alert(isVideoFile(file.name, file.type)
        ? t("videoPublished")
        : t("photoPublished"));

      return;
    }

    const table = cloudTables[type];
    if (!table) throw new Error("Tipo de publicação inválido.");

    const record = {
      titulo: title,
      descricao: description
    };

    if (type === "eventos") record.data_evento = date || null;
    if (type === "promocoes") record.validade = date || null;

    const { error } = await supabaseClient.from(table).insert(record);
    if (error) throw error;

    await loadCloudItems(type);
    updateStats();
    renderPage(type);
    alert(t("saved"));

  } catch (error) {
    console.error("Erro ao salvar:", error);
    alert("Não foi possível salvar a publicação.\n\n" +
      (error.message || "Erro desconhecido."));
  } finally {
    if (submitButton.isConnected) {
      submitButton.disabled = false;
      submitButton.textContent = t("save");
    }
  }
}

// ==========================================
// LISTAR PUBLICAÇÕES
// ==========================================

async function renderItems(type) {
  const list = document.getElementById("item-list");
  if (!list) return;

  list.innerHTML = `<div class="empty">${t("loadingItems")}</div>`;

  try {
    if (cloudTables[type]) {
      await loadCloudItems(type);
    } else if (type === "fotos") {
      await loadPhotos();
    }

    if (!list.isConnected) return;

    const items = data[type] || [];

    if (!items.length) {
      list.innerHTML = `<div class="empty">${t("noItems")}</div>`;
      return;
    }

    list.innerHTML = items.map(item => {
      const media = type === "fotos" && item.image
        ? (
          isVideoFile(item.storagePath || item.image, "")
            ? `<video src="${escapeHTML(item.image)}" controls playsinline preload="metadata"
                 style="width:100%;max-height:260px;object-fit:contain;border-radius:12px"></video>`
            : `<img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)}" loading="lazy">`
        )
        : "";

      return `
        <article class="item-card">
          ${media}
          <h3>${escapeHTML(item.title)}</h3>
          ${item.date ? `<p>${t("date")}: ${escapeHTML(item.date)}</p>` : ""}
          <p>${escapeHTML(item.description || t("noDescription"))}</p>
          <div class="item-actions">
            <button class="delete-btn" data-delete="${escapeHTML(item.id)}" type="button">
              ${t("delete")}
            </button>
          </div>
        </article>`;
    }).join("");

    list.querySelectorAll("[data-delete]").forEach(button => {
      button.addEventListener("click", async () => {
        const id = button.dataset.delete;

        if (!confirm(t("deleteConfirm"))) return;

        button.disabled = true;

        try {
          if (type === "fotos") {
            const photo = data.fotos.find(item => String(item.id) === String(id));
            if (!photo) throw new Error("Arquivo não encontrado.");
            if (!photo.storagePath) throw new Error("Caminho do arquivo não registrado.");

            const { error: deleteError } = await supabaseClient
              .from("fotos").delete().eq("id", id);

            if (deleteError) throw deleteError;

            const { error: storageError } = await supabaseClient.storage
              .from(PHOTO_BUCKET).remove([photo.storagePath]);

            if (storageError) console.error("Erro ao remover arquivo:", storageError);

            await loadPhotos();

          } else if (cloudTables[type]) {
            const { error } = await supabaseClient
              .from(cloudTables[type]).delete().eq("id", id);

            if (error) throw error;
            await loadCloudItems(type);

          } else {
            data[type] = data[type].filter(item => String(item.id) !== String(id));
            saveData();
          }

          updateStats();
          renderPage(type);
          alert(t("deleted"));

        } catch (error) {
          console.error("Erro ao excluir:", error);
          alert("Não foi possível concluir a exclusão.\n\n" +
            (error.message || "Erro desconhecido."));
          button.disabled = false;
        }
      });
    });

  } catch (error) {
    console.error("Erro ao carregar publicações:", error);

    if (list.isConnected) {
      list.innerHTML = `<div class="empty">${t("loadError")}</div>`;
    }
  }
}

// ==========================================
// MENU E LINKS
// ==========================================

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => renderPage(button.dataset.page));
});

document.getElementById("preview-link").addEventListener("click", event => {
  event.preventDefault();
  alert("Configure o endereço público do site neste link.");
});

pageContent.addEventListener("click", event => {
  const button = event.target.closest("[data-go]");
  if (button) renderPage(button.dataset.go);
});

// ==========================================
// TEMA CLARO E ESCURO
// ==========================================

const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");

function applyTheme(isDark) {
  document.body.classList.toggle("dark-theme", isDark);

  if (themeIcon) themeIcon.textContent = isDark ? "🌙" : "☀️";

  if (themeToggle) {
    themeToggle.setAttribute(
      "aria-label",
      isDark ? "Ativar tema claro" : "Ativar tema escuro"
    );
  }

  localStorage.setItem("estacaoAlegriaTheme", isDark ? "dark" : "light");
}

const savedTheme = localStorage.getItem("estacaoAlegriaTheme");
applyTheme(savedTheme === "dark");

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    applyTheme(!document.body.classList.contains("dark-theme"));
  });
}

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
logoutButton.textContent = t("logout");
logoutButton.style.border = "0";
logoutButton.style.cursor = "pointer";
logoutButton.style.display = "none";

topbar.appendChild(logoutButton);

function showAuthMessage(message, success = false) {
  authMessage.textContent = message;
  authMessage.style.color = success ? "#21865c" : "#b33b3b";
}

function updateAuthMode() {
  authTitle.textContent = isSignUpMode ? t("createAccount") : t("welcome");

  authDescription.textContent = isSignUpMode
    ? t("registerDescription")
    : t("loginDescription");

  authSubmit.textContent = isSignUpMode ? t("create") : t("login");

  authSwitch.textContent = isSignUpMode
    ? t("alreadyHaveAccount")
    : t("noAccount");

  authPassword.autocomplete = isSignUpMode ? "new-password" : "current-password";
  authPassword.minLength = 6;

  showAuthMessage("");
}

function setAuthenticated(isAuthenticated) {
  document.body.classList.toggle("authenticated", isAuthenticated);
  authScreen.hidden = isAuthenticated;
  logoutButton.style.display = isAuthenticated ? "inline-block" : "none";
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
  authSubmit.textContent = t("waitLogin");
  showAuthMessage("");

  try {
    if (isSignUpMode) {
      const { data: result, error } = await supabaseClient.auth.signUp({
        email,
        password
      });

      if (error) throw error;

      if (result.session) {
        showAuthMessage(t("accountCreated"), true);
      } else {
        showAuthMessage(t("signupReceived"), true);
      }

    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      showAuthMessage(t("loginSuccess"), true);
    }

  } catch (error) {
    const message = String(error.message || "");

    if (/already registered|already exists|user already/i.test(message)) {
      showAuthMessage("Este e-mail já possui cadastro. Tente entrar.");
    } else if (/invalid login credentials/i.test(message)) {
      showAuthMessage(t("loginError"));
    } else if (/email not confirmed/i.test(message)) {
      showAuthMessage(t("emailUnconfirmed"));
    } else if (/password should be at least/i.test(message)) {
      showAuthMessage(t("passwordMin"));
    } else {
      showAuthMessage("Não foi possível concluir. " + message);
    }

  } finally {
    authBusy = false;
    authSubmit.disabled = false;
    authSubmit.textContent = isSignUpMode ? t("create") : t("login");
  }
});

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;

  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
  } catch (error) {
    alert("Não foi possível sair da conta: " + error.message);
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
    setTimeout(() => refreshCloudData(), 0);
  }

  if (event === "SIGNED_OUT") {
    authForm.reset();
    showAuthMessage(t("logoutSuccess"));

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
    showAuthMessage("Não foi possível verificar sua sessão. Atualize a página.");
    return;
  }

  const isAuthenticated = Boolean(sessionData.session);
  setAuthenticated(isAuthenticated);

  if (isAuthenticated) await refreshCloudData();
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================

updateStats();
renderPage("inicio");
updateAuthMode();
restoreAuthSession();
