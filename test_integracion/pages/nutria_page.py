from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class NutriAPage:
    BUTTON = (By.CSS_SELECTOR, 'button[aria-label="Abrir chat Nutricionista IA"]')
    MODAL_TITLE = (By.XPATH, '//*[contains(normalize-space(.), "Chat Nutricionista IA")]')
    CLOSE_BUTTON = (By.XPATH, '//button[normalize-space(.)="Cerrar"]')

    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)

    def open_modal(self):
        btn = self.wait.until(EC.element_to_be_clickable(self.BUTTON))
        btn.click()
        self.wait.until(EC.visibility_of_element_located(self.MODAL_TITLE))

    def is_modal_open(self):
        elems = self.driver.find_elements(*self.MODAL_TITLE)
        return len(elems) > 0 and elems[0].is_displayed()

    def toggle_with_button(self):
        btn = self.wait.until(EC.element_to_be_clickable(self.BUTTON))
        btn.click()

    def close_modal(self):
        close = self.wait.until(EC.element_to_be_clickable(self.CLOSE_BUTTON))
        close.click()
