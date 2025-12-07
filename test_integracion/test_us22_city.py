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
    time.sleep(5)
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
    - Ver actividades
    - Aplicar filtro 'Completadas'
    - Si hay completadas: sólo se muestran completadas
    - Si no hay completadas: la lista queda vacía (también es correcto)
    """
    login = LoginPage(driver)
    home = HomePage(driver)
    city_page = CityPage(driver)

    # Login
    login.abrir()
    time.sleep(1)
    login.login("toni@example.com", "app-fitness1")
    time.sleep(5)

    # Ir a Barcelona desde buscador
    home.buscar("Barcelona")

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
    time.sleep(5)
    city_page.esperar_cargada()
    time.sleep(1)

    # Estados iniciales
    estados_todos = city_page.estados_actividades_visibles()
    if not estados_todos:
        pytest.skip("No hay actividades en Barcelona para probar el filtro.")

    hay_pendientes = any("Pendiente" in e for e in estados_todos)
    hay_completadas = any("Completada" in e for e in estados_todos)

    # Aplicar filtro Estado -> 'Completadas'
    city_page.seleccionar_filtro_estado("Completadas")
    time.sleep(3)

    estados_filtrados = city_page.estados_actividades_visibles()

    if not hay_completadas:
        # Caso 1: el usuario no tiene ninguna completada.
        # El comportamiento correcto es que el filtro deje la lista vacía.
        assert (
            not estados_filtrados
        ), "Se muestran actividades aunque el usuario no tiene ninguna completada."
        return

    # Caso 2: sí hay completadas → deben aparecer sólo completadas
    assert estados_filtrados, "No se muestran actividades tras aplicar el filtro."
    assert all(
        "Completada" in e for e in estados_filtrados
    ), "Hay actividades no completadas tras aplicar el filtro 'Completadas'."