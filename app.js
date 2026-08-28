const STORAGE_KEY = "foco-tarefas-mvp";
const AUTH_KEY = "foco-authenticated";

const seedState = {
  activeFilter: "inbox",
  activeProjectId: null,
  statusFilter: "all",
  priorityFilter: null,
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
      due: todayAt(18, 0),
      labels: ["planejamento"],
      completedAt: null,
      createdAt: new Date().toISOString(),
      subtasks: [
        { id: "s1", title: "Revisar pendencias", done: true },
        { id: "s2", title: "Definir 3 prioridades", done: false }
      ]
    },
    {
      id: "t2",
      title: "Enviar proposta para cliente",
      description: "Anexar resumo comercial e prazo de implantacao.",
      projectId: "p2",
      priority: "alta",
      status: "pendente",
      due: todayAt(11, 30),
      labels: ["cliente", "comercial"],
      completedAt: null,
      createdAt: new Date().toISOString(),
      subtasks: []
    },
    {
      id: "t3",
      title: "Separar material do curso",
      description: "",
      projectId: "p3",
      priority: "media",
      status: "pendente",
      due: addDaysAt(2, 9, 0),
      labels: ["aula"],
      completedAt: null,
      createdAt: new Date().toISOString(),
      subtasks: [{ id: "s3", title: "Baixar arquivos", done: false }]
    }
  ],
  activity: []
};

let state = loadState();

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
  searchInput: document.querySelector("#searchInput"),
  chips: document.querySelectorAll(".chip"),
  viewButtons: document.querySelectorAll("[data-view]"),
  taskList: document.querySelector("#taskList"),
  boardView: document.querySelector("#boardView"),
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
  refreshAuthState();
  render();
});

function bindAuth() {
  els.authForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const password = document.querySelector("#passwordInput").value;
    if (password !== APP_PASSWORD) {
      els.authError.textContent = "Senha invalida.";
      return;
    }
    sessionStorage.setItem(AUTH_KEY, "true");
    els.authError.textContent = "";
    refreshAuthState();
  });

  els.logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem(AUTH_KEY);
    refreshAuthState();
  });
}

function refreshAuthState() {
  const authenticated = sessionStorage.getItem(AUTH_KEY) === "true";
  els.authScreen.classList.toggle("hidden", authenticated);
  els.appShell.classList.toggle("locked", !authenticated);
  if (!authenticated) document.querySelector("#passwordInput").focus();
}

function bindEvents() {
  els.quickAddBtn.addEventListener("click", () => {
    els.taskTitle.focus();
  });

  els.addProjectBtn.addEventListener("click", () => {
    els.projectDialog.showModal();
    els.projectName.focus();
  });

  els.projectForm.addEventListener("submit", (event) => {
    if (event.submitter?.value === "cancel") return;
    event.preventDefault();
    const name = els.projectName.value.trim();
    if (!name) return;
    const project = {
      id: crypto.randomUUID(),
      name,
      color: els.projectColor.value
    };
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
    const task = {
      id: crypto.randomUUID(),
      title,
      description: "",
      projectId: els.taskProject.value,
      priority: els.taskPriority.value,
      status: "pendente",
      due: els.taskDue.value ? new Date(els.taskDue.value).toISOString() : null,
      labels: [],
      completedAt: null,
      createdAt: new Date().toISOString(),
      subtasks: []
    };
    state.tasks.unshift(task);
    state.selectedTaskId = task.id;
    els.taskTitle.value = "";
    els.taskDue.value = "";
    logActivity(`Tarefa "${title}" criada`);
    saveAndRender();
  });

  els.searchInput.addEventListener("input", renderTasks);

  els.chips.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.status) {
        state.statusFilter = button.dataset.status;
        state.priorityFilter = null;
      }
      if (button.dataset.priority) {
        state.priorityFilter = state.priorityFilter === button.dataset.priority ? null : button.dataset.priority;
        state.statusFilter = "all";
      }
      saveAndRender();
    });
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
  els.projectList.innerHTML = state.projects
    .map((project) => {
      const count = state.tasks.filter((task) => task.projectId === project.id && task.status !== "concluida").length;
      const active = state.activeProjectId === project.id ? "active" : "";
      return `
        <button class="project-item ${active}" type="button" data-project-id="${project.id}">
          <span class="project-dot" style="color: ${project.color}"><i data-lucide="circle"></i></span>
          <span>${escapeHtml(project.name)}</span>
          <b>${count}</b>
        </button>
      `;
    })
    .join("");

  els.projectList.querySelectorAll("[data-project-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeFilter = "project";
      state.activeProjectId = button.dataset.projectId;
      saveAndRender();
    });
  });
}

function renderCounts() {
  const openTasks = state.tasks.filter((task) => task.status !== "concluida");
  els.countInbox.textContent = openTasks.length;
  els.countToday.textContent = openTasks.filter(isDueToday).length;
  els.countUpcoming.textContent = openTasks.filter(isUpcoming).length;
  els.countCompleted.textContent = state.tasks.filter((task) => task.status === "concluida").length;
  els.metricDone.textContent = state.tasks.filter(doneInLastSevenDays).length;
}

