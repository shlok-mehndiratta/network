document.addEventListener("DOMContentLoaded", function() {
    // New post form submission handler
    if (document.querySelector(".new-post")) {
        document.querySelector(".new-post").addEventListener("submit", newPost);
        document.querySelector(".new-post-content").addEventListener("keyup", function(event) {
            console.log("Keyup event fired");
                if (event.target.value.trim() === "") {
                    document.querySelector(".new-post-submit").disabled = true;
                } else {
                    document.querySelector(".new-post-submit").disabled = false;
                }
        });
    }

    // view profile page of individual  user
    document.querySelectorAll(".profile").forEach(element => {element.addEventListener("click", () => view_posts('my-posts'))});
    view_posts('all');
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
