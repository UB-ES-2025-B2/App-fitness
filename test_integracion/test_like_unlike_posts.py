# test_integracion/test_like_unlike_posts.py
import os
import time

from pages.login_page import LoginPage
from pages.feed_page import FeedPage
from pages.perfil_page import PerfilPage


BASE_URL = os.getenv("DEPLOY_URL", "https://app-fitness-1.onrender.com")


def test_like_unlike_post_and_see_in_profile(driver):
    login = LoginPage(driver)
    feed = FeedPage(driver)
    perfil = PerfilPage(driver)

    login.abrir()
    time.sleep(1)
    login.login("toni@example.com", "app-fitness1")

    feed.wait_loaded()
    time.sleep(1)

    if feed.is_liked():
        feed.toggle_like()
        time.sleep(1)
        assert feed.is_liked() is False

    baseline_count = feed.get_like_count()
    post_title = feed.get_first_post_title()

    feed.toggle_like()
    time.sleep(1)
    assert feed.is_liked() is True

    count_after_like = feed.get_like_count()
    assert count_after_like == baseline_count + 1

    perfil.abrir()
    time.sleep(1)
    perfil.open_liked_tab()
    time.sleep(1)

    liked_titles = perfil.liked_post_titles()
    assert any(post_title in t for t in liked_titles)

    driver.get(BASE_URL + "/")
    feed.wait_loaded()
    time.sleep(1)

    if feed.is_liked():
        feed.toggle_like()
        time.sleep(1)
        assert feed.is_liked() is False

    perfil.abrir()
    time.sleep(1)
    perfil.open_liked_tab()
    time.sleep(1)

    liked_titles_after = perfil.liked_post_titles()
    assert not any(post_title in t for t in liked_titles_after)
