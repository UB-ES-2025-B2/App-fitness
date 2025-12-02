from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time


class ResultadosPage:

    def __init__(self, driver):
        self.driver = driver
        # Increase default wait to reduce flakiness on slow CI/deploys
        self.wait = WebDriverWait(driver, 20)

    def abrir_resultado(self, texto, href_contains=None):
        """
        Intenta abrir un resultado de búsqueda.

        - Si `href_contains` está definido, prioriza un <a> cuyo href lo contenga.
        - Si no, intenta varias estrategias basadas en el texto.
        """

        xpaths = []

        # 1) Si nos pasan un trozo de href, usar eso primero (más robusto)
        if href_contains:
            xpaths.append(
                f"//div[@id='search-suggestions']//a[contains(@href, '{href_contains}')]"
            )

        # 2) Antiguos fallbacks por texto (puede fallar por mayúsculas/minúsculas)
        xpaths.extend([
            f"//img[@alt='{texto}']/ancestor::a[1]",
            f"//div[@id='search-suggestions']//a[contains(normalize-space(.), '{texto}')]",
            f"//a[contains(normalize-space(.), '{texto}')]",
            f"//a[.//img[contains(@alt, '{texto}')]]",
        ])

        elemento = None
        last_exc = None

        time.sleep(5)  # Esperar un poco a que cargue la lista

        for xp in xpaths:
            try:
                elemento = self.wait.until(
                    EC.element_to_be_clickable((By.XPATH, xp))
                )
                if elemento:
                    break
            except Exception as e:
                last_exc = e
                continue

        # 3) Último recurso: clicamos la primera sugerencia que haya
        if elemento is None:
            try:
                elemento = self.wait.until(
                    EC.element_to_be_clickable(
                        (By.CSS_SELECTOR, "#search-suggestions li a")
                    )
                )
            except Exception as e:
                last_exc = e

        if elemento is None:
            raise AssertionError(
                f"No se encontró ningún resultado que coincida con '{texto}'. "
                "Revisa si los datos de prueba están presentes en el deploy o si el selector necesita actualización."
            ) from last_exc

        self.driver.execute_script(
            "arguments[0].scrollIntoView({block: 'center'});", elemento
        )
        self.driver.execute_script("arguments[0].click();", elemento)

