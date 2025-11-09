# 🛠️ Solución de Problemas - Imágenes Next.js

## ❌ Problema Original

```
Invalid src prop (...bing.com...) on `next/image`, 
hostname "www.bing.com" is not configured under images in your `next.config.js`
```

## ✅ Solución Implementada

### 1. Configuración de Next.js (`next.config.ts`)

**Antes:**
```typescript
const nextConfig: NextConfig = {
  /* config options here */
};
```

**Después:**
```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};
```

**Qué hace:** Permite cargar imágenes de **cualquier dominio** (bing.com, unsplash.com, pravatar.cc, cloudinary, etc.)

### 2. Componente SafeImage

Creamos un componente que maneja errores de carga de imágenes:

```typescript
const SafeImage = ({ 
  src, 
  alt, 
  fill, 
  width, 
  height, 
  className 
}: { 
  src: string; 
  alt: string; 
  fill?: boolean; 
  width?: number; 
  height?: number; 
  className?: string;
}) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return null;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      className={className}
      onError={() => setError(true)}
      unoptimized={src.includes('bing.com') || src.includes('unsplash.com')}
    />
  );
};
```

**Beneficios:**
- ✅ Maneja errores de carga sin romper la UI
- ✅ Oculta imágenes rotas
- ✅ Usa `unoptimized` para dominios problemáticos
- ✅ Fallback a gradiente si no hay imagen

### 3. Uso en el Código

**Reemplazamos todas las instancias de `<Image>` con `<SafeImage>`:**

```typescript
// Banner
<SafeImage
  src={user.avatarUrl}
  alt="Banner"
  fill
  className="object-cover opacity-50"
/>

// Avatar
<SafeImage
  src={user.avatarUrl}
  alt={user.name}
  width={96}
  height={96}
  className="object-cover w-full h-full"
/>

// Imagen del post
<SafeImage
  src={post.image}
  alt="Post"
  fill
  className="object-cover"
/>
```

## 🚀 Pasos para Aplicar la Solución

### 1. Actualizar `next.config.ts`
Ya está actualizado ✅

### 2. Reiniciar el servidor de desarrollo
```bash
# Detener el servidor actual (Ctrl+C)
# Limpiar cache (opcional pero recomendado)
rm -rf .next

# Iniciar de nuevo
npm run dev
```

### 3. Verificar que funciona
- Ve a `http://localhost:3000/usuario/1`
- Las imágenes deberían cargar sin errores
- Si alguna falla, se oculta en lugar de mostrar error

## 📋 Dominios Comunes Soportados

Con la configuración actual, estos dominios funcionan:

- ✅ `www.bing.com`
- ✅ `images.unsplash.com`
- ✅ `i.pravatar.cc`
- ✅ `res.cloudinary.com`
- ✅ `th.bing.com`
- ✅ Cualquier otro dominio HTTPS/HTTP

## 🔒 Consideraciones de Seguridad

**⚠️ Nota:** La configuración `hostname: '**'` permite **cualquier** dominio. En producción, deberías limitarlo:

```typescript
// Versión más segura para producción
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'images.unsplash.com',
    },
    {
      protocol: 'https',
      hostname: 'i.pravatar.cc',
    },
    {
      protocol: 'https',
      hostname: 'res.cloudinary.com',
    },
    // Añade solo los dominios que uses
  ],
},
```

## 🐛 Troubleshooting

### Las imágenes siguen sin cargar
1. **Reinicia el servidor** (importante después de cambiar next.config.ts)
2. **Limpia el cache:** `rm -rf .next`
3. **Verifica la URL** en DevTools → Network tab

### Error: "Invalid src prop"
- Asegúrate de haber reiniciado el servidor
- Verifica que `next.config.ts` tenga la configuración correcta

### Las imágenes aparecen rotas
- Verifica que la URL sea válida y accesible
- SafeImage las ocultará automáticamente si fallan

## ✅ Resultado Final

- ✅ Imágenes externas funcionan sin errores
- ✅ Manejo elegante de fallos de carga
- ✅ Fallback a iniciales si no hay avatar
- ✅ Gradiente de fondo si no hay banner
- ✅ No rompe la UI si una imagen falla

## 📚 Referencias

- [Next.js Image Configuration](https://nextjs.org/docs/app/api-reference/components/image#remotepatterns)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
