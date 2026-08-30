const API_STATE = "/api/state";
const API_LOGIN = "/api/login";
const API_LOGOUT = "/api/logout";
const API_SETUP = "/api/setup";
const API_REGISTER = "/api/register";
const API_INVITE_ACCEPT = "/api/invites/accept";
const API_RECOVERY_RESET = "/api/recovery/reset";
const API_MEMBERS = "/api/members";
const API_INVITES = "/api/invites";

const STANDARD_STATUSES = [
  { value: "pendente", label: "Pendente" },
  { value: "andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluida" }
];

const DEV_STATUSES = [
  { value: "analise", label: "Analise" },
  { value: "em_progresso", label: "Em progresso" },
  { value: "dev_teste", label: "Dev teste" },
  { value: "sdx_teste", label: "SDX teste" },
  { value: "ready_deploy", label: "Ready To Deploy" },
  { value: "producao", label: "Producao" },
  { value: "finalizado", label: "Finalizado" }
];

const FINANCE_CATEGORY_SEEDS = [
  { id: "fc-alimentacao", name: "Alimentacao", type: "despesa", active: true, subcategories: ["Mercado", "Restaurante", "Delivery", "Ifood"] },
  { id: "fc-moradia", name: "Moradia", type: "despesa", active: true, subcategories: ["Luz", "Agua", "Condominio", "Aluguel", "Internet", "Supermercado"] },
  { id: "fc-transporte", name: "Transporte", type: "despesa", active: true, subcategories: ["Uber", "Posto", "Combustivel", "Aplicativo", "Manutencao", "Seguro"] },
  { id: "fc-saude", name: "Saude", type: "despesa", active: true, subcategories: ["Remedios", "Consultas", "Exames", "Plano de saude"] },
  { id: "fc-educacao", name: "Educacao", type: "despesa", active: true, subcategories: ["Escola", "Cursos", "Material", "Mensalidade"] },
  { id: "fc-lazer", name: "Lazer", type: "despesa", active: true, subcategories: ["Passeios", "Streaming", "Viagens"] },
  { id: "fc-assinaturas", name: "Assinaturas", type: "despesa", active: true, subcategories: ["Software", "Streaming", "Clubes"] },
  { id: "fc-salario", name: "Salario", type: "receita", active: true, subcategories: ["Salario", "Bonus", "Freelance"] },
  { id: "fc-outros", name: "Outros", type: "ambos", active: true, subcategories: ["Geral"] }
];

const seedFinance = {
  activeView: "overview",
  activeMonth: monthKey(new Date()),
  composerOpen: false,
  editingTransactionId: null,
  accounts: [{ id: "fa-carteira", name: "Carteira", type: "Dinheiro", initialBalance: 0, active: true, createdAt: new Date().toISOString() }],
  cards: [],
  categories: FINANCE_CATEGORY_SEEDS,
  transactions: []
};

const seedState = {
  activeFilter: "inbox",
  activeProjectId: null,
  statusFilter: "all",
  priorityFilter: null,
  nicheFilter: null,
  dateFilterOpen: false,
  dateRange: { from: "", to: "" },
  expandedDateGroups: {},
  view: "list",
  selectedTaskId: "t1",
  preferences: { activeModule: "routine" },
  finance: structuredClone(seedFinance),
  projects: [
    { id: "p1", name: "Pessoal", color: "#27865f" },
    { id: "p2", name: "Trabalho", color: "#2f6f87" },
    { id: "p3", name: "Estudos", color: "#6f8f3f" }
  ],
  tasks: [
    {
      id: "t1",
      title: "Organizar tarefas da semana",
      description: "Definir prioridades, prazos e tarefas recorrentes.",
      projectId: "p1",
      priority: "alta",
      status: "andamento",
      niche: "geral",
      due: todayAt(18, 0),
      labels: ["planejamento"],
      links: [],
      completedAt: null,
      createdAt: new Date().toISOString(),
      subtasks: [
        { id: "s1", title: "Revisar pendencias", done: true },
        { id: "s2", title: "Definir 3 prioridades", done: false }
      ]
    },
    {
      id: "t2",
      title: "Publicar ajuste do Focus",
      description: "Validar fluxo, testar em SDX e publicar no servidor.",
      projectId: "p2",
      priority: "alta",
      status: "analise",
      niche: "dev",
      due: todayAt(15, 0),
      labels: ["dev", "focus"],
      links: [{ id: "l1", title: "ClickUp", url: "https://app.clickup.com/" }],
      completedAt: null,
      createdAt: new Date().toISOString(),
      subtasks: [{ id: "s3", title: "Criar filtro por data", done: false }]
    }
  ],
  activity: []
};

let state = structuredClone(seedState);
let saveTimer = null;

const els = {
  authScreen: document.querySelector("#authScreen"),
  authForm: document.querySelector("#authForm"),
  setupForm: document.querySelector("#setupForm"),
  inviteAcceptForm: document.querySelector("#inviteAcceptForm"),
  recoveryForm: document.querySelector("#recoveryForm"),
  authModeButtons: document.querySelectorAll("[data-auth-mode]"),
  authPanels: document.querySelectorAll("[data-auth-panel]"),
  authError: document.querySelector("#authError"),
  appShell: document.querySelector("#appShell"),
  logoutBtn: document.querySelector("#logoutBtn"),
  quickAddBtn: document.querySelector("#quickAddBtn"),
  addProjectBtn: document.querySelector("#addProjectBtn"),
  projectDialog: document.querySelector("#projectDialog"),
  projectForm: document.querySelector("#projectForm"),
  projectName: document.querySelector("#projectName"),
  projectColor: document.querySelector("#projectColor"),
  navItems: document.querySelectorAll(".nav-item"),
  projectList: document.querySelector("#projectList"),
  taskForm: document.querySelector("#taskForm"),
  taskTitle: document.querySelector("#taskTitle"),
  taskDue: document.querySelector("#taskDue"),
  taskProject: document.querySelector("#taskProject"),
  taskPriority: document.querySelector("#taskPriority"),
  taskIsDev: document.querySelector("#taskIsDev"),
  searchInput: document.querySelector("#searchInput"),
  chips: document.querySelectorAll(".chip"),
  viewButtons: document.querySelectorAll("[data-view]"),
  datePanel: document.querySelector("#datePanel"),
  filterStartDate: document.querySelector("#filterStartDate"),
  filterEndDate: document.querySelector("#filterEndDate"),
  clearDateFilter: document.querySelector("#clearDateFilter"),
  taskList: document.querySelector("#taskList"),
  boardView: document.querySelector("#boardView"),
  dateView: document.querySelector("#dateView"),
  emptyState: document.querySelector("#emptyState"),
  detailPanel: document.querySelector("#detailPanel"),
  viewEyebrow: document.querySelector("#viewEyebrow"),
  viewTitle: document.querySelector("#viewTitle"),
  countInbox: document.querySelector("#countInbox"),
  countToday: document.querySelector("#countToday"),
  countUpcoming: document.querySelector("#countUpcoming"),
  countCompleted: document.querySelector("#countCompleted"),
  metricDone: document.querySelector("#metricDone"),
  moduleButtons: document.querySelectorAll("[data-module]"),
  routineSidebar: document.querySelector("#routineSidebar"),
  financeSidebar: document.querySelector("#financeSidebar"),
  routineWorkspace: document.querySelector("#routineWorkspace"),
  financeWorkspace: document.querySelector("#financeWorkspace"),
  financeNavItems: document.querySelectorAll("[data-finance-view]"),
  newTransactionBtn: document.querySelector("#newTransactionBtn"),
  importReceiptBtn: document.querySelector("#importReceiptBtn"),
  voiceTransactionBtn: document.querySelector("#voiceTransactionBtn"),
  receiptFileInput: document.querySelector("#receiptFileInput"),
  financeTitle: document.querySelector("#financeTitle"),
  financeSearchInput: document.querySelector("#financeSearchInput"),
  financeComposer: document.querySelector("#financeComposer"),
  transactionForm: document.querySelector("#transactionForm"),
  transactionDescription: document.querySelector("#transactionDescription"),
  transactionType: document.querySelector("#transactionType"),
  transactionAmount: document.querySelector("#transactionAmount"),
  transactionCategory: document.querySelector("#transactionCategory"),
  transactionSubcategory: document.querySelector("#transactionSubcategory"),
  transactionAccount: document.querySelector("#transactionAccount"),
  transactionCard: document.querySelector("#transactionCard"),
  transactionCompetence: document.querySelector("#transactionCompetence"),
  transactionDate: document.querySelector("#transactionDate"),
  transactionDueDate: document.querySelector("#transactionDueDate"),
  transactionStatus: document.querySelector("#transactionStatus"),
  transactionRepeat: document.querySelector("#transactionRepeat"),
  transactionInstallmentStart: document.querySelector("#transactionInstallmentStart"),
  transactionInstallments: document.querySelector("#transactionInstallments"),
  transactionIntervalDays: document.querySelector("#transactionIntervalDays"),
  transactionNote: document.querySelector("#transactionNote"),
  transactionAssistMessage: document.querySelector("#transactionAssistMessage"),
  financeContent: document.querySelector("#financeContent"),
  countTransactions: document.querySelector("#countTransactions"),
  countAccounts: document.querySelector("#countAccounts"),
  countCards: document.querySelector("#countCards"),
  countCategories: document.querySelector("#countCategories")
};

document.addEventListener("DOMContentLoaded", () => {
  bindAuth();
  bindEvents();
  boot();
});

