const taskInput = document.getElementById('taskInput');
const addButton = document.getElementById('addButton');
const taskList = document.getElementById('taskList');

function createTaskItem(text) {
  const item = document.createElement('li');
  item.className = 'task-item';

  const taskText = document.createElement('p');
  taskText.className = 'task-text';
  taskText.textContent = text;
  taskText.addEventListener('click', () => {
    taskText.classList.toggle('completed');
  });

  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-button';
  deleteButton.type = 'button';
  deleteButton.setAttribute('aria-label', '删除任务');
  deleteButton.textContent = '×';
  deleteButton.addEventListener('click', () => {
    item.remove();
    updateEmptyState();
  });

  item.appendChild(taskText);
  item.appendChild(deleteButton);
  return item;
}

function updateEmptyState() {
  const hasTasks = taskList.children.length > 0;
  const existingNotice = document.querySelector('.no-tasks');

  if (!hasTasks) {
    if (!existingNotice) {
      const notice = document.createElement('p');
      notice.className = 'no-tasks';
      notice.textContent = '当前还没有任务，输入一项开始吧。';
      taskList.appendChild(notice);
    }
  } else if (existingNotice) {
    existingNotice.remove();
  }
}

function addTask() {
  const value = taskInput.value.trim();
  if (!value) {
    taskInput.focus();
    return;
  }

  const taskItem = createTaskItem(value);
  taskList.appendChild(taskItem);
  taskInput.value = '';
  taskInput.focus();
  updateEmptyState();
}

addButton.addEventListener('click', addTask);

taskInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    addTask();
  }
});

updateEmptyState();
