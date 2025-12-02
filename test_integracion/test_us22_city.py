# test_integracion/test_us22_city_frontend.py
import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from pages.login_page import LoginPage
from pages.home_page import HomePage
from pages.city_page import CityPage


@pytest.mark.usefixtures("driver")
def test_buscar_ciudad_y_abrir_pagina(driver):
    """
    US22 – Búsqueda de ciudad:
    - Login como toni@example.com
    - Buscar 'Barcelona'
    - Clicar sugerencia de ciudad
    - Ver página 'Progreso en Barcelona' con mapa
    """
    login = LoginPage(driver)
    home = HomePage(driver)
    city_page = CityPage(driver)

    # 1. Login
    login.abrir()
    time.sleep(1)
    login.login("toni@example.com", "app-fitness1")
    time.sleep(5)

    # 2. Buscar Barcelona desde el buscador de la home
    home.buscar("Barcelona")
    time.sleep(3)

    # 3. Clicar resultado que ponga "Barcelona" y sea de tipo ciudad
    sugerencia = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable(
            (
                By.XPATH,
                "//div[@id='search-suggestions']//li"
                "[.//span[contains(normalize-space(.), 'Barcelona')]]"
                "[.//span[contains(normalize-space(.), 'Ciudad')]]",
            )
        )
    )
    sugerencia.click()

    # 4. Comprobar que estamos en la página de ciudad
    city_page.esperar_cargada()
    assert "Progreso en Barcelona" in city_page.titulo()

    # 5. Y que el mapa existe y tiene markers
    assert city_page.hay_mapa()
    assert city_page.num_markers() >= 1

@pytest.mark.usefixtures("driver")
def test_filtro_estado_completadas(driver):
    """
    US22 – Filtro en página de ciudad:
    - Entrar a la ciudad de Barcelona
    - Ver que hay al menos una actividad pendiente
    - Aplicar filtro 'Completadas'
    - Ver que solo se muestran actividades completadas
    """
    login = LoginPage(driver)
    home = HomePage(driver)
    city_page = CityPage(driver)

    # Login
    login.abrir()
    time.sleep(1)
    login.login("toni@example.com", "app-fitness1")
    time.sleep(2)

    # ir a Barcelona desde buscador (reutilizamos lógica sencilla)
    home.buscar("Barcelona")

    # clicamos la sugerencia de Barcelona (cualquier tipo)
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC

    sugerencia = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable(
            (
                By.XPATH,
                "//div[@id='search-suggestions']//li"
                "[.//span[contains(normalize-space(.), 'Barcelona')]]",
            )
        )
    )
    sugerencia.click()

    city_page.esperar_cargada()
    time.sleep(1)

    # Estados con todos los filtros por defecto
    estados_todos = city_page.estados_actividades_visibles()
    # Si no hubiera pendientes, el test no tendría sentido -> skip
    if not any("Pendiente" in e for e in estados_todos):
        pytest.skip("No hay actividades pendientes en Barcelona para probar el filtro.")

    # Aplicar filtro Estado -> 'Completadas'
    city_page.seleccionar_filtro_estado("Completadas")
    time.sleep(1)

    estados_filtrados = city_page.estados_actividades_visibles()
    assert estados_filtrados, "No se muestran actividades tras aplicar el filtro."

    # Todas las que se ven deberían ser 'Completada'
    assert all("Completada" in e for e in estados_filtrados)