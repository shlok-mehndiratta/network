from django.contrib.auth.models import AbstractUser
from django.db import models
from django.shortcuts import render
# from httpx import request


class User(AbstractUser):
    profile_picture = models.ImageField(upload_to='profile_pics/', default='default.jpg', blank=True) 
    bio = models.TextField(blank=True)
    following = models.ManyToManyField('self', symmetrical=False, related_name='followers', blank=True)
    followers_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.username


class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField(User, related_name="liked_posts", blank=True)

    def __str__(self):
        return f"{self.user.username}: {self.content[:20]}..."
    
    def serialize(self):
        return {
            "id": self.id,
            "name": self.user.first_name + " " + self.user.last_name,
            "username": self.user.username,
            "content": self.content,
            "timestamp": self.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "likes_count": self.likes.count(),
            "liked_by_user": self.likes.filter(id=self.user.id).exists()
        }

