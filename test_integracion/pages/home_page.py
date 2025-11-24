from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

class HomePage:

    def __init__(self, driver):
        self.driver = driver

    SEARCH = (By.CSS_SELECTOR, "input[type='search']")

    def buscar(self, nombre):
        search = self.driver.find_element(*self.SEARCH)
        search.send_keys(nombre)
        search.send_keys(Keys.ENTER)
