// Landing page JavaScript for TaskFlow
document.addEventListener('DOMContentLoaded', function() {
    // Initialize animations and interactions
    initializeAnimations();
    
    // Check if user data already exists
    checkExistingUser();
    
    // Form submission handler
    const form = document.getElementById('verificationForm');
    form.addEventListener('submit', handleFormSubmission);
    
    // Add enhanced input interactions
    setupInputAnimations();
    
    // Add floating elements animation
    createFloatingElements();
});

function initializeAnimations() {
    // Add staggered animation classes to form elements
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach((group, index) => {
        group.style.animationDelay = `${1.4 + (index * 0.2)}s`;
    });
    
    // Add interactive classes to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.classList.add('interactive-element');
    });
}

function createFloatingElements() {
    // Create floating particles for enhanced visual appeal
    const container = document.querySelector('.container');
    
    for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.className = 'floating-particle';
        particle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: rgba(102, 126, 234, 0.3);
            border-radius: 50%;
            pointer-events: none;
            animation: floatParticle ${8 + Math.random() * 4}s ease-in-out infinite;
            animation-delay: ${Math.random() * 2}s;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
        `;
        container.appendChild(particle);
    }
    
    // Add CSS for floating particles
    if (!document.querySelector('#particle-styles')) {
        const style = document.createElement('style');
        style.id = 'particle-styles';
        style.textContent = `
            @keyframes floatParticle {
                0%, 100% {
                    transform: translateY(0px) translateX(0px) scale(1);
                    opacity: 0.3;
                }
                25% {
                    transform: translateY(-20px) translateX(10px) scale(1.2);
                    opacity: 0.6;
                }
                50% {
                    transform: translateY(-10px) translateX(-15px) scale(0.8);
                    opacity: 0.8;
                }
                75% {
                    transform: translateY(-30px) translateX(5px) scale(1.1);
                    opacity: 0.4;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function setupInputAnimations() {
    const inputs = document.querySelectorAll('input');
    
    inputs.forEach(input => {
        // Add focus animations
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
            addRippleEffect(this);
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
        
        // Add typing animation
        input.addEventListener('input', function() {
            if (this.value) {
                this.classList.add('has-content');
            } else {
                this.classList.remove('has-content');
            }
        });
    });
}

function addRippleEffect(element) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple-effect';
    ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(102, 126, 234, 0.3);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
        width: 20px;
        height: 20px;
        left: 50%;
        top: 50%;
        margin-left: -10px;
        margin-top: -10px;
    `;
    
    element.parentElement.style.position = 'relative';
    element.parentElement.appendChild(ripple);
    
    // Add ripple animation CSS if not exists
    if (!document.querySelector('#ripple-styles')) {
        const style = document.createElement('style');
        style.id = 'ripple-styles';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
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

function checkExistingUser() {
    const userData = localStorage.getItem('taskflowUser');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            if (user.name && user.dateOfBirth && isValidAge(user.dateOfBirth)) {
                // Show loading animation before redirect
                showLoadingTransition();
                setTimeout(() => {
                    window.location.href = 'app.html';
                }, 1500);
            }
        } catch (error) {
            // Clear invalid data
            localStorage.removeItem('taskflowUser');
        }
    }
}

function showLoadingTransition() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <p>Welcome back! Loading your tasks...</p>
        </div>
    `;
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(26, 26, 46, 0.95);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.5s ease-out;
    `;
    
    const loadingContent = overlay.querySelector('.loading-content');
    loadingContent.style.cssText = `
        text-align: center;
        color: white;
        animation: slideInUp 0.8s ease-out 0.2s both;
    `;
    
    document.body.appendChild(overlay);
}

function handleFormSubmission(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('fullName').value.trim();
    const dateOfBirth = document.getElementById('dateOfBirth').value;
    const submitBtn = document.querySelector('.verify-btn');
    
    // Clear previous error messages
    hideError();
    
    // Add loading state to button
    setButtonLoading(submitBtn, true);
    
    // Simulate processing time for better UX
    setTimeout(() => {
        // Validate inputs
        if (!fullName) {
            setButtonLoading(submitBtn, false);
            showError('Please enter your full name.');
            return;
        }
        
        if (!dateOfBirth) {
            setButtonLoading(submitBtn, false);
            showError('Please enter your date of birth.');
            return;
        }
        
        // Validate age
        if (!isValidAge(dateOfBirth)) {
            setButtonLoading(submitBtn, false);
            showError('You must be over 10 years old to access TaskFlow.');
            return;
        }
        
        // Save user data
        const userData = {
            name: fullName,
            dateOfBirth: dateOfBirth,
            registrationDate: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('taskflowUser', JSON.stringify(userData));
            
            // Show success animation
            showSuccessAnimation();
            
            // Redirect to app after animation
            setTimeout(() => {
                window.location.href = 'app.html';
            }, 2000);
            
        } catch (error) {
            setButtonLoading(submitBtn, false);
            showError('Unable to save your information. Please try again.');
        }
    }, 800);
}

function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.innerHTML = `
            <div class="loading-spinner" style="width: 16px; height: 16px; margin-right: 8px;"></div>
            Verifying...
        `;
        button.disabled = true;
        button.style.opacity = '0.8';
    } else {
        button.innerHTML = `
            <span class="check-icon">✓</span>
            Verify & Continue
        `;
        button.disabled = false;
        button.style.opacity = '1';
    }
}

function showSuccessAnimation() {
    const formContainer = document.querySelector('.form-container');
    
    // Create success overlay
    const successOverlay = document.createElement('div');
    successOverlay.className = 'success-overlay';
    successOverlay.innerHTML = `
        <div class="success-content">
            <div class="success-icon">✓</div>
            <h3>Verification Successful!</h3>
            <p>Welcome to TaskFlow. Redirecting to your dashboard...</p>
        </div>
    `;
    
    successOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(16, 185, 129, 0.95);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 16px;
        animation: successSlideIn 0.5s ease-out;
    `;
    
    const successContent = successOverlay.querySelector('.success-content');
    successContent.style.cssText = `
        text-align: center;
        color: white;
    `;
    
    const successIcon = successOverlay.querySelector('.success-icon');
    successIcon.style.cssText = `
        font-size: 3rem;
        margin-bottom: 1rem;
        animation: successBounce 0.8s ease-out 0.2s both;
    `;
    
    formContainer.style.position = 'relative';
    formContainer.appendChild(successOverlay);
    
    // Add success animation styles
    if (!document.querySelector('#success-styles')) {
        const style = document.createElement('style');
        style.id = 'success-styles';
        style.textContent = `
            @keyframes successSlideIn {
                from {
                    opacity: 0;
                    transform: scale(0.8);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            @keyframes successBounce {
                0% {
                    transform: scale(0);
                }
                50% {
                    transform: scale(1.2);
                }
                100% {
                    transform: scale(1);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function isValidAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    
    // Calculate age
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age > 10;
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Add shake animation
    errorElement.style.animation = 'none';
    setTimeout(() => {
        errorElement.style.animation = 'errorShake 0.5s ease-in-out';
    }, 10);
    
    // Scroll to error message
    errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideError() {
    const errorElement = document.getElementById('errorMessage');
    errorElement.style.display = 'none';
}

// Enhanced input event listeners for real-time validation feedback
document.getElementById('fullName').addEventListener('input', function() {
    const isValid = this.value.trim().length > 0;
    updateInputValidation(this, isValid);
});

document.getElementById('dateOfBirth').addEventListener('change', function() {
    const isValid = this.value && isValidAge(this.value);
    updateInputValidation(this, isValid);
    
    if (this.value && !isValid) {
        showError('You must be over 10 years old to access TaskFlow.');
    } else if (isValid) {
        hideError();
    }
});

function updateInputValidation(input, isValid) {
    if (isValid) {
        input.style.borderColor = 'rgba(16, 185, 129, 0.5)';
        input.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
    } else if (input.value) {
        input.style.borderColor = 'rgba(239, 68, 68, 0.5)';
        input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
    } else {
        input.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        input.style.boxShadow = 'none';
    }
}

// Add page transition effects
window.addEventListener('beforeunload', function() {
    document.body.style.animation = 'fadeOut 0.3s ease-out';
});

// Add CSS for additional animations
if (!document.querySelector('#additional-styles')) {
    const style = document.createElement('style');
    style.id = 'additional-styles';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        .form-group.focused label {
            color: #667eea !important;
            transform: translateY(-2px);
        }
        
        .has-content {
            background: rgba(255, 255, 255, 0.15) !important;
        }
    `;
    document.head.appendChild(style);
}

