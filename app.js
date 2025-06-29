// Main application JavaScript for TaskFlow
let currentTab = 'todo';
let tasks = {
    todo: [],
    completed: [],
    archived: []
};

let animationQueue = [];
let isAnimating = false;
let currentSearchTerm = '';
let currentFilter = 'all';
let currentCategoryFilter = '';
let currentPriorityFilter = '';

// Category and priority mappings
const categories = {
    general: { name: 'General', icon: '📋' },
    work: { name: 'Work', icon: '💼' },
    personal: { name: 'Personal', icon: '👤' },
    shopping: { name: 'Shopping', icon: '🛒' },
    health: { name: 'Health', icon: '🏥' },
    learning: { name: 'Learning', icon: '📚' },
    finance: { name: 'Finance', icon: '💰' },
    travel: { name: 'Travel', icon: '✈️' }
};

const priorities = {
    low: { name: 'Low', icon: '🟢', order: 1 },
    medium: { name: 'Medium', icon: '🟡', order: 2 },
    high: { name: 'High', icon: '🟠', order: 3 },
    urgent: { name: 'Urgent', icon: '🔴', order: 4 }
};

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
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            currentSearchTerm = this.value.trim();
            updateClearSearchButton();
            filterAndRenderTasks();
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                filterAndRenderTasks();
            }
        });
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            searchInput.value = '';
            currentSearchTerm = '';
            updateClearSearchButton();
            filterAndRenderTasks();
            searchInput.focus();
        });
    }
    
    // Filter functionality
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all filter buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            currentFilter = this.getAttribute('data-filter');
            filterAndRenderTasks();
        });
    });
    
    // Category and Priority filter functionality
    const categoryFilter = document.getElementById('categoryFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            currentCategoryFilter = this.value;
            filterAndRenderTasks();
        });
    }
    
    if (priorityFilter) {
        priorityFilter.addEventListener('change', function() {
            currentPriorityFilter = this.value;
            filterAndRenderTasks();
        });
    }
    
    // Export/Import functionality
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFileInput = document.getElementById('importFileInput');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    if (importBtn) {
        importBtn.addEventListener('click', function() {
            importFileInput.click();
        });
    }
    
    if (importFileInput) {
        importFileInput.addEventListener('change', handleFileImport);
    }
    
    // Sign out with confirmation animation
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', signOutWithAnimation);
    }
    
    // Keyboard shortcuts
    setupKeyboardShortcuts();
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Don't trigger shortcuts when typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            // Allow Escape to blur input fields
            if (e.key === 'Escape') {
                e.target.blur();
                return;
            }
            
            // Allow Ctrl+shortcuts even in input fields
            if (!e.ctrlKey && !e.metaKey) {
                return;
            }
        }
        
        // Ctrl/Cmd + N: Focus on new task input
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            const taskInput = document.getElementById('taskInput');
            if (taskInput) {
                taskInput.focus();
                taskInput.select();
            }
            showKeyboardShortcutFeedback('Focus on new task input');
            return;
        }
        
        // Ctrl/Cmd + S: Focus on search input
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
            showKeyboardShortcutFeedback('Focus on search');
            return;
        }
        
        // Ctrl/Cmd + E: Export data
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            exportData();
            showKeyboardShortcutFeedback('Export data');
            return;
        }
        
        // Ctrl/Cmd + I: Import data
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
            e.preventDefault();
            const importFileInput = document.getElementById('importFileInput');
            if (importFileInput) {
                importFileInput.click();
            }
            showKeyboardShortcutFeedback('Import data');
            return;
        }
        
        // Ctrl/Cmd + /: Show keyboard shortcuts help
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            showKeyboardShortcutsHelp();
            return;
        }
        
        // Number keys 1-3: Switch tabs (only when not in input)
        if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
            if (e.key === '1') {
                e.preventDefault();
                switchTabWithAnimation('todo');
                showKeyboardShortcutFeedback('Switched to Todo');
                return;
            }
            if (e.key === '2') {
                e.preventDefault();
                switchTabWithAnimation('completed');
                showKeyboardShortcutFeedback('Switched to Completed');
                return;
            }
            if (e.key === '3') {
                e.preventDefault();
                switchTabWithAnimation('archived');
                showKeyboardShortcutFeedback('Switched to Archived');
                return;
            }
        }
        
        // Escape: Clear search
        if (e.key === 'Escape' && currentSearchTerm) {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = '';
                currentSearchTerm = '';
                updateClearSearchButton();
                filterAndRenderTasks();
            }
            showKeyboardShortcutFeedback('Search cleared');
            return;
        }
    });
}