function renderTaskProjectOptions() {
  els.taskProject.innerHTML = state.projects
    .map((project) => `<option value="${project.id}">${escapeHtml(project.name)}</option>`)
    .join("");

  if (state.activeProjectId) {
    els.taskProject.value = state.activeProjectId;
  }
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
  els.viewEyebrow.textContent = eyebrow;
  els.viewTitle.textContent = title;
}

function renderControls() {
  els.navItems.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === state.activeFilter && !state.activeProjectId);
  });
  els.chips.forEach((button) => {
    const activeStatus = button.dataset.status && button.dataset.status === state.statusFilter;
    const activePriority = button.dataset.priority && button.dataset.priority === state.priorityFilter;
    button.classList.toggle("active", Boolean(activeStatus || activePriority));
  });
  els.viewButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.view);
  });
}

function renderTasks() {
  const tasks = getFilteredTasks();
  els.emptyState.classList.toggle("hidden", tasks.length > 0);
  els.taskList.classList.toggle("hidden", state.view !== "list" || tasks.length === 0);
  els.boardView.classList.toggle("hidden", state.view !== "board" || tasks.length === 0);

  if (state.view === "list") {
    els.taskList.innerHTML = tasks.map(renderTaskCard).join("");
    bindTaskCards(els.taskList);
  } else {
    const columns = [
      ["pendente", "Pendentes"],
      ["andamento", "Em andamento"],
      ["concluida", "Concluidas"]
    ];
    els.boardView.innerHTML = columns
      .map(([status, title]) => {
        const cards = tasks.filter((task) => task.status === status).map(renderTaskCard).join("");
        return `<section class="board-column"><h2>${title}</h2>${cards}</section>`;
      })
      .join("");
    bindTaskCards(els.boardView);
  }

  queueIconRefresh();
}

