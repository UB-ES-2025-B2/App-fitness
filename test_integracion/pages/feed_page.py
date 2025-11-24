from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os
import time


class FeedPage:
    FIRST_POST = (By.CSS_SELECTOR, "div > article, article, .post-card, .card")
    LIKE_BUTTON = (By.XPATH, ".//button[contains(translate(.,'ME GUSTA','me gusta'),'me gusta')]")
    LIKE_COUNT = (By.XPATH, ".//span[contains(@class, 'like') or contains(@class,'count') or number(.)=number(.)]")

    POST_TITLE = (By.XPATH, ".//h3 | .//h2")

    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)
        self.base_url = os.getenv("DEPLOY_URL", "https://app-fitness-1.onrender.com")

    def abrir(self):
        """Go to homepage/feed and wait for first post."""
        self.driver.get(self.base_url + "/")
        self.wait.until(EC.presence_of_element_located(self.FIRST_POST))
        time.sleep(1)

    def _first_post(self):
        return self.driver.find_elements(*self.FIRST_POST)[0]

    def get_first_post_title(self):
        post = self._first_post()
        title = post.find_element(*self.POST_TITLE).text.strip()
        return title
    def wait_loaded(self, timeout: int = 10):
        """
        Asegura que estamos en la página de feed ("/") y
        espera a que aparezca al menos un post.
        """
        if not self.driver.current_url.startswith(self.base_url + "/"):
            self.driver.get(self.base_url + "/")

        WebDriverWait(self.driver, timeout).until(
            EC.presence_of_element_located(self.FIRST_POST)
        )

    def get_like_count(self):
        post = self._first_post()
        counts = post.find_elements(*self.LIKE_COUNT)

        for el in counts:
            txt = el.text.strip()
            if txt.isdigit():
                return int(txt)
        return 0

    def is_liked(self):
        post = self._first_post()

        btn = post.find_element(*self.LIKE_BUTTON)
        classes = btn.get_attribute("class") or ""

        classes = classes.lower()
        return "liked" in classes or "active" in classes or "selected" in classes

    def toggle_like(self):
        post = self._first_post()
        btn = post.find_element(*self.LIKE_BUTTON)
        btn.click()
        time.sleep(0.7)