function showKeyboardShortcutFeedback(message) {
    // Create a small feedback notification
    const feedback = document.createElement('div');
    feedback.className = 'keyboard-shortcut-feedback';
    feedback.textContent = message;
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 0.85rem;
        z-index: 1001;
        animation: shortcutFeedbackSlideIn 0.3s ease-out;
        pointer-events: none;
    `;
    
    // Add animation styles if not exists
    if (!document.querySelector('#shortcut-feedback-styles')) {
        const style = document.createElement('style');
        style.id = 'shortcut-feedback-styles';
        style.textContent = `
            @keyframes shortcutFeedbackSlideIn {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
            
            @keyframes shortcutFeedbackSlideOut {
                from {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(feedback);
    
    // Remove after 2 seconds
    setTimeout(() => {
        feedback.style.animation = 'shortcutFeedbackSlideOut 0.3s ease-out forwards';
        setTimeout(() => {
            if (feedback.parentElement) {
                feedback.remove();
            }
        }, 300);
    }, 2000);
}

function showKeyboardShortcutsHelp() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">⌨️ Keyboard Shortcuts</h3>
                <button class="modal-close" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <div class="shortcuts-grid" style="display: grid; grid-template-columns: 1fr 2fr; gap: 15px; margin: 20px 0;">
                    <div style="font-weight: 600; color: #333;">Shortcut</div>
                    <div style="font-weight: 600; color: #333;">Action</div>
                    
                    <div><kbd>Ctrl/Cmd + N</kbd></div>
                    <div>Focus on new task input</div>
                    
                    <div><kbd>Ctrl/Cmd + S</kbd></div>
                    <div>Focus on search input</div>
                    
                    <div><kbd>Ctrl/Cmd + E</kbd></div>
                    <div>Export tasks data</div>
                    
                    <div><kbd>Ctrl/Cmd + I</kbd></div>
                    <div>Import tasks data</div>
                    
                    <div><kbd>1</kbd></div>
                    <div>Switch to Todo tab</div>
                    
                    <div><kbd>2</kbd></div>
                    <div>Switch to Completed tab</div>
                    
                    <div><kbd>3</kbd></div>
                    <div>Switch to Archived tab</div>
                    
                    <div><kbd>Escape</kbd></div>
                    <div>Clear search / Blur input</div>
                    
                    <div><kbd>Ctrl/Cmd + /</kbd></div>
                    <div>Show this help</div>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px; font-size: 0.9rem; color: #666;">
                    <strong>💡 Tip:</strong> Most shortcuts work globally, but number keys only work when not typing in input fields.
                </div>
            </div>
            <div class="modal-actions">
                <button class="modal-btn modal-btn-primary" onclick="closeModal(this)">Got it!</button>
            </div>
        </div>
    `;
    
    // Add kbd styles if not exists
    if (!document.querySelector('#kbd-styles')) {
        const style = document.createElement('style');
        style.id = 'kbd-styles';
        style.textContent = `
            kbd {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 3px;
                padding: 2px 6px;
                font-family: 'Courier New', monospace;
                font-size: 0.85rem;
                color: #495057;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(modal);
    
    // Add click outside to close
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modal.querySelector('.modal-close'));
        }
    });
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
    const categorySelect = document.getElementById('categorySelect');
    const prioritySelect = document.getElementById('prioritySelect');
    const submitBtn = document.getElementById('submitBtn');
    
    if (!taskInput || !submitBtn) return;
    
    const title = taskInput.value.trim();
    const category = categorySelect ? categorySelect.value : 'general';
    const priority = prioritySelect ? prioritySelect.value : 'medium';
    
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
            category: category,
            priority: priority,
            status: currentTab,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        tasks[currentTab].push(newTask);
        
        // Clear input with animation
        taskInput.style.transition = 'all 0.3s ease';
        taskInput.style.transform = 'scale(0.95)';
        taskInput.value = '';
        
        // Reset selects to default
        if (categorySelect) categorySelect.value = 'general';
        if (prioritySelect) prioritySelect.value = 'medium';
        
        setTimeout(() => {
            taskInput.style.transform = 'scale(1)';
        }, 150);
        
        saveTasks();
        updateTaskCountsWithAnimation();
        filterAndRenderTasks();
        
        setButtonLoadingState(submitBtn, false);
        showNotificationWithAnimation('Task Added', `${priorities[priority].icon} ${categories[category].icon} Task added to ${capitalizeFirst(currentTab)}.`, 'success');
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
    filterAndRenderTasks();
}

