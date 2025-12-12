from flask import Blueprint, request, jsonify
from sqlalchemy import func
from .. import db
from ..models.user_model import User
from ..models.comunity_model import Community
from ..models.city_model import City

bp = Blueprint("search", __name__, url_prefix="/api/search")

@bp.get("/")
def search():
    q = (request.args.get("q") or "").strip()
    limit = min(int(request.args.get("limit", 10)), 20)
    offset = max(int(request.args.get("offset", 0)), 0)

    if not q:
        return jsonify({"communities": [], "users": [], "cities": [], "has_more": False})

    like = f"%{q}%"

    # Comunitats per nom/slug
    communities = (
        db.session.query(Community.id, Community.name, getattr(Community, "slug", None))
        .filter(func.lower(Community.name).like(func.lower(like)))
        .order_by(Community.name.asc())
        .offset(offset).limit(limit + 1)
        .all()
    )

    has_more_communities = len(communities) > limit
    communities = communities[:limit]

    communities_json = [
        {"id": c.id, "name": c.name, "slug": getattr(c, "slug", None)}
        for c in communities
    ]

    # Usuaris per username o nom
    users = (
        db.session.query(User.id, User.username, User.name)
        .filter(
            func.lower(User.username).like(func.lower(like)) |
            func.lower(func.coalesce(User.name, "")).like(func.lower(like))
        )
        .order_by(User.username.asc())
        .offset(offset).limit(limit + 1)
        .all()
    )
    has_more_users = len(users) > limit
    users = users[:limit]
    users_json = [{"id": u.id, "username": u.username, "name": u.name} for u in users]

    # CITIES
    cities = (
        db.session.query(City.id, City.name, City.slug)
        .filter(func.lower(City.name).like(func.lower(like)))
        .order_by(City.name.asc())
        .offset(offset).limit(limit + 1)
        .all()
    )
    has_more_cities = len(cities) > limit
    cities = cities[:limit]
    cities_json = [
        {"id": c.id, "name": c.name, "slug": c.slug}
        for c in cities
    ]

    return jsonify({
        "communities": communities_json,
        "users": users_json,
        "cities": cities_json,
        "has_more": has_more_communities or has_more_users or has_more_cities
    })
