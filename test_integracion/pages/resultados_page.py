from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time


class ResultadosPage:

    def __init__(self, driver):
        self.driver = driver
        # Increase default wait to reduce flakiness on slow CI/deploys
        self.wait = WebDriverWait(driver, 20)

    def abrir_resultado(self, texto):
        """
        Try to open a search result matching `texto` using a few
        fallbacks and explicit waits to avoid timing-related failures.
        """
        # Try: image alt -> ancestor link
        xpaths = [
            f"//img[@alt='{texto}']/ancestor::a[1]",
            f"//a[contains(., '{texto}')]",
            f"//a[.//img[contains(@alt, '{texto}')]]",
        ]

        elemento = None
        last_exc = None
        for xp in xpaths:
            try:
                elemento = self.wait.until(
                    EC.element_to_be_clickable((By.XPATH, xp))
                )
                if elemento:
                    break
            except Exception as e:
                last_exc = e
                # continue to next fallback
                continue

        if elemento is None:
            # Give a helpful error for debugging in CI
            raise AssertionError(
                f"No se encontró ningún resultado que coincida con '{texto}'. "
                "Revisa si los datos de prueba están presentes en el deploy o si el selector necesita actualización."
            ) from last_exc

        # ensure visible and click via JS to avoid overlay/click interception
        try:
            self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", elemento)
            self.driver.execute_script("arguments[0].click();", elemento)
        except Exception:
            # fallback to normal click
            elemento.click()

        time.sleep(2)

