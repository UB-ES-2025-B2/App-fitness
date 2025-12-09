import time
import pytest
from selenium.webdriver.common.by import By

from pages.login_page import LoginPage
from pages.feed_page import FeedPage
from pages.perfil_page import PerfilPage


def _get_first_likeable_post(driver):
    candidates = driver.find_elements(
        By.CSS_SELECTOR, "div > article, article, .post-card, .card"
    )

    if not candidates:
        pytest.skip("No hay ningún post en el feed para probar likes.")

    for el in candidates:
        btns = el.find_elements(
            By.XPATH, ".//button[.//span[contains(normalize-space(.), 'Me gusta')]]"
        )
        if btns:
            return el, btns[0]

    pytest.skip("Ningún post tiene botón 'Me gusta'.")


def _parse_like_count(like_button):
    spans = like_button.find_elements(By.TAG_NAME, "span")
    if not spans:
        return 0
    text = spans[-1].text.strip()
    first_token = text.split()[0]
    return int(first_token) if first_token.isdigit() else 0


def _is_liked(like_button):
    spans = like_button.find_elements(By.TAG_NAME, "span")
    return spans and spans[0].text.strip() == "💖"


def test_like_unlike_post_and_see_in_profile(driver):
    login = LoginPage(driver)
    feed = FeedPage(driver)
    perfil = PerfilPage(driver)

    login.abrir()
    time.sleep(10)
    login.login("toni@example.com", "app-fitness1")

    feed.abrir()
    time.sleep(15)

    post, like_button = _get_first_likeable_post(driver)

    title_el = post.find_element(By.XPATH, ".//h2 | .//h3")
    post_title = title_el.text.strip()

    baseline = _parse_like_count(like_button)

    if _is_liked(like_button):
        like_button.click()
        time.sleep(1)
        post, like_button = _get_first_likeable_post(driver)
        baseline = _parse_like_count(like_button)

    like_button.click()
    time.sleep(1)
    post, like_button = _get_first_likeable_post(driver)

    assert _is_liked(like_button)
    assert _parse_like_count(like_button) == baseline + 1

    perfil.abrir()
    time.sleep(1)
    perfil.open_liked_tab()
    time.sleep(1)

    liked_titles = perfil.liked_post_titles()
    assert any(post_title in t for t in liked_titles)

    feed.abrir()
    time.sleep(2)
    post, like_button = _get_first_likeable_post(driver)

    if _is_liked(like_button):
        like_button.click()
        time.sleep(1)
        post, like_button = _get_first_likeable_post(driver)
        assert not _is_liked(like_button)

    perfil.abrir()
    time.sleep(1)
    perfil.open_liked_tab()
    time.sleep(1)

    liked_titles_after = perfil.liked_post_titles()
    assert not any(post_title in t for t in liked_titles_after)
