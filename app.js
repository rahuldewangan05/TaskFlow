// Main application JavaScript for TaskFlow
let currentTab = 'todo';
let tasks = {
    todo: [],
    completed: [],
    archived: []
};

let animationQueue = [];
let isAnimating = false;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize page animations
    initializePageAnimations();
    
    // Check if user is authenticated
    checkAuthentication();
    
    // Initialize the application
    initializeApp();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadInitialData();
    
    // Add interactive enhancements
    setupInteractiveEnhancements();
});

function initializePageAnimations() {
    // Add entrance animations to main elements
    const elements = [
        { selector: '.app-header', delay: 0.4 },
        { selector: '.tabs-container', delay: 1.2 },
        { selector: '.add-task-section', delay: 1.4 },
        { selector: '.tasks-container', delay: 1.6 }
    ];
    
    elements.forEach(({ selector, delay }) => {
        const element = document.querySelector(selector);
        if (element) {
            element.style.animationDelay = `${delay}s`;
        }
    });
}

function setupInteractiveEnhancements() {
    // Add hover effects to interactive elements
    const interactiveElements = document.querySelectorAll('.tab-btn, .task-btn, .submit-btn, .sign-out-btn');
    interactiveElements.forEach(element => {
        element.classList.add('interactive-element');
        
        // Add click ripple effect
        element.addEventListener('click', function(e) {
            addClickRipple(e, this);
        });
    });
    
    // Add typing animation to task input
    const taskInput = document.getElementById('taskInput');
    if (taskInput) {
        taskInput.addEventListener('input', function() {
            if (this.value.length > 0) {
                this.classList.add('has-content');
            } else {
                this.classList.remove('has-content');
            }
        });
        
        // Add focus animations
        taskInput.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        taskInput.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    }
}