function renderTasks() {
    filterAndRenderTasks();
}

function filterAndRenderTasks() {
    ['todo', 'completed', 'archived'].forEach(status => {
        const container = document.getElementById(`${status}Tasks`);
        if (!container) return;
        
        container.innerHTML = '';
        
        // Get filtered tasks
        let filteredTasks = getFilteredTasks(status);
        
        // Show search results info if searching
        if (currentSearchTerm && status === currentTab) {
            showSearchResultsInfo(container, filteredTasks.length, tasks[status].length);
        }
        
        // Render filtered tasks
        if (filteredTasks.length === 0 && (currentSearchTerm || currentFilter !== 'all') && status === currentTab) {
            showNoResults(container);
        } else {
            filteredTasks.forEach((task, index) => {
                const taskElement = createTaskElementWithAnimation(task, index);
                container.appendChild(taskElement);
            });
        }
    });
}

function getFilteredTasks(status) {
    let filteredTasks = [...tasks[status]];
    
    // Apply search filter
    if (currentSearchTerm) {
        filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(currentSearchTerm.toLowerCase())
        );
    }
    
    // Apply category filter
    if (currentCategoryFilter) {
        filteredTasks = filteredTasks.filter(task => 
            task.category === currentCategoryFilter
        );
    }
    
    // Apply priority filter
    if (currentPriorityFilter) {
        filteredTasks = filteredTasks.filter(task => 
            task.priority === currentPriorityFilter
        );
    }
    
    // Apply time-based filter
    if (currentFilter !== 'all') {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        filteredTasks = filteredTasks.filter(task => {
            const taskDate = new Date(task.lastModified);
            if (currentFilter === 'recent') {
                return taskDate >= oneDayAgo;
            } else if (currentFilter === 'older') {
                return taskDate < oneDayAgo;
            }
            return true;
        });
    }
    
    // Sort by priority (urgent first) and then by creation date
    filteredTasks.sort((a, b) => {
        const priorityA = priorities[a.priority || 'medium'].order;
        const priorityB = priorities[b.priority || 'medium'].order;
        
        if (priorityA !== priorityB) {
            return priorityB - priorityA; // Higher priority first
        }
        
        // If same priority, sort by creation date (newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    return filteredTasks;
}

function showSearchResultsInfo(container, filteredCount, totalCount) {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'search-results-info';
    
    let infoText = '';
    if (currentSearchTerm && currentFilter !== 'all') {
        infoText = `Found ${filteredCount} of ${totalCount} tasks matching "${currentSearchTerm}" (${currentFilter})`;
    } else if (currentSearchTerm) {
        infoText = `Found ${filteredCount} of ${totalCount} tasks matching "${currentSearchTerm}"`;
    } else if (currentFilter !== 'all') {
        infoText = `Showing ${filteredCount} of ${totalCount} ${currentFilter} tasks`;
    }
    
    infoDiv.textContent = infoText;
    container.appendChild(infoDiv);
}

function showNoResults(container) {
    const noResultsDiv = document.createElement('div');
    noResultsDiv.className = 'no-results';
    
    let message = '';
    if (currentSearchTerm && currentFilter !== 'all') {
        message = `No ${currentFilter} tasks found matching "${currentSearchTerm}"`;
    } else if (currentSearchTerm) {
        message = `No tasks found matching "${currentSearchTerm}"`;
    } else if (currentFilter !== 'all') {
        message = `No ${currentFilter} tasks found`;
    }
    
    noResultsDiv.innerHTML = `
        <div class="no-results-icon">🔍</div>
        <div>${message}</div>
        <div style="margin-top: 10px; font-size: 0.9rem; opacity: 0.7;">
            Try adjusting your search or filter criteria
        </div>
    `;
    
    container.appendChild(noResultsDiv);
}

function updateClearSearchButton() {
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    if (clearSearchBtn) {
        if (currentSearchTerm) {
            clearSearchBtn.style.display = 'flex';
        } else {
            clearSearchBtn.style.display = 'none';
        }
    }
}

function createTaskElementWithAnimation(task, index) {
    const taskCard = document.createElement('div');
    taskCard.className = 'task-card';
    taskCard.setAttribute('data-task-id', task.id);
    
    // Add staggered entrance animation
    taskCard.style.animation = `taskCardSlideIn 0.5s ease-out ${index * 0.1}s both`;
    taskCard.style.position = 'relative';
    
    const timestamp = formatTimestamp(task.lastModified);
    
    // Get category and priority info (with fallbacks for older tasks)
    const category = task.category || 'general';
    const priority = task.priority || 'medium';
    const categoryInfo = categories[category] || categories.general;
    const priorityInfo = priorities[priority] || priorities.medium;
    
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
        <div class="priority-sort-indicator priority-${priority}"></div>
        <div class="task-content">
            <h3 class="task-title">${highlightSearchTerm(escapeHtml(task.title))}</h3>
            <div class="task-metadata-row">
                <span class="task-category category-${category}">${categoryInfo.icon} ${categoryInfo.name}</span>
                <span class="task-priority priority-${priority}">${priorityInfo.icon} ${priorityInfo.name}</span>
            </div>
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

function highlightSearchTerm(text) {
    if (!currentSearchTerm) return text;
    
    const regex = new RegExp(`(${escapeRegex(currentSearchTerm)})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function exportData() {
    try {
        const userData = localStorage.getItem('taskflowUser');
        const user = userData ? JSON.parse(userData) : null;
        
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            user: user ? { name: user.name } : null, // Don't export sensitive data like DOB
            tasks: tasks,
            totalTasks: {
                todo: tasks.todo.length,
                completed: tasks.completed.length,
                archived: tasks.archived.length
            }
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `taskflow-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(link.href);
        
        showNotificationWithAnimation('Export Successful', 'Your tasks have been exported successfully!', 'success');
        
    } catch (error) {
        console.error('Export error:', error);
        showNotificationWithAnimation('Export Failed', 'Failed to export tasks. Please try again.', 'error');
    }
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/json') {
        showNotificationWithAnimation('Invalid File', 'Please select a valid JSON file.', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importData = JSON.parse(e.target.result);
            showImportPreview(importData);
        } catch (error) {
            console.error('Import error:', error);
            showNotificationWithAnimation('Import Failed', 'Invalid JSON file format.', 'error');
        }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

function showImportPreview(importData) {
    // Validate import data structure
    if (!importData.tasks || typeof importData.tasks !== 'object') {
        showNotificationWithAnimation('Invalid Data', 'The file does not contain valid task data.', 'error');
        return;
    }
    
    const { todo = [], completed = [], archived = [] } = importData.tasks;
    const totalImportTasks = todo.length + completed.length + archived.length;
    
    if (totalImportTasks === 0) {
        showNotificationWithAnimation('No Tasks', 'The file does not contain any tasks to import.', 'info');
        return;
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Import Preview</h3>
                <button class="modal-close" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <p><strong>Import Summary:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Todo tasks: ${todo.length}</li>
                    <li>Completed tasks: ${completed.length}</li>
                    <li>Archived tasks: ${archived.length}</li>
                    <li><strong>Total: ${totalImportTasks} tasks</strong></li>
                </ul>
                
                ${importData.exportDate ? `<p><strong>Export Date:</strong> ${new Date(importData.exportDate).toLocaleString()}</p>` : ''}
                ${importData.user?.name ? `<p><strong>Original User:</strong> ${escapeHtml(importData.user.name)}</p>` : ''}
                
                <p style="margin-top: 20px; color: #dc3545; font-weight: 500;">
                    ⚠️ Warning: This will replace all your current tasks!
                </p>
                <p style="color: #666; font-size: 0.9rem;">
                    Current tasks: ${tasks.todo.length + tasks.completed.length + tasks.archived.length} total
                </p>
            </div>
            <div class="modal-actions">
                <button class="modal-btn modal-btn-secondary" onclick="closeModal(this)">Cancel</button>
                <button class="modal-btn modal-btn-primary" onclick="confirmImport(${JSON.stringify(importData).replace(/"/g, '&quot;')})">Import Tasks</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add click outside to close
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modal.querySelector('.modal-close'));
        }
    });
}