async function boot() {
  const setup = await requestJson(API_SETUP);
  if (setup.needsSetup) setAuthMode("setup");
  const loaded = await loadRemoteState();
  refreshAuthState(loaded);
  if (loaded) render();
}
function bindAuth() {
  els.authScreen.addEventListener("click", (event) => {
    const button = event.target.closest("[data-auth-mode]");
    if (!button) return;
    setAuthMode(button.dataset.authMode);
  });

  els.authModeButtons.forEach((button) => {
    button.addEventListener("click", () => setAuthMode(button.dataset.authMode));
  });

  els.authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const response = await requestJson(API_LOGIN, {
      method: "POST",
      body: JSON.stringify({
        email: document.querySelector("#emailInput").value,
        password: document.querySelector("#passwordInput").value
      })
    });

    if (!response.ok) return showAuthMessage(response.message || "Email ou senha invalidos.");
    await loadRemoteState();
    refreshAuthState(true);
    render();
  });

  els.setupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const response = await requestJson(API_REGISTER, {
      method: "POST",
      body: JSON.stringify({
        name: document.querySelector("#setupName").value,
        email: document.querySelector("#setupEmail").value,
        password: document.querySelector("#setupPassword").value,
        tenantName: document.querySelector("#tenantName").value
      })
    });

    if (!response.ok) return showAuthMessage(response.message || "Nao foi possivel criar o acesso.");
    showAuthMessage(`Acesso criado. Guarde este codigo de recuperacao: ${response.recoveryCode}`);
    currentSession = response.session;
    await loadRemoteState();
    refreshAuthState(true);
    render();
  });

  els.inviteAcceptForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const response = await requestJson(API_INVITE_ACCEPT, {
      method: "POST",
      body: JSON.stringify({
        name: document.querySelector("#inviteName").value,
        email: document.querySelector("#inviteEmail").value,
        password: document.querySelector("#invitePassword").value,
        inviteCode: document.querySelector("#inviteCode").value
      })
    });

    if (!response.ok) return showAuthMessage(response.message || "Convite invalido.");
    showAuthMessage(`Usuario criado. Guarde este codigo de recuperacao: ${response.recoveryCode}`);
    setAuthMode("login");
  });

  els.recoveryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const response = await requestJson(API_RECOVERY_RESET, {
      method: "POST",
      body: JSON.stringify({
        email: document.querySelector("#recoveryEmail").value,
        recoveryCode: document.querySelector("#recoveryCode").value,
        newPassword: document.querySelector("#newPassword").value
      })
    });

    if (!response.ok) return showAuthMessage(response.message || "Nao foi possivel recuperar a senha.");
    showAuthMessage(`Senha alterada. Guarde o novo codigo de recuperacao: ${response.recoveryCode}`);
    setAuthMode("login");
  });

  els.logoutBtn.addEventListener("click", async () => {
    await requestJson(API_LOGOUT, { method: "POST" });
    currentSession = null;
    tenantMembers = [];
    refreshAuthState(false);
  });
}
function refreshAuthState(authenticated) {
  els.authScreen.classList.toggle("hidden", authenticated);
  els.appShell.classList.toggle("locked", !authenticated);
  if (!authenticated) document.querySelector("[data-auth-panel]:not(.hidden) input")?.focus();
}

function setAuthMode(mode) {
  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.authMode === mode);
  });
  document.querySelectorAll("[data-auth-panel]").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.authPanel !== mode);
  });
  els.authError.textContent = "";
  document.querySelector(`[data-auth-panel="${mode}"] input`)?.focus();
}

function showAuthMessage(message) {
  els.authError.textContent = message;
}
window.setAuthMode = setAuthMode;

function bindEvents() {
  els.quickAddBtn.addEventListener("click", () => els.taskTitle.focus());

  els.moduleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.preferences.activeModule = button.dataset.module;
      saveAndRender();
    });
  });

  els.financeNavItems.forEach((button) => {
    button.addEventListener("click", () => {
      state.finance.activeView = button.dataset.financeView;
      state.finance.composerOpen = false;
      saveAndRender();
    });
  });

  els.newTransactionBtn.addEventListener("click", () => {
    openTransactionComposer();
  });

  els.importReceiptBtn.addEventListener("click", () => {
    openTransactionComposer();
    setTransactionAssistMessage("Selecione um comprovante Pix em PDF, imagem ou texto.");
    els.receiptFileInput.click();
  });

  els.receiptFileInput.addEventListener("change", handleReceiptImport);

  els.transactionDescription.addEventListener("input", applyTransactionSuggestion);

  els.transactionCategory.addEventListener("change", () => {
    renderSubcategoryOptions(els.transactionCategory.value);
  });

  els.transactionRepeat.addEventListener("change", updateTransactionFieldVisibility);
  els.transactionStatus.addEventListener("change", updateTransactionFieldVisibility);
  els.transactionDueDate.addEventListener("change", updateTransactionFieldVisibility);

  els.voiceTransactionBtn.addEventListener("click", () => {
    openTransactionComposer();
    startVoiceTransaction();
  });

  els.transactionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = collectTransactionForm();
    if (state.finance.editingTransactionId) {
      const current = state.finance.transactions.find((item) => item.id === state.finance.editingTransactionId);
      const applyForward = current?.seriesId && current.repeat !== "single" && window.confirm("Aplicar valor, descricao, categoria e periodo aos lancamentos futuros desta serie?");
      updateFinancialTransaction(state.finance.editingTransactionId, input, Boolean(applyForward));
    } else {
      createFinancialTransaction(input);
    }
    resetTransactionForm();
    state.finance.composerOpen = false;
    state.finance.editingTransactionId = null;
    saveAndRender();
  });
  els.financeSearchInput.addEventListener("input", renderFinance);

  els.addProjectBtn.addEventListener("click", () => {
    els.projectDialog.showModal();
    els.projectName.focus();
  });

  els.projectForm.addEventListener("submit", (event) => {
    if (event.submitter?.value === "cancel") return;
    event.preventDefault();
    const name = els.projectName.value.trim();
    if (!name) return;
    const project = { id: createId(), name, color: els.projectColor.value };
    state.projects.push(project);
    state.activeProjectId = project.id;
    state.activeFilter = "project";
    els.projectName.value = "";
    els.projectDialog.close();
    logActivity(`Projeto "${name}" criado`);
    saveAndRender();
  });

  els.navItems.forEach((button) => {
    button.addEventListener("click", () => {
      state.activeFilter = button.dataset.filter;
      state.activeProjectId = null;
      saveAndRender();
    });
  });

  els.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = els.taskTitle.value.trim();
    if (!title) return;
    const isDev = els.taskIsDev.checked;
    const task = {
      id: createId(),
      title,
      description: "",
      projectId: els.taskProject.value,
      priority: els.taskPriority.value,
      status: isDev ? "analise" : "pendente",
      niche: isDev ? "dev" : "geral",
      due: els.taskDue.value ? new Date(els.taskDue.value).toISOString() : null,
      labels: isDev ? ["dev"] : [],
      links: [],
      completedAt: null,
      createdAt: new Date().toISOString(),
      subtasks: []
    };
    state.tasks.unshift(task);
    state.selectedTaskId = task.id;
    els.taskTitle.value = "";
    els.taskDue.value = "";
    els.taskIsDev.checked = false;
    logActivity(`Tarefa "${title}" criada`);
    saveAndRender();
  });

  els.searchInput.addEventListener("input", renderTasks);

  els.chips.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.dateToggle) state.dateFilterOpen = !state.dateFilterOpen;
      if (button.dataset.status) {
        state.statusFilter = button.dataset.status;
        state.priorityFilter = null;
      }
      if (button.dataset.priority) {
        state.priorityFilter = state.priorityFilter === button.dataset.priority ? null : button.dataset.priority;
        state.statusFilter = "all";
      }
      if (button.dataset.niche) {
        state.nicheFilter = state.nicheFilter === button.dataset.niche ? null : button.dataset.niche;
      }
      saveAndRender();
    });
  });

  els.filterStartDate.addEventListener("change", () => {
    state.dateRange.from = els.filterStartDate.value;
    state.dateFilterOpen = true;
    saveAndRender();
  });

  els.filterEndDate.addEventListener("change", () => {
    state.dateRange.to = els.filterEndDate.value;
    state.dateFilterOpen = true;
    saveAndRender();
  });

  els.clearDateFilter.addEventListener("click", () => {
    state.dateRange = { from: "", to: "" };
    state.dateFilterOpen = false;
    saveAndRender();
  });

  els.viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      saveAndRender();
    });
  });
}

function render() {
  renderProjects();
  renderCounts();
  renderTaskProjectOptions();
  renderHeader();
  renderControls();
  renderTasks();
  renderDetails();
  renderShell();
  renderFinance();
  queueIconRefresh();
}

function renderProjects() {
  els.projectList.innerHTML = state.projects.map((project) => {
    const count = state.tasks.filter((task) => task.projectId === project.id && !isTaskDone(task)).length;
    const active = state.activeProjectId === project.id ? "active" : "";
    return `
      <button class="project-item ${active}" type="button" data-project-id="${project.id}">
        <span class="project-dot" style="color: ${project.color}"><i data-lucide="circle"></i></span>
        <span>${escapeHtml(project.name)}</span>
        <b>${count}</b>
      </button>
    `;
  }).join("");

  els.projectList.querySelectorAll("[data-project-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeFilter = "project";
      state.activeProjectId = button.dataset.projectId;
      saveAndRender();
    });
  });
}

function renderCounts() {
  const openTasks = state.tasks.filter((task) => !isTaskDone(task));
  els.countInbox.textContent = openTasks.length;
  els.countToday.textContent = openTasks.filter(isDueToday).length;
  els.countUpcoming.textContent = openTasks.filter(isUpcoming).length;
  els.countCompleted.textContent = state.tasks.filter(isTaskDone).length;
  els.metricDone.textContent = state.tasks.filter(doneInLastSevenDays).length;
}

function renderTaskProjectOptions() {
  els.taskProject.innerHTML = state.projects
    .map((project) => `<option value="${project.id}">${escapeHtml(project.name)}</option>`)
    .join("");
  if (state.activeProjectId) els.taskProject.value = state.activeProjectId;
}

function renderHeader() {
  const activeProject = getProject(state.activeProjectId);
  const titles = {
    inbox: ["Entrada", "Suas tarefas"],
    today: ["Hoje", "Tarefas do dia"],
    upcoming: ["Proximas", "Agenda futura"],
    completed: ["Concluidas", "Historico recente"],
    project: ["Projeto", activeProject?.name || "Projeto"]
  };
  const [eyebrow, title] = titles[state.activeFilter] || titles.inbox;
  els.viewEyebrow.textContent = state.view === "dates" ? "Por data" : eyebrow;
  els.viewTitle.textContent = state.view === "dates" ? "Tarefas agrupadas" : title;
}

function renderControls() {
  els.navItems.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === state.activeFilter && !state.activeProjectId);
  });
  els.chips.forEach((button) => {
    const activeStatus = button.dataset.status && button.dataset.status === state.statusFilter;
    const activePriority = button.dataset.priority && button.dataset.priority === state.priorityFilter;
    const activeNiche = button.dataset.niche && button.dataset.niche === state.nicheFilter;
    const activeDate = button.dataset.dateToggle && hasDateFilter();
    button.classList.toggle("active", Boolean(activeStatus || activePriority || activeNiche || activeDate));
  });
  els.viewButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.view);
  });
  els.datePanel.classList.toggle("hidden", !state.dateFilterOpen);
  els.filterStartDate.value = state.dateRange.from || "";
  els.filterEndDate.value = state.dateRange.to || "";
}

function renderTasks() {
  const tasks = getFilteredTasks();
  els.emptyState.classList.toggle("hidden", tasks.length > 0);
  els.taskList.classList.toggle("hidden", state.view !== "list" || tasks.length === 0);
  els.boardView.classList.toggle("hidden", state.view !== "board" || tasks.length === 0);
  els.dateView.classList.toggle("hidden", state.view !== "dates" || tasks.length === 0);

  if (state.view === "list") {
    els.taskList.innerHTML = tasks.map(renderTaskCard).join("");
    bindTaskCards(els.taskList);
  }
  if (state.view === "board") renderBoard(tasks);
  if (state.view === "dates") renderDateGroups(tasks);
  queueIconRefresh();
}