function renderTaskCard(task) {
  const project = getProject(task.projectId);
  const selected = task.id === state.selectedTaskId ? "selected" : "";
  const completed = task.status === "concluida" ? "completed" : "";
  const done = task.status === "concluida" ? "done" : "";
  const due = task.due ? formatDate(task.due) : "Sem prazo";
  const subtaskCount = task.subtasks.filter((subtask) => subtask.done).length;
  const labels = task.labels.map((label) => `<span class="pill">#${escapeHtml(label)}</span>`).join("");

  return `
    <article class="task-card ${selected} ${completed}" data-task-id="${task.id}">
      <button class="task-check ${done}" type="button" data-action="toggle" aria-label="Concluir tarefa">
        <i data-lucide="check"></i>
      </button>
      <div class="task-main">
        <div class="task-title-row">
          <strong>${escapeHtml(task.title)}</strong>
          <span class="pill priority-${task.priority}">${task.priority}</span>
        </div>
        <div class="task-meta">
          <span class="pill"><i data-lucide="folder"></i>${escapeHtml(project?.name || "Sem projeto")}</span>
          <span class="pill"><i data-lucide="calendar"></i>${due}</span>
          <span class="pill"><i data-lucide="list-checks"></i>${subtaskCount}/${task.subtasks.length}</span>
          ${labels}
        </div>
      </div>
      <select class="status-select" data-action="status" aria-label="Status da tarefa">
        <option value="pendente" ${task.status === "pendente" ? "selected" : ""}>Pendente</option>
        <option value="andamento" ${task.status === "andamento" ? "selected" : ""}>Em andamento</option>
        <option value="concluida" ${task.status === "concluida" ? "selected" : ""}>Concluida</option>
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
      updateTask(task.id, {
        status: task.status === "concluida" ? "pendente" : "concluida",
        completedAt: task.status === "concluida" ? null : new Date().toISOString()
      });
    });
  });

  root.querySelectorAll("[data-action='status']").forEach((select) => {
    select.addEventListener("change", () => {
      const task = getTask(select.closest(".task-card").dataset.taskId);
      updateTask(task.id, {
        status: select.value,
        completedAt: select.value === "concluida" ? new Date().toISOString() : null
      });
    });
  });
}

function renderDetails() {
  const task = getTask(state.selectedTaskId);
  if (!task) {
    els.detailPanel.innerHTML = `
      <div class="detail-empty">
        <i data-lucide="mouse-pointer-2"></i>
        <strong>Selecione uma tarefa</strong>
        <span>Detalhes, subtarefas e comentarios aparecem aqui.</span>
      </div>
    `;
    queueIconRefresh();
    return;
  }

  els.detailPanel.innerHTML = `
    <form class="detail-form" id="detailForm">
      <label>
        Tarefa
        <input name="title" value="${escapeAttr(task.title)}" />
      </label>
      <label>
        Descricao
        <textarea name="description">${escapeHtml(task.description || "")}</textarea>
      </label>
      <label>
        Projeto
        <select name="projectId">
          ${state.projects.map((project) => `<option value="${project.id}" ${project.id === task.projectId ? "selected" : ""}>${escapeHtml(project.name)}</option>`).join("")}
        </select>
      </label>
      <label>
        Prioridade
        <select name="priority">
          <option value="alta" ${task.priority === "alta" ? "selected" : ""}>Alta</option>
          <option value="media" ${task.priority === "media" ? "selected" : ""}>Media</option>
          <option value="baixa" ${task.priority === "baixa" ? "selected" : ""}>Baixa</option>
        </select>
      </label>
      <label>
        Prazo
        <input name="due" type="datetime-local" value="${task.due ? toDatetimeLocal(task.due) : ""}" />
      </label>
      <label>
        Etiquetas
        <input name="labels" value="${escapeAttr(task.labels.join(", "))}" placeholder="cliente, urgente" />
      </label>
      <div class="subtasks">
        <div class="section-title"><span>Subtarefas</span></div>
        ${task.subtasks.map((subtask) => `
          <div class="subtask-row ${subtask.done ? "done" : ""}" data-subtask-id="${subtask.id}">
            <input type="checkbox" ${subtask.done ? "checked" : ""} data-action="subtask-toggle" aria-label="Concluir subtarefa" />
            <span>${escapeHtml(subtask.title)}</span>
            <button class="icon-button" type="button" data-action="subtask-delete" aria-label="Remover subtarefa">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        `).join("")}
        <div class="subtask-add">
          <input id="subtaskTitle" type="text" placeholder="Nova subtarefa" />
          <button class="icon-button" id="addSubtaskBtn" type="button" aria-label="Adicionar subtarefa">
            <i data-lucide="plus"></i>
          </button>
        </div>
      </div>
      <button class="danger" id="deleteTaskBtn" type="button">
        Remover tarefa
      </button>
    </form>
  `;

  const form = els.detailPanel.querySelector("#detailForm");
  form.addEventListener("input", () => {
    const formData = new FormData(form);
    updateTask(task.id, {
      title: formData.get("title").trim() || task.title,
      description: formData.get("description"),
      projectId: formData.get("projectId"),
      priority: formData.get("priority"),
      due: formData.get("due") ? new Date(formData.get("due")).toISOString() : null,
      labels: formData.get("labels").split(",").map((label) => label.trim()).filter(Boolean)
    }, false);
  });

  form.querySelector("#addSubtaskBtn").addEventListener("click", () => {
    const input = form.querySelector("#subtaskTitle");
    const title = input.value.trim();
    if (!title) return;
    task.subtasks.push({ id: crypto.randomUUID(), title, done: false });
    input.value = "";
    logActivity(`Subtarefa adicionada em "${task.title}"`);
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

  queueIconRefresh();
}

function getFilteredTasks() {
  const query = els.searchInput.value.trim().toLowerCase();
  return state.tasks
    .filter((task) => {
      if (state.activeFilter === "today") return task.status !== "concluida" && isDueToday(task);
      if (state.activeFilter === "upcoming") return task.status !== "concluida" && isUpcoming(task);
      if (state.activeFilter === "completed") return task.status === "concluida";
      if (state.activeFilter === "project") return task.projectId === state.activeProjectId;
      return task.status !== "concluida";
    })
    .filter((task) => state.statusFilter === "all" || task.status === state.statusFilter)
    .filter((task) => !state.priorityFilter || task.priority === state.priorityFilter)
    .filter((task) => {
      if (!query) return true;
      const project = getProject(task.projectId)?.name || "";
      return [task.title, task.description, project, task.labels.join(" ")].join(" ").toLowerCase().includes(query);
    })
    .sort((a, b) => {
      const priorityWeight = { alta: 0, media: 1, baixa: 2 };
      const dueA = a.due ? new Date(a.due).getTime() : Number.MAX_SAFE_INTEGER;
      const dueB = b.due ? new Date(b.due).getTime() : Number.MAX_SAFE_INTEGER;
      return dueA - dueB || priorityWeight[a.priority] - priorityWeight[b.priority];
    });
}

function updateTask(id, patch, rerenderDetails = true) {
  const task = getTask(id);
  Object.assign(task, patch);
  if (patch.status) logActivity(`Status de "${task.title}" alterado para ${patch.status}`);
  saveState();
  renderProjects();
  renderCounts();
  renderControls();
  renderTasks();
  if (rerenderDetails) renderDetails();
}

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : structuredClone(seedState);
  } catch {
    return structuredClone(seedState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveAndRender() {
  saveState();
  render();
}

function logActivity(text) {
  state.activity.unshift({ id: crypto.randomUUID(), text, at: new Date().toISOString() });
  state.activity = state.activity.slice(0, 50);
}

function getTask(id) {
  return state.tasks.find((task) => task.id === id);
}

function getProject(id) {
  return state.projects.find((project) => project.id === id);
}

function isDueToday(task) {
  if (!task.due) return false;
  const due = new Date(task.due);
  const now = new Date();
  return due.toDateString() === now.toDateString();
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

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function toDatetimeLocal(value) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
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



