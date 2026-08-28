const API_STATE = "/api/state";
const API_LOGIN = "/api/login";
const API_LOGOUT = "/api/logout";

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
  metricDone: document.querySelector("#metricDone")
};

document.addEventListener("DOMContentLoaded", () => {
  bindAuth();
  bindEvents();
  boot();
});

async function boot() {
  const loaded = await loadRemoteState();
  refreshAuthState(loaded);
  if (loaded) render();
}

function bindAuth() {
  els.authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = document.querySelector("#passwordInput").value;
    const response = await requestJson(API_LOGIN, {
      method: "POST",
      body: JSON.stringify({ password })
    });

    if (!response.ok) {
      els.authError.textContent = response.message || "Senha invalida.";
      return;
    }

    els.authError.textContent = "";
    await loadRemoteState();
    refreshAuthState(true);
    render();
  });

  els.logoutBtn.addEventListener("click", async () => {
    await requestJson(API_LOGOUT, { method: "POST" });
    refreshAuthState(false);
  });
}

function refreshAuthState(authenticated) {
  els.authScreen.classList.toggle("hidden", authenticated);
  els.appShell.classList.toggle("locked", !authenticated);
  if (!authenticated) document.querySelector("#passwordInput").focus();
}

function bindEvents() {
  els.quickAddBtn.addEventListener("click", () => els.taskTitle.focus());

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
  state = normalizeState(response.data);
  return true;
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