function renderBoard(tasks) {
  const statuses = [...STANDARD_STATUSES, ...DEV_STATUSES];
  els.boardView.innerHTML = statuses.map((status) => {
    const cards = tasks.filter((task) => task.status === status.value).map(renderTaskCard).join("");
    return `<section class="board-column"><h2>${status.label}</h2>${cards || '<p class="column-empty">Sem tarefas</p>'}</section>`;
  }).join("");
  bindTaskCards(els.boardView);
}

function renderDateGroups(tasks) {
  const groups = groupTasksByDate(tasks);
  els.dateView.innerHTML = groups.map((group) => {
    const expanded = state.expandedDateGroups[group.key] !== false;
    return `
      <section class="date-group">
        <button class="date-group-header" type="button" data-date-key="${group.key}">
          <span><i data-lucide="${expanded ? "chevron-down" : "chevron-right"}"></i>${group.label}</span>
          <b>${group.tasks.length}</b>
        </button>
        <div class="date-group-body ${expanded ? "" : "hidden"}">
          ${group.tasks.map(renderTaskCard).join("")}
        </div>
      </section>
    `;
  }).join("");
  els.dateView.querySelectorAll("[data-date-key]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.dateKey;
      state.expandedDateGroups[key] = state.expandedDateGroups[key] === false;
      saveAndRender();
    });
  });
  bindTaskCards(els.dateView);
}

function renderTaskCard(task) {
  const project = getProject(task.projectId);
  const selected = task.id === state.selectedTaskId ? "selected" : "";
  const completed = isTaskDone(task) ? "completed" : "";
  const done = isTaskDone(task) ? "done" : "";
  const due = task.due ? formatDate(task.due) : "Sem prazo";
  const subtaskCount = task.subtasks.filter((subtask) => subtask.done).length;
  const labels = task.labels.map((label) => `<span class="pill">#${escapeHtml(label)}</span>`).join("");
  const links = task.links.length ? `<span class="pill"><i data-lucide="link"></i>${task.links.length}</span>` : "";

  return `
    <article class="task-card ${selected} ${completed}" data-task-id="${task.id}">
      <button class="task-check ${done}" type="button" data-action="toggle" aria-label="Concluir tarefa"><i data-lucide="check"></i></button>
      <div class="task-main">
        <div class="task-title-row">
          <strong>${escapeHtml(task.title)}</strong>
          ${task.niche === "dev" ? '<span class="pill niche-dev">Dev</span>' : ""}
          <span class="pill priority-${task.priority}">${task.priority}</span>
        </div>
        <div class="task-meta">
          <span class="pill"><i data-lucide="folder"></i>${escapeHtml(project?.name || "Sem projeto")}</span>
          <span class="pill"><i data-lucide="calendar"></i>${due}</span>
          <span class="pill"><i data-lucide="activity"></i>${getStatusLabel(task)}</span>
          <span class="pill"><i data-lucide="list-checks"></i>${subtaskCount}/${task.subtasks.length}</span>
          ${links}
          ${labels}
        </div>
      </div>
      <select class="status-select" data-action="status" aria-label="Status da tarefa">
        ${getStatusOptions(task).map((status) => `<option value="${status.value}" ${task.status === status.value ? "selected" : ""}>${status.label}</option>`).join("")}
      </select>
    </article>
  `;
}

function bindTaskCards(root) {
  root.querySelectorAll(".task-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("[data-action]")) return;
      state.selectedTaskId = card.dataset.taskId;
      saveAndRender();
    });
  });
  root.querySelectorAll("[data-action='toggle']").forEach((button) => {
    button.addEventListener("click", () => {
      const task = getTask(button.closest(".task-card").dataset.taskId);
      const doneStatus = task.niche === "dev" ? "finalizado" : "concluida";
      const openStatus = task.niche === "dev" ? "analise" : "pendente";
      updateTask(task.id, {
        status: isTaskDone(task) ? openStatus : doneStatus,
        completedAt: isTaskDone(task) ? null : new Date().toISOString()
      });
    });
  });
  root.querySelectorAll("[data-action='status']").forEach((select) => {
    select.addEventListener("change", () => {
      const task = getTask(select.closest(".task-card").dataset.taskId);
      updateTask(task.id, {
        status: select.value,
        completedAt: isDoneStatus(select.value) ? new Date().toISOString() : null
      });
    });
  });
}

