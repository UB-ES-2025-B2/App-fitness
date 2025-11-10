"""
US10 - Buscador (usuarios y comunidades)

Criterios comprobados:
- GET /api/search/ devuelve resultados por substring (case-insensitive)
- Respuesta vacía si falta 'q' o está en blanco
- Respeta el parámetro ?limit (por colección)
- El payload NO incluye 'topics'
- Búsqueda de usuarios por username y por name
- Búsqueda de comunidades por name (si el modelo existe)
"""

import pytest
from conftest import create_user

SEARCH_URL = "/api/search/"  # Blueprint con url_prefix="/api/search" y ruta "/"

# Detectamos si existe el modelo Community; si no, saltamos los tests que lo requieren
try:
    from app.models.comunity_model import Community  # ajusta si el path difiere en tu proyecto
    HAS_COMMUNITY = True
except Exception:
    Community = None
    HAS_COMMUNITY = False


try:
    from app.models.comunity_model import Community  # ajusta el path si difiere
    HAS_COMMUNITY = True
except Exception:
    Community = None
    HAS_COMMUNITY = False


def create_community(db, name="Comunidad Test", slug=None, created_by_id=None, **extra):
    """
    Crea una comunidad válida para el esquema actual.
    - Si el modelo exige created_by NOT NULL, creamos un usuario si no se pasa.
    - Rellena sólo campos que existan en el modelo.
    """
    if not HAS_COMMUNITY:
        pytest.skip("Modelo Community no disponible en este proyecto.")

    # Asegurar autor/creador
    if created_by_id is None:
        # Creamos un usuario creador mínimo
        creator = create_user(
            db,
            username=f"creator_{name.replace(' ', '_').lower()}",
            name="Creator",
            email=f"creator_{abs(hash(name))}@example.com",
            password="pwd",
        )
        created_by_id = creator.id

    # Construir la instancia con campos existentes
    c = Community(name=name)

    if hasattr(Community, "slug"):
        setattr(c, "slug", slug or name.lower().replace(" ", "-"))
    if hasattr(Community, "created_by"):
        setattr(c, "created_by", created_by_id)
    if hasattr(Community, "private") and "private" in extra:
        setattr(c, "private", extra["private"])
    if hasattr(Community, "topic") and "topic" in extra:
        setattr(c, "topic", extra["topic"])
    if hasattr(Community, "description") and "description" in extra:
        setattr(c, "description", extra["description"])
    if hasattr(Community, "reglas") and "reglas" in extra:
        setattr(c, "reglas", extra["reglas"])
    if hasattr(Community, "image_url") and "image_url" in extra:
        setattr(c, "image_url", extra["image_url"])

    db.session.add(c)
    db.session.commit()
    return c


def _get_ok_json(client, url):
    rv = client.get(url)
    assert rv.status_code == 200
    return rv.get_json()


def test_search_empty_query_returns_empty_arrays(client):
    d = _get_ok_json(client, SEARCH_URL)               # sin q
    d2 = _get_ok_json(client, SEARCH_URL + "?q=")      # q vacío

    for data in (d, d2):
        assert "communities" in data and "users" in data
        assert isinstance(data["communities"], list) and isinstance(data["users"], list)
        assert data["communities"] == []
        assert data["users"] == []
        assert "topics" not in data  # no debe existir


def test_search_user_by_username_and_name(client, _db):
    # username y name distintos
    create_user(_db, username="marti97", name="MartiUb", email="m1@example.com", password="pwd")
    create_user(_db, username="laura.run", name="Laura Runner", email="m2@example.com", password="pwd")

    # Por username (case-insensitive / substring)
    d1 = _get_ok_json(client, SEARCH_URL + "?q=MARti")
    usernames = [u["username"] for u in d1["users"]]
    assert "marti97" in usernames

    # Por name (case-insensitive / substring)
    d2 = _get_ok_json(client, SEARCH_URL + "?q=runner")
    names = [u.get("name") for u in d2["users"]]
    assert any(n and "Runner" in n for n in names)


@pytest.mark.skipif(not HAS_COMMUNITY, reason="No hay modelo Community en este proyecto")
def test_search_community_by_name_case_insensitive(client, _db):
    create_community(_db, name="Universitat Barcelona Fitness")
    create_community(_db, name="Escalada UB")

    # substring "barc" (case-insensitive) debe encontrar la primera
    d = _get_ok_json(client, SEARCH_URL + "?q=BaRc")
    names = [c["name"] for c in d["communities"]]
    assert any(n == "Universitat Barcelona Fitness" for n in names)

    # consulta sin match
    d2 = _get_ok_json(client, SEARCH_URL + "?q=xyz-no-match")
    assert d2["communities"] == []


def test_search_limit_applies_per_collection(client, _db):
    # Creamos varios users que hagan match con "ub"
    for i in range(6):
        create_user(_db, username=f"ubuser{i}", name=f"User{i}", email=f"u{i}@ex.com", password="pwd")

    # Y varias communities si existen
    if HAS_COMMUNITY:
        for i in range(6):
            create_community(_db, name=f"UB Comunidad {i}")

    d = _get_ok_json(client, SEARCH_URL + "?q=ub&limit=3")

    assert "users" in d and "communities" in d
    assert len(d["users"]) <= 3
    assert len(d["communities"]) <= 3

    # Shape mínimo esperado
    if d["users"]:
        u = d["users"][0]
        assert "id" in u and "username" in u and "name" in u

    if d["communities"]:
        c = d["communities"][0]
        assert "id" in c and "name" in c
        if "slug" in c:
            assert isinstance(c["slug"], (str, type(None)))


def test_search_mixed_results(client, _db):
    # Un user y, si existe, una comunidad que puedan matchear "ub"
    create_user(_db, username="ub_demo", name="Ub Demo", email="ubdemo@example.com", password="pwd")
    if HAS_COMMUNITY:
        create_community(_db, name="UB Comunidad Test")

    d = _get_ok_json(client, SEARCH_URL + "?q=ub")
    assert "users" in d and "communities" in d
    # No forzamos cantidad, solo comprobamos que ambas claves existen y son listas
    assert isinstance(d["users"], list) and isinstance(d["communities"], list)
