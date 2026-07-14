const STORAGE_KEY = 'task-manager:tasks';
const FILTER_KEY = 'task-manager:filter';

const state = {
  tasks: [],
  filter: 'all',
};

const els = {
  form: document.getElementById('taskForm'),
  input: document.getElementById('taskInput'),
  list: document.getElementById('taskList'),
  emptyState: document.getElementById('emptyState'),
  activeCount: document.getElementById('activeCount'),
  footer: document.getElementById('appFooter'),
  footerCount: document.getElementById('footerCount'),
  clearBtn: document.getElementById('clearCompleted'),
  filters: document.getElementById('filters'),
  toast: document.getElementById('toast'),
};

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.tasks = raw ? JSON.parse(raw) : [];
  } catch {
    state.tasks = [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function loadFilter() {
  state.filter = localStorage.getItem(FILTER_KEY) || 'all';
}

function saveFilter() {
  localStorage.setItem(FILTER_KEY, state.filter);
}

function getFiltered() {
  if (state.filter === 'active') return state.tasks.filter((t) => !t.done);
  if (state.filter === 'completed') return state.tasks.filter((t) => t.done);
  return state.tasks;
}

function pluralize(n, forms) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

let toastTimer;
function showToast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  requestAnimationFrame(() => els.toast.classList.add('is-visible'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.classList.remove('is-visible');
    setTimeout(() => { els.toast.hidden = true; }, 200);
  }, 2200);
}

function render() {
  const filtered = getFiltered();
  els.list.innerHTML = '';
  filtered.forEach((task) => els.list.appendChild(createTaskEl(task)));

  const active = state.tasks.filter((t) => !t.done).length;
  const completed = state.tasks.length - active;
  els.activeCount.textContent = `${active} ${pluralize(active, ['активная задача', 'активные задачи', 'активных задач'])}`;

  const showEmpty = filtered.length === 0;
  els.emptyState.hidden = !showEmpty;
  if (showEmpty) {
    const msg = state.filter === 'completed'
      ? 'Нет выполненных задач'
      : state.filter === 'active'
        ? 'Нет активных задач'
        : 'Список пуст';
    els.emptyState.querySelector('.empty-state__text').textContent = msg;
  }

  const hasAny = state.tasks.length > 0;
  els.footer.hidden = !hasAny;
  if (hasAny) {
    els.footerCount.textContent = `${active} осталось, ${completed} выполнено`;
    els.clearBtn.disabled = completed === 0;
  }
}

function createTaskEl(task) {
  const li = document.createElement('li');
  li.className = 'task-item' + (task.done ? ' is-completed' : '');
  li.dataset.id = task.id;
  li.innerHTML = `
    <label class="task-item__checkbox">
      <input type="checkbox" ${task.done ? 'checked' : ''} aria-label="Отметить выполненной" />
      <span class="task-item__checkmark">
        <svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" /></svg>
      </span>
    </label>
    <span class="task-item__text">${escapeHtml(task.text)}</span>
    <button type="button" class="task-item__delete" aria-label="Удалить задачу">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    </button>`;

  li.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
    toggleTask(task.id, e.target.checked);
  });
  li.querySelector('.task-item__delete').addEventListener('click', () => {
    removeTask(task.id, li);
  });
  return li;
}

function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  state.tasks.unshift({ id: Date.now() + Math.random().toString(36).slice(2, 8), text: trimmed, done: false });
  saveTasks();
  render();
  showToast('Задача добавлена');
}

function toggleTask(id, done) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;
  task.done = done;
  saveTasks();
  render();
}

function removeTask(id, el) {
  el.classList.add('is-removing');
  el.addEventListener('animationend', () => {
    state.tasks = state.tasks.filter((t) => t.id !== id);
    saveTasks();
    render();
  }, { once: true });
}

function clearCompleted() {
  const count = state.tasks.filter((t) => t.done).length;
  if (count === 0) return;
  const completedEls = [...els.list.querySelectorAll('.task-item.is-completed')];
  completedEls.forEach((el) => el.classList.add('is-removing'));
  const finish = () => {
    state.tasks = state.tasks.filter((t) => !t.done);
    saveTasks();
    render();
    showToast(`Удалено выполненных: ${count}`);
  };
  if (completedEls.length === 0) {
    finish();
  } else {
    const last = completedEls[completedEls.length - 1];
    last.addEventListener('animationend', finish, { once: true });
  }
}

function setFilter(filter) {
  state.filter = filter;
  saveFilter();
  els.filters.querySelectorAll('.filter').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.filter === filter);
  });
  render();
}

function init() {
  loadTasks();
  loadFilter();
  setFilter(state.filter);

  els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask(els.input.value);
    els.input.value = '';
    els.input.focus();
  });

  els.filters.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter');
    if (btn) setFilter(btn.dataset.filter);
  });

  els.clearBtn.addEventListener('click', clearCompleted);
}

init();
