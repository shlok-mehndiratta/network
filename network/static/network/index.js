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

    // Additional event listeners can be added here
});
   
 

function newPost(event) {
    event.preventDefault();
    const newPostForm = document.querySelector(".new-post");
    const formData = new FormData(newPostForm);
    fetch("/new-post", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
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
    });
}