function renderDetails() {
  const task = getTask(state.selectedTaskId);
  if (!task) {
    els.detailPanel.innerHTML = `<div class="detail-empty"><i data-lucide="mouse-pointer-2"></i><strong>Selecione uma tarefa</strong><span>Detalhes, subtarefas e links aparecem aqui.</span></div>`;
    queueIconRefresh();
    return;
  }

  els.detailPanel.innerHTML = `
    <form class="detail-form" id="detailForm">
      <label>Tarefa<input name="title" value="${escapeAttr(task.title)}" /></label>
      <label>Descricao<textarea name="description">${escapeHtml(task.description || "")}</textarea></label>
      <label>Projeto<select name="projectId">${state.projects.map((project) => `<option value="${project.id}" ${project.id === task.projectId ? "selected" : ""}>${escapeHtml(project.name)}</option>`).join("")}</select></label>
      <label>Prioridade<select name="priority">
        <option value="alta" ${task.priority === "alta" ? "selected" : ""}>Alta</option>
        <option value="media" ${task.priority === "media" ? "selected" : ""}>Media</option>
        <option value="baixa" ${task.priority === "baixa" ? "selected" : ""}>Baixa</option>
      </select></label>
      <label>Nicho<select name="niche">
        <option value="geral" ${task.niche !== "dev" ? "selected" : ""}>Geral</option>
        <option value="dev" ${task.niche === "dev" ? "selected" : ""}>Dev</option>
      </select></label>
      <label>Status<select name="status">${getStatusOptions(task).map((status) => `<option value="${status.value}" ${task.status === status.value ? "selected" : ""}>${status.label}</option>`).join("")}</select></label>
      <label>Prazo<input name="due" type="datetime-local" value="${task.due ? toDatetimeLocal(task.due) : ""}" /></label>
      <label>Etiquetas<input name="labels" value="${escapeAttr(task.labels.join(", "))}" placeholder="cliente, urgente" /></label>
      <div class="subtasks">
        <div class="section-title"><span>Subtarefas</span></div>
        ${task.subtasks.map((subtask) => `<div class="subtask-row ${subtask.done ? "done" : ""}" data-subtask-id="${subtask.id}"><input type="checkbox" ${subtask.done ? "checked" : ""} data-action="subtask-toggle" aria-label="Concluir subtarefa" /><span>${escapeHtml(subtask.title)}</span><button class="icon-button" type="button" data-action="subtask-delete" aria-label="Remover subtarefa"><i data-lucide="trash-2"></i></button></div>`).join("")}
        <div class="subtask-add"><input id="subtaskTitle" type="text" placeholder="Nova subtarefa" /><button class="icon-button" id="addSubtaskBtn" type="button" aria-label="Adicionar subtarefa"><i data-lucide="plus"></i></button></div>
      </div>
      <div class="links-section">
        <div class="section-title"><span>Links</span></div>
        ${task.links.map((link) => `<div class="link-row" data-link-id="${link.id}"><a href="${escapeAttr(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.title || link.url)}</a><button class="icon-button" type="button" data-action="link-delete" aria-label="Remover link"><i data-lucide="trash-2"></i></button></div>`).join("")}
        <div class="link-add"><input id="linkTitle" type="text" placeholder="Nome do link" /><input id="linkUrl" type="url" placeholder="https://..." /><button class="icon-button" id="addLinkBtn" type="button" aria-label="Adicionar link"><i data-lucide="plus"></i></button></div>
      </div>
      <button class="danger" id="deleteTaskBtn" type="button">Remover tarefa</button>
    </form>
  `;

  const form = els.detailPanel.querySelector("#detailForm");
  form.addEventListener("input", () => {
    const formData = new FormData(form);
    const nextNiche = formData.get("niche");
    const validStatus = getStatusOptions({ ...task, niche: nextNiche }).some((status) => status.value === formData.get("status"));
    updateTask(task.id, {
      title: formData.get("title").trim() || task.title,
      description: formData.get("description"),
      projectId: formData.get("projectId"),
      priority: formData.get("priority"),
      niche: nextNiche,
      status: validStatus ? formData.get("status") : nextNiche === "dev" ? "analise" : "pendente",
      due: formData.get("due") ? new Date(formData.get("due")).toISOString() : null,
      labels: formData.get("labels").split(",").map((label) => label.trim()).filter(Boolean)
    }, false);
  });

  form.querySelector("[name='niche']").addEventListener("change", () => saveAndRender());
  form.querySelector("#addSubtaskBtn").addEventListener("click", () => {
    const input = form.querySelector("#subtaskTitle");
    const title = input.value.trim();
    if (!title) return;
    task.subtasks.push({ id: createId(), title, done: false });
    input.value = "";
    logActivity(`Subtarefa adicionada em "${task.title}"`);
    saveAndRender();
  });
  form.querySelector("#addLinkBtn").addEventListener("click", () => {
    const titleInput = form.querySelector("#linkTitle");
    const urlInput = form.querySelector("#linkUrl");
    const url = normalizeUrl(urlInput.value.trim());
    if (!url) return;
    task.links.push({ id: createId(), title: titleInput.value.trim() || url, url });
    titleInput.value = "";
    urlInput.value = "";
    logActivity(`Link adicionado em "${task.title}"`);
    saveAndRender();
  });
  form.querySelector("#deleteTaskBtn").addEventListener("click", () => {
    state.tasks = state.tasks.filter((item) => item.id !== task.id);
    state.selectedTaskId = state.tasks[0]?.id || null;
    logActivity(`Tarefa "${task.title}" removida`);
    saveAndRender();
  });
  form.querySelectorAll("[data-action='subtask-toggle']").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const subtask = task.subtasks.find((item) => item.id === checkbox.closest("[data-subtask-id]").dataset.subtaskId);
      subtask.done = checkbox.checked;
      saveAndRender();
    });
  });
  form.querySelectorAll("[data-action='subtask-delete']").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.closest("[data-subtask-id]").dataset.subtaskId;
      task.subtasks = task.subtasks.filter((subtask) => subtask.id !== id);
      saveAndRender();
    });
  });
  form.querySelectorAll("[data-action='link-delete']").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.closest("[data-link-id]").dataset.linkId;
      task.links = task.links.filter((link) => link.id !== id);
      saveAndRender();
    });
  });
  queueIconRefresh();
}

function getFilteredTasks() {
  const query = els.searchInput.value.trim().toLowerCase();
  return state.tasks
    .filter(matchesQuickFilter)
    .filter((task) => state.statusFilter === "all" || matchesStatusFilter(task, state.statusFilter))
    .filter((task) => !state.priorityFilter || task.priority === state.priorityFilter)
    .filter((task) => !state.nicheFilter || task.niche === state.nicheFilter)
    .filter(matchesDateRange)
    .filter((task) => {
      if (!query) return true;
      const project = getProject(task.projectId)?.name || "";
      const linkText = task.links.map((link) => `${link.title} ${link.url}`).join(" ");
      return [task.title, task.description, project, task.labels.join(" "), linkText].join(" ").toLowerCase().includes(query);
    })
    .sort(compareTasks);
}

function matchesQuickFilter(task) {
  if (state.activeFilter === "today") return !isTaskDone(task) && isDueToday(task);
  if (state.activeFilter === "upcoming") return !isTaskDone(task) && isUpcoming(task);
  if (state.activeFilter === "completed") return isTaskDone(task);
  if (state.activeFilter === "project") return task.projectId === state.activeProjectId;
  return !isTaskDone(task);
}

function matchesStatusFilter(task, status) {
  if (status === "concluida") return isTaskDone(task);
  if (status === "andamento") return task.status === "andamento" || task.status === "em_progresso";
  if (status === "pendente") return task.status === "pendente" || task.status === "analise";
  return task.status === status;
}

function matchesDateRange(task) {
  if (!hasDateFilter()) return true;
  if (!task.due) return false;
  const value = dateOnly(task.due);
  if (state.dateRange.from && value < state.dateRange.from) return false;
  if (state.dateRange.to && value > state.dateRange.to) return false;
  return true;
}

function compareTasks(a, b) {
  const priorityWeight = { alta: 0, media: 1, baixa: 2 };
  const dueA = a.due ? new Date(a.due).getTime() : Number.MAX_SAFE_INTEGER;
  const dueB = b.due ? new Date(b.due).getTime() : Number.MAX_SAFE_INTEGER;
  return dueA - dueB || priorityWeight[a.priority] - priorityWeight[b.priority];
}

function updateTask(id, patch, rerenderDetails = true) {
  const task = getTask(id);
  Object.assign(task, patch);
  task.links = Array.isArray(task.links) ? task.links : [];
  task.subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
  if (patch.status) logActivity(`Status de "${task.title}" alterado para ${getStatusLabel(task)}`);
  saveState();
  renderProjects();
  renderCounts();
  renderControls();
  renderTasks();
  if (rerenderDetails) renderDetails();
}

async function loadRemoteState() {
  const response = await requestJson(API_STATE);
  if (!response.ok) return false;
  currentSession = response.session || null;
  state = normalizeState(response.data);
  await loadMembers();
  return true;
}

async function loadMembers() {
  const response = await requestJson(API_MEMBERS);
  tenantMembers = response.ok && Array.isArray(response.members) ? response.members : [];
}

function saveState() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(async () => {
    const response = await requestJson(API_STATE, {
      method: "PUT",
      body: JSON.stringify(state)
    });
    if (!response.ok && response.status === 401) refreshAuthState(false);
  }, 250);
}

function saveAndRender() {
  saveState();
  render();
}

async function requestJson(url, options = {}) {
  try {
    const response = await fetch(url, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, ...data };
  } catch {
    return { ok: false, message: "Nao foi possivel conectar ao servidor." };
  }
}

function normalizeState(nextState) {
  const merged = {
    ...structuredClone(seedState),
    ...nextState,
    projects: Array.isArray(nextState?.projects) ? nextState.projects : seedState.projects,
    tasks: Array.isArray(nextState?.tasks) ? nextState.tasks : seedState.tasks,
    activity: Array.isArray(nextState?.activity) ? nextState.activity : []
  };
  merged.dateRange = {
    from: nextState?.dateRange?.from || "",
    to: nextState?.dateRange?.to || ""
  };
  merged.expandedDateGroups = nextState?.expandedDateGroups || {};
  merged.tasks = merged.tasks.map(normalizeTask);
  return merged;
}

function normalizeTask(task) {
  const niche = task.niche === "dev" ? "dev" : "geral";
  let status = task.status || (niche === "dev" ? "analise" : "pendente");
  if (niche === "dev" && status === "concluida") status = "finalizado";
  if (niche !== "dev" && !STANDARD_STATUSES.some((item) => item.value === status)) status = status === "finalizado" ? "concluida" : "andamento";
  return {
    ...task,
    niche,
    status,
    priority: task.priority || "media",
    labels: Array.isArray(task.labels) ? task.labels : [],
    links: Array.isArray(task.links) ? task.links : [],
    subtasks: Array.isArray(task.subtasks) ? task.subtasks : []
  };
}

function groupTasksByDate(tasks) {
  const grouped = new Map();
  for (const task of tasks) {
    const key = task.due ? dateOnly(task.due) : "sem-data";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(task);
  }
  return Array.from(grouped.entries()).map(([key, items]) => ({
    key,
    label: key === "sem-data" ? "Sem data" : formatLongDate(key),
    tasks: items.sort(compareTasks)
  })).sort((a, b) => {
    if (a.key === "sem-data") return 1;
    if (b.key === "sem-data") return -1;
    return a.key.localeCompare(b.key);
  });
}

function getStatusOptions(task) {
  return task.niche === "dev" ? DEV_STATUSES : STANDARD_STATUSES;
}

function getStatusLabel(task) {
  return getStatusOptions(task).find((status) => status.value === task.status)?.label || task.status;
}

function isDoneStatus(status) {
  return status === "concluida" || status === "finalizado";
}

function isTaskDone(task) {
  return isDoneStatus(task.status);
}

function hasDateFilter() {
  return Boolean(state.dateRange?.from || state.dateRange?.to);
}

function logActivity(text) {
  state.activity.unshift({ id: createId(), text, at: new Date().toISOString() });
  state.activity = state.activity.slice(0, 50);
}

function getTask(id) {
  return state.tasks.find((task) => task.id === id);
}

function getProject(id) {
  return state.projects.find((project) => project.id === id);
}

function isDueToday(task) {
  return task.due && dateOnly(task.due) === dateOnly(new Date().toISOString());
}

function isUpcoming(task) {
  if (!task.due) return false;
  const due = new Date(task.due);
  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() + 7);
  return due > now && due <= end;
}

function doneInLastSevenDays(task) {
  if (!task.completedAt) return false;
  const done = new Date(task.completedAt);
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return done >= start;
}

function todayAt(hour, minute) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function addDaysAt(days, hour, minute) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function dateOnly(value) {
  const text = String(value || "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatLongDate(value) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
}

function toDatetimeLocal(value) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function normalizeUrl(value) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function queueIconRefresh() {
  requestAnimationFrame(() => {
    if (window.lucide) window.lucide.createIcons();
  });
}

function createId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  if (window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function renderShell() {
  const activeModule = state.preferences?.activeModule || "routine";
  els.moduleButtons.forEach((button) => button.classList.toggle("active", button.dataset.module === activeModule));
  els.routineSidebar.classList.toggle("hidden", activeModule !== "routine");
  els.financeSidebar.classList.toggle("hidden", activeModule !== "finance");
  els.routineWorkspace.classList.toggle("hidden", activeModule !== "routine");
  els.financeWorkspace.classList.toggle("hidden", activeModule !== "finance");
}

function normalizeFinance(finance) {
  const source = finance && typeof finance === "object" ? finance : {};
  return {
    ...structuredClone(seedFinance),
    ...source,
    activeView: source.activeView || "overview",
    activeMonth: source.activeMonth || monthKey(new Date()),
    composerOpen: source.composerOpen === true,
    editingTransactionId: source.editingTransactionId || null,
    accounts: Array.isArray(source.accounts) ? source.accounts.map(normalizeAccount) : structuredClone(seedFinance.accounts),
    cards: Array.isArray(source.cards) ? source.cards.map(normalizeCard) : [],
    categories: mergeCategories(source.categories),
    transactions: Array.isArray(source.transactions) ? source.transactions.map(normalizeTransaction) : []
  };
}

function mergeCategories(categories) {
  const byId = new Map(FINANCE_CATEGORY_SEEDS.map((category) => [category.id, normalizeCategory(category)]));
  if (Array.isArray(categories)) {
    categories.forEach((category) => {
      const normalized = normalizeCategory(category);
      const existing = byId.get(normalized.id);
      byId.set(normalized.id, {
        ...existing,
        ...normalized,
        subcategories: normalized.subcategories.length ? normalized.subcategories : existing?.subcategories || []
      });
    });
  }
  return Array.from(byId.values());
}

function renderSubcategoryOptions(categoryId, selectedId = "") {
  const subcategories = getSubcategories(categoryId);
  els.transactionSubcategory.innerHTML = `<option value="">Subcategoria</option>${subcategories.map((subcategory) => `<option value="${subcategory.id}" ${subcategory.id === selectedId ? "selected" : ""}>${escapeHtml(subcategory.name)}</option>`).join("")}`;
}

function normalizeSubcategory(subcategory) {
  if (typeof subcategory === "string") {
    return { id: slugifySubcategory(subcategory), name: subcategory, active: true };
  }
  const name = subcategory?.name || "Subcategoria";
  return {
    id: subcategory?.id || slugifySubcategory(name),
    name,
    active: subcategory?.active !== false
  };
}

function slugifySubcategory(value) {
  return `fsc-${normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || createId()}`;
}

function getSubcategories(categoryId) {
  const category = getCategory(categoryId);
  return Array.isArray(category?.subcategories) ? category.subcategories.filter((subcategory) => subcategory.active !== false) : [];
}

function getSubcategoryName(transaction) {
  return getSubcategories(transaction.categoryId).find((subcategory) => subcategory.id === transaction.subcategoryId)?.name || "";
}

function parseSubcategoryList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map(normalizeSubcategory);
}

function normalizeAccount(account) {
  return {
    id: account.id || createId(),
    name: account.name || "Conta",
    type: account.type || "Outros",
    initialBalance: Number(account.initialBalance || account.balance || 0),
    active: account.active !== false,
    createdAt: account.createdAt || new Date().toISOString()
  };
}

function normalizeCard(card) {
  return {
    id: card.id || createId(),
    name: card.name || "Cartao",
    limit: Number(card.limit || 0),
    closingDay: Number(card.closingDay || 1),
    dueDay: Number(card.dueDay || 10),
    accountId: card.accountId || "",
    active: card.active !== false,
    createdAt: card.createdAt || new Date().toISOString()
  };
}

function normalizeCategory(category) {
  return {
    id: category.id || createId(),
    name: category.name || "Categoria",
    type: ["receita", "despesa", "ambos"].includes(category.type) ? category.type : "ambos",
    active: category.active !== false,
    subcategories: Array.isArray(category.subcategories) ? category.subcategories.map(normalizeSubcategory) : []
  };
}

function normalizeTransaction(transaction) {
  const rawDate = dateOnly(transaction.date || transaction.data || new Date().toISOString());
  const baseDueDate = dateOnly(transaction.dueDate || transaction.vencimento || rawDate);
  const status = transaction.status === "pago" ? "pago" : "pendente";
  const baseDate = status === "pago" ? rawDate : baseDueDate;
  const repeat = ["single", "fixed", "installment", "interval"].includes(transaction.repeat) ? transaction.repeat : "single";
  const paidAt = status === "pago" ? dateOnly(transaction.paidAt || baseDate) : null;

  return {
    id: transaction.id || createId(),
    description: transaction.description || transaction.descricao || "Lancamento",
    type: transaction.type === "receita" ? "receita" : "despesa",
    amount: Number(transaction.amount || transaction.value || transaction.valor || 0),
    categoryId: transaction.categoryId || "",
    subcategoryId: transaction.subcategoryId || transaction.subcategory || "",
    accountId: transaction.accountId || "",
    cardId: transaction.cardId || "",
    date: baseDate,
    dueDate: baseDueDate,
    competenceMonth: transaction.competenceMonth || monthKey(baseDueDate),
    status,
    repeat,
    seriesId: transaction.seriesId || null,
    installmentNumber: Number(transaction.installmentNumber || 1),
    installmentTotal: Number(transaction.installmentTotal || 1),
    intervalDays: Number(transaction.intervalDays || 0),
    note: transaction.note || transaction.observacao || "",
    createdAt: transaction.createdAt || new Date().toISOString(),
    updatedAt: transaction.updatedAt || transaction.createdAt || new Date().toISOString(),
    paidAt
  };
}

function renderFinance() {
  if (!els.financeWorkspace || state.preferences?.activeModule !== "finance") return;
  renderFinanceNav();
  renderTransactionOptions();
  const view = state.finance.activeView || "overview";
  els.financeTitle.textContent = getFinanceViewTitle(view);
  els.financeComposer.classList.toggle("hidden", !state.finance.composerOpen);
  const submitButton = els.transactionForm?.querySelector("button[type='submit']");
  if (submitButton) submitButton.innerHTML = state.finance.editingTransactionId ? '<i data-lucide="save"></i>Salvar alteracoes' : '<i data-lucide="send"></i>Adicionar';
  if (view === "overview") renderFinanceOverview();
  if (view === "summary") renderFinanceSummary();
  if (view === "transactions") renderTransactions();
  if (view === "accounts") renderAccounts();
  if (view === "cards") renderCards();
  if (view === "categories") renderCategories();
  queueIconRefresh();
}

function renderFinanceNav() {
  els.financeNavItems.forEach((button) => button.classList.toggle("active", button.dataset.financeView === state.finance.activeView));
  els.countTransactions.textContent = state.finance.transactions.length;
  els.countAccounts.textContent = state.finance.accounts.filter((account) => account.active).length;
  els.countCards.textContent = state.finance.cards.filter((card) => card.active).length;
  els.countCategories.textContent = state.finance.categories.filter((category) => category.active).length;
}

function getFinanceViewTitle(view) {
  return { overview: "Visao geral", summary: "Resumo", transactions: "Lancamentos", accounts: "Contas", cards: "Cartoes", categories: "Categorias" }[view] || "Minhas Financas";
}

function renderTransactionOptions() {
  const categories = state.finance.categories.filter((category) => category.active);
  els.transactionCategory.innerHTML = categories.map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`).join("");
  renderSubcategoryOptions(els.transactionCategory.value, els.transactionSubcategory.value);
  els.transactionAccount.innerHTML = `<option value="">Conta</option>${state.finance.accounts.filter((account) => account.active).map((account) => `<option value="${account.id}">${escapeHtml(account.name)}</option>`).join("")}`;
  els.transactionCard.innerHTML = `<option value="">Cartao</option>${state.finance.cards.filter((card) => card.active).map((card) => `<option value="${card.id}">${escapeHtml(card.name)}</option>`).join("")}`;
  setDefaultTransactionDates(false);
  updateTransactionFieldVisibility();
}

