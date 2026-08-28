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
  { value: "producao", label: "Producao" },
  { value: "finalizado", label: "Finalizado" }
];

const FINANCE_CATEGORY_SEEDS = [
  { id: "fc-alimentacao", name: "Alimentacao", type: "despesa", active: true },
  { id: "fc-moradia", name: "Moradia", type: "despesa", active: true },
  { id: "fc-transporte", name: "Transporte", type: "despesa", active: true },
  { id: "fc-saude", name: "Saude", type: "despesa", active: true },
  { id: "fc-educacao", name: "Educacao", type: "despesa", active: true },
  { id: "fc-lazer", name: "Lazer", type: "despesa", active: true },
  { id: "fc-assinaturas", name: "Assinaturas", type: "despesa", active: true },
  { id: "fc-salario", name: "Salario", type: "receita", active: true },
  { id: "fc-outros", name: "Outros", type: "ambos", active: true }
];

const seedFinance = {
  activeView: "overview",
  composerOpen: false,
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
    { id: "p1", name: "Pessoal", color: "#d94f35" },
    { id: "p2", name: "Trabalho", color: "#376da8" },
    { id: "p3", name: "Estudos", color: "#2f7d6b" }
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
  financeTitle: document.querySelector("#financeTitle"),
  financeSearchInput: document.querySelector("#financeSearchInput"),
  financeComposer: document.querySelector("#financeComposer"),
  transactionForm: document.querySelector("#transactionForm"),
  transactionDescription: document.querySelector("#transactionDescription"),
  transactionType: document.querySelector("#transactionType"),
  transactionAmount: document.querySelector("#transactionAmount"),
  transactionCategory: document.querySelector("#transactionCategory"),
  transactionAccount: document.querySelector("#transactionAccount"),
  transactionCard: document.querySelector("#transactionCard"),
  transactionDate: document.querySelector("#transactionDate"),
  transactionDueDate: document.querySelector("#transactionDueDate"),
  transactionStatus: document.querySelector("#transactionStatus"),
  transactionNote: document.querySelector("#transactionNote"),
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
  els.authModeButtons.forEach((button) => button.classList.toggle("active", button.dataset.authMode === mode));
  els.authPanels.forEach((panel) => panel.classList.toggle("hidden", panel.dataset.authPanel !== mode));
  els.authError.textContent = "";
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
    state.preferences.activeModule = "finance";
    state.finance.composerOpen = true;
    saveAndRender();
    els.transactionDescription.focus();
  });

  els.transactionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    createFinancialTransaction({
      description: els.transactionDescription.value,
      type: els.transactionType.value,
      amount: els.transactionAmount.value,
      categoryId: els.transactionCategory.value,
      accountId: els.transactionAccount.value,
      cardId: els.transactionCard.value,
      date: els.transactionDate.value,
      dueDate: els.transactionDueDate.value,
      status: els.transactionStatus.value,
      note: els.transactionNote.value
    });
    els.transactionForm.reset();
    els.transactionDate.value = dateOnly(new Date().toISOString());
    state.finance.composerOpen = false;
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
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
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
    composerOpen: source.composerOpen === true,
    accounts: Array.isArray(source.accounts) ? source.accounts.map(normalizeAccount) : structuredClone(seedFinance.accounts),
    cards: Array.isArray(source.cards) ? source.cards.map(normalizeCard) : [],
    categories: mergeCategories(source.categories),
    transactions: Array.isArray(source.transactions) ? source.transactions.map(normalizeTransaction) : []
  };
}

function mergeCategories(categories) {
  const custom = Array.isArray(categories) ? categories : [];
  const byId = new Map([...FINANCE_CATEGORY_SEEDS, ...custom].map((category) => [category.id, normalizeCategory(category)]));
  return Array.from(byId.values());
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
    active: category.active !== false
  };
}

