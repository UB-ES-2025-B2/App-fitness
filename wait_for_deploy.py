import time
import sys
import requests

def wait_until_ready(url, timeout=300):
    print(f"Esperando a que {url} responda 200...")

    start = time.time()

    while time.time() - start < timeout:
        try:
            r = requests.get(url, timeout=5)
            if r.status_code == 200:
                print("✅ Deploy activo y respondiendo correctamente")
                return
        except:
            pass

        print("Aún no está listo... reintentando en 5s")
        time.sleep(5)

    raise TimeoutError("❗ El deploy no se activó dentro del tiempo esperado.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Debes pasar la URL como argumento")
        sys.exit(1)

    wait_until_ready(sys.argv[1])
