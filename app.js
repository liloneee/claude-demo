const STORAGE_KEY = 'todo_app_v1';

const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const todayList = document.getElementById('todayList');
const emptyState = document.getElementById('emptyState');
const stats = document.getElementById('stats');
const historyAccordion = document.getElementById('historyAccordion');

let state = { tasks: [] };

function normalizeTask(task) {
  return {
    id: task.id,
    title: task.title || '',
    createdAt: task.createdAt || Date.now(),
    completed: task.completed || false,
    completedAt: task.completedAt || null,
    note: task.note || { content: '', open: false }
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      state = { tasks: Array.isArray(data.tasks) ? data.tasks.map(normalizeTask) : [] };
      save();
    }
  } catch (e) { state = { tasks: [] }; }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() { return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`; }

function isToday(ts) {
  const d = new Date(ts);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function createTask(title) {
  return { id: uid(), title, createdAt: Date.now(), completed: false, completedAt: null, note: { content: '', open: false } };
}

function addTask() {
  const v = taskInput.value.trim();
  if (!v) return taskInput.focus();
  state.tasks.push(createTask(v));
  taskInput.value = '';
  sync();
}

function toggleComplete(id) {
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  t.completed = !t.completed;
  t.completedAt = t.completed ? Date.now() : null;
  sync();
}

function removeTask(id) {
  state.tasks = state.tasks.filter(x => x.id !== id);
  sync();
}

function toggleNote(id) {
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  if (!t.note) t.note = { content: '', open: false };
  t.note.open = !t.note.open;
  sync();
}

function updateNote(id, value) {
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  if (!t.note) t.note = { content: '', open: false };
  t.note.content = value;
  save();
}

function formatDate(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function splitEveryNChars(text, n) {
  return text.replace(new RegExp(`(.{1,${n}})`, 'g'), '$1\n').trim();
}

function renderToday() {
  const todayTasks = state.tasks.filter(t => isToday(t.createdAt));
  todayList.innerHTML = '';
  if (todayTasks.length === 0) {
    emptyState.style.display = 'block';
    stats.textContent = '0 项';
    return;
  }
  emptyState.style.display = 'none';

  todayTasks.forEach((t) => {
    const note = t.note || { content: '', open: false };
    const li = document.createElement('li');
    li.className = `todo-item enter${note.open ? ' note-open' : ''}`;

    const check = document.createElement('button');
    check.className = `check${t.completed ? ' done' : ''}`;
    check.innerHTML = t.completed ? '✓' : '';
    check.addEventListener('click', () => toggleComplete(t.id));

    const title = document.createElement('p');
    title.className = `todo-title${t.completed ? ' done' : ''}`;
    title.textContent = splitEveryNChars(t.title, 30);
    title.addEventListener('click', () => toggleComplete(t.id));

    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const noteBtn = document.createElement('button');
    noteBtn.className = `note-btn${note.content ? ' has-note' : ''}${note.open ? ' open' : ''}`;
    noteBtn.type = 'button';
    noteBtn.title = '备注';
    noteBtn.innerHTML = '✎';
    noteBtn.addEventListener('click', () => toggleNote(t.id));

    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.innerHTML = '×';
    del.addEventListener('click', () => removeTask(t.id));

    actions.appendChild(noteBtn);
    actions.appendChild(del);

    li.appendChild(check);
    li.appendChild(title);
    li.appendChild(actions);

    const notePanel = document.createElement('div');
    notePanel.className = `note-panel${note.open ? ' open' : ''}`;
    const textarea = document.createElement('textarea');
    textarea.className = 'note-textarea';
    textarea.placeholder = '写下备注，刷新后也会被保存…';
    textarea.value = note.content;
    textarea.addEventListener('input', (e) => updateNote(t.id, e.target.value));
    notePanel.appendChild(textarea);

    li.appendChild(notePanel);
    todayList.appendChild(li);
  });

  const remaining = todayTasks.filter(t => !t.completed).length;
  stats.textContent = remaining === 0 ? '今日已收工 🎉' : `${remaining} 项待办`;
}

function renderHistory() {
  // group non-today tasks by date (descending)
  const groups = {};
  state.tasks.forEach(t => {
    if (isToday(t.createdAt)) return;
    const key = formatDate(t.createdAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  const keys = Object.keys(groups).sort((a,b) => b.localeCompare(a));
  historyAccordion.innerHTML = '';
  if (keys.length === 0) {
    const e = document.createElement('div');
    e.className = 'history-empty';
    e.textContent = '暂无历史记录';
    historyAccordion.appendChild(e);
    return;
  }

  keys.forEach(key => {
    const group = document.createElement('div');
    group.className = 'day-group';
    const header = document.createElement('div');
    header.className = 'day-header';
    const title = document.createElement('div');
    title.className = 'day-title';
    title.textContent = key;
    const count = document.createElement('div');
    count.className = 'day-count';
    count.textContent = `${groups[key].length} 条`;
    header.appendChild(title);
    header.appendChild(count);

    const body = document.createElement('div');
    body.className = 'day-body';
    // default open for recent 7 days
    const todayTs = Date.now();
    const sevenDaysAgo = todayTs - 7*24*60*60*1000;
    const sampleTs = new Date(key + 'T00:00:00').getTime();
    if (sampleTs >= sevenDaysAgo) body.classList.add('open');

    groups[key].forEach(t => {
      const note = t.note || { content: '' };
      const itemWrapper = document.createElement('div');
      itemWrapper.className = 'history-item-wrapper';

      const it = document.createElement('div');
      it.className = 'history-item';
      const left = document.createElement('div');
      left.textContent = t.title;
      if (t.completed) left.style.textDecoration = 'line-through';
      const right = document.createElement('div');
      right.textContent = t.completedAt ? new Date(t.completedAt).toLocaleTimeString() : '';
      it.appendChild(left);
      it.appendChild(right);

      itemWrapper.appendChild(it);

      if (note.content) {
        const noteToggle = document.createElement('button');
        noteToggle.className = 'note-toggle';
        noteToggle.type = 'button';
        noteToggle.textContent = '查看备注';
        const notePanel = document.createElement('div');
        notePanel.className = 'history-note';
        notePanel.textContent = note.content;
        noteToggle.addEventListener('click', () => notePanel.classList.toggle('open'));
        itemWrapper.appendChild(noteToggle);
        itemWrapper.appendChild(notePanel);
      }

      body.appendChild(itemWrapper);
    });

    header.addEventListener('click', () => body.classList.toggle('open'));

    group.appendChild(header);
    group.appendChild(body);
    historyAccordion.appendChild(group);
  });
}

function sync() {
  save();
  renderToday();
  renderHistory();
}

load();
renderToday();
renderHistory();

addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(); });