function renderFinanceOverview() {
  const summary = getFinanceSummary();
  els.financeContent.innerHTML = `
    ${renderMonthControls(summary)}
    ${renderExpensePie(summary)}
    <section class="finance-kpis">
      <div class="finance-kpi"><span>Saldo atual</span><strong>${formatCurrency(summary.balance)}</strong></div>
      <div class="finance-kpi"><span>Receitas previstas</span><strong>${formatCurrency(summary.income)}</strong></div>
      <div class="finance-kpi"><span>Despesas previstas</span><strong>${formatCurrency(summary.expenses)}</strong></div>
      <div class="finance-kpi"><span>Resultado previsto</span><strong class="${summary.result >= 0 ? "positive" : "negative"}">${formatCurrency(summary.result)}</strong></div>
      <div class="finance-kpi"><span>Saldo previsto acumulado</span><strong class="${summary.projectedBalance >= 0 ? "positive" : "negative"}">${formatCurrency(summary.projectedBalance)}</strong></div>
      <div class="finance-kpi"><span>Recebido no mes</span><strong>${formatCurrency(summary.paidIncome)}</strong></div>
      <div class="finance-kpi"><span>Pago no mes</span><strong>${formatCurrency(summary.paidExpenses)}</strong></div>
      <div class="finance-kpi"><span>Aberto no mes</span><strong>${formatCurrency(Math.max(0, summary.expenses - summary.paidExpenses))}</strong></div>
      <div class="finance-kpi"><span>Lancamentos</span><strong>${summary.monthTransactions.length}</strong></div>
    </section>
    <section class="finance-block"><h2>Lancamentos de ${formatMonthLabel(summary.selectedMonth)}</h2>${renderTransactionRows(summary.monthTransactions)}</section>
    ${renderFamilyPanel()}`;
  bindFinanceActions();
}

function renderFinanceSummary() {
  const summary = getFinanceSummary();
  els.financeContent.innerHTML = `
    ${renderMonthControls(summary)}
    <section class="finance-two-col">
      <div class="finance-block"><h2>Proximos pagamentos</h2>${renderTransactionRows(summary.upcoming)}</div>
      <div class="finance-block"><h2>Ultimos lancamentos</h2>${renderTransactionRows(summary.latest)}</div>
    </section>
    ${renderFamilyPanel()}`;
  bindFinanceActions();
}