function addClickRipple(event, element) {
    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('div');
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: rippleEffect 0.6s ease-out;
        pointer-events: none;
        z-index: 1;
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    // Add ripple animation CSS if not exists
    if (!document.querySelector('#ripple-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'ripple-animation-styles';
        style.textContent = `
            @keyframes rippleEffect {
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

function checkAuthentication() {
    const userData = localStorage.getItem('taskflowUser');
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const user = JSON.parse(userData);
        if (!user.name || !user.dateOfBirth) {
            localStorage.removeItem('taskflowUser');
            window.location.href = 'index.html';
            return;
        }
        
        // Set user info in header with animation
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            animateTextChange(userNameElement, user.name);
        }
        
        // Set user avatar with loading animation
        const avatarImg = document.getElementById('userAvatar');
        if (avatarImg) {
            const avatarUrl = `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${encodeURIComponent(user.name)}`;
            
            // Add loading state
            avatarImg.style.opacity = '0.5';
            avatarImg.style.transform = 'scale(0.8)';
            
            avatarImg.onload = function() {
                this.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                this.style.opacity = '1';
                this.style.transform = 'scale(1)';
            };
            
            avatarImg.src = avatarUrl;
        }
        
    } catch (error) {
        localStorage.removeItem('taskflowUser');
        window.location.href = 'index.html';
    }
}

function animateTextChange(element, newText) {
    element.style.transition = 'all 0.3s ease';
    element.style.opacity = '0';
    element.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
        element.textContent = newText;
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
    }, 150);
}

function initializeApp() {
    // Show loading state
    showLoadingState();
    
    // Load tasks from localStorage
    const savedTasks = localStorage.getItem('taskflowTasks');
    if (savedTasks) {
        try {
            tasks = JSON.parse(savedTasks);
        } catch (error) {
            console.error('Error loading saved tasks:', error);
            tasks = { todo: [], completed: [], archived: [] };
        }
    }
    
    // Update UI with animations
    setTimeout(() => {
        updateTaskCountsWithAnimation();
        renderTasksWithAnimation();
        hideLoadingState();
    }, 500);
}

function showLoadingState() {
    const tasksContainer = document.querySelector('.tasks-container');
    if (tasksContainer) {
        tasksContainer.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading your tasks...</p>
            </div>
        `;
        
        const loadingState = tasksContainer.querySelector('.loading-state');
        loadingState.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            color: #a0a0a0;
            animation: fadeIn 0.3s ease-out;
        `;
    }
}

function hideLoadingState() {
    const loadingState = document.querySelector('.loading-state');
    if (loadingState) {
        loadingState.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => {
            // Restore original task lists
            const tasksContainer = document.querySelector('.tasks-container');
            if (tasksContainer) {
                tasksContainer.innerHTML = `
                    <div id="todoTasks" class="task-list active"></div>
                    <div id="completedTasks" class="task-list"></div>
                    <div id="archivedTasks" class="task-list"></div>
                `;
                renderTasksWithAnimation();
            }
        }, 300);
    }
}

function setupEventListeners() {
    // Tab switching with animations
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            switchTabWithAnimation(tab);
        });
    });
    
    // Task submission with enhanced feedback
    const submitBtn = document.getElementById('submitBtn');
    const taskInput = document.getElementById('taskInput');
    
    if (submitBtn) {
        submitBtn.addEventListener('click', addTaskWithAnimation);
    }
    
    if (taskInput) {
        taskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addTaskWithAnimation();
            }
        });
    }
    
    // Sign out with confirmation animation
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', signOutWithAnimation);
    }
}

function switchTabWithAnimation(tab) {
    if (currentTab === tab) return;
    
    const oldTab = currentTab;
    currentTab = tab;
    
    // Animate tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tab) {
            btn.classList.add('active');
        }
    });
    
    // Animate task lists transition
    const oldList = document.getElementById(`${oldTab}Tasks`);
    const newList = document.getElementById(`${tab}Tasks`);
    
    if (oldList && newList) {
        // Fade out old list
        oldList.style.animation = 'fadeOutSlide 0.3s ease-out forwards';
        
        setTimeout(() => {
            oldList.classList.remove('active');
            newList.classList.add('active');
            
            // Fade in new list
            newList.style.animation = 'fadeInSlide 0.4s ease-out forwards';
            
            // Re-animate task cards
            const taskCards = newList.querySelectorAll('.task-card');
            taskCards.forEach((card, index) => {
                card.style.animation = `taskCardSlideIn 0.5s ease-out ${index * 0.1}s both`;
            });
        }, 300);
    }
    
    // Add transition animations CSS if not exists
    if (!document.querySelector('#transition-styles')) {
        const style = document.createElement('style');
        style.id = 'transition-styles';
        style.textContent = `
            @keyframes fadeOutSlide {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(-30px);
                }
            }
            
            @keyframes fadeInSlide {
                from {
                    opacity: 0;
                    transform: translateX(30px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function addTaskWithAnimation() {
    const taskInput = document.getElementById('taskInput');
    const submitBtn = document.getElementById('submitBtn');
    
    if (!taskInput || !submitBtn) return;
    
    const title = taskInput.value.trim();
    
    if (!title) {
        // Shake animation for empty input
        taskInput.style.animation = 'inputShake 0.5s ease-in-out';
        setTimeout(() => {
            taskInput.style.animation = '';
        }, 500);
        
        showNotificationWithAnimation('Error', 'Please enter a task description.', 'error');
        return;
    }
    
    // Add loading state to button
    setButtonLoadingState(submitBtn, true);
    
    // Simulate processing for better UX
    setTimeout(() => {
        const newTask = {
            id: generateTaskId(),
            title: title,
            status: currentTab,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        tasks[currentTab].push(newTask);
        
        // Clear input with animation
        taskInput.style.transition = 'all 0.3s ease';
        taskInput.style.transform = 'scale(0.95)';
        taskInput.value = '';
        
        setTimeout(() => {
            taskInput.style.transform = 'scale(1)';
        }, 150);
        
        saveTasks();
        updateTaskCountsWithAnimation();
        renderTasksWithAnimation();
        
        setButtonLoadingState(submitBtn, false);
        showNotificationWithAnimation('Task Added', `Task added to ${capitalizeFirst(currentTab)}.`, 'success');
    }, 600);
    
    // Add input shake animation CSS if not exists
    if (!document.querySelector('#input-shake-styles')) {
        const style = document.createElement('style');
        style.id = 'input-shake-styles';
        style.textContent = `
            @keyframes inputShake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }
        `;
        document.head.appendChild(style);
    }
}

function setButtonLoadingState(button, isLoading) {
    if (isLoading) {
        button.innerHTML = `
            <div class="loading-spinner" style="width: 16px; height: 16px; margin-right: 8px;"></div>
            Adding...
        `;
        button.disabled = true;
        button.style.opacity = '0.8';
    } else {
        button.innerHTML = 'Submit';
        button.disabled = false;
        button.style.opacity = '1';
    }
}

async function loadInitialData() {
    // Only load dummy data if no tasks exist
    if (tasks.todo.length === 0 && tasks.completed.length === 0 && tasks.archived.length === 0) {
        try {
            showNotificationWithAnimation('Loading', 'Fetching initial tasks...', 'info');
            
            const response = await fetch('https://dummyjson.com/todos');
            const data = await response.json();
            
            // Transform API data to our task format
            const dummyTasks = data.todos.slice(0, 5).map(todo => ({
                id: generateTaskId(),
                title: todo.todo,
                status: 'todo',
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            }));
            
            tasks.todo = dummyTasks;
            saveTasks();
            updateTaskCountsWithAnimation();
            renderTasksWithAnimation();
            
            showNotificationWithAnimation('Success', 'Initial tasks loaded successfully!', 'success');
            
        } catch (error) {
            console.error('Error loading dummy data:', error);
            // Add some default tasks if API fails
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
            updateTaskCountsWithAnimation();
            renderTasksWithAnimation();
            showNotificationWithAnimation('Info', 'Default tasks loaded (API unavailable)', 'info');
        }
    }
}

function moveTaskWithAnimation(taskId, fromStatus, toStatus) {
    const taskIndex = tasks[fromStatus].findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;
    
    const task = tasks[fromStatus][taskIndex];
    
    // Update task data
    task.status = toStatus;
    task.lastModified = new Date().toISOString();
    
    // Move task to new array
    tasks[fromStatus].splice(taskIndex, 1);
    tasks[toStatus].push(task);
    
    saveTasks();
    updateTaskCountsWithAnimation();
    
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
        taskElement.style.animation = 'taskCardSlideOut 0.4s ease-in forwards';
        setTimeout(() => {
            renderTasksWithAnimation();
            showNotificationWithAnimation('Task Updated', `Task moved to ${capitalizeFirst(toStatus)}.`, 'success');
        }, 400);
    } else {
        renderTasksWithAnimation();
        showNotificationWithAnimation('Task Updated', `Task moved to ${capitalizeFirst(toStatus)}.`, 'success');
    }
    
    // Add task card exit animation CSS if not exists
    if (!document.querySelector('#task-exit-styles')) {
        const style = document.createElement('style');
        style.id = 'task-exit-styles';
        style.textContent = `
            @keyframes taskCardSlideOut {
                from {
                    opacity: 1;
                    transform: translateX(0) scale(1);
                }
                to {
                    opacity: 0;
                    transform: translateX(100px) scale(0.8);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function renderTasksWithAnimation() {
    ['todo', 'completed', 'archived'].forEach(status => {
        const container = document.getElementById(`${status}Tasks`);
        if (!container) return;
        
        container.innerHTML = '';
        
        tasks[status].forEach((task, index) => {
            const taskElement = createTaskElementWithAnimation(task, index);
            container.appendChild(taskElement);
        });
    });
}

function renderTasks() {
    renderTasksWithAnimation();
}

function createTaskElementWithAnimation(task, index) {
    const taskCard = document.createElement('div');
    taskCard.className = 'task-card';
    taskCard.setAttribute('data-task-id', task.id);
    
    // Add staggered entrance animation
    taskCard.style.animation = `taskCardSlideIn 0.5s ease-out ${index * 0.1}s both`;
    
    const timestamp = formatTimestamp(task.lastModified);
    
    let statusBadge = '';
    if (task.status === 'archived') {
        statusBadge = '<div class="task-status status-archived">Archived</div>';
    } else if (task.status === 'completed') {
        statusBadge = '<div class="task-status status-completed">Completed</div>';
    }
    
    let actionButtons = '';
    if (task.status === 'todo') {
        actionButtons = `
            <button class="task-btn complete-btn interactive-element" onclick="moveTaskWithAnimation('${task.id}', 'todo', 'completed')">
                ✓ Mark as completed
            </button>
            <button class="task-btn archive-btn interactive-element" onclick="moveTaskWithAnimation('${task.id}', 'todo', 'archived')">
                🗃️ Archive
            </button>
        `;
    } else if (task.status === 'completed') {
        actionButtons = `
            <button class="task-btn move-btn interactive-element" onclick="moveTaskWithAnimation('${task.id}', 'completed', 'todo')">
                ↩️ Move to Todo
            </button>
            <button class="task-btn archive-btn interactive-element" onclick="moveTaskWithAnimation('${task.id}', 'completed', 'archived')">
                🗃️ Archive
            </button>
        `;
    } else if (task.status === 'archived') {
        actionButtons = `
            <button class="task-btn move-btn interactive-element" onclick="moveTaskWithAnimation('${task.id}', 'archived', 'todo')">
                📝 Move to Todo
            </button>
            <button class="task-btn move-btn interactive-element" onclick="moveTaskWithAnimation('${task.id}', 'archived', 'completed')">
                ✓ Mark as completed
            </button>
        `;
    }
    
    taskCard.innerHTML = `
        <div class="task-content">
            <h3 class="task-title">${escapeHtml(task.title)}</h3>
            <div class="task-meta">
                <span class="task-timestamp">${timestamp}</span>
                ${statusBadge}
            </div>
        </div>
        <div class="task-actions">
            ${actionButtons}
        </div>
    `;
    
    // Add task card slide-in animation CSS if not exists
    if (!document.querySelector('#task-card-styles')) {
        const style = document.createElement('style');
        style.id = 'task-card-styles';
        style.textContent = `
            @keyframes taskCardSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    return taskCard;
}

function updateTaskCounts() {
    const todoCount = tasks.todo.length;
    const completedCount = tasks.completed.length;
    const archivedCount = tasks.archived.length;
    
    const todoCountElement = document.getElementById('todoCount');
    const completedCountElement = document.getElementById('completedCount');
    const archivedCountElement = document.getElementById('archivedCount');
    
    if (todoCountElement) todoCountElement.textContent = todoCount;
    if (completedCountElement) completedCountElement.textContent = completedCount;
    if (archivedCountElement) archivedCountElement.textContent = archivedCount;
}

function updateTaskCountsWithAnimation() {
    updateTaskCounts();
    
    // Add count animation to the count elements
    const countElements = [
        document.getElementById('todoCount'),
        document.getElementById('completedCount'),
        document.getElementById('archivedCount')
    ];
    
    countElements.forEach(count => {
        if (count) {
            count.style.animation = 'countPulse 0.3s ease-out';
            setTimeout(() => {
                count.style.animation = '';
            }, 300);
        }
    });
    
    // Add count animation CSS if not exists
    if (!document.querySelector('#count-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'count-animation-styles';
        style.textContent = `
            @keyframes countPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
}

function saveTasks() {
    localStorage.setItem('taskflowTasks', JSON.stringify(tasks));
}

function generateTaskId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const options = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
    };
    return date.toLocaleString(undefined, options);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotificationWithAnimation(title, message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <h4 class="notification-title">${escapeHtml(title)}</h4>
            <p class="notification-message">${escapeHtml(message)}</p>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add notification styles if not exists
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
             .notification {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                padding: 10px;
                max-width: 200px;
                z-index: 1000;
                animation: notificationFadeIn 0.3s ease-out;
                border-left: 4px solid #007bff;
            }
            
            @keyframes notificationFadeIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -60%);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%);
                }
            }
            
            @keyframes notificationFadeOut {
                from {
                    opacity: 1;
                    transform: translate(-50%, -50%);
                }
                to {
                    opacity: 0;
                    transform: translate(-50%, -40%);
                }
            }   }
            
            .notification-title {
                margin: 0 0 2px 0;
                font-size: 12px;
                font-weight: 600;
                color: #333;
            }
            
            .notification-message {
                margin: 0;
                font-size: 11px;
                color: #666;
            }
            
            .notification-close {
                position: absolute;
                top: 8px;
                right: 8px;
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #999;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .notification-close:hover {
                color: #333;
            }
            
            @keyframes notificationSlideIn {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'notificationFadeOut 0.3s ease-out forwards';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, 1000);
}

function signOutWithAnimation() {
    if (confirm('Are you sure you want to sign out?')) {
        // Add fade out animation
        document.body.style.animation = 'fadeOut 0.5s ease-out forwards';
        
        setTimeout(() => {
            localStorage.removeItem('taskflowUser');
            localStorage.removeItem('taskflowTasks');
            window.location.href = 'index.html';
        }, 500);
        
        // Add fade out animation CSS if not exists
        if (!document.querySelector('#fadeout-styles')) {
            const style = document.createElement('style');
            style.id = 'fadeout-styles';
            style.textContent = `
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

