import pytest
import os
import sys
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

from datetime import datetime
import pathlib
import traceback

@pytest.fixture
def driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--start-maximized")
    #options.add_argument("--headless=new")

    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
    except Exception as e:
        pytest.skip(f"Skipping integration test: Chrome driver could not be initialized (Chrome might be missing). Error: {e}")
        return

    yield driver
    driver.quit()


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """On test failure, capture screenshot and page source (if driver fixture present).
    Artifacts will be written under `test_integracion/artifacts/` for later upload.
    """
    outcome = yield
    rep = outcome.get_result()
    if rep.when == "call" and rep.failed:
        driver = item.funcargs.get("driver")
        if driver:
            artifacts_dir = pathlib.Path(__file__).resolve().parent / "artifacts"
            artifacts_dir.mkdir(exist_ok=True)
            name = f"{item.nodeid.replace('/', '_').replace('::', '_') }"
            try:
                screenshot_path = artifacts_dir / f"{name}.png"
                driver.save_screenshot(str(screenshot_path))
            except Exception:
                # ensure we don't mask original failure
                traceback.print_exc()
            try:
                html_path = artifacts_dir / f"{name}.html"
                with open(html_path, "w", encoding="utf-8") as f:
                    f.write(driver.page_source)
            except Exception:
                traceback.print_exc()