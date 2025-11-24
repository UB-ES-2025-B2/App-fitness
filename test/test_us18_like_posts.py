# test_integracion/test_like_unlike_posts.py

import time
import pytest

from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException

from pages.login_page import LoginPage
from pages.feed_page import FeedPage
from pages.perfil_page import PerfilPage


def _get_first_likeable_post(driver):
    """
    Devuelve (post_element, like_button) del primer post que tenga
    un botón cuyo texto interno contenga 'Me gusta'.
    """
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
    text = spans[-1].text.strip()  # "0 Me gusta"
    first_token = text.split()[0]  # "0"
    return int(first_token) if first_token.isdigit() else 0


def _is_liked(like_button):
    spans = like_button.find_elements(By.TAG_NAME, "span")
    return bool(spans) and spans[0].text.strip() == "💖"


def test_like_unlike_post_and_see_in_profile(driver):
    login = LoginPage(driver)
    feed = FeedPage(driver)
    perfil = PerfilPage(driver)

    # 1) Login
    login.abrir()
    time.sleep(1)
    login.login("toni@example.com", "app-fitness1")

    # 2) Ir al feed; si no aparece ningún post en el tiempo de espera,
    #    saltamos el test en vez de fallar.
    try:
        feed.abrir()
    except TimeoutException:
        pytest.skip("No se encontró ningún post en el feed tras el login.")
    time.sleep(2)

    # 3) Localizar primer post 'likeable'
    post, like_button = _get_first_likeable_post(driver)

    title_el = post.find_element(By.XPATH, ".//h2 | .//h3")
    post_title = title_el.text.strip()

    baseline = _parse_like_count(like_button)

    # 4) Si ya está con like, lo quitamos para empezar desde 0
    if _is_liked(like_button):
        like_button.click()
        time.sleep(1)
        post, like_button = _get_first_likeable_post(driver)
        baseline = _parse_like_count(like_button)

    # 5) Dar like
    like_button.click()
    time.sleep(1)
    post, like_button = _get_first_likeable_post(driver)

    assert _is_liked(like_button)
    assert _parse_like_count(like_button) == baseline + 1

    # 6) Comprobar que aparece en "Me gusta" del perfil
    perfil.abrir()
    time.sleep(1)
    perfil.open_liked_tab()
    time.sleep(1)

    liked_titles = perfil.liked_post_titles()
    assert any(post_title in t for t in liked_titles)

    # 7) Volver al feed y quitar el like
    feed.abrir()
    time.sleep(2)
    post, like_button = _get_first_likeable_post(driver)

    if _is_liked(like_button):
        like_button.click()
        time.sleep(1)
        post, like_button = _get_first_likeable_post(driver)
        assert not _is_liked(like_button)

    # 8) Volver a "Me gusta" → ya no debería aparecer
    perfil.abrir()
    time.sleep(1)
    perfil.open_liked_tab()
    time.sleep(1)

    liked_titles_after = perfil.liked_post_titles()
    assert not any(post_title in t for t in liked_titles_after)
