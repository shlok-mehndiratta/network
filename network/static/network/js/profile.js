document.addEventListener("DOMContentLoaded", () => {
    // Find the single follow button on the page
    const followBtn = document.querySelector('#follow-btn');

    // If the button exists, add a single click event listener
    if (followBtn) {
        followBtn.addEventListener('click', handleFollow);
    }
    
    // This loads the user's posts
    view_posts(profile_name);
}); 


function handleFollow() {
    // Check if the current user is logged in
    if (isAuthenticated !== "true") {
        window.location.href = `/login?next=${window.location.pathname}`;
        return;
    }

    const followBtn = document.querySelector('#follow-btn');
    const action = followBtn.dataset.action; // 'follow' or 'unfollow'

    fetch('/edit-profile', {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken() 
        },
        body: JSON.stringify({
            // Send `true` if the action is 'follow', otherwise `false`
            follow: action === 'follow',
            following: profile_name
        })
    })
    .then(response => {
        if (response.ok) {
            // **Update the UI without reloading the page**
            updateFollowUI();
        } else {
            alert('Something went wrong. Please try again.');
        }
    });
}


function updateFollowUI() {
    const followBtn = document.querySelector('#follow-btn');
    const followerCountSpan = document.querySelector('#follower-count');
    let currentFollowers = parseInt(followerCountSpan.innerText);

    // If the button's last action was 'follow'
    if (followBtn.dataset.action === 'follow') {
        // Change button to 'Following' state
        followBtn.innerText = 'Following';
        followBtn.className = 'btn btn-outline-primary';
        followBtn.dataset.action = 'unfollow'; // Set the next action to 'unfollow'
        followerCountSpan.innerText = currentFollowers + 1; // Increment follower count

    } else { // If the button's last action was 'unfollow'
        // Change button to 'Follow' state
        followBtn.innerText = 'Follow';
        followBtn.className = 'btn btn-primary';
        followBtn.dataset.action = 'follow'; // Set the next action to 'follow'
        followerCountSpan.innerText = currentFollowers - 1; // Decrement follower count
    }
}
