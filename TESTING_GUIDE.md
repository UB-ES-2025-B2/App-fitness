# 🧪 Guía de Prueba - Visualización de Perfiles de Usuario

## ✅ Checklist de Implementación

### Backend ✓
- [x] Endpoint GET `/api/users/{id}` - Obtener perfil
- [x] Endpoint GET `/api/users/{id}/posts` - Obtener publicaciones
- [x] Endpoint GET `/api/users/{id}/followers` - Obtener seguidores
- [x] Endpoint GET `/api/users/{id}/following` - Obtener seguidos
- [x] Endpoint POST `/api/users/{id}/follow` - Seguir usuario
- [x] Endpoint DELETE `/api/users/{id}/follow` - Dejar de seguir

### Frontend ✓
- [x] Página dinámica `/usuario/[id]/page.tsx`
- [x] Componente `UserCard.tsx` reutilizable
- [x] Links desde el Feed hacia perfiles de usuario
- [x] Sistema de seguir/dejar de seguir
- [x] Filtrado de publicaciones por tema

## 🚀 Pasos para Probar

### 1. Iniciar el Backend
```bash
cd /home/pau/PROJECTS_/UBFITNESS/App-fitness/backend
source .venv/bin/activate  # o: python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

Deberías ver:
```
 * Running on http://127.0.0.1:5000
```

### 2. Verificar que existan usuarios en la BD
```bash
curl http://localhost:5000/api/users/
```

Si está vacío, crea uno vía registro:
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "bio": "Amante del fitness",
    "avatar_url": "https://i.pravatar.cc/150?img=1",
    "topics": ["Fútbol", "Montaña"]
  }'
```

### 3. Iniciar el Frontend
```bash
cd /home/pau/PROJECTS_/UBFITNESS/App-fitness/front-end
npm install
npm run dev
```

Deberías ver:
```
- Local:        http://localhost:3000
```

### 4. Probar el Flujo Completo

#### A. Ver perfil de usuario
1. Ve a `http://localhost:3000/usuario/1`
2. Verifica que aparezca:
   - ✓ Banner superior con overlay
   - ✓ Avatar (o inicial si no hay imagen)
   - ✓ Nombre y username
   - ✓ Bio (si existe)
   - ✓ Stats: posts, seguidores, siguiendo
   - ✓ Botón "Seguir" o "Editar perfil"

#### B. Filtrar por temas
1. En la sección "Intereses", haz clic en diferentes temas
2. Verifica que los posts se filtren correctamente
3. "Todos" debería mostrar todas las publicaciones

#### C. Seguir/Dejar de seguir
1. Si estás logueado, el botón "Seguir" debería aparecer
2. Click en "Seguir" → el botón cambia a "Siguiendo"
3. El contador de seguidores aumenta en 1
4. Click en "Siguiendo" → vuelve a "Seguir"
5. El contador disminuye en 1

#### D. Navegación desde el Feed
1. Ve a `http://localhost:3000/home`
2. Los nombres de usuario en los posts deberían ser **clicables**
3. Click en un nombre → redirige a `/usuario/{id}`

#### E. Editar perfil propio
1. Ve a tu propio perfil (usuario logueado)
2. Debe aparecer el botón "Editar perfil"
3. Click → redirige a `/perfil`

## 🐛 Problemas Comunes

### Error: "Usuario no encontrado"
**Causa:** El ID no existe en la base de datos.
**Solución:** Verifica los IDs disponibles:
```bash
curl http://localhost:5000/api/users/
```

### Error: "Error al cargar publicaciones"
**Causa:** La ruta no está registrada o hay un error en el backend.
**Solución:** Verifica los logs del Flask backend en la terminal.

### El botón "Seguir" no aparece
**Causa:** No hay usuario logueado o el token no es válido.
**Solución:** 
1. Verifica que `localStorage.getItem("ubfitness_tokens")` existe en DevTools
2. Si no existe, ve a `/registration` y crea un usuario

### Las imágenes no cargan
**Causa:** URLs inválidas o problemas de CORS.
**Solución:**
1. Verifica que las URLs en `avatar_url` e `image_url` sean accesibles
2. Prueba con URLs públicas como `https://i.pravatar.cc/150?img=X`

### Error: "process.env.NEXT_PUBLIC_API_BASE is undefined"
**Causa:** El archivo `.env.local` no existe o no se reinició el servidor.
**Solución:**
1. Crea `.env.local` en la raíz del frontend:
   ```
   NEXT_PUBLIC_API_BASE=http://localhost:5000
   ```
2. Reinicia el servidor: `Ctrl+C` y `npm run dev`

## 📊 Datos de Prueba (JSON)

### Crear usuario con posts:
```bash
# 1. Registrar usuario
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "fitgirl",
    "name": "Ana García",
    "email": "ana@fitness.com",
    "password": "secret123",
    "bio": "Entrenadora personal | Amante del yoga 🧘‍♀️",
    "avatar_url": "https://i.pravatar.cc/150?img=25",
    "topics": ["Yoga", "Nutrición"]
  }'

# 2. Crear post (usa el user_id devuelto)
curl -X POST http://localhost:5000/api/posts/ \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "topic": "Yoga",
    "text": "¡Hoy completé mi primera clase de yoga avanzado! 🙌",
    "image_url": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800"
  }'
```

## ✨ Funcionalidades Extra Implementadas

- **Responsive design**: funciona en móvil y desktop
- **Optimización de imágenes**: Next.js Image automático
- **Carga de estados**: spinners y mensajes de error
- **Navegación fluida**: links desde cualquier parte de la app
- **Componente reutilizable**: `UserCard` para listas de usuarios
- **Estadísticas en tiempo real**: posts, seguidores, siguiendo

## 📸 Screenshots Esperadas

1. **Banner superior**: con overlay semitransparente
2. **Avatar circular**: con inicial si no hay imagen
3. **Botones de intereses**: con colores diferenciados (rojo para seleccionado)
4. **Cards de posts**: con imagen opcional y tema en la esquina
5. **Botón de seguir**: cambia de color según el estado

## 🎯 Próximos Pasos Sugeridos

- [ ] Agregar búsqueda de usuarios en el Header
- [ ] Página de seguidores/seguidos (lista con UserCard)
- [ ] Editar banner del perfil
- [ ] Sistema de likes en posts
- [ ] Comentarios en publicaciones
- [ ] Notificaciones de nuevos seguidores
