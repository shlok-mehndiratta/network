document.addEventListener("DOMContentLoaded", () => {
    const follow_btn = document.querySelector('#follow')
    if (follow_btn) {
        follow_btn.addEventListener('click', () => follow(true));
    }

    const unfollow_btn = document.querySelector('#unfollow')
    if (unfollow_btn) {
        unfollow_btn.addEventListener('click', () => follow(false));
    }
    
    view_posts(profile_name);
});   

function follow(bool) {
    if (isAuthenticated !== "true") {
        const currentUrl = window.location.pathname + window.location.search;
        window.location.href = `/login?next=${encodeURIComponent(currentUrl)}`;
        return;
    }
    fetch('/edit-profile', {
        method: "PUT" ,
        headers: {
            "Content-Type": "application/json",  // important
            "X-CSRFToken": getCSRFToken()        // include CSRF token if you're using Django
        },
        body: JSON.stringify({
            follow: Boolean(bool),
            following: profile_name
        })
    })
    .then(() => {
        window.location.reload();
    })
}

// Helper to extract CSRF token from cookies (required for Django PUT/POST/DELETE)
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