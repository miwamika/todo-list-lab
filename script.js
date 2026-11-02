let tasks = [];
document.addEventListener('DOMContentLoaded', () => { loadTasks(); renderApp(); });

function renderApp() {
    document.body.innerHTML = '';
    const appContainer = document.createElement('div');
    appContainer.id = 'app-container';
    const header = document.createElement('header');
    const h1 = document.createElement('h1');
    h1.textContent = 'My Tasks';
    header.appendChild(h1);
    const dateDisplay = document.createElement('div');
    dateDisplay.className = 'date-display';
    dateDisplay.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    header.appendChild(dateDisplay);
    appContainer.appendChild(header);

    const form = document.createElement('form');
    form.className = 'input-group';
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.placeholder = 'Add a new task...';
    titleInput.id = 'new-task-title';
    titleInput.required = true;
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.id = 'new-task-date';
    const addBtn = document.createElement('button');
    addBtn.type = 'submit';
    addBtn.textContent = 'Add Task';
    form.append(titleInput, dateInput, addBtn);
    appContainer.appendChild(form);
    form.addEventListener('submit', (e) => { e.preventDefault(); addTask(titleInput.value, dateInput.value); titleInput.value = ''; dateInput.value = ''; });

    const controls = document.createElement('div');
    controls.className = 'controls';
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search tasks...';
    searchInput.id = 'search-input';
    const filterSelect = document.createElement('select');
    filterSelect.id = 'filter-select';
    [{v:'all',t:'All'},{v:'active',t:'To Do'},{v:'completed',t:'Done'}].forEach(o => { const opt = document.createElement('option'); opt.value = o.v; opt.textContent = o.t; filterSelect.appendChild(opt); });
    const sortBtn = document.createElement('button');
    sortBtn.textContent = 'Sort by Date';
    sortBtn.id = 'sort-btn';
    controls.append(searchInput, filterSelect, sortBtn);
    appContainer.appendChild(controls);

    const ul = document.createElement('ul');
    ul.id = 'task-list';
    appContainer.appendChild(ul);
    document.body.appendChild(appContainer);

    searchInput.addEventListener('input', () => renderTasks());
    filterSelect.addEventListener('change', () => renderTasks());
    sortBtn.addEventListener('click', () => { tasks.sort((a, b) => new Date(a.date) - new Date(b.date)); saveTasks(); renderTasks(); });
    renderTasks();
}

function loadTasks() { const s = localStorage.getItem('tasks'); if (s) tasks = JSON.parse(s); }
function saveTasks() { localStorage.setItem('tasks', JSON.stringify(tasks)); }
function addTask(title, date) { tasks.push({ id: Date.now(), title, date: date || new Date().toISOString().split('T')[0], completed: false }); saveTasks(); renderTasks(); }
function deleteTask(id) { tasks = tasks.filter(t => t.id !== id); saveTasks(); renderTasks(); }
function editTask(id) { const t = tasks.find(x => x.id === id); if (!t) return; const nt = prompt('Edit task:', t.title); const nd = prompt('Edit date (YYYY-MM-DD):', t.date); if (nt !== null && nd !== null) { t.title = nt || t.title; t.date = nd || t.date; saveTasks(); renderTasks(); } }
function toggleTask(id) { const t = tasks.find(x => x.id === id); if (t) { t.completed = !t.completed; saveTasks(); renderTasks(); } }

function renderTasks() {
    const ul = document.getElementById('task-list');
    ul.innerHTML = '';
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const filterStatus = document.getElementById('filter-select').value;
    let filtered = tasks.filter(t => {
        const ms = t.title.toLowerCase().includes(searchTerm);
        let mf = true;
        if (filterStatus === 'active') mf = !t.completed;
        if (filterStatus === 'completed') mf = t.completed;
        return ms && mf;
    });
    filtered.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.setAttribute('draggable', true);
        li.dataset.id = task.id;
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = task.completed;
        cb.onchange = () => toggleTask(task.id);
        const content = document.createElement('div');
        content.className = 'task-content';
        const ts = document.createElement('span');
        ts.textContent = task.title;
        const ds = document.createElement('span');
        ds.className = 'task-date';
        ds.textContent = task.date;
        content.append(ts, ds);
        const actions = document.createElement('div');
        actions.className = 'actions';
        const eb = document.createElement('button');
        eb.textContent = '✏️';
        eb.onclick = () => editTask(task.id);
        const db = document.createElement('button');
        db.textContent = '🗑️';
        db.className = 'delete-btn';
        db.onclick = () => deleteTask(task.id);
        actions.append(eb, db);
        li.append(cb, content, actions);
        ul.appendChild(li);
    });
    initDragAndDrop();
}

function initDragAndDrop() {
    const list = document.getElementById('task-list');
    const items = list.querySelectorAll('.task-item');
    items.forEach(item => {
        item.addEventListener('dragstart', () => item.classList.add('dragging'));
        item.addEventListener('dragend', () => { item.classList.remove('dragging'); updateOrderAfterDrop(); });
    });
    list.addEventListener('dragover', (e) => {
        e.preventDefault();
        const after = getDragAfterElement(list, e.clientY);
        const draggable = document.querySelector('.dragging');
        if (after == null) list.appendChild(draggable); else list.insertBefore(draggable, after);
    });
}
function getDragAfterElement(container, y) {
    const elements = [...container.querySelectorAll('.task-item:not(.dragging)')];
    return elements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset, element: child };
        return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}
function updateOrderAfterDrop() {
    const list = document.getElementById('task-list');
    const ids = [...list.querySelectorAll('.task-item')].map(li => Number(li.dataset.id));
    tasks.sort((a, b) => {
        const ia = ids.indexOf(a.id), ib = ids.indexOf(b.id);
        if (ia === -1 && ib === -1) return 0; if (ia === -1) return 1; if (ib === -1) return -1; return ia - ib;
    });
    saveTasks();
}
