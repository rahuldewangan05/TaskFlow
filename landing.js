// Simplified Landing page JavaScript for TaskFlow
document.addEventListener('DOMContentLoaded', function() {
    // Check if user data already exists
    checkExistingUser();
    
    // Form submission handler
    const form = document.getElementById('verificationForm');
    form.addEventListener('submit', handleFormSubmission);
});

function checkExistingUser() {
    const userData = localStorage.getItem('taskflowUser');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            if (user.name && user.dateOfBirth && isValidAge(user.dateOfBirth)) {
                window.location.href = 'app.html';
            }
        } catch (error) {
            localStorage.removeItem('taskflowUser');
        }
    }
}

function handleFormSubmission(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('fullName').value.trim();
    const dateOfBirth = document.getElementById('dateOfBirth').value;
    const submitBtn = document.querySelector('.verify-btn');
    
    // Clear previous error messages
    hideError();
    
    // Add loading state
    setButtonLoading(submitBtn, true);
    
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
        
        // Redirect to app
        setTimeout(() => {
            window.location.href = 'app.html';
        }, 1000);
        
    } catch (error) {
        setButtonLoading(submitBtn, false);
        showError('Unable to save your information. Please try again.');
    }
}

function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.innerHTML = 'Verifying...';
        button.disabled = true;
    } else {
        button.innerHTML = '✓ Verify & Continue';
        button.disabled = false;
    }
}

function isValidAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    
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
}

function hideError() {
    const errorElement = document.getElementById('errorMessage');
    errorElement.style.display = 'none';
}

