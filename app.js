/**
 * 任务清单 - 党政风格
 * A todo list application with local storage persistence.
 */

// ============================================
// Constants
// ============================================
const STORAGE_KEY = 'todo_tasks';
const ANNOUNCEMENT_DELAY = 3000;

// ============================================
// State
// ============================================
let tasks = [];
let nextId = 1;

// ============================================
// DOM References
// ============================================
const elements = {
    input: document.getElementById('task-input'),
    addBtn: document.getElementById('add-task-btn'),
    list: document.getElementById('tasks-list'),
    emptyState: document.getElementById('empty-state'),
    totalCount: document.getElementById('total-count'),
    completedCount: document.getElementById('completed-count'),
    clearCompletedBtn: document.getElementById('clear-completed-btn'),
    resetBtn: document.getElementById('reset-data'),
    statusMessage: document.getElementById('status-message'),
};

// ============================================
// Storage
// ============================================
function loadTasks() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed;
    } catch {
        return [];
    }
}

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
        console.error('Failed to save tasks:', e);
    }
}

// ============================================
// ID Management
// ============================================
function computeNextId(existingTasks) {
    return existingTasks.length === 0
        ? 1
        : Math.max(...existingTasks.map((t) => t.id)) + 1;
}

// ============================================
// Task Operations
// ============================================
function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) return null;

    const task = {
        id: nextId++,
        text: trimmed,
        completed: false,
        createdAt: Date.now(),
    };

    tasks.unshift(task);
    saveTasks();
    return task;
}

function deleteTask(id) {
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return false;
    tasks.splice(index, 1);
    saveTasks();
    return true;
}

function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return false;
    task.completed = !task.completed;
    saveTasks();
    return true;
}

function clearCompleted() {
    const before = tasks.length;
    tasks = tasks.filter((t) => !t.completed);
    saveTasks();
    return before - tasks.length;
}

function resetAll() {
    tasks = [];
    nextId = 1;
    saveTasks();
}

// ============================================
// Render
// ============================================
function render() {
    renderList();
    renderStats();
    renderEmptyState();
}

function renderList() {
    elements.list.innerHTML = '';

    tasks.forEach((task) => {
        const li = document.createElement('li');
        li.className = `task-item${task.completed ? ' completed' : ''}`;
        li.dataset.id = task.id;

        li.innerHTML = `
            <div class="task-checkbox" role="checkbox" aria-checked="${task.completed}" tabindex="0">
                <i class="fas fa-check" aria-hidden="true"></i>
            </div>
            <span class="task-text">${escapeHtml(task.text)}</span>
            <button class="task-delete-btn" aria-label="删除任务: ${escapeHtml(task.text)}">
                <i class="fas fa-times" aria-hidden="true"></i>
            </button>
        `;

        elements.list.appendChild(li);
    });
}

function renderEmptyState() {
    const hasTasks = tasks.length > 0;
    elements.emptyState.style.display = hasTasks ? 'none' : '';
}

function renderStats() {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    elements.totalCount.textContent = `总计: ${total}`;
    elements.completedCount.textContent = `已完成: ${completed}`;
}

// ============================================
// Helpers
// ============================================
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function announce(message) {
    elements.statusMessage.textContent = '';
    // Force reflow to re-trigger announcement
    requestAnimationFrame(() => {
        elements.statusMessage.textContent = message;
    });
}

// ============================================
// Event Handlers
// ============================================
function handleAddTask() {
    const text = elements.input.value;
    const task = addTask(text);
    if (!task) return;

    elements.input.value = '';
    elements.input.focus();
    render();
    announce(`已添加任务: ${task.text}`);
}

function handleToggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    toggleTask(id);
    render();
    announce(task.completed ? '任务已完成' : '任务已标记为未完成');
}

function handleDeleteTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    deleteTask(id);
    render();
    announce(`已删除任务: ${task.text}`);
}

function handleClearCompleted() {
    const count = clearCompleted();
    if (count === 0) {
        announce('没有已完成的任务');
        return;
    }
    render();
    announce(`已清空 ${count} 个已完成任务`);
}

function handleReset() {
    if (!confirm('确定要重置所有数据吗？此操作不可撤销。')) return;
    resetAll();
    render();
    announce('所有数据已重置');
}

// ============================================
// Event Listeners
// ============================================
// Add task: button click
elements.addBtn.addEventListener('click', handleAddTask);

// Add task: Enter key
elements.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        handleAddTask();
    }
});

// Task list: event delegation for toggle and delete
elements.list.addEventListener('click', (e) => {
    const item = e.target.closest('.task-item');
    if (!item) return;

    const id = Number(item.dataset.id);

    if (e.target.closest('.task-delete-btn')) {
        handleDeleteTask(id);
        return;
    }

    if (e.target.closest('.task-checkbox, .task-text')) {
        handleToggleTask(id);
    }
});

// Task list: keyboard support on checkboxes
elements.list.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;

    const checkbox = e.target.closest('.task-checkbox');
    if (!checkbox) return;

    e.preventDefault();
    const item = checkbox.closest('.task-item');
    const id = Number(item.dataset.id);
    handleToggleTask(id);
});

// Clear completed
elements.clearCompletedBtn.addEventListener('click', handleClearCompleted);

// Reset data
elements.resetBtn.addEventListener('click', handleReset);

// ============================================
// Init
// ============================================
function init() {
    tasks = loadTasks();
    nextId = computeNextId(tasks);
    render();
    elements.input.focus();
}

init();
