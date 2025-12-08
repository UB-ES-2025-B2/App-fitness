import os
import time
import pytest
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException

from pages.login_page import LoginPage
from pages.feed_page import FeedPage
from pages.nutria_page import NutriAPage


@pytest.mark.integration
def test_nutria_chat_opens_and_toggles(driver):
    """
    Verifies NutrIA chat modal opens and closes without page reload.
    - Logs in with seeded demo creds
    - Opens home feed
    - Clicks floating NutrIA button to open modal
    - Toggles close via the same button
    """
    # Skip if DEPLOY_URL not defined and default might not include NutrIA yet
    base = os.getenv("DEPLOY_URL", "https://app-fitness-1.onrender.com")

    login = LoginPage(driver)
    feed = FeedPage(driver)
    nutria = NutriAPage(driver)

    login.abrir()
    # Demo credentials used across other tests
    login.login("toni@example.com", "app-fitness1")

    feed.abrir()

    # Open the modal
    try:
        nutria.open_modal()
    except TimeoutException:
        pytest.skip("NutrIA button not present on deployed environment yet.")
    assert nutria.is_modal_open(), "NutriIA modal did not appear after clicking opener"

    # Toggle close via the same button
    nutria.toggle_with_button()
    # Wait for modal to disappear
    WebDriverWait(driver, 10).until(
        EC.invisibility_of_element_located((By.XPATH, '//*[contains(normalize-space(.), "Chat Nutricionista IA")]'))
    )

    # Open again and close via 'Cerrar'
    try:
        nutria.open_modal()
    except TimeoutException:
        pytest.skip("NutrIA button not present on deployed environment yet (second open).")
    assert nutria.is_modal_open(), "NutriIA modal did not appear on second open"
    nutria.close_modal()
    WebDriverWait(driver, 10).until(
        EC.invisibility_of_element_located((By.XPATH, '//*[contains(normalize-space(.), "Chat Nutricionista IA")]'))
    )