function confirmImport(importData) {
    try {
        // Validate and clean import data
        const newTasks = {
            todo: Array.isArray(importData.tasks.todo) ? importData.tasks.todo : [],
            completed: Array.isArray(importData.tasks.completed) ? importData.tasks.completed : [],
            archived: Array.isArray(importData.tasks.archived) ? importData.tasks.archived : []
        };
        
        // Validate each task has required fields
        ['todo', 'completed', 'archived'].forEach(status => {
            newTasks[status] = newTasks[status].filter(task => {
                return task && 
                       typeof task.id === 'string' && 
                       typeof task.title === 'string' && 
                       task.title.trim().length > 0;
            }).map(task => ({
                id: task.id || generateTaskId(),
                title: task.title.trim(),
                status: status,
                createdAt: task.createdAt || new Date().toISOString(),
                lastModified: task.lastModified || new Date().toISOString()
            }));
        });
        
        // Replace current tasks
        tasks = newTasks;
        
        // Save to localStorage
        saveTasks();
        
        // Update UI
        updateTaskCountsWithAnimation();
        filterAndRenderTasks();
        
        // Close modal
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
        
        const totalImported = tasks.todo.length + tasks.completed.length + tasks.archived.length;
        showNotificationWithAnimation('Import Successful', `Successfully imported ${totalImported} tasks!`, 'success');
        
    } catch (error) {
        console.error('Import confirmation error:', error);
        showNotificationWithAnimation('Import Failed', 'Failed to import tasks. Please try again.', 'error');
    }
}

