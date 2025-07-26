document.addEventListener("DOMContentLoaded", function() {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');

    // 1. Check if it's a profile page first
    if (path.startsWith('/profile/')) {
        view_posts(profile_name); 
    } 
    // 2. If not a profile page, check for the 'following' view parameter
    else if (view === 'following') {
        view_posts('following');
    } 
    // 3. Otherwise, default to the 'all' posts view
    else {
        view_posts('all');
    }

    // All posts page to view all posts
    document.querySelector("#all-posts").addEventListener("click", () => view_posts('all'));
    // document.querySelector("#profile").addEventListener("click", () => view_posts(profile_name));
    document.querySelector("#following").addEventListener("click", () => view_posts('following'));

    
}); 


function view_posts(profile_name) {
    fetch(`/posts/${profile_name}`)
    .then((response) => response.json())
    .then((data) => {
        // Clear previous content
        const postsContainer = document.querySelector('.posts');
        postsContainer.innerHTML = '';
        const postsHeader = document.querySelector('.posts-header');
        if (postsHeader){
            postsHeader.innerHTML = '';

            // Add a heading (optional but good practice)
            const heading = document.createElement('h3');
            heading.className = 'mb-2';
            if (profile_name === 'all') {
                heading.innerHTML = 'All Posts';
            } else if (profile_name === 'following') {
                heading.innerHTML = 'Following';
            }
            postsHeader.append(heading);
        }

        if (data && data.length > 0) {
        data.forEach((post) => {
            const postElement = document.createElement('div');
            postElement.className = 'card border-dark mb-2';
            postElement.innerHTML = `
            <div class="card-body">
                <figcaption class="blockquote-header mb-2">
                    <img src="/static/network/assets/user.jpeg" alt="User" class="rounded-circle me-2" style="width: 35px; height: 35px;">
                    <a href="/profile/${post.username}" class="profile"><b>${post.name}</b></a>
                    <cite title="username">(${post.username})</cite>
                    <span class="card-text float-right"><small class="text-body-secondary">${post.timestamp}</small></span>
                    ${post.username == currentUsername ? `<button class="edit btn btn-outline-primary px-1 py-0 mx-2 float-right">✎</button>` : ''}
                </figcaption>
                <figure>
                    <p class="card-text">${post.content}</p>
                </figure>
                <p class="card-text">
                    <span class="like-section">
                        <img class="like-btn" 
                             src="${post.liked_by_user ? '/static/network/assets/icons/red-heart.svg' : '/static/network/assets/icons/heart.svg'}" 
                             alt="${post.liked_by_user ? 'Liked' : 'Like'}" 
                             style="cursor: pointer;">
                        <span class="likes-count">${post.likes_count}</span>
                    </span>
                    <img class="comment-btn ml-4" src="/static/network/assets/icons/comment.svg" alt="comment">
                </p>
            </div>
            `;
            
            // Add event listener for the like button
            const likeBtn = postElement.querySelector('.like-btn');
            likeBtn.addEventListener('click', () => {
                fetch(`/edit-post/${post.id}`, {
                    method: 'PUT',
                    headers: { 'X-CSRFToken': getCSRFToken() } // Assuming getCSRFToken() exists from your profile.js
                })
                .then(response => response.json())
                .then(result => {
                    // Update the like button and count without reloading
                    const likesCountSpan = postElement.querySelector('.likes-count');
                    likesCountSpan.innerText = result.likes_count;
                    if (result.liked) {
                        likeBtn.src = '/static/network/assets/icons/red-heart.svg';
                        likeBtn.alt = 'Liked';
                    } else {
                        likeBtn.src = '/static/network/assets/icons/heart.svg';
                        likeBtn.alt = 'Like';
                    }
                });
            });

            postsContainer.append(postElement);
        });

  

    } else {
         // If the data array is empty, display the "No Posts" message.
        const noPostsMessage = document.createElement('div');
        noPostsMessage.className = 'text-center text-muted p-5';
        noPostsMessage.innerHTML = `<h3>No Posts Found</h3>`;
        postsContainer.append(noPostsMessage);
    }
    });
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