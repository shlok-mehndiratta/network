document.addEventListener("DOMContentLoaded", function() {
    // All posts page to view all posts
    document.querySelector("#all-posts").addEventListener("click", () => view_posts('all'));
    document.querySelector("#profile").addEventListener("click", () => view_posts(profile_name));
}); 


function view_posts(profile_name) {
    fetch(`/posts/${profile_name}`)
    .then((response) => response.json())  // gets the list of all the posts and its details
    .then((data) => {
        console.log(profile_name)
        data.forEach((post) => {

            const postcontent = document.createElement('div');
            postcontent.className = 'card border-dark mb-2';
            postcontent.innerHTML = `
            <div class="card-body">
                <figcaption class="blockquote-header mb-2">
                    <img src="/static/network/assets/user.jpeg" alt="User" class="rounded-circle me-2" style="width: 35px; height: 35px;">
                    <a title="name" href="/profile/${post.username}" class="profile" class="pl-2 pr-1"><b>${post.name}</b></a> 
                    <cite title="username">(${post.username})</cite>
                    <span class="card-text float-right"><small class="text-body-secondary">${post.timestamp}</small></span>
                    ${post.username == currentUsername ? '<button class="edit btn btn-outline-primary px-1 py-0 mx-2 float-right">✎</button>' : '' }
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
            // if (`${posts}` == 'all-posts') {
            document.querySelector('.posts').append(postcontent);
            // } else if  (`${posts}` == 'my-posts') {
            //     document.querySelector('.my_posts').append(postcontent);
            // // };

        });
    })
}