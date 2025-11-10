import os
from dotenv import load_dotenv
import cloudinary
load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", SECRET_KEY)
    MAIL_SERVER = "smtp.gmail.com"
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = "erramoseduardo@gmail.com"
    MAIL_PASSWORD = "eptb jupr ffou lzgs" 
    MAIL_DEFAULT_SENDER = ("App Fitness", "no-reply@appfitness.com")
    FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

if __name__ == "__main__":
    print("CLOUDINARY CONFIG TEST ✅")
    import cloudinary.uploader

    try:
        result = cloudinary.uploader.upload("app/test.png")
        print("✅ Imatge pujada correctament!")
        print("URL segura:", result.get("secure_url"))
    except Exception as e:
        print("❌ Error en la pujada:", e)