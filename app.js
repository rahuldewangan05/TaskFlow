// Enhanced main application JavaScript for TaskFlow
let currentTab = 'todo';
let tasks = {
    todo: [],
    completed: [],
    archived: []
};

let currentSearchTerm = '';
let currentCategoryFilter = '';
let currentPriorityFilter = '';
let isSortedByPriority = false;

// Category and priority mappings
const categories = {
    general: { name: 'General', icon: '📋' },
    work: { name: 'Work', icon: '💼' },
    personal: { name: 'Personal', icon: '👤' },
    shopping: { name: 'Shopping', icon: '🛒' },
    health: { name: 'Health', icon: '🏥' },
    learning: { name: 'Learning', icon: '📚' }
};

const priorities = {
    low: { name: 'Low', icon: '🟢', order: 1 },
    medium: { name: 'Medium', icon: '🟡', order: 2 },
    high: { name: 'High', icon: '🟠', order: 3 },
    urgent: { name: 'Urgent', icon: '🔴', order: 4 }
};

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuthentication();
    
    // Initialize the application
    initializeApp();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadInitialData();
});

function checkAuthentication() {
    const userData = localStorage.getItem('taskflowUser');
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const user = JSON.parse(userData);
        displayUserInfo(user);
    } catch (error) {
        localStorage.removeItem('taskflowUser');
        window.location.href = 'index.html';
    }
}

function displayUserInfo(user) {
    document.getElementById('userName').textContent = user.name;
    
    // Set avatar using UI Avatars API
    const avatarUrl = `https://ui-avatars.com/api/?background=667eea&color=fff&name=${encodeURIComponent(user.name)}`;
    document.getElementById('userAvatar').src = avatarUrl;
}

function initializeApp() {
    // Load tasks from localStorage
    const savedTasks = localStorage.getItem('taskflowTasks');
    if (savedTasks) {
        try {
            tasks = JSON.parse(savedTasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }
    
    // Update UI
    updateTaskCounts();
    renderTasks();
}

function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });
    
    // Add task
    document.getElementById('submitBtn').addEventListener('click', addTask);
    document.getElementById('taskInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    // Search functionality
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('clearSearchBtn').addEventListener('click', clearSearch);
    
    // Filter functionality
    document.getElementById('categoryFilter').addEventListener('change', handleCategoryFilter);
    document.getElementById('priorityFilter').addEventListener('change', handlePriorityFilter);
    document.getElementById('sortBtn').addEventListener('click', togglePrioritySort);
    
    // Sign out
    document.getElementById('signOutBtn').addEventListener('click', signOut);
}

function loadInitialData() {
    // Load dummy data only if no tasks exist
    if (tasks.todo.length === 0 && tasks.completed.length === 0 && tasks.archived.length === 0) {
        fetch('https://dummyjson.com/todos')
            .then(response => response.json())
            .then(data => {
                // Take first 5 todos and add them to todo list with random categories and priorities
                const dummyTasks = data.todos.slice(0, 5).map(todo => ({
                    id: Date.now() + Math.random(),
                    title: todo.todo,
                    category: getRandomCategory(),
                    priority: getRandomPriority(),
                    timestamp: new Date().toLocaleString(),
                    lastModified: new Date().toLocaleString()
                }));
                
                tasks.todo = dummyTasks;
                saveTasks();
                updateTaskCounts();
                renderTasks();
            })
            .catch(error => {
                console.error('Error loading dummy data:', error);
            });
    }
}

function getRandomCategory() {
    const categoryKeys = Object.keys(categories);
    return categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
}

function getRandomPriority() {
    const priorityKeys = Object.keys(priorities);
    return priorityKeys[Math.floor(Math.random() * priorityKeys.length)];
}

function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    // Update task lists
    document.querySelectorAll('.task-list').forEach(list => {
        list.classList.remove('active');
    });
    document.getElementById(`${tab}Tasks`).classList.add('active');
    
    // Re-render tasks for current tab
    renderTasks();
}

function addTask() {
    const taskInput = document.getElementById('taskInput');
    const categorySelect = document.getElementById('categorySelect');
    const prioritySelect = document.getElementById('prioritySelect');
    
    const taskText = taskInput.value.trim();
    const category = categorySelect.value;
    const priority = prioritySelect.value;
    
    if (!taskText) {
        showNotification('Please enter a task!');
        return;
    }
    
    const newTask = {
        id: Date.now(),
        title: taskText,
        category: category,
        priority: priority,
        timestamp: new Date().toLocaleString(),
        lastModified: new Date().toLocaleString()
    };
    
    tasks[currentTab].push(newTask);
    taskInput.value = '';
    
    saveTasks();
    updateTaskCounts();
    renderTasks();
    showNotification('Task added successfully!');
}

function moveTask(taskId, fromStage, toStage) {
    const taskIndex = tasks[fromStage].findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;
    
    const task = tasks[fromStage].splice(taskIndex, 1)[0];
    task.lastModified = new Date().toLocaleString();
    tasks[toStage].push(task);
    
    saveTasks();
    updateTaskCounts();
    renderTasks();
    showNotification(`Task moved to ${toStage}!`);
}

function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    
    currentSearchTerm = searchInput.value.trim().toLowerCase();
    
    if (currentSearchTerm) {
        clearBtn.style.display = 'block';
    } else {
        clearBtn.style.display = 'none';
    }
    
    renderTasks();
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('clearSearchBtn').style.display = 'none';
    currentSearchTerm = '';
    renderTasks();
}

function handleCategoryFilter() {
    currentCategoryFilter = document.getElementById('categoryFilter').value;
    renderTasks();
}

function handlePriorityFilter() {
    currentPriorityFilter = document.getElementById('priorityFilter').value;
    renderTasks();
}

function togglePrioritySort() {
    isSortedByPriority = !isSortedByPriority;
    const sortBtn = document.getElementById('sortBtn');
    
    if (isSortedByPriority) {
        sortBtn.textContent = 'Clear Sort';
        sortBtn.style.background = '#ef4444';
    } else {
        sortBtn.textContent = 'Sort by Priority';
        sortBtn.style.background = '#10b981';
    }
    
    renderTasks();
}

function filterTasks(taskList) {
    let filtered = [...taskList];
    
    // Apply search filter
    if (currentSearchTerm) {
        filtered = filtered.filter(task => 
            task.title.toLowerCase().includes(currentSearchTerm)
        );
    }
    
    // Apply category filter
    if (currentCategoryFilter) {
        filtered = filtered.filter(task => task.category === currentCategoryFilter);
    }
    
    // Apply priority filter
    if (currentPriorityFilter) {
        filtered = filtered.filter(task => task.priority === currentPriorityFilter);
    }
    
    // Apply sorting
    if (isSortedByPriority) {
        filtered.sort((a, b) => priorities[b.priority].order - priorities[a.priority].order);
    }
    
    return filtered;
}

function highlightSearchTerm(text) {
    if (!currentSearchTerm) return text;
    
    const regex = new RegExp(`(${currentSearchTerm})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

function renderTasks() {
    Object.keys(tasks).forEach(stage => {
        const container = document.getElementById(`${stage}Tasks`);
        const filteredTasks = filterTasks(tasks[stage]);
        
        if (filteredTasks.length === 0) {
            if (currentSearchTerm || currentCategoryFilter || currentPriorityFilter) {
                container.innerHTML = `
                    <div class="no-results">
                        <h3>No matching tasks found</h3>
                        <p>Try adjusting your search or filter criteria.</p>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <h3>No ${stage} tasks</h3>
                        <p>Your ${stage} tasks will appear here.</p>
                    </div>
                `;
            }
            return;
        }
        
        container.innerHTML = filteredTasks.map(task => createTaskCard(task, stage)).join('');
    });
}

function createTaskCard(task, stage) {
    const actions = getTaskActions(task.id, stage);
    const categoryInfo = categories[task.category];
    const priorityInfo = priorities[task.priority];
    
    return `
        <div class="task-card priority-${task.priority}">
            <div class="task-header">
                <div class="task-title">${highlightSearchTerm(task.title)}</div>
                <div class="task-badges">
                    <span class="task-badge category-badge">${categoryInfo.icon} ${categoryInfo.name}</span>
                    <span class="task-badge priority-badge priority-${task.priority}">${priorityInfo.icon} ${priorityInfo.name}</span>
                </div>
            </div>
            <div class="task-meta">Last modified: ${task.lastModified}</div>
            <div class="task-actions">
                ${actions}
            </div>
        </div>
    `;
}

function getTaskActions(taskId, stage) {
    const actions = [];
    
    if (stage === 'todo') {
        actions.push(`<button class="task-btn complete" onclick="moveTask(${taskId}, 'todo', 'completed')">Mark as Completed</button>`);
        actions.push(`<button class="task-btn archive" onclick="moveTask(${taskId}, 'todo', 'archived')">Archive</button>`);
    } else if (stage === 'completed') {
        actions.push(`<button class="task-btn todo" onclick="moveTask(${taskId}, 'completed', 'todo')">Move to Todo</button>`);
        actions.push(`<button class="task-btn archive" onclick="moveTask(${taskId}, 'completed', 'archived')">Archive</button>`);
    } else if (stage === 'archived') {
        actions.push(`<button class="task-btn todo" onclick="moveTask(${taskId}, 'archived', 'todo')">Move to Todo</button>`);
        actions.push(`<button class="task-btn complete" onclick="moveTask(${taskId}, 'archived', 'completed')">Move to Completed</button>`);
    }
    
    return actions.join('');
}

function updateTaskCounts() {
    document.getElementById('todoCount').textContent = tasks.todo.length;
    document.getElementById('completedCount').textContent = tasks.completed.length;
    document.getElementById('archivedCount').textContent = tasks.archived.length;
}

function saveTasks() {
    try {
        localStorage.setItem('taskflowTasks', JSON.stringify(tasks));
    } catch (error) {
        console.error('Error saving tasks:', error);
        showNotification('Error saving tasks!');
    }
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    const messageElement = document.getElementById('notificationMessage');
    
    messageElement.textContent = message;
    notification.style.display = 'block';
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
    }, 3000);
}

function signOut() {
    if (confirm('Are you sure you want to sign out?')) {
        localStorage.removeItem('taskflowUser');
        localStorage.removeItem('taskflowTasks');
        window.location.href = 'index.html';
    }
}

