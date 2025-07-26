# models.py

from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    profile_picture = models.ImageField(upload_to='profile_pics/', default='default.jpg', blank=True)
    bio = models.TextField(blank=True)
    following = models.ManyToManyField('self', symmetrical=False, related_name='followers', blank=True)

    # These properties will calculate the count automatically and are always correct
    @property
    def followers_count(self):
        return self.followers.count()

    @property
    def following_count(self):
        return self.following.count()

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
            "liked_by_user": current_user in self.likes.all() if current_user and current_user.is_authenticated else False
        }