function renderExpensePie(summary) {
  const colors = ["#27865f", "#2f6f87", "#86a64b", "#d18b35", "#b23b32", "#6f8f3f", "#596f62", "#8a6f3f"];
  const total = summary.expenseByCategory.reduce((sum, item) => sum + item.amount, 0);
  if (total <= 0) {
    return `
      <section class="finance-block expense-dashboard">
        <h2>Dashboard de despesas</h2>
        <div class="expense-pie-wrap">
          <div class="expense-pie empty"><span>R$ 0,00</span></div>
          <p class="empty-copy">Nenhuma despesa lancada neste mes.</p>
        </div>
      </section>`;
  }

  let cursor = 0;
  const gradient = summary.expenseByCategory.map((item, index) => {
    const start = cursor;
    cursor += (item.amount / total) * 100;
    return `${colors[index % colors.length]} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
  }).join(", ");

  const legend = summary.expenseByCategory.map((item, index) => {
    const percentage = ((item.amount / total) * 100).toFixed(1).replace(".", ",");
    return `<div class="pie-legend-row"><i style="background:${colors[index % colors.length]}"></i><span>${escapeHtml(item.name)}</span><strong>${formatCurrency(item.amount)}</strong><small>${percentage}%</small></div>`;
  }).join("");

  return `
    <section class="finance-block expense-dashboard">
      <h2>Dashboard de despesas</h2>
      <div class="expense-pie-wrap">
        <div class="expense-pie" style="--pie:${gradient}"><span>${formatCurrency(total)}</span></div>
        <div class="pie-legend">${legend}</div>
      </div>
    </section>`;
}
function renderMonthControls(summary) {
  return `
    <section class="month-toolbar">
      <button class="icon-button" type="button" data-finance-action="month-prev" aria-label="Mes anterior"><i data-lucide="chevron-left"></i></button>
      <div><span>Competencia</span><strong>${formatMonthLabel(summary.selectedMonth)}</strong></div>
      <button class="icon-button" type="button" data-finance-action="month-next" aria-label="Proximo mes"><i data-lucide="chevron-right"></i></button>
      <input type="month" value="${summary.selectedMonth}" data-finance-action="month-pick" aria-label="Escolher mes" />
      <button class="secondary-action" type="button" data-finance-action="month-current"><i data-lucide="calendar-days"></i>Mes atual</button>
    </section>`;
}

function renderFamilyPanel() {
  const members = tenantMembers.map((member) => `
    <div class="finance-row">
      <div><strong>${escapeHtml(member.name)}</strong><span>${escapeHtml(member.email)} - ${member.role === "owner" ? "Dono" : "Membro"}</span></div>
    </div>`).join("") || `<p class="empty-copy">Nenhum membro carregado.</p>`;
  const inviteForm = currentSession?.role === "owner" ? `
    <form class="mini-form family-invite-form" id="inviteMemberForm">
      <input name="email" type="email" placeholder="Email do familiar" required />
      <button type="submit"><i data-lucide="user-plus"></i>Gerar convite</button>
    </form>
    <p class="invite-result" id="inviteResult"></p>` : "";
  return `
    <section class="finance-block family-panel">
      <h2>Familia ${currentSession?.tenantName ? `- ${escapeHtml(currentSession.tenantName)}` : ""}</h2>
      ${inviteForm}
      <div class="finance-list">${members}</div>
    </section>`;
}

function renderTransactions() {
  const summary = getFinanceSummary();
  els.financeContent.innerHTML = `${renderMonthControls(summary)}<section class="finance-block"><h2>Lancamentos</h2>${renderTransactionRows(getFilteredTransactions())}</section>`;
  bindFinanceActions();
}

function renderAccounts() {
  els.financeContent.innerHTML = `
    <section class="finance-block">
      <h2>Contas</h2>
      <form class="mini-form" id="accountForm">
        <input name="name" placeholder="Nome da conta" required />
        <select name="type"><option>Conta corrente</option><option>Poupanca</option><option>Dinheiro</option><option>Carteira digital</option><option>Outros</option></select>
        <input name="initialBalance" type="number" step="0.01" placeholder="Saldo inicial" />
        <button type="submit"><i data-lucide="plus"></i>Adicionar</button>
      </form>
      ${state.finance.accounts.map((account) => `<div class="finance-row"><div><strong>${escapeHtml(account.name)}</strong><span>${escapeHtml(account.type)} - ${formatCurrency(account.initialBalance)}</span></div><button class="icon-button" data-finance-action="toggle-account" data-id="${account.id}"><i data-lucide="${account.active ? "eye" : "eye-off"}"></i></button></div>`).join("")}
    </section>`;
  document.querySelector("#accountForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    createAccount({ name: data.get("name"), type: data.get("type"), initialBalance: data.get("initialBalance") });
    saveAndRender();
  });
  bindFinanceActions();
}

function renderCards() {
  els.financeContent.innerHTML = `
    <section class="finance-block">
      <h2>Cartoes</h2>
      <form class="mini-form" id="cardForm">
        <input name="name" placeholder="Nome do cartao" required />
        <input name="limit" type="number" step="0.01" placeholder="Limite" />
        <input name="closingDay" type="number" min="1" max="31" placeholder="Fechamento" />
        <input name="dueDay" type="number" min="1" max="31" placeholder="Vencimento" />
        <select name="accountId"><option value="">Conta relacionada</option>${state.finance.accounts.map((account) => `<option value="${account.id}">${escapeHtml(account.name)}</option>`).join("")}</select>
        <button type="submit"><i data-lucide="plus"></i>Adicionar</button>
      </form>
      ${state.finance.cards.map((card) => `<div class="finance-row"><div><strong>${escapeHtml(card.name)}</strong><span>Limite ${formatCurrency(card.limit)} - fecha dia ${card.closingDay}, vence dia ${card.dueDay}</span></div><button class="icon-button" data-finance-action="toggle-card" data-id="${card.id}"><i data-lucide="${card.active ? "eye" : "eye-off"}"></i></button></div>`).join("")}
    </section>`;
  document.querySelector("#cardForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    createCard({ name: data.get("name"), limit: data.get("limit"), closingDay: data.get("closingDay"), dueDay: data.get("dueDay"), accountId: data.get("accountId") });
    saveAndRender();
  });
  bindFinanceActions();
}

function renderCategories() {
  els.financeContent.innerHTML = `
    <section class="finance-block">
      <h2>Categorias</h2>
      <form class="mini-form" id="categoryForm">
        <input name="name" placeholder="Nome da categoria" required />
        <select name="type"><option value="despesa">Despesa</option><option value="receita">Receita</option><option value="ambos">Ambos</option></select>
        <input name="subcategories" placeholder="Subcategorias: Luz, Agua, Condominio" />
        <button type="submit"><i data-lucide="plus"></i>Adicionar categoria</button>
      </form>
      <div class="category-list">${state.finance.categories.map(renderCategoryRow).join("")}</div>
    </section>`;
  document.querySelector("#categoryForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    createCategory({ name: data.get("name"), type: data.get("type"), subcategories: parseSubcategoryList(data.get("subcategories")) });
    saveAndRender();
  });
  document.querySelectorAll(".subcategory-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      addSubcategoriesToCategory(event.currentTarget.dataset.categoryId, data.get("name"));
      saveAndRender();
    });
  });
  bindFinanceActions();
}

function renderCategoryRow(category) {
  const subcategories = getSubcategories(category.id);
  const chips = subcategories.length
    ? subcategories.map((subcategory) => `
      <span class="subcategory-chip">
        ${escapeHtml(subcategory.name)}
        <button type="button" data-finance-action="remove-subcategory" data-id="${category.id}" data-subcategory-id="${subcategory.id}" aria-label="Remover subcategoria ${escapeHtml(subcategory.name)}"><i data-lucide="x"></i></button>
      </span>`).join("")
    : `<span class="empty-copy">Nenhuma subcategoria vinculada.</span>`;
  return `
    <div class="category-row">
      <div class="category-row-header">
        <div>
          <strong>${escapeHtml(category.name)}</strong>
          <span>${escapeHtml(category.type)}</span>
        </div>
        <button class="icon-button" type="button" data-finance-action="toggle-category" data-id="${category.id}" aria-label="${category.active ? "Ocultar" : "Mostrar"} categoria"><i data-lucide="${category.active ? "eye" : "eye-off"}"></i></button>
      </div>
      <div class="subcategory-area">
        <div class="subcategory-list">${chips}</div>
        <form class="subcategory-form" data-category-id="${category.id}">
          <input name="name" placeholder="Nova subcategoria" required />
          <button type="submit"><i data-lucide="plus"></i>Vincular</button>
        </form>
      </div>
    </div>`;
}

function openTransactionComposer() {
  state.preferences.activeModule = "finance";
  state.finance.composerOpen = true;
  state.finance.editingTransactionId = null;
  resetTransactionForm();
  saveAndRender();
  els.transactionDescription.focus();
}

async function handleReceiptImport() {
  const file = els.receiptFileInput.files?.[0];
  if (!file) return;
  openTransactionComposer();
  setTransactionAssistMessage(`Lendo ${file.name}...`);

  const text = await extractReceiptText(file);
  const parsed = parseTransactionText(text || file.name);
  applyParsedTransaction(parsed, {
    fallbackDescription: file.name.replace(/\.[^.]+$/, ""),
    notePrefix: `Importado do comprovante: ${file.name}`
  });

  if (text) {
    setTransactionAssistMessage("Comprovante lido. Confira os campos antes de adicionar.");
  } else {
    setTransactionAssistMessage("Arquivo anexado ao formulario. Para PDF escaneado ou imagem, confira e complete os campos manualmente.");
  }
  els.receiptFileInput.value = "";
}

async function extractReceiptText(file) {
  if (file.type.startsWith("image/")) return "";
  try {
    const buffer = await file.arrayBuffer();
    const text = new TextDecoder("latin1").decode(buffer);
    return text.replace(/[\x00-\x08\x0E-\x1F]+/g, " ");
  } catch (error) {
    return "";
  }
}

function startVoiceTransaction() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setTransactionAssistMessage("Este navegador nao tem reconhecimento de voz. Use Chrome ou Edge atualizado.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  setTransactionAssistMessage("Ouvindo... fale algo como: despesa mercado 120 reais pago hoje.");
  recognition.start();

  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript || "";
    const parsed = parseTransactionText(transcript);
    applyParsedTransaction(parsed, { fallbackDescription: transcript, notePrefix: `Lancado por voz: ${transcript}` });
    setTransactionAssistMessage("Voz reconhecida. Confira os campos antes de adicionar.");
  };
  recognition.onerror = () => setTransactionAssistMessage("Nao consegui ouvir com clareza. Tente novamente falando descricao, valor e se esta pago.");
}

function parseTransactionText(text) {
  const raw = String(text || "");
  const normalized = normalizeText(raw);
  const amountMatch = raw.match(/(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+(?:[,.]\d{1,2})?)/i);
  const amount = amountMatch ? parseMoney(amountMatch[1]) : "";
  const type = /\b(receita|recebimento|recebi|entrada|salario|pix recebido)\b/.test(normalized) ? "receita" : "despesa";
  const status = /\b(pago|paguei|quitado|baixado|recebi|recebido)\b/.test(normalized) ? "pago" : "pendente";
  const date = /\b(hoje|agora)\b/.test(normalized) ? dateOnly(new Date().toISOString()) : "";
  const description = raw
    .replace(amountMatch?.[0] || "", "")
    .replace(/\b(despesa|receita|pagamento|paguei|pago|recebi|recebido|pix|reais|real|hoje|agora)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return { description, amount, type, status, date };
}

function parseMoney(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text;
  const number = Number(normalized);
  return Number.isFinite(number) ? number.toFixed(2) : "";
}

function applyParsedTransaction(parsed, options = {}) {
  const today = dateOnly(new Date().toISOString());
  const description = parsed.description || options.fallbackDescription || "Lancamento importado";
  els.transactionDescription.value = description;
  if (parsed.amount) els.transactionAmount.value = parsed.amount;
  els.transactionType.checked = parsed.type !== "receita";
  els.transactionStatus.value = parsed.status || "pendente";
  if (parsed.date) els.transactionDate.value = parsed.date;
  if (!els.transactionDueDate.value) els.transactionDueDate.value = parsed.date || today;
  if (!els.transactionCompetence.value) els.transactionCompetence.value = monthKey(els.transactionDueDate.value || today);
  const existingNote = els.transactionNote.value.trim();
  els.transactionNote.value = [options.notePrefix, existingNote].filter(Boolean).join(" | ");
}

function setTransactionAssistMessage(message) {
  if (els.transactionAssistMessage) els.transactionAssistMessage.textContent = message || "";
}
function collectTransactionForm() {
  return {
    description: els.transactionDescription.value,
    type: els.transactionType.checked ? "despesa" : "receita",
    amount: els.transactionAmount.value,
    categoryId: els.transactionCategory.value,
    subcategoryId: els.transactionSubcategory.value,
    accountId: els.transactionAccount.value,
    cardId: els.transactionCard.value,
    competenceMonth: els.transactionCompetence.value,
    date: els.transactionDate.value,
    dueDate: els.transactionDueDate.value,
    status: els.transactionStatus.value,
    repeat: els.transactionRepeat.value,
    installmentStart: els.transactionInstallmentStart.value,
    installments: els.transactionInstallments.value,
    intervalDays: els.transactionIntervalDays.value,
    note: els.transactionNote.value
  };
}

function createFinancialTransaction(input) {
  const repeat = ["fixed", "installment", "interval"].includes(input.repeat) ? input.repeat : "single";
  const totalInstallments = Math.max(1, Math.min(480, Number(input.installments || 1)));
  const installmentStart = repeat === "installment" ? Math.max(1, Math.min(totalInstallments, Number(input.installmentStart || 1))) : 1;
  const intervalDays = repeat === "interval" ? Math.max(1, Math.min(365, Number(input.intervalDays || 15))) : 0;
  const total = repeat === "fixed" || repeat === "interval" ? 24 : repeat === "installment" ? totalInstallments - installmentStart + 1 : 1;
  const seriesId = repeat === "single" ? null : createId();
  const baseCompetence = input.competenceMonth || monthKey(input.dueDate || input.date || new Date());
  const baseDueDate = input.dueDate || firstDayOfMonth(baseCompetence);
  const baseDescription = String(input.description || "").trim();
  const created = [];

  for (let index = 0; index < total; index += 1) {
    const installmentNumber = repeat === "installment" ? installmentStart + index : 1;
    const dueDate = repeat === "interval" ? addDaysToDate(baseDueDate, index * intervalDays) : addMonthsToDate(baseDueDate, index);
    const competenceMonth = repeat === "interval" ? monthKey(dueDate) : addMonths(baseCompetence, index);
    const label = repeat === "installment" ? ` ${installmentNumber}/${totalInstallments}` : "";
    const isFirst = index === 0;
    const status = isFirst ? input.status : "pendente";
    const transaction = normalizeTransaction({
      id: createId(),
      description: `${baseDescription}${label}`,
      type: input.type,
      amount: input.amount,
      categoryId: input.categoryId,
      subcategoryId: input.subcategoryId,
      accountId: input.accountId,
      cardId: input.cardId,
      competenceMonth,
      date: status === "pago" ? (input.date || dueDate) : dueDate,
      dueDate,
      status,
      repeat,
      seriesId,
      installmentNumber,
      installmentTotal: repeat === "installment" ? totalInstallments : 1,
      intervalDays,
      note: input.note,
      paidAt: status === "pago" ? (input.date || dateOnly(new Date().toISOString())) : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    if (transaction.description && transaction.amount > 0) created.push(transaction);
  }

  state.finance.transactions.unshift(...created);
  return created[0] || null;
}

function updateFinancialTransaction(id, input, applyForward = false) {
  const transaction = state.finance.transactions.find((item) => item.id === id);
  if (!transaction) return null;
  const next = normalizeTransaction({
    ...transaction,
    description: String(input.description || "").trim(),
    type: input.type,
    amount: input.amount,
    categoryId: input.categoryId,
    subcategoryId: input.subcategoryId,
    accountId: input.accountId,
    cardId: input.cardId,
    competenceMonth: input.competenceMonth || monthKey(input.dueDate || input.date || transaction.competenceMonth),
    date: input.status === "pago" ? (input.date || input.dueDate || transaction.date) : (input.dueDate || input.date || transaction.dueDate),
    dueDate: input.dueDate || input.date || transaction.dueDate,
    status: input.status,
    repeat: input.repeat || transaction.repeat || "single",
    installmentNumber: Number(input.installmentStart || transaction.installmentNumber || 1),
    installmentTotal: Number(input.installments || transaction.installmentTotal || 1),
    intervalDays: Number(input.intervalDays || transaction.intervalDays || 0),
    note: input.note,
    paidAt: input.status === "pago" ? (input.date || transaction.paidAt || dateOnly(new Date().toISOString())) : null,
    updatedAt: new Date().toISOString()
  });
  Object.assign(transaction, next);
  if (applyForward && transaction.seriesId) {
    const future = state.finance.transactions
      .filter((item) => item.seriesId === transaction.seriesId && item.id !== transaction.id && item.dueDate > transaction.dueDate)
      .sort(compareTransactions);
    future.forEach((item, index) => {
      const dueDate = transaction.repeat === "interval"
        ? addDaysToDate(transaction.dueDate, (index + 1) * Math.max(1, transaction.intervalDays || 15))
        : addMonthsToDate(transaction.dueDate, index + 1);
      Object.assign(item, normalizeTransaction({
        ...item,
        description: transaction.description.replace(/\s+\d+\/\d+$/, "") + (transaction.repeat === "installment" ? ` ${item.installmentNumber}/${transaction.installmentTotal}` : ""),
        type: transaction.type,
        amount: transaction.amount,
        categoryId: transaction.categoryId,
        subcategoryId: transaction.subcategoryId,
        accountId: transaction.accountId,
        cardId: transaction.cardId,
        competenceMonth: transaction.repeat === "interval" ? monthKey(dueDate) : addMonths(transaction.competenceMonth, index + 1),
        date: item.status === "pago" ? item.date : dueDate,
        dueDate,
        repeat: transaction.repeat,
        installmentTotal: transaction.installmentTotal,
        intervalDays: transaction.intervalDays,
        note: transaction.note,
        updatedAt: new Date().toISOString()
      }));
    });
  }
  return transaction;
}

function resetTransactionForm() {
  els.transactionForm.reset();
  els.transactionType.checked = true;
  els.transactionInstallmentStart.value = "1";
  els.transactionInstallments.value = "1";
  els.transactionIntervalDays.value = "15";
  els.transactionRepeat.value = "single";
  state.finance.editingTransactionId = null;
  setDefaultTransactionDates(true);
  updateTransactionFieldVisibility();
}

function fillTransactionForm(transaction) {
  els.transactionDescription.value = transaction.description;
  els.transactionType.checked = transaction.type !== "receita";
  els.transactionAmount.value = transaction.amount;
  els.transactionCategory.value = transaction.categoryId;
  renderSubcategoryOptions(transaction.categoryId, transaction.subcategoryId);
  els.transactionAccount.value = transaction.accountId;
  els.transactionCard.value = transaction.cardId;
  els.transactionCompetence.value = transaction.competenceMonth || monthKey(transaction.dueDate || transaction.date);
  els.transactionDate.value = transaction.paidAt || transaction.date || dateOnly(new Date().toISOString());
  els.transactionDueDate.value = transaction.dueDate || dateOnly(new Date().toISOString());
  els.transactionStatus.value = transaction.status;
  els.transactionRepeat.value = transaction.repeat || "single";
  els.transactionInstallmentStart.value = transaction.installmentNumber || "1";
  els.transactionInstallments.value = transaction.installmentTotal || "1";
  els.transactionIntervalDays.value = transaction.intervalDays || "15";
  els.transactionNote.value = transaction.note || "";
  updateTransactionFieldVisibility();
}

function updateTransactionFieldVisibility() {
  const repeat = els.transactionRepeat.value;
  const showRepeatFields = repeat === "installment" || repeat === "interval";
  document.querySelectorAll("[data-repeat-field]").forEach((field) => {
    field.classList.toggle("hidden", !showRepeatFields);
  });

  document.querySelectorAll("[data-interval-field]").forEach((field) => field.classList.toggle("hidden", repeat !== "interval"));

  const dateField = document.querySelector("#transactionDateField");
  const isPaid = els.transactionStatus.value === "pago";
  if (dateField) dateField.classList.toggle("hidden", !isPaid);
  if (!isPaid) {
    els.transactionDate.value = els.transactionDueDate.value || dateOnly(new Date().toISOString());
  }
}

function applyTransactionSuggestion() {
  const term = normalizeText(els.transactionDescription.value).trim();
  const suggestion = term.includes("uber")
    ? { categoryId: "fc-transporte", subcategory: "uber", subcategoryName: "Uber" }
    : ["posto", "gasolina", "combustivel"].some((word) => term.includes(word))
      ? { categoryId: "fc-transporte", subcategory: "posto", subcategoryName: "Posto" }
      : term.includes("ifood")
        ? { categoryId: "fc-alimentacao", subcategory: "ifood", subcategoryName: "Ifood" }
        : ["supermercado", "supermercador", "mercado", " bh ", "bh"].some((word) => term.includes(word))
          ? { categoryId: "fc-moradia", subcategory: "supermercado", subcategoryName: "Supermercado" }
          : null;
  if (!suggestion) return;
  els.transactionCategory.value = suggestion.categoryId;
  const category = getCategory(suggestion.categoryId);
  if (category && !getSubcategories(suggestion.categoryId).some((item) => normalizeText(item.name) === suggestion.subcategory)) {
    category.subcategories = [...getSubcategories(suggestion.categoryId), normalizeSubcategory(suggestion.subcategoryName)];
  }
  renderSubcategoryOptions(suggestion.categoryId, "");
  const option = Array.from(els.transactionSubcategory.options).find((item) => normalizeText(item.textContent) === suggestion.subcategory);
  if (option) els.transactionSubcategory.value = option.value;
}
function createAccount(input) {
  const account = normalizeAccount({ id: createId(), ...input, createdAt: new Date().toISOString() });
  state.finance.accounts.push(account);
  return account;
}

function createCard(input) {
  const card = normalizeCard({ id: createId(), ...input, createdAt: new Date().toISOString() });
  state.finance.cards.push(card);
  return card;
}

function createCategory(input) {
  const category = normalizeCategory({ id: createId(), ...input });
  state.finance.categories.push(category);
  return category;
}

function addSubcategoriesToCategory(categoryId, value) {
  const category = state.finance.categories.find((item) => item.id === categoryId);
  if (!category) return;
  const existingNames = new Set(getSubcategories(category.id).map((subcategory) => normalizeText(subcategory.name)));
  const additions = parseSubcategoryList(value).filter((subcategory) => !existingNames.has(normalizeText(subcategory.name)));
  category.subcategories = [...getSubcategories(category.id), ...additions];
}

function removeSubcategoryFromCategory(categoryId, subcategoryId) {
  const category = state.finance.categories.find((item) => item.id === categoryId);
  if (!category) return;
  category.subcategories = getSubcategories(category.id).filter((subcategory) => subcategory.id !== subcategoryId);
}

function getFinanceSummary() {
  const selectedMonth = state.finance.activeMonth || monthKey(new Date());
  const today = dateOnly(new Date().toISOString());
  const transactions = state.finance.transactions.map(normalizeTransaction);
  const monthTransactions = transactions.filter((transaction) => transaction.competenceMonth === selectedMonth).sort(compareTransactions);
  const paidUntilToday = transactions.filter((transaction) => transaction.status === "pago" && (transaction.paidAt || transaction.date) <= today);
  const paidInMonth = monthTransactions.filter((transaction) => transaction.status === "pago");
  const projectedUntilMonth = transactions.filter((transaction) => (transaction.competenceMonth || monthKey(transaction.dueDate || transaction.date)) <= selectedMonth);
  const projectedIncome = projectedUntilMonth.filter((transaction) => transaction.type === "receita").reduce((sum, transaction) => sum + transaction.amount, 0);
  const projectedExpenses = projectedUntilMonth.filter((transaction) => transaction.type === "despesa").reduce((sum, transaction) => sum + transaction.amount, 0);
  const upcoming = transactions
    .filter((transaction) => transaction.status !== "pago" && transaction.dueDate >= today)
    .sort(compareTransactions)
    .slice(0, 6);
  const latest = [...transactions]
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 6);
  const baseBalance = state.finance.accounts.filter((account) => account.active).reduce((sum, account) => sum + Number(account.initialBalance || 0), 0);
  const paidIncomeAll = paidUntilToday.filter((transaction) => transaction.type === "receita").reduce((sum, transaction) => sum + transaction.amount, 0);
  const paidExpensesAll = paidUntilToday.filter((transaction) => transaction.type === "despesa").reduce((sum, transaction) => sum + transaction.amount, 0);
  const income = monthTransactions.filter((transaction) => transaction.type === "receita").reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = monthTransactions.filter((transaction) => transaction.type === "despesa").reduce((sum, transaction) => sum + transaction.amount, 0);
  const paidIncome = paidInMonth.filter((transaction) => transaction.type === "receita").reduce((sum, transaction) => sum + transaction.amount, 0);
  const paidExpenses = paidInMonth.filter((transaction) => transaction.type === "despesa").reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenseByCategory = getExpenseBreakdown(monthTransactions);

  return {
    selectedMonth,
    monthTransactions,
    upcoming,
    latest,
    balance: baseBalance + paidIncomeAll - paidExpensesAll,
    projectedBalance: baseBalance + projectedIncome - projectedExpenses,
    income,
    expenses,
    result: income - expenses,
    paidIncome,
    paidExpenses,
    expenseByCategory
  };
}

function getExpenseBreakdown(transactions) {
  const grouped = new Map();
  transactions.filter((transaction) => transaction.type === "despesa").forEach((transaction) => {
    const subcategoryName = getSubcategoryName(transaction);
    const name = subcategoryName ? `${getCategory(transaction.categoryId)?.name || "Sem categoria"} / ${subcategoryName}` : getCategory(transaction.categoryId)?.name || "Sem categoria";
    grouped.set(name, (grouped.get(name) || 0) + transaction.amount);
  });
  return Array.from(grouped, ([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
}
function getFilteredTransactions() {
  const term = normalizeText(els.financeSearchInput.value);
  const selectedMonth = state.finance.activeMonth || monthKey(new Date());
  return state.finance.transactions
    .map(normalizeTransaction)
    .filter((transaction) => transaction.competenceMonth === selectedMonth)
    .filter((transaction) => !term || normalizeText(`${transaction.description} ${transaction.note} ${getCategory(transaction.categoryId)?.name || ""} ${getSubcategoryName(transaction)}`).includes(term))
    .sort(compareTransactions);
}

function renderTransactionRows(transactions) {
  if (!transactions.length) return `<p class="empty-copy">Nenhum lancamento.</p>`;
  const selectedIds = new Set(state.finance.selectedTransactionIds || []);
  const isTransactionsView = state.finance.activeView === "transactions";
  const bulkBar = isTransactionsView ? `
    <div class="transaction-bulkbar">
      <label><input type="checkbox" data-transaction-select-all /> Selecionar todos</label>
      <span>${selectedIds.size ? `${selectedIds.size} selecionado(s)` : "Selecione lancamentos para agir em grupo"}</span>
      <button class="secondary-action" type="button" data-finance-action="bulk-delete-transaction" ${selectedIds.size ? "" : "disabled"}><i data-lucide="trash-2"></i>Excluir selecionados</button>
    </div>` : "";
  return `${bulkBar}<div class="finance-list">${transactions.map((item) => {
    const category = getCategory(item.categoryId);
    const repeatLabel = item.repeat === "installment" ? `Parcela ${item.installmentNumber}/${item.installmentTotal}` : item.repeat === "fixed" ? "Fixo mensal" : item.repeat === "interval" ? `A cada ${item.intervalDays || 15} dias` : "Unico";
    const subcategoryName = getSubcategoryName(item);
    const categoryLabel = subcategoryName ? `${category?.name || "Sem categoria"} / ${subcategoryName}` : category?.name || "Sem categoria";
    const dateLabel = item.status === "pago" ? `Pago em ${formatDisplayDate(item.paidAt || item.date)}` : `Vence em ${formatDisplayDate(item.dueDate)}`;
    return `
      <div class="finance-row ${selectedIds.has(item.id) ? "selected" : ""}">
        <label class="transaction-select"><input type="checkbox" data-transaction-select="${item.id}" ${selectedIds.has(item.id) ? "checked" : ""} aria-label="Selecionar ${escapeAttr(item.description)}" /></label>
        <div>
          <strong>${escapeHtml(item.description)}</strong>
          <span>${formatDisplayDate(item.dueDate)} - ${escapeHtml(categoryLabel)} - ${escapeHtml(getPaymentName(item))}</span>
          <small>${repeatLabel} - Competencia ${formatMonthLabel(item.competenceMonth)} - ${dateLabel}</small>
        </div>
        <div class="transaction-actions">
          <b class="${item.type === "receita" ? "positive" : "negative"}">${item.type === "receita" ? "+" : "-"}${formatCurrency(item.amount)}</b>
          <button class="icon-button" type="button" data-finance-action="edit-transaction" data-id="${item.id}" aria-label="Editar lancamento"><i data-lucide="pencil"></i></button>
          <button class="icon-button danger-icon" type="button" data-finance-action="delete-transaction" data-id="${item.id}" aria-label="Excluir lancamento"><i data-lucide="trash-2"></i></button>
          <button class="status-mini ${item.status}" type="button" data-finance-action="toggle-transaction" data-id="${item.id}">${item.status === "pago" ? "Pago" : "Pendente"}</button>
        </div>
      </div>`;
  }).join("")}</div>`;
}

function bindFinanceActions() {
  const inviteForm = document.querySelector("#inviteMemberForm");
  if (inviteForm) {
    inviteForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const response = await requestJson(API_INVITES, { method: "POST", body: JSON.stringify({ email: data.get("email") }) });
      const result = document.querySelector("#inviteResult");
      if (!response.ok) {
        if (result) result.textContent = response.message || "Nao foi possivel gerar convite.";
        return;
      }
      if (result) result.textContent = `Convite para ${response.invite.email}: ${response.invite.inviteCode}`;
      event.currentTarget.reset();
    });
  }

  document.querySelectorAll('[data-finance-action="month-pick"]').forEach((input) => {
    input.addEventListener("change", () => {
      state.finance.activeMonth = input.value || monthKey(new Date());
      setDefaultTransactionDates(true);
      saveAndRender();
    });
  });

  document.querySelectorAll("[data-transaction-select]").forEach((input) => {
    input.addEventListener("change", () => {
      const ids = new Set(state.finance.selectedTransactionIds || []);
      if (input.checked) ids.add(input.dataset.transactionSelect);
      else ids.delete(input.dataset.transactionSelect);
      state.finance.selectedTransactionIds = Array.from(ids);
      renderFinance();
    });
  });
  const selectAll = document.querySelector("[data-transaction-select-all]");
  if (selectAll) {
    selectAll.checked = transactionsAreAllSelected();
    selectAll.addEventListener("change", () => {
      const visibleIds = getFilteredTransactions().map((item) => item.id);
      state.finance.selectedTransactionIds = selectAll.checked ? visibleIds : [];
      renderFinance();
    });
  }
  document.querySelectorAll("button[data-finance-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.financeAction;
      const id = button.dataset.id;
      if (action === "month-prev") {
        state.finance.activeMonth = addMonths(state.finance.activeMonth, -1);
      }
      if (action === "month-next") {
        state.finance.activeMonth = addMonths(state.finance.activeMonth, 1);
      }
      if (action === "month-current") {
        state.finance.activeMonth = monthKey(new Date());
      }
      if (["month-prev", "month-next", "month-current"].includes(action)) {
        setDefaultTransactionDates(true);
      }
      if (action === "edit-transaction") {
        const item = state.finance.transactions.find((transaction) => transaction.id === id);
        if (!item) return;
        state.finance.composerOpen = true;
        state.finance.editingTransactionId = item.id;
        saveAndRender();
        fillTransactionForm(item);
        els.transactionDescription.focus();
        return;
      }
      if (action === "delete-transaction") {
        const item = state.finance.transactions.find((transaction) => transaction.id === id);
        if (!item) return;
        if (!deleteTransactionsWithScope([id])) return;
        if (state.finance.editingTransactionId === id) {
          state.finance.editingTransactionId = null;
          state.finance.composerOpen = false;
          resetTransactionForm();
        }
      }
      if (action === "bulk-delete-transaction") {
        if (!deleteTransactionsWithScope(state.finance.selectedTransactionIds || [])) return;
      }
      if (action === "toggle-transaction") {
        const item = state.finance.transactions.find((transaction) => transaction.id === id);
        if (!item) return;
        item.status = item.status === "pago" ? "pendente" : "pago";
        item.paidAt = item.status === "pago" ? dateOnly(new Date().toISOString()) : null;
        item.date = item.status === "pago" ? item.paidAt : item.date;
        item.updatedAt = new Date().toISOString();
      }
      if (action === "toggle-account") {
        const item = state.finance.accounts.find((account) => account.id === id);
        if (item) item.active = !item.active;
      }
      if (action === "toggle-card") {
        const item = state.finance.cards.find((card) => card.id === id);
        if (item) item.active = !item.active;
      }
      if (action === "toggle-category") {
        const item = state.finance.categories.find((category) => category.id === id);
        if (item) item.active = !item.active;
      }
      if (action === "remove-subcategory") {
        removeSubcategoryFromCategory(id, button.dataset.subcategoryId);
      }
      saveAndRender();
    });
  });
}

function transactionsAreAllSelected() {
  const visibleIds = getFilteredTransactions().map((item) => item.id);
  return visibleIds.length > 0 && visibleIds.every((id) => (state.finance.selectedTransactionIds || []).includes(id));
}

function deleteTransactionsWithScope(ids) {
  const selected = state.finance.transactions.filter((item) => ids.includes(item.id));
  if (!selected.length) return false;
  const hasSeries = selected.some((item) => item.seriesId);
  let scope = "selected";
  if (hasSeries) {
    const answer = window.prompt("Excluir lancamentos:\n1 = somente selecionados\n2 = serie inteira\n3 = selecionados e os proximos da serie", "1");
    if (answer === null) return false;
    scope = answer.trim() === "2" ? "series" : answer.trim() === "3" ? "forward" : "selected";
  } else if (!window.confirm(`Excluir ${selected.length} lancamento(s)? Esta acao nao pode ser desfeita.`)) {
    return false;
  }
  const selectedSet = new Set(ids);
  state.finance.transactions = state.finance.transactions.filter((item) => {
    if (selectedSet.has(item.id)) return false;
    if (!item.seriesId || scope === "selected") return true;
    const origin = selected.find((entry) => entry.seriesId === item.seriesId);
    if (!origin) return true;
    if (scope === "series") return false;
    return item.dueDate <= origin.dueDate;
  });
  state.finance.selectedTransactionIds = [];
  return true;
}
function setDefaultTransactionDates(force = false) {
  const today = dateOnly(new Date().toISOString());
  if (force || !els.transactionCompetence.value) els.transactionCompetence.value = state.finance.activeMonth || monthKey(today);
  if (force || !els.transactionDate.value) els.transactionDate.value = today;
  if (force || !els.transactionDueDate.value) els.transactionDueDate.value = today;
}

function monthKey(value) {
  if (value instanceof Date) return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
  const text = String(value || "");
  if (/^\d{4}-\d{2}$/.test(text)) return text;
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 7);
  return monthKey(new Date());
}

function firstDayOfMonth(month) {
  return `${monthKey(month)}-01`;
}

function addMonths(month, amount) {
  const [year, monthNumber] = monthKey(month).split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + amount, 1);
  return monthKey(date);
}

function addMonthsToDate(value, amount) {
  const source = /^\d{4}-\d{2}-\d{2}/.test(String(value)) ? String(value).slice(0, 10) : dateOnly(new Date().toISOString());
  const [year, monthNumber, day] = source.split("-").map(Number);
  const target = new Date(year, monthNumber - 1 + amount, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
}

function addDaysToDate(value, amount) {
  const source = /^\d{4}-\d{2}-\d{2}/.test(String(value)) ? String(value).slice(0, 10) : dateOnly(new Date().toISOString());
  const [year, monthNumber, day] = source.split("-").map(Number);
  const target = new Date(year, monthNumber - 1, day + amount);
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
}
function formatMonthLabel(month) {
  const [year, monthNumber] = monthKey(month).split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(year, monthNumber - 1, 1));
}

function compareTransactions(a, b) {
  return String(a.dueDate || a.date).localeCompare(String(b.dueDate || b.date));
}

function getCategory(id) {
  return state.finance.categories.find((category) => category.id === id);
}

function getPaymentName(transaction) {
  if (transaction.cardId) return state.finance.cards.find((card) => card.id === transaction.cardId)?.name || "Cartao";
  if (transaction.accountId) return state.finance.accounts.find((account) => account.id === transaction.accountId)?.name || "Conta";
  return "Sem pagamento";
}

function isSameMonth(value, month, year) {
  const date = new Date(`${value}T12:00:00`);
  return date.getMonth() === month && date.getFullYear() === year;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

function formatDateOnly(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return dateOnly(new Date().toISOString());
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(value) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${formatDateOnly(value)}T12:00:00`));
}