function normalizeTransaction(transaction) {
  return {
    id: transaction.id || createId(),
    description: transaction.description || transaction.descricao || "Lancamento",
    type: transaction.type === "receita" ? "receita" : "despesa",
    amount: Number(transaction.amount || transaction.value || transaction.valor || 0),
    categoryId: transaction.categoryId || "",
    accountId: transaction.accountId || "",
    cardId: transaction.cardId || "",
    date: transaction.date || transaction.data || dateOnly(new Date().toISOString()),
    dueDate: transaction.dueDate || transaction.vencimento || transaction.date || dateOnly(new Date().toISOString()),
    status: transaction.status === "pago" ? "pago" : "pendente",
    note: transaction.note || transaction.observacao || "",
    createdAt: transaction.createdAt || new Date().toISOString(),
    paidAt: transaction.paidAt || (transaction.status === "pago" ? new Date().toISOString() : null)
  };
}

function renderFinance() {
  if (!els.financeWorkspace || state.preferences?.activeModule !== "finance") return;
  renderFinanceNav();
  renderTransactionOptions();
  const view = state.finance.activeView || "overview";
  els.financeTitle.textContent = getFinanceViewTitle(view);
  els.financeComposer.classList.toggle("hidden", !state.finance.composerOpen);
  if (view === "overview") renderFinanceOverview();
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
  return { overview: "Visao geral", transactions: "Lancamentos", accounts: "Contas", cards: "Cartoes", categories: "Categorias" }[view] || "Minhas Financas";
}

function renderTransactionOptions() {
  const categories = state.finance.categories.filter((category) => category.active);
  els.transactionCategory.innerHTML = categories.map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`).join("");
  els.transactionAccount.innerHTML = `<option value="">Conta</option>${state.finance.accounts.filter((account) => account.active).map((account) => `<option value="${account.id}">${escapeHtml(account.name)}</option>`).join("")}`;
  els.transactionCard.innerHTML = `<option value="">Cartao</option>${state.finance.cards.filter((card) => card.active).map((card) => `<option value="${card.id}">${escapeHtml(card.name)}</option>`).join("")}`;
  if (!els.transactionDate.value) els.transactionDate.value = dateOnly(new Date().toISOString());
}

function renderFinanceOverview() {
  const summary = getFinanceSummary();
  els.financeContent.innerHTML = `
    <section class="finance-kpis">
      <div class="finance-kpi"><span>Saldo atual</span><strong>${formatCurrency(summary.balance)}</strong></div>
      <div class="finance-kpi"><span>Receitas do mes</span><strong>${formatCurrency(summary.income)}</strong></div>
      <div class="finance-kpi"><span>Despesas do mes</span><strong>${formatCurrency(summary.expenses)}</strong></div>
      <div class="finance-kpi"><span>Resultado</span><strong class="${summary.result >= 0 ? "positive" : "negative"}">${formatCurrency(summary.result)}</strong></div>
    </section>
    <section class="finance-two-col">
      <div class="finance-block"><h2>Proximos pagamentos</h2>${renderTransactionRows(summary.upcoming)}</div>
      <div class="finance-block"><h2>Ultimos lancamentos</h2>${renderTransactionRows(summary.latest)}</div>
    </section>
    ${renderFamilyPanel()}`;
  bindFinanceActions();
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
  els.financeContent.innerHTML = `<section class="finance-block"><h2>Lancamentos</h2>${renderTransactionRows(getFilteredTransactions())}</section>`;
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
        <button type="submit"><i data-lucide="plus"></i>Adicionar</button>
      </form>
      ${state.finance.categories.map((category) => `<div class="finance-row"><div><strong>${escapeHtml(category.name)}</strong><span>${escapeHtml(category.type)}</span></div><button class="icon-button" data-finance-action="toggle-category" data-id="${category.id}"><i data-lucide="${category.active ? "eye" : "eye-off"}"></i></button></div>`).join("")}
    </section>`;
  document.querySelector("#categoryForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    createCategory({ name: data.get("name"), type: data.get("type") });
    saveAndRender();
  });
  bindFinanceActions();
}

