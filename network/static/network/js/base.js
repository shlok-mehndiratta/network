document.addEventListener("DOMContentLoaded", function() {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');

    // Make sure initial loads start on page 1
    if (path.startsWith('/profile/')) {
        const profile_name = path.substring(path.lastIndexOf('/') + 1);
        view_posts(profile_name, 1);
    } else if (view === 'following') {
        view_posts('following', 1);
    } else {
        view_posts('all', 1);
    }

    // Add event listeners to main navigation links to load page 1
    document.querySelector("#all-posts").addEventListener("click", () => view_posts('all', 1));
    document.querySelector("#following").addEventListener("click", () => view_posts('following', 1));
});

function view_posts(profile_name, page = 1) {
    window.scrollTo(0, 0);
    
    // Append the page number to the fetch request
    fetch(`/posts/${profile_name}?page=${page}`)
        .then(response => response.json())
        .then(response_data => {
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

            const posts = response_data.posts;
            
            if (posts && posts.length > 0) {
                posts.forEach(post => {
                    // This entire block for creating a postElement is the same as before
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

        // After showing posts, render the pagination controls
        render_pagination_controls(response_data, profile_name, page);

        });
}

function render_pagination_controls(data, profile_name, current_page) {
    const container = document.getElementById('pagination-container');
    container.innerHTML = '';

    if (data.total_pages <= 1) {
        return; // Don't show controls if there's only one page
    }

    const nav = document.createElement('nav');
    const ul = document.createElement('ul');
    ul.className = 'pagination';

    // "Previous" button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${!data.has_previous ? 'disabled' : ''}`;
    const prevLink = document.createElement('a');
    prevLink.className = 'page-link';
    prevLink.href = '#';
    prevLink.innerHTML = 'Previous';
    prevLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (data.has_previous) {
            view_posts(profile_name, data.current_page - 1);
        }
    });
    prevLi.append(prevLink);
    ul.append(prevLi);

    // Page number buttons
    const cp = data.current_page
    const lp = data.total_pages
    for (let i = (cp <= 3 ? 1 : cp - 2); i <= (lp-cp < 2 ? lp : cp+2); i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === data.current_page ? 'active' : ''}`;
        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = '#';
        pageLink.innerHTML = i;
        pageLink.addEventListener('click', (e) => {
            e.preventDefault();
            view_posts(profile_name, i);
        });
        pageLi.append(pageLink);
        ul.append(pageLi);
    }

    // "Next" button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${!data.has_next ? 'disabled' : ''}`;
    const nextLink = document.createElement('a');
    nextLink.className = 'page-link';
    nextLink.href = '#';
    nextLink.innerHTML = 'Next';
    nextLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (data.has_next) {
            view_posts(profile_name, data.current_page + 1);
        }
    });
    nextLi.append(nextLink);
    ul.append(nextLi);

    nav.append(ul);
    container.append(nav);
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