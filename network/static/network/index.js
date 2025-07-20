document.addEventListener("DOMContentLoaded", () => {
    // New post form submission handler
    document.querySelector(".new-post").addEventListener("submit", newPost);
    document.querySelector(".new-post-content").addEventListener("keyup", function(event) {
        console.log("Keyup event fired");
            if (event.target.value.trim() === "") {
                document.querySelector(".new-post-submit").disabled = true;
            } else {
                document.querySelector(".new-post-submit").disabled = false;
            }
    });

    // All posts page to view all posts
    document.querySelector("#all-posts").addEventListener("click", view_posts);
    view_posts();
});   
 

function newPost(event) {
    event.preventDefault();
    const newPostForm = document.querySelector(".new-post");
    const formData = new FormData(newPostForm);
    fetch("/new-post", {
        method: "POST",
        body: formData
    })
    .then(response => {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return response.json();
        } else {
            // Probably got redirected to login page (HTML)
            window.location.href = "/login/?next=/new-post";
            throw new Error("Not authenticated");
        }
    })
    .then(data => {
        if (data.success) {
            // Handle successful post creation
            alert("Post created successfully!");
            // Optionally, you can redirect or update the UI to show the new post
            window.location.reload(); // Reload the page to show the new post
        } else {
            // Handle errors
            alert(data.error || "An error occurred while creating the post.");
        }
    })
};

function view_posts(event) {
    fetch('/posts')
    .then((response) => response.json())  // gets the list of all the posts and its details
    .then((posts) => {
        console.log("fetched successfully")
        posts.forEach((post) => {

            const postcontent = document.createElement('div');
            postcontent.className = 'card border-dark mb-2';
            postcontent.innerHTML = `
            <div class="card-body">
                <figcaption class="blockquote-header mb-2 ">
                    <img src="/static/network/assets/user.jpeg" alt="User" class="rounded-circle me-2" style="width: 35px; height: 35px;">
                    <cite title="username">${post.user}</cite>
                    <span class="card-text float-right"><small class="text-body-secondary">${post.timestamp}</small></span>
                </figcaption>
                <figure>
                <p class="card-text">${post.content}</p>        
                </figure>
                <p class="card-text">
                    <span>
                        ${!post.liked_by_user 
                            ? '<img class="like-btn" src="/static/network/assets/icons/heart.svg" alt="Like">'
                            : '<img class="like-btn ml-4" src="static/network/assets/icons/red-heart.svg" alt="Liked"></img>'
                        }
                        ${post.likes_count}
                        <img class="like-btn ml-5" src="/static/network/assets/icons/comment.svg" alt="comment">
                    </span>
                </p>
            </div>
            `
            // Appends data to posts div
            document.querySelector('.posts').append(postcontent);

        });
    })
}
