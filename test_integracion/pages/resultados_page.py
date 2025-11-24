from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time


class ResultadosPage:

    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)

    def abrir_resultado(self, texto):
        elemento = self.wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, f"//a[contains(., '{texto}')]")
            )
        )
        elemento.click()
        time.sleep(2)

