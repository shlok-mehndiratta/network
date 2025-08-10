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
    const allPostsLink = document.querySelector("#all-posts");
    if (allPostsLink) {
        allPostsLink.addEventListener("click", () => view_posts('all', 1));
    }

    const followingLink = document.querySelector("#following");
    if (followingLink) {
        followingLink.addEventListener("click", () => view_posts('following', 1));
    }
});

// to close the commments section when user clicks anywhere else
document.addEventListener('click', function(event) {
    // Find all comment sections that are currently visible
    const openCommentSections = document.querySelectorAll('.comments-section[style*="display: block"]');
    
    openCommentSections.forEach(section => {
        // Check if the click happened outside the section AND outside its corresponding comment button
        const postElement = section.closest('.card');
        const commentBtn = postElement.querySelector('.comment-btn');

        if (!section.contains(event.target) && !commentBtn.contains(event.target)) {
            section.style.display = 'none';
        }
    });
});

function view_posts(profile_name, page = 1) {
    // Stop the function if profile_name is missing.
    if (!profile_name) {
        console.error("view_posts was called without a profile_name. Aborting fetch.");
        return;
    }

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
                            <img src="${post.profile_picture_url}" alt="profile picture" class="rounded-circle me-2" style="width: 35px; height: 35px;">
                            <a href="/profile/${post.username}" class="profile"><b>${post.name}</b></a>
                            <cite title="username">(${post.username})</cite>
                            <span class="card-text float-right"><small class="text-body-secondary">${post.timestamp}</small></span>
                            ${post.username == currentUsername ? `<button class="edit-btn btn btn-outline-primary px-1 py-0 mx-2 float-right">✎</button>` : ''}
                        </figcaption>
                        <figure>
                            <p class="card-text post-content-text">${post.content}</p>
                        </figure>
                        <p class="card-text">
                            <span class="like-section">
                                <img class="like-btn" 
                                    src="${post.liked_by_user ? '/static/network/assets/icons/red-heart.svg' : '/static/network/assets/icons/heart.svg'}" 
                                    alt="${post.liked_by_user ? 'Liked' : 'Like'}" 
                                    style="cursor: pointer;">
                                <span class="likes-count">${post.likes_count}</span>
                                </span>
                            <img class="comment-btn ml-4" src="/static/network/assets/icons/comment.svg" alt="comment" style="cursor: pointer;">
                            <span class="comments-count">${post.comments_count || 0}</span> </p>

                        <div class="comments-section" id="comments-section-${post.id}" style="display: none;">
                            <div class="add-comment-form my-2">
                                <textarea class="form-control form-control-sm" placeholder="Add a comment..."></textarea>
                                <button class="btn btn-primary btn-sm mt-1 post-comment-btn">Post</button>
                            </div>
                            <div class="comments-list border-top">
                                </div>
                        </div>
                        </p>
                    </div>
                    `;
                    
                    postsContainer.append(postElement);
                
                    // Add the event listener logic for the edit button
                    const editButton = postElement.querySelector('.edit-btn');
                    if (editButton) {
                        editButton.addEventListener('click', () => {

                            if (postElement.querySelector('.edit-container')) {
                                return; 
                            }

                            const contentP = postElement.querySelector('.post-content-text');
                            const currentContent = contentP.innerText;

                            // Create the edit view elements
                            const editContainer = document.createElement('div');
                            editContainer.className = 'edit-container';
                            editContainer.innerHTML = `
                                <textarea class="form-control" rows="3">${currentContent}</textarea>
                                <button class="btn btn-primary btn-sm mt-2 save-btn">Save</button>
                            `;

                            // Hide the original paragraph and show the edit view
                            contentP.style.display = 'none';
                            contentP.after(editContainer);

                            // Add listener for the new "Save" button
                            const saveButton = editContainer.querySelector('.save-btn');
                            saveButton.addEventListener('click', () => {
                                const newContent = editContainer.querySelector('textarea').value;

                                fetch(`/edit-post/${post.id}`, {
                                    method: 'PUT',
                                    headers: { 'X-CSRFToken': getCSRFToken(), 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        content: newContent
                                    })
                                })
                                .then(response => response.json())
                                .then(result => {
                                    // Update the original paragraph's content
                                    contentP.innerText = result.content;

                                    // Remove the edit view and show the updated paragraph
                                    editContainer.remove();
                                    contentP.style.display = 'block';
                                });
                            });
                        });
                    }

                    const likeBtn = postElement.querySelector('.like-btn');
                    if (likeBtn) {
                        likeBtn.addEventListener('click', () => {
                            // This check is still good practice
                            if (isAuthenticated !== "true") {
                                window.location.href = '/login';
                                return;
                            }

                            // Determine if the post is currently liked based on the image's alt text
                            const isCurrentlyLiked = likeBtn.alt === 'Liked';
                            
                            // Correctly build the fetch request
                            fetch(`/edit-post/${post.id}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json', // Tell the server we're sending JSON
                                    'X-CSRFToken': getCSRFToken()
                                },
                                // Include the JSON data in the body
                                body: JSON.stringify({
                                    liked: !isCurrentlyLiked // Send the opposite of the current state
                                })
                            })
                            .then(response => response.json())
                            .then(result => {
                                // Update the UI based on the new state from the server
                                const likesCountSpan = postElement.querySelector('.likes-count');
                                likesCountSpan.innerText = result.likes_count ?? 0;

                                if (result.liked) {
                                    likeBtn.src = '/static/network/assets/icons/red-heart.svg';
                                    likeBtn.alt = 'Liked';
                                } else {
                                    likeBtn.src = '/static/network/assets/icons/heart.svg';
                                    likeBtn.alt = 'Like';
                                }
                            })
                            .catch(error => console.error('Error liking post:', error));
                        });
                    }

                    // Event listener for comments section
                    const commentBtn = postElement.querySelector('.comment-btn');
                    const commentsSection = postElement.querySelector(`#comments-section-${post.id}`);
                    const commentTextarea = commentsSection.querySelector('textarea');

                    // When the comment button is clicked
                    commentBtn.addEventListener('click', (event) => {
                        event.stopPropagation();
                        
                        const isHidden = commentsSection.style.display === 'none';
                        commentsSection.style.display = isHidden ? 'block' : 'none';

                        if (isHidden) {
                            // Now it focuses on the correct textarea
                            commentTextarea.focus();

                            const commentsList = commentsSection.querySelector('.comments-list');
                            if (commentsList.children.length === 0) {
                                // Fetch comments only if the list is empty
                                fetch(`/post/${post.id}/comments`)
                                    .then(response => response.json())
                                    .then(comments => {
                                        if (comments.length > 0) {
                                            comments.forEach(comment => {
                                                const commentElement = document.createElement('div');
                                                commentElement.className = 'comment mb-2 medium';
                                                commentElement.innerHTML = `
                                                    <img src="${comment.profile_picture_url}" class="rounded-circle mr-1" style="width:25px; height:25px; object-fit:cover;">
                                                    <strong>${comment.username}</strong>: ${comment.content}
                                                `;
                                                commentsList.append(commentElement);
                                            });
                                        } else {
                                            // If there are no comments, show a message
                                            const noCommentsMessage = document.createElement('p');
                                            noCommentsMessage.className = 'text-muted small text-center my-2';
                                            noCommentsMessage.innerText = 'No comments yet. Be the first!';
                                            commentsList.append(noCommentsMessage);
                                        }
                                    });
                            }
                        }
                    });

                    // Logic for submitting a new comment
                    const postCommentBtn = commentsSection.querySelector('.post-comment-btn');
                    // This block now correctly uses the 'commentTextarea' variable defined above
                    postCommentBtn.addEventListener('click', () => {
                        if (isAuthenticated !== 'true') {
                            window.location.href = '/login';
                            return;
                        }
                        const content = commentTextarea.value;
                        if (!content) return;

                        fetch(`/post/${post.id}/comments`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRFToken() },
                            body: JSON.stringify({ content: content })
                        })
                        .then(response => response.json())
                        .then(newComment => {
                            const commentsList = commentsSection.querySelector('.comments-list');
                            const noCommentsMessage = commentsList.querySelector('.text-muted');
                            if (noCommentsMessage) {
                                noCommentsMessage.remove();
                            }
                            const commentElement = document.createElement('div');
                            commentElement.className = 'comment mb-2';
                            commentElement.innerHTML = `
                                <img src="${newComment.profile_picture_url || defaultProfilePicUrl}" class="rounded-circle" style="width:25px; height:25px; object-fit:cover;">
                                <strong>${newComment.username}</strong>: ${newComment.content}
                            `;
                            commentsList.prepend(commentElement);
                            
                            const commentsCountSpan = postElement.querySelector('.comments-count');
                            const currentCount = parseInt(commentsCountSpan.innerText) || 0;
                            commentsCountSpan.innerText = currentCount + 1;

                            commentTextarea.value = '';
                        });
                    });
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