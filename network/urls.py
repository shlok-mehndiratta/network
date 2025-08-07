
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("register/", views.register, name="register"),
    path("profile/<str:username>", views.profile, name="profile"),

    # API Endpoints
    path("new-post", views.new_post, name="new_post"),
    path("posts/<str:profile_name>", views.posts, name="posts"),
    path("edit-profile", views.edit_profile, name="edit_profile"),
    path("edit-post/<int:post_id>", views.edit_post, name="edit_post"),
    path("update-profile/", views.update_profile, name="update_profile"),
    path("post/<int:post_id>/comments", views.handle_comments, name="handle_comments"),
]
