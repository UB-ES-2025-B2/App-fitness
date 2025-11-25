from pages.login_page import LoginPage
from pages.home_page import HomePage
from pages.resultados_page import ResultadosPage
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def test_busqueda_usuario(driver):

    login = LoginPage(driver)
    home = HomePage(driver)
    resultados = ResultadosPage(driver)

    login.abrir()

    login.login("toni@example.com", "app-fitness1")

    # wait until search input is visible (home ready)
    WebDriverWait(driver, 15).until(
        EC.visibility_of_element_located((By.XPATH, "//input[@placeholder='Buscar' or @aria-label='Buscar']"))
    )

    home.buscar("Toni")

    # Wait and open the result robustly
    resultados.abrir_resultado("Toni")

    # Assert we landed on a user page and the user's name is visible
    assert "/usuario/" in driver.current_url.lower()
    WebDriverWait(driver, 10).until(
        EC.text_to_be_present_in_element((By.TAG_NAME, "body"), "Toni")
    )