function createFinancialTransaction(input) {
  const transaction = normalizeTransaction({
    id: createId(),
    description: String(input.description || "").trim(),
    type: input.type,
    amount: input.amount,
    categoryId: input.categoryId,
    accountId: input.accountId,
    cardId: input.cardId,
    date: input.date || dateOnly(new Date().toISOString()),
    dueDate: input.dueDate || input.date || dateOnly(new Date().toISOString()),
    status: input.status,
    note: input.note,
    paidAt: input.status === "pago" ? new Date().toISOString() : null,
    createdAt: new Date().toISOString()
  });
  if (!transaction.description || transaction.amount <= 0) return null;
  state.finance.transactions.unshift(transaction);
  return transaction;
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

function getFinanceSummary() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const transactions = state.finance.transactions;
  const paid = transactions.filter((item) => item.status === "pago");
  const income = paid.filter((item) => item.type === "receita" && isSameMonth(item.date, month, year)).reduce((sum, item) => sum + item.amount, 0);
  const expenses = paid.filter((item) => item.type === "despesa" && isSameMonth(item.date, month, year)).reduce((sum, item) => sum + item.amount, 0);
  const initial = state.finance.accounts.filter((account) => account.active).reduce((sum, account) => sum + account.initialBalance, 0);
  const totalIncome = paid.filter((item) => item.type === "receita").reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = paid.filter((item) => item.type === "despesa").reduce((sum, item) => sum + item.amount, 0);
  return {
    balance: initial + totalIncome - totalExpenses,
    income,
    expenses,
    result: income - expenses,
    upcoming: transactions.filter((item) => item.type === "despesa" && item.status === "pendente").sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate))).slice(0, 6),
    latest: transactions.slice(0, 6)
  };
}

function getFilteredTransactions() {
  const query = els.financeSearchInput.value.trim().toLowerCase();
  return state.finance.transactions.filter((item) => {
    if (!query) return true;
    return [item.description, item.note, getCategory(item.categoryId)?.name, getPaymentName(item)].join(" ").toLowerCase().includes(query);
  });
}

function renderTransactionRows(transactions) {
  if (!transactions.length) return `<p class="column-empty">Nenhum lancamento.</p>`;
  return `<div class="finance-list">${transactions.map((item) => `
    <div class="finance-row transaction-row">
      <div>
        <strong>${escapeHtml(item.description)}</strong>
        <span>${formatDateOnly(item.date)} - ${escapeHtml(getCategory(item.categoryId)?.name || "Sem categoria")} - ${escapeHtml(getPaymentName(item))}</span>
      </div>
      <div class="transaction-side">
        <b class="${item.type === "receita" ? "positive" : "negative"}">${item.type === "receita" ? "+" : "-"}${formatCurrency(item.amount)}</b>
        <button class="status-mini ${item.status}" data-finance-action="toggle-transaction" data-id="${item.id}">${item.status === "pago" ? "Pago" : "Pendente"}</button>
      </div>
    </div>`).join("")}</div>`;
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

  document.querySelectorAll("[data-finance-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;
      const action = button.dataset.financeAction;
      if (action === "toggle-transaction") {
        const item = state.finance.transactions.find((transaction) => transaction.id === id);
        item.status = item.status === "pago" ? "pendente" : "pago";
        item.paidAt = item.status === "pago" ? new Date().toISOString() : null;
      }
      if (action === "toggle-account") {
        const item = state.finance.accounts.find((account) => account.id === id);
        item.active = !item.active;
      }
      if (action === "toggle-card") {
        const item = state.finance.cards.find((card) => card.id === id);
        item.active = !item.active;
      }
      if (action === "toggle-category") {
        const item = state.finance.categories.find((category) => category.id === id);
        item.active = !item.active;
      }
      saveAndRender();
    });
  });
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
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T12:00:00`));
}


