from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os

class LoginPage:
    EMAIL = (By.ID, "email")
    PASSWORD = (By.ID, "password")
    LOGIN_BTN = (By.CSS_SELECTOR, "button[type='submit']")

    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)

    def abrir(self):
        base = os.getenv("DEPLOY_URL", "https://app-fitness-1.onrender.com")
        self.driver.get(base + "/login")

    def login(self, user, passwd):
        # Esperar a que el campo email esté visible
        email_input = self.wait.until(
            EC.visibility_of_element_located(self.EMAIL)
        )
        email_input.clear()
        email_input.send_keys(user)

        # Esperar a que el campo password esté visible
        pwd_input = self.wait.until(
            EC.visibility_of_element_located(self.PASSWORD)
        )
        pwd_input.clear()
        pwd_input.send_keys(passwd)

        # Esperar a que el botón sea clicable y hacer click
        btn = self.wait.until(
            EC.element_to_be_clickable(self.LOGIN_BTN)
        )
        btn.click()
