# Página de Visualización de Usuario

## 📍 Ubicación
`/usuario/[id]/page.tsx`

## 🎯 Funcionalidad
Página dinámica que muestra el perfil completo de un usuario con:
- **Banner personalizado** con la imagen de avatar de fondo
- **Información del perfil**: nombre, username, bio
- **Estadísticas**: número de posts, seguidores y seguidos
- **Botón de seguir/dejar de seguir** (si no es tu propio perfil)
- **Filtrado por temas**: muestra todos los posts o filtra por tema específico
- **Listado de publicaciones** con imagen, texto y fecha

## 🔗 Cómo acceder
- URL: `http://localhost:3000/usuario/[id]`
- Ejemplo: `http://localhost:3000/usuario/1` (perfil del usuario con ID 1)

## 🔌 Endpoints del Backend utilizados

### 1. **Obtener perfil del usuario**
```
GET /api/users/{user_id}
```
Respuesta:
```json
{
  "id": 1,
  "username": "johndoe",
  "name": "John Doe",
  "avatarUrl": "https://...",
  "bio": "Amante del fitness",
  "ocultarInfo": false,
  "createdAt": "2025-01-01T00:00:00"
}
```

### 2. **Obtener publicaciones del usuario**
```
GET /api/users/{user_id}/posts
```
Respuesta:
```json
[
  {
    "id": 1,
    "text": "De rutina con mi marido el gordo haber si adelgaza",
    "topic": "Taekwondo",
    "image": "https://...",
    "date": "2025-01-15T10:30:00"
  }
]
```

### 3. **Obtener seguidores**
```
GET /api/users/{user_id}/followers
```

### 4. **Obtener seguidos**
```
GET /api/users/{user_id}/following
```

### 5. **Seguir usuario**
```
POST /api/users/{user_id}/follow?me={current_user_id}
```

### 6. **Dejar de seguir**
```
DELETE /api/users/{user_id}/follow?me={current_user_id}
```

## 🚀 Cómo probar

### 1. Asegúrate de que el backend esté corriendo
```bash
cd /home/pau/PROJECTS_/UBFITNESS/App-fitness/backend
source .venv/bin/activate
python run.py
```

### 2. Asegúrate de que el frontend esté corriendo
```bash
cd /home/pau/PROJECTS_/UBFITNESS/App-fitness/front-end
npm run dev
```

### 3. Navega a un perfil de usuario
- Ve a `http://localhost:3000/usuario/1`
- Cambia el `1` por el ID de cualquier usuario existente en tu base de datos

### 4. Desde otro componente, puedes linkear al perfil así:
```tsx
import Link from "next/link";

<Link href={`/usuario/${userId}`}>
  Ver perfil de {userName}
</Link>
```

## 🎨 Diseño

La página sigue el diseño proporcionado con:
- Banner superior con overlay
- Avatar circular con iniciales si no hay imagen
- Botones de intereses/temas con colores diferenciados
- Cards de publicaciones con imagen opcional
- Responsive design para móvil y desktop

## 🔐 Seguridad

- El botón de seguir solo aparece si hay un usuario logueado
- El botón "Editar perfil" solo aparece si es tu propio perfil
- Los tokens se guardan en `localStorage` bajo la clave `ubfitness_tokens`

## 📝 Notas

- Si el usuario no tiene posts, se muestra un mensaje indicándolo
- Los temas se extraen automáticamente de las publicaciones existentes
- El filtro "Todos" muestra todas las publicaciones sin filtro
- Las imágenes se optimizan automáticamente con Next.js Image

## 🐛 Troubleshooting

**Error: "Usuario no encontrado"**
- Verifica que el ID existe en la base de datos
- Comprueba que el backend esté corriendo

**Error: "Error al cargar publicaciones"**
- Verifica que la ruta `/api/users/{id}/posts` esté registrada correctamente
- Revisa los logs del backend para ver errores

**No aparece el botón de seguir**
- Asegúrate de estar logueado
- Verifica que el token en `localStorage` sea válido
