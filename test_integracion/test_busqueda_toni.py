from pages.login_page import LoginPage
from pages.home_page import HomePage
from pages.resultados_page import ResultadosPage
import time

def test_busqueda_usuario(driver):

    login = LoginPage(driver)
    home = HomePage(driver)
    resultados = ResultadosPage(driver)

    login.abrir()
    time.sleep(1)

    login.login("toni@example.com", "app-fitness1")
    time.sleep(5)


    home.buscar("Toni")

    resultados.abrir_resultado("Toni", href_contains="/usuario/1")
    time.sleep(3)

    assert "usuario/1" in driver.current_url.lower()