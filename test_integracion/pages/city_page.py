# test_integracion/pages/city_page.py
import os
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class CityPage:
    def __init__(self, driver):
        self.driver = driver
        self.base_url = os.getenv("DEPLOY_URL", "https://app-fitness-1.onrender.com")

    # Por si quieres entrar directo por URL: /city/<id>
    def abrir(self, city_id: int):
        self.driver.get(f"{self.base_url}/city/{city_id}")

    def esperar_cargada(self, timeout=15):
        """Espera al <h1> 'Progreso en ...'."""
        WebDriverWait(self.driver, timeout).until(
            EC.visibility_of_element_located(
                (By.XPATH, "//h1[contains(normalize-space(.), 'Progreso en')]")
            )
        )

    def titulo(self) -> str:
        h1 = self.driver.find_element(
            By.XPATH, "//h1[contains(normalize-space(.), 'Progreso en')]"
        )
        return h1.text.strip()

    # ---------- Lista de actividades ----------

    def estados_actividades_visibles(self):
        """
        Devuelve una lista de textos de estado ('Completada' / 'Pendiente')
        de las actividades visibles.
        """
        badges = self.driver.find_elements(
            By.XPATH,
            "//li[contains(@class,'group')]"  # cada actividad
            "//span[contains(@class,'rounded-full') and "
            "(contains(., 'Completada') or contains(., 'Pendiente'))]"
        )
        return [b.text.strip() for b in badges]

    # ---------- Filtros ----------

    def _click_pill(self, text: str, timeout=10):
        btn = WebDriverWait(self.driver, timeout).until(
            EC.element_to_be_clickable(
                (
                    By.XPATH,
                    f"//button[contains(normalize-space(.), '{text}')]",
                )
            )
        )
        btn.click()
        return btn

    def seleccionar_filtro_estado(self, label: str):
        # Ejemplo label: 'Todas', 'Completadas', 'Pendientes'
        self._click_pill(label)

    def seleccionar_filtro_dificultad(self, label: str):
        # 'Todas', 'Fácil', 'Media', 'Difícil'
        self._click_pill(label)

    def seleccionar_filtro_tipo(self, label: str):
        # 'Todos', 'Fútbol', 'Básquet', 'Montaña'
        self._click_pill(label)

    # ---------- Mapa ----------

    def hay_mapa(self) -> bool:
        """Comprueba que el contenedor Leaflet existe."""
        try:
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, ".leaflet-container")
                )
            )
            return True
        except Exception:
            return False

    def num_markers(self) -> int:
        """
        Cuenta iconos de marcador Leaflet.
        (Lo normal es que haya al menos 1 si has puesto coords.)
        """
        markers = self.driver.find_elements(
            By.CSS_SELECTOR, ".leaflet-marker-icon"
        )
        return len(markers)
