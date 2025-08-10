from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
import os
import uuid


def user_profile_pic_path(instance, filename):
    """
    Generates a unique path for a new profile picture.
    Path will be: 'profile_pics/user_<id>/<uuid>.<ext>'
    """
    # Get the file's extension (e.g., .jpg, .png)
    ext = os.path.splitext(filename)[1]
    # Generate a unique filename using UUID
    unique_filename = f"{uuid.uuid4()}{ext}"
    # Return the complete file path
    return os.path.join('profile_pics', f'user_{instance.pk}', unique_filename)


class User(AbstractUser):
    profile_picture = models.ImageField(upload_to=user_profile_pic_path, default='default.jpg', blank=True)
    bio = models.TextField(blank=True)
    following = models.ManyToManyField('self', symmetrical=False, related_name='followers', blank=True)

    # Override the save method to handle profile picture deletion
    def save(self, *args, **kwargs):
        # Check if this user object is already in the database
        if self.pk:
            try:
                # Get the old user object from the database
                old_instance = User.objects.get(pk=self.pk)
                
                # Check if the profile picture has changed
                if old_instance.profile_picture != self.profile_picture:
                    # Check if the old picture was not the default one before deleting
                    if old_instance.profile_picture and old_instance.profile_picture.name != 'default.jpg':
                        old_instance.profile_picture.delete(save=False)
            except User.DoesNotExist:
                pass # This happens on user creation, so we do nothing.

        # Finally, call the original save method
        super().save(*args, **kwargs)

    # These properties will calculate the count automatically and are always correct
    @property
    def followers_count(self):
        return self.followers.count()

    @property
    def following_count(self):
        return self.following.count()
    
    @property
    def profile_picture_url(self):
        """
        Returns the URL for the user's profile picture.
        Provides the URL for the default image if no picture is uploaded.
        """
        if self.profile_picture and hasattr(self.profile_picture, 'url'):
            return self.profile_picture.url
        else:
            # Construct the URL for the default image located in your MEDIA_ROOT
            return f"{settings.MEDIA_URL}default.jpg"

    def __str__(self):
        return self.username


class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField(User, related_name="liked_posts", blank=True)

    def __str__(self):
        return f"{self.user.username}: {self.content[:20]}..."

    # The serialize method now accepts a user to check the 'like' status against
    def serialize(self, current_user=None):
        return {
            "id": self.id,
            "name": self.user.first_name + " " + self.user.last_name,
            "username": self.user.username,
            "content": self.content,
            "timestamp": self.timestamp.strftime("%b %d, %Y, %I:%M %p"), # Nicer format
            "likes_count": self.likes.count(),
            # Correctly checks if the current_user (who is Browse) has liked this post
            "liked_by_user": current_user in self.likes.all() if current_user and current_user.is_authenticated else False,
            "profile_picture_url": self.user.profile_picture_url,
            "comments_count": self.comments.count(),            
        }
    
class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.username} on post {self.post.id}"

    def serialize(self):
        return {
            "id": self.id,
            "username": self.user.username,
            "name": self.user.first_name,
            "profile_picture_url": self.user.profile_picture_url,
            "content": self.content,
            "timestamp": self.timestamp.strftime("%b %d, %Y, %I:%M %p"),
        }