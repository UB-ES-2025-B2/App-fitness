from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os

class LoginPage:

    EMAIL = (By.ID, "email")
    PASSWORD = (By.ID, "password")
    LOGIN_BTN = (By.CSS_SELECTOR, "button[type='submit']")
    HOME_MARKER = (By.CSS_SELECTOR, "input[type='search']")  # o algo que aparezca en home

    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)

    def abrir(self):
        self.driver.get(os.getenv("DEPLOY_URL","https://app-fitness-1.onrender.com")+"/login")

    def login(self, user, passwd):
        self.driver.find_element(*self.EMAIL).send_keys(user)
        self.driver.find_element(*self.PASSWORD).send_keys(passwd)
        self.driver.find_element(*self.LOGIN_BTN).click()

        # Esperar a que cargue la home
        self.wait.until(
            EC.presence_of_element_located(self.HOME_MARKER)
        )
