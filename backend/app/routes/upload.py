from flask import Blueprint, request, jsonify
import cloudinary.uploader

bp = Blueprint("upload", __name__, url_prefix="/api/upload")

@bp.route("/", methods=["POST"])
def upload_image():
    """Rep una imatge del frontend i la puja a Cloudinary"""
    if "image" not in request.files:
        return jsonify({"error": "Falta el camp 'image' al formulari"}), 400

    file = request.files["image"]

    try:
        upload_result = cloudinary.uploader.upload(file)
        image_url = upload_result.get("secure_url")
        return jsonify({
            "message": "Imatge pujada correctament",
            "url": image_url
        }), 200
    except Exception as e:
        print("❌ Error Cloudinary:", e)
        return jsonify({"error": str(e)}), 500
