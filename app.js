// Main application logic for TaskFlow
// This is where all the magic happens - task management, API calls, etc.

let currentTab = 'todo'; // Keep track of which tab is currently active
let tasks = {
    todo: [],
    completed: [],
    archived: []
};

document.addEventListener('DOMContentLoaded', function() {
    // Make sure the user is actually supposed to be here
    checkAuthentication();
    
    // Get everything set up
    initializeApp();
    
    // Wire up all the event listeners
    setupEventListeners();
    
    // Load some initial data to make the app feel populated
    loadInitialData();
});

function checkAuthentication() {
    // First things first - make sure they went through the age verification
    const userData = localStorage.getItem('taskflowUser');
    if (!userData) {
        // No user data means they haven't been verified, send them back
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const user = JSON.parse(userData);
        // Double check that we have all the required info
        if (!user.name || !user.dateOfBirth) {
            // Something's missing, clear the data and start over
            localStorage.removeItem('taskflowUser');
            window.location.href = 'index.html';
            return;
        }
        
        // All good! Set up the user info in the header
        document.getElementById('userName').textContent = user.name;
        
        // Generate their avatar using the UI Avatars service
        // This creates a nice colored avatar with their initials
        const avatarUrl = `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${encodeURIComponent(user.name)}`;
        document.getElementById('userAvatar').src = avatarUrl;
        
    } catch (error) {
        // JSON parsing failed, data is corrupted
        localStorage.removeItem('taskflowUser');
        window.location.href = 'index.html';
    }
}

function initializeApp() {
    // Load any existing tasks from localStorage
    const savedTasks = localStorage.getItem('taskflowTasks');
    if (savedTasks) {
        try {
            tasks = JSON.parse(savedTasks);
        } catch (error) {
            // If parsing fails, just start with empty arrays
            console.error('Error loading saved tasks:', error);
            tasks = { todo: [], completed: [], archived: [] };
        }
    }
    
    // Update the UI to reflect current state
    updateTaskCounts();
    renderTasks();
}

function setupEventListeners() {
    // Handle tab switching - this was more complex than I initially thought
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            switchTab(tab);
        });
    });
    
    // Task submission - both button click and Enter key
    const submitBtn = document.getElementById('submitBtn');
    const taskInput = document.getElementById('taskInput');
    
    submitBtn.addEventListener('click', addTask);
    // Allow Enter key to submit tasks - users expect this
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    // Sign out functionality
    document.getElementById('signOutBtn').addEventListener('click', signOut);
}

async function loadInitialData() {
    // Only load dummy data if this is a fresh install
    // Don't want to overwrite existing user tasks
    if (tasks.todo.length === 0 && tasks.completed.length === 0 && tasks.archived.length === 0) {
        try {
            // Fetch some dummy todos from the API to populate the app
            const response = await fetch('https://dummyjson.com/todos');
            const data = await response.json();
            
            // Transform the API data to match our internal format
            // We only take the first 5 to avoid overwhelming new users
            const dummyTasks = data.todos.slice(0, 5).map(todo => ({
                id: generateTaskId(),
                title: todo.todo, // The API uses 'todo' field for the text
                status: 'todo',
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            }));
            
            tasks.todo = dummyTasks;
            saveTasks();
            updateTaskCounts();
            renderTasks();
            
        } catch (error) {
            // API might be down, so let's provide some fallback tasks
            console.error('Error loading dummy data:', error);
            const defaultTasks = [
                'Complete project documentation',
                'Review code changes',
                'Update team on progress',
                'Plan next sprint',
                'Test new features'
            ].map(title => ({
                id: generateTaskId(),
                title: title,
                status: 'todo',
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            }));
            
            tasks.todo = defaultTasks;
            saveTasks();
            updateTaskCounts();
            renderTasks();
        }
    }
}

function switchTab(tab) {
    // Update which tab is currently active
    currentTab = tab;
    
    // Update the visual state of the tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    // Show the corresponding task list
    document.querySelectorAll('.task-list').forEach(list => {
        list.classList.remove('active');
    });
    document.getElementById(`${tab}Tasks`).classList.add('active');
}

function addTask() {
    // Get the task text and clean it up
    const taskInput = document.getElementById('taskInput');
    const title = taskInput.value.trim();
    
    // Don't allow empty tasks
    if (!title) {
        showNotification('Error', 'Please enter a task description.');
        return;
    }
    
    // Create a new task object
    const newTask = {
        id: generateTaskId(), // Unique ID for this task
        title: title,
        status: currentTab, // Add to whatever tab is currently active
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
    };
    
    // Add it to the appropriate array
    tasks[currentTab].push(newTask);
    taskInput.value = ''; // Clear the input field
    
    // Save and update the UI
    saveTasks();
    updateTaskCounts();
    renderTasks();
    
    // Give the user some feedback
    showNotification('Task Added', `Task added to ${capitalizeFirst(currentTab)}.`);
}

