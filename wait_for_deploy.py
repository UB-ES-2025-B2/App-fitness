import time
import sys
import requests

def wait_until_ready(url, timeout=900):
    print(f"Esperando a que {url} responda 200 (Timeout: {timeout}s)...")

    start = time.time()

    while time.time() - start < timeout:
        try:
            r = requests.get(url, timeout=10)
            if r.status_code == 200:
                print(f"✅ Deploy activo y respondiendo correctamente: {url}")
                return
        except Exception as e:
            # print(f"Error conectando a {url}: {e}")
            pass

        elapsed = int(time.time() - start)
        print(f"[{elapsed}s/{timeout}s] Aún no está listo {url}... reintentando en 10s")
        time.sleep(10)

    raise TimeoutError(f"❗ El deploy {url} no se activó dentro del tiempo esperado ({timeout}s).")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Debes pasar la URL como argumento")
        sys.exit(1)

    wait_until_ready(sys.argv[1])