function closeModal(element) {
    const modal = element.closest('.modal-overlay');
    if (modal) {
        modal.style.animation = 'modalFadeOut 0.3s ease-out forwards';
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

function showNotificationWithAnimation(title, message, type) {
    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 300px;
        `;
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Set notification icon based on type
    let icon = '';
    let borderColor = '#007bff';
    switch(type) {
        case 'success':
            icon = '✓';
            borderColor = '#28a745';
            break;
        case 'error':
            icon = '✕';
            borderColor = '#dc3545';
            break;
        case 'info':
            icon = 'ℹ';
            borderColor = '#17a2b8';
            break;
        default:
            icon = '•';
            borderColor = '#007bff';
    }
    
    notification.innerHTML = `
        <div class="notification-icon" style="color: ${borderColor};">${icon}</div>
        <div class="notification-content">
            <div class="notification-title">${escapeHtml(title)}</div>
            <div class="notification-message">${escapeHtml(message)}</div>
        </div>
        <button class="notification-close" onclick="removeNotification(this.parentElement)">×</button>
    `;
    
    // Add notification styles if not exists
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                display: flex;
                align-items: flex-start;
                gap: 10px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                padding: 12px 16px;
                border-left: 4px solid #007bff;
                animation: notificationSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                position: relative;
                overflow: hidden;
                min-height: 60px;
            }
            
            .notification::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
                animation: notificationGlow 2s ease-in-out infinite;
            }
            
            @keyframes notificationGlow {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 1; }
            }
            
            .notification-success {
                border-left-color: #28a745;
            }
            
            .notification-error {
                border-left-color: #dc3545;
            }
            
            .notification-info {
                border-left-color: #17a2b8;
            }
            
            .notification-icon {
                font-size: 16px;
                font-weight: bold;
                margin-top: 2px;
                flex-shrink: 0;
            }
            
            .notification-content {
                flex: 1;
                min-width: 0;
            }
            
            .notification-title {
                font-size: 14px;
                font-weight: 600;
                color: #333;
                margin-bottom: 2px;
                line-height: 1.2;
            }
            
            .notification-message {
                font-size: 12px;
                color: #666;
                line-height: 1.3;
                word-wrap: break-word;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 16px;
                cursor: pointer;
                color: #999;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s ease;
                flex-shrink: 0;
            }
            
            .notification-close:hover {
                color: #333;
                background: rgba(0, 0, 0, 0.1);
            }
            
            @keyframes notificationSlideIn {
                from {
                    opacity: 0;
                    transform: translateX(100%) scale(0.8);
                }
                to {
                    opacity: 1;
                    transform: translateX(0) scale(1);
                }
            }
            
            @keyframes notificationSlideOut {
                from {
                    opacity: 1;
                    transform: translateX(0) scale(1);
                    max-height: 100px;
                    margin-bottom: 10px;
                }
                to {
                    opacity: 0;
                    transform: translateX(100%) scale(0.8);
                    max-height: 0;
                    margin-bottom: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add to notification container
    notificationContainer.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        removeNotification(notification);
    }, 4000);
}

function removeNotification(notification) {
    if (notification && notification.parentElement) {
        notification.style.animation = 'notificationSlideOut 0.4s ease-in forwards';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 400);
    }
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

