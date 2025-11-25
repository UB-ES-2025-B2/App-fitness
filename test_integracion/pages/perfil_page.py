from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os
import time


class PerfilPage:
    TAB_LIKED = (
        By.XPATH,
        "//button[contains(., 'Me gusta') or contains(., 'Posts que me gustan')]",
    )

    LIKED_POST_CARD = (
        By.CSS_SELECTOR,
        "article, .post-card, .card"
    )

    POST_TITLE = (By.XPATH, ".//h3 | .//h2")

    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)
        self.base_url = os.getenv("DEPLOY_URL", "https://app-fitness-1.onrender.com")

    def abrir(self):
        """
        Abre la página de perfil del usuario.
        """
        self.driver.get(self.base_url + "/perfil")
        # Esperar a que cargue algo de la página de perfil
        time.sleep(1)

    def open_liked_tab(self):
        """
        Hace clic en la pestaña de 'Me gusta' / 'Posts que me gustan'
        y espera a que aparezca al menos un post liked (si hay).
        """
        tab = self.wait.until(EC.element_to_be_clickable(self.TAB_LIKED))
        tab.click()
        # Si no hay likes, puede que no haya cards;
        # por seguridad, solo esperamos un pequeño tiempo
        time.sleep(1)

    def liked_post_titles(self):
        """
        Devuelve una lista con los títulos de los posts
        mostrados en la pestaña de “posts que me gustan”.
        """
        cards = self.driver.find_elements(*self.LIKED_POST_CARD)
        titles = []

        for c in cards:
            try:
                t = c.find_element(*self.POST_TITLE)
                titles.append(t.text.strip())
            except Exception:
                continue

        return titles
