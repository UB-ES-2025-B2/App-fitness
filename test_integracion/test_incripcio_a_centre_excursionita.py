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

    wait = WebDriverWait(driver, 15)
    try:
        card = wait.until(
            EC.presence_of_element_located(
                (By.XPATH, "//img[@alt='Centre Excursionista Puigcastellar']/ancestor::a[1]")
            )
        )
    except Exception as e:
        raise AssertionError(
            "Elemento 'Centre Excursionista Puigcastellar' no apareció en la página. "
            "Verifica que el dato exista en la base de datos del deploy o que la ruta sea correcta."
        ) from e

    # ensure visible and click
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", card)
    driver.execute_script("arguments[0].click();", card)
    time.sleep(5)

    assert "c/1" in driver.current_url.lower()

    wait = WebDriverWait(driver, 10)

    boton_comunidad = wait.until(
        EC.presence_of_element_located(
            (By.XPATH, "//button[contains(text(), 'Unirse a la comunidad') or contains(text(), 'Salir de la comunidad')]")
        )
    )

    texto_inicial = boton_comunidad.text.strip()

    if "Unirse a la comunidad" in texto_inicial:
        # Unirse primero
        boton_comunidad.click()
        boton_actual = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Salir de la comunidad')]"))
        )
        assert "Salir de la comunidad" in boton_actual.text.strip()

        # Salir después
        boton_actual.click()
        boton_actual = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Unirse a la comunidad')]"))
        )
        assert "Unirse a la comunidad" in boton_actual.text.strip()

    else:
        # Salir primero
        boton_comunidad.click()
        boton_actual = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Unirse a la comunidad')]"))
        )
        assert "Unirse a la comunidad" in boton_actual.text.strip()

        # Volver a unirse
        boton_actual.click()
        boton_actual = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Salir de la comunidad')]"))
        )
        assert "Salir de la comunidad" in boton_actual.text.strip()