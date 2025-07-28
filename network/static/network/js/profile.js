document.addEventListener("DOMContentLoaded", () => {
    // --- FOLLOW/UNFOLLOW LOGIC (No changes here) ---
    const followBtn = document.querySelector('#follow-btn');
    if (followBtn) {
        followBtn.addEventListener('click', handleFollow);
    }
    
    // --- EDIT PROFILE MODAL LOGIC (All changes are here) ---
    const saveButton = document.querySelector('#save-profile-changes');
    const editForm = document.querySelector('#edit-profile-form');

    if (saveButton && editForm) {
        saveButton.addEventListener('click', () => {
            handleProfileUpdate(editForm, saveButton);
        });
    }
    
    // Initial call to load posts
    view_posts(profile_name, 1);
});

/**
 * Handles the profile update form submission with proper UI states and error handling.
 */
function handleProfileUpdate(form, button) {
    // 1. Clear old errors and set the button to a "loading" state
    clearErrors(form);
    button.disabled = true;
    button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...`;

    const formData = new FormData(form);

    fetch('/update-profile/', {
        method: 'POST',
        headers: { 'X-CSRFToken': getCSRFToken() },
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            // On success, update the profile page UI with the new data
            document.querySelector('#profile-full-name').innerText = result.name;
            document.querySelector('#profile-header-name').innerText = result.name.split(' ')[0]; // Show first name in header
            document.querySelector('#profile-username').innerText = `@${result.username}`; // Update username
            document.querySelector('#profile-bio').innerText = result.bio || "No bio provided.";
            if (result.profile_picture_url) {
                document.querySelectorAll('.profile-pic').forEach(img => img.src = result.profile_picture_url);
            }
            
            view_posts(result.username, 1);

            $('#editProfileModal').modal('hide');
        } else {
            displayErrors(result.errors, form);
        }
    })
    .catch(error => {
        // On network or server failure, show a generic alert
        console.error('Profile update failed:', error);
        alert('An unexpected error occurred. Please try again later.');
    })
    .finally(() => {
        // 4. Always restore the button to its original state
        button.disabled = false;
        button.innerHTML = 'Save changes';
    });
}

/**
 * Displays validation errors below the corresponding form fields.
 * @param {object} errors - An object where keys are field names and values are error message arrays.
 * @param {HTMLFormElement} form - The form element to display errors in.
 */
function displayErrors(errors, form) {
    for (const fieldName in errors) {
        const field = form.querySelector(`[name="${fieldName}"]`);
        if (field) {
            // Add Bootstrap's 'is-invalid' class for a red border
            field.classList.add('is-invalid');
            
            // Create and insert the error message element
            const errorContainer = document.createElement('div');
            errorContainer.className = 'invalid-feedback d-block'; // 'd-block' makes it visible
            errorContainer.innerText = errors[fieldName].join(' '); // Join multiple errors for a single field
            
            // Insert the error message right after the form field
            field.parentNode.insertBefore(errorContainer, field.nextSibling);
        }
    }
}

/**
 * Removes all previous validation error messages and styles from a form.
 * @param {HTMLFormElement} form - The form element to clear errors from.
 */
function clearErrors(form) {
    // Remove all old error message divs
    form.querySelectorAll('.invalid-feedback').forEach(msg => msg.remove());
    // Remove the red border from all fields that had errors
    form.querySelectorAll('.is-invalid').forEach(field => field.classList.remove('is-invalid'));
}


// --- Your other functions (handleFollow, getCSRFToken) go here ---
function handleFollow() { /* ... your existing follow logic ... */ }
function getCSRFToken() { /* ... your existing CSRF token logic ... */ }