// Landing page script for TaskFlow
// Had to implement age verification because of legal requirements - pain in the butt but necessary

document.addEventListener('DOMContentLoaded', function() {
    // First thing we do is check if someone's already logged in
    // No point making them fill out the form again if they're already verified
    checkExistingUser();
    
    // Set up the form submission handler
    const form = document.getElementById('verificationForm');
    form.addEventListener('submit', handleFormSubmission);
});

function checkExistingUser() {
    // Grab whatever user data we might have stored
    const userData = localStorage.getItem('taskflowUser');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            // Make sure we actually have the data we need and they're old enough
            if (user.name && user.dateOfBirth && isValidAge(user.dateOfBirth)) {
                // All good, send them straight to the app
                window.location.href = 'app.html';
            }
        } catch (error) {
            // Something's wrong with the stored data, better clear it out
            // This happens sometimes when localStorage gets corrupted
            localStorage.removeItem('taskflowUser');
        }
    }
}

function handleFormSubmission(event) {
    // Stop the form from doing its default submit behavior
    event.preventDefault();
    
    // Get the values from the form fields
    const fullName = document.getElementById('fullName').value.trim();
    const dateOfBirth = document.getElementById('dateOfBirth').value;
    const errorMessage = document.getElementById('errorMessage');
    
    // Clear any previous error messages first
    hideError();
    
    // Basic validation - make sure they actually entered something
    if (!fullName) {
        showError('Please enter your full name.');
        return;
    }
    
    if (!dateOfBirth) {
        showError('Please enter your date of birth.');
        return;
    }
    
    // This is the important part - age validation
    // We need to make sure they're over 10 years old
    if (!isValidAge(dateOfBirth)) {
        showError('You must be over 10 years old to access TaskFlow.');
        return;
    }
    
    // Everything looks good, let's save their info
    const userData = {
        name: fullName,
        dateOfBirth: dateOfBirth,
        registrationDate: new Date().toISOString() // Keep track of when they signed up
    };
    
    try {
        localStorage.setItem('taskflowUser', JSON.stringify(userData));
        // Success! Send them to the main app
        window.location.href = 'app.html';
    } catch (error) {
        // localStorage can fail if it's full or disabled
        showError('Unable to save your information. Please try again.');
    }
}

function isValidAge(dateOfBirth) {
    // Calculate their age based on today's date
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    
    // Start with the year difference
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust if they haven't had their birthday this year yet
    // This was tricky to get right - had to account for month and day
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age > 10; // Must be over 10, not 10 or older
}

function showError(message) {
    // Display the error message to the user
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Scroll to the error so they can see it
    // This is helpful on mobile where the form might be long
    errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideError() {
    // Hide any existing error messages
    const errorElement = document.getElementById('errorMessage');
    errorElement.style.display = 'none';
}

// Real-time validation feedback - makes the form feel more responsive
// I added this because users like immediate feedback when typing

document.getElementById('fullName').addEventListener('input', function() {
    // Change border color based on whether they've entered something
    if (this.value.trim()) {
        this.style.borderColor = 'rgba(102, 126, 234, 0.5)'; // Blue for valid
    } else {
        this.style.borderColor = 'rgba(255, 255, 255, 0.2)'; // Default
    }
});

document.getElementById('dateOfBirth').addEventListener('change', function() {
    // Validate age in real-time and show visual feedback
    if (this.value && isValidAge(this.value)) {
        this.style.borderColor = 'rgba(16, 185, 129, 0.5)'; // Green for valid age
        hideError(); // Clear any existing error
    } else if (this.value) {
        this.style.borderColor = 'rgba(239, 68, 68, 0.5)'; // Red for invalid age
    } else {
        this.style.borderColor = 'rgba(255, 255, 255, 0.2)'; // Default
    }
});

