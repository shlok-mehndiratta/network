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

    setupProfilePicEditor();
    
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
            
            document.querySelectorAll('.profile-pic').forEach(img => img.src = result.profile_picture_url);

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

/**
 * Handles the follow/unfollow fetch request.
 */
function handleFollow() {
    if (isAuthenticated !== "true") {
        window.location.href = `/login?next=${window.location.pathname}`;
        return;
    }

    const followBtn = document.querySelector('#follow-btn');
    const action = followBtn.dataset.action;

    fetch('/edit-profile', {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken() 
        },
        body: JSON.stringify({
            follow: action === 'follow',
            following: profile_name
        })
    })
    .then(response => {
        if (response.ok) {
            updateFollowUI(); // This function updates the button's appearance
        } else {
            alert('Something went wrong. Please try again.');
        }
    });
}

/**
 * Updates the Follow/Following button and follower count without reloading.
 */
function updateFollowUI() {
    const followBtn = document.querySelector('#follow-btn');
    const followerCountSpan = document.querySelector('#follower-count');
    let currentFollowers = parseInt(followerCountSpan.innerText);

    if (followBtn.dataset.action === 'follow') {
        followBtn.innerText = 'Following';
        followBtn.className = 'btn btn-outline-primary';
        followBtn.dataset.action = 'unfollow';
        followerCountSpan.innerText = currentFollowers + 1;
    } else {
        followBtn.innerText = 'Follow';
        followBtn.className = 'btn btn-primary';
        followBtn.dataset.action = 'follow';
        followerCountSpan.innerText = currentFollowers - 1;
    }
}

/**
 * Gets the CSRF token from cookies.
 */
function getCSRFToken() {
    const name = 'csrftoken';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(name + '=')) {
            return decodeURIComponent(cookie.substring(name.length + 1));
        }
    }
    return '';
}


/**
 * Sets up the interactive profile picture editor in the modal.
 */
function setupProfilePicEditor() {
    // The hidden inputs Django rendered
    const realFileInput = document.querySelector('#id_profile_picture');
    const clearCheckbox = document.querySelector('#profile_picture-clear_id');

    // Our custom UI elements
    const changeBtn = document.querySelector('#change-pic-btn');
    const removeBtn = document.querySelector('#remove-pic-btn');
    const previewImage = document.querySelector('.profile-pic-preview');

    // If these elements don't exist on the page, do nothing
    if (!realFileInput || !changeBtn || !removeBtn || !previewImage) {
        return;
    }

    // When the user clicks our "Change Photo" button, trigger the hidden file input
    changeBtn.addEventListener('click', () => {
        realFileInput.click();
    });

    

    // When the user clicks "Remove", check the hidden "clear" checkbox
    // and update the preview to the default image.
    removeBtn.addEventListener('click', () => {
        if (clearCheckbox) {
            clearCheckbox.checked = true;
        }
        realFileInput.value = null; // Clear any selected file

        previewImage.src = '/media/default.jpg'; 
    });
    

    // When a new file is selected in the hidden input, show a live preview
    realFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            // Use FileReader to get the image data
            const reader = new FileReader();
            reader.onload = (e) => {
                // Update the preview image src to show the new image
                previewImage.src = e.target.result;
            };
            reader.readAsDataURL(file);

            // Uncheck the "clear" box if it was checked
            if (clearCheckbox) {
                clearCheckbox.checked = false;
            }
        }
    });
}