function moveTask(taskId, fromStatus, toStatus) {
    // Find the task in the source array
    const taskIndex = tasks[fromStatus].findIndex(task => task.id === taskId);
    if (taskIndex === -1) return; // Task not found, shouldn't happen but just in case
    
    // Get the task and update its properties
    const task = tasks[fromStatus][taskIndex];
    task.status = toStatus;
    task.lastModified = new Date().toISOString(); // Update the timestamp
    
    // Move it from one array to another
    tasks[fromStatus].splice(taskIndex, 1); // Remove from source
    tasks[toStatus].push(task); // Add to destination
    
    // Update everything
    saveTasks();
    updateTaskCounts();
    renderTasks();
    
    // Let the user know what happened
    showNotification('Task Updated', `Task moved to ${capitalizeFirst(toStatus)}.`);
}

function renderTasks() {
    // Re-render all task lists
    // This is a bit brute force but it's simple and works well
    Object.keys(tasks).forEach(status => {
        const container = document.getElementById(`${status}Tasks`);
        container.innerHTML = ''; // Clear existing content
        
        // Create a card for each task
        tasks[status].forEach(task => {
            const taskElement = createTaskElement(task);
            container.appendChild(taskElement);
        });
    });
}

function createTaskElement(task) {
    // Build the HTML for a single task card
    const taskCard = document.createElement('div');
    taskCard.className = 'task-card';
    
    // Format the timestamp nicely
    const timestamp = formatTimestamp(task.lastModified);
    
    // Add status badge for completed and archived tasks
    let statusBadge = '';
    if (task.status === 'archived') {
        statusBadge = '<div class="task-status status-archived">Archived</div>';
    } else if (task.status === 'completed') {
        statusBadge = '<div class="task-status status-completed">Completed</div>';
    }
    
    // Different action buttons depending on the task status
    // This was the trickiest part - making sure the right buttons show up
    let actionButtons = '';
    if (task.status === 'todo') {
        actionButtons = `
            <button class="task-btn complete-btn" onclick="moveTask('${task.id}', 'todo', 'completed')">
                Mark as completed
            </button>
            <button class="task-btn archive-btn" onclick="moveTask('${task.id}', 'todo', 'archived')">
                🗃️ Archive
            </button>
        `;
    } else if (task.status === 'completed') {
        actionButtons = `
            <button class="task-btn move-btn" onclick="moveTask('${task.id}', 'completed', 'todo')">
                Move to Todo
            </button>
            <button class="task-btn archive-btn" onclick="moveTask('${task.id}', 'completed', 'archived')">
                🗃️ Archive
            </button>
        `;
    } else if (task.status === 'archived') {
        // Archived tasks can be moved back to either todo or completed
        actionButtons = `
            <button class="task-btn move-btn" onclick="moveTask('${task.id}', 'archived', 'todo')">
                Move to Todo
            </button>
            <button class="task-btn move-btn" onclick="moveTask('${task.id}', 'archived', 'completed')">
                Move to Completed
            </button>
        `;
    }
    
    // Put it all together
    taskCard.innerHTML = `
        <div class="task-header">
            <div class="task-title">${escapeHtml(task.title)}</div>
            <div class="task-timestamp">
                Last modified at:<br>
                ${timestamp}
            </div>
        </div>
        ${statusBadge}
        <div class="task-actions">
            ${actionButtons}
        </div>
    `;
    
    return taskCard;
}

function updateTaskCounts() {
    // Update the numbers in the tab buttons
    // Users like to see how many tasks they have in each category
    document.getElementById('todoCount').textContent = tasks.todo.length;
    document.getElementById('completedCount').textContent = tasks.completed.length;
    document.getElementById('archivedCount').textContent = tasks.archived.length;
}

function saveTasks() {
    // Persist tasks to localStorage so they survive page refreshes
    try {
        localStorage.setItem('taskflowTasks', JSON.stringify(tasks));
    } catch (error) {
        // localStorage can fail if it's full or disabled
        console.error('Error saving tasks:', error);
        showNotification('Error', 'Unable to save tasks. Storage may be full.');
    }
}

function generateTaskId() {
    // Create a unique ID for each task
    // Using timestamp + random string to avoid collisions
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function formatTimestamp(isoString) {
    // Convert ISO timestamp to a nice readable format
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

function capitalizeFirst(str) {
    // Simple utility to capitalize the first letter
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(text) {
    // Prevent XSS attacks by escaping HTML in user input
    // This is important since we're inserting user content into the DOM
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(title, message) {
    // Show a temporary notification to give user feedback
    const notification = document.getElementById('notification');
    const titleElement = document.getElementById('notificationTitle');
    const messageElement = document.getElementById('notificationMessage');
    
    titleElement.textContent = title;
    messageElement.textContent = message;
    
    notification.style.display = 'block';
    
    // Auto-hide after 3 seconds - long enough to read but not annoying
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

function signOut() {
    // Confirm before signing out - prevent accidental logouts
    if (confirm('Are you sure you want to sign out?')) {
        // Clear all stored data
        localStorage.removeItem('taskflowUser');
        localStorage.removeItem('taskflowTasks');
        // Send them back to the landing page
        window.location.href = 'index.html';
    }
}

// Make moveTask function globally available so the onclick handlers work
// This is a bit of a hack but it's the simplest way to handle the button clicks
window.moveTask = moveTask;

