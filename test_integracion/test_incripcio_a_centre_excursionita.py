from pages.login_page import LoginPage 
from pages.home_page import HomePage 
from pages.resultados_page import ResultadosPage 
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_busqueda_usuario(driver):

    login = LoginPage(driver)
    home = HomePage(driver)
    resultados = ResultadosPage(driver)

    login.abrir()
    time.sleep(1)

    login.login("toni@example.com", "app-fitness1")
    time.sleep(5)

    wait = WebDriverWait(driver, 30)
    card = wait.until(
        EC.element_to_be_clickable((
            By.XPATH,
            "//a[contains(@href, '/c/') and .//text()[contains(., 'Centre Excursionista Puigcastellar')]]"
        ))
    )
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", card)
    driver.execute_script("arguments[0].click();", card)

    wait.until(EC.url_contains("/c/1"))
    assert "c/1" in driver.current_url.lower()

    # 3) Esperar al botón de Unirse/Salir (más tolerante con espacios)
    boton_comunidad = wait.until(
        EC.element_to_be_clickable((
            By.XPATH,
            "//button["
            "contains(normalize-space(.), 'Unirse a la comunidad') or "
            "contains(normalize-space(.), 'Salir de la comunidad')"
            "]"
        ))
    )

    texto_inicial = boton_comunidad.text.strip()

    if "Unirse a la comunidad" in texto_inicial:
        # Unirse primero
        boton_comunidad.click()
        boton_actual = wait.until(
            EC.element_to_be_clickable((
                By.XPATH,
                "//button[contains(normalize-space(.), 'Salir de la comunidad')]"
            ))
        )
        assert "Salir de la comunidad" in boton_actual.text

        # Salir después
        boton_actual.click()
        boton_actual = wait.until(
            EC.element_to_be_clickable((
                By.XPATH,
                "//button[contains(normalize-space(.), 'Unirse a la comunidad')]"
            ))
        )
        assert "Unirse a la comunidad" in boton_actual.text

    else:
        # Salir primero
        boton_comunidad.click()
        boton_actual = wait.until(
            EC.element_to_be_clickable((
                By.XPATH,
                "//button[contains(normalize-space(.), 'Unirse a la comunidad')]"
            ))
        )
        assert "Unirse a la comunidad" in boton_actual.text

        # Volver a unirse
        boton_actual.click()
        boton_actual = wait.until(
            EC.element_to_be_clickable((
                By.XPATH,
                "//button[contains(normalize-space(.), 'Salir de la comunidad')]"
            ))
        )
        assert "Salir de la comunidad" in boton_actual.text