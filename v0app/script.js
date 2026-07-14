(function () {
  "use strict";

  const STORAGE_KEY = "task-manager.tasks";

  // DOM refs
  const form = document.getElementById("taskForm");
  const input = document.getElementById("taskInput");
  const list = document.getElementById("taskList");
  const emptyState = document.getElementById("emptyState");
  const counter = document.getElementById("counter");
  const clearBtn = document.getElementById("clearCompleted");
  const filters = document.getElementById("filters");
  const dateLabel = document.getElementById("dateLabel");

  // State
  let tasks = loadTasks();
  let currentFilter = "all";

  // --- Storage ---
  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.log("[v0] Failed to load tasks:", e.message);
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.log("[v0] Failed to save tasks:", e.message);
    }
  }

  // --- Helpers ---
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function getFiltered() {
    if (currentFilter === "active") return tasks.filter((t) => !t.done);
    if (currentFilter === "completed") return tasks.filter((t) => t.done);
    return tasks;
  }

  function pluralize(n) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return "активная задача";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "активные задачи";
    return "активных задач";
  }

  // --- Rendering ---
  function render() {
    list.innerHTML = "";
    const filtered = getFiltered();

    filtered.forEach((task) => {
      const li = document.createElement("li");
      li.className = "task" + (task.done ? " is-done" : "");
      li.dataset.id = task.id;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "task__check";
      checkbox.checked = task.done;
      checkbox.setAttribute("aria-label", "Отметить как выполненную");
      checkbox.addEventListener("change", () => toggleTask(task.id));

      const span = document.createElement("span");
      span.className = "task__text";
      span.textContent = task.text;

      const del = document.createElement("button");
      del.className = "task__delete";
      del.setAttribute("aria-label", "Удалить задачу");
      del.innerHTML =
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
      del.addEventListener("click", () => removeTask(task.id, li));

      li.append(checkbox, span, del);
      list.appendChild(li);
    });

    // Empty state
    const showEmpty = filtered.length === 0;
    emptyState.hidden = !showEmpty;
    emptyState.querySelector("p").textContent =
      tasks.length === 0
        ? "Список пуст. Добавьте первую задачу!"
        : "Нет задач в этой категории.";

    // Counter
    const active = tasks.filter((t) => !t.done).length;
    counter.textContent = active + " " + pluralize(active);

    // Clear button visibility
    const hasCompleted = tasks.some((t) => t.done);
    clearBtn.style.display = hasCompleted ? "inline-block" : "none";
  }

  // --- Actions ---
  function addTask(text) {
    tasks.unshift({ id: uid(), text: text, done: false });
    saveTasks();
    render();
  }

  function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.done = !task.done;
      saveTasks();
      render();
    }
  }

  function removeTask(id, li) {
    li.classList.add("is-removing");
    setTimeout(() => {
      tasks = tasks.filter((t) => t.id !== id);
      saveTasks();
      render();
    }, 250);
  }

  function clearCompleted() {
    tasks = tasks.filter((t) => !t.done);
    saveTasks();
    render();
  }

  // --- Events ---
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    addTask(value);
    input.value = "";
    input.focus();
  });

  clearBtn.addEventListener("click", clearCompleted);

  filters.addEventListener("click", (e) => {
    const btn = e.target.closest(".filters__btn");
    if (!btn) return;
    currentFilter = btn.dataset.filter;
    filters.querySelectorAll(".filters__btn").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    render();
  });

  // Date label
  dateLabel.textContent = new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  render();
})();
