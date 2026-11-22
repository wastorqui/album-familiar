# Nuestro álbum

Álbum y diario de los niños: frases, primeras veces, logros y momentos con fotos. Se usa desde el móvil con un PIN, los dos adultos lo alimentan y se puede sacar un libro en PDF por niño y año.

## Cómo publicarlo (unos 15 minutos, desde un ordenador)

Usa las mismas cuentas de GitHub y Vercel que el cofre de monedas.

### 1. GitHub
1. **+ → New repository**. Nombre: `album-familiar`. Marca **Private**. **Create repository**.
2. **uploading an existing file** y arrastra **todo el contenido de la carpeta `album`**. **Commit changes**.

### 2. Vercel
1. **Add New… → Project**, elige `album-familiar` → **Import**.
2. En **Environment Variables** añade:
   - `APP_PIN` → el PIN del álbum (mejor 6 cifras; puede ser distinto al del cofre).
   - `SESSION_SECRET` → el texto aleatorio que te he pasado en el chat.
3. **Deploy**. Hasta el paso 3 verás un aviso de que falta la base de datos: es normal.

### 3. Base de datos y fotos (gratis)
1. En el proyecto, **Storage → Upstash for Redis**. Puedes conectar la misma base de datos del cofre (los datos van separados) o crear otra, plan **Free**.
2. **Storage → Create → Blob**. Al crearlo, elige acceso **Private** (las fotos solo se ven entrando con el PIN). Conéctalo al proyecto.
3. **Deployments → ⋯ → Redeploy**.

### 4. Regalarlo
- Abre la dirección de Vercel en el móvil de tu mujer o pásale enlace y PIN.
- La primera vez aparece la dedicatoria con el botón **Abrir el álbum**.
- Para tenerlo como app: **Compartir → Añadir a pantalla de inicio** (iPhone) o **⋮ → Añadir a pantalla de inicio** (Android).

## Cosas útiles
- **Libro en PDF**: pestaña Libro → elige niño y año → **Guardar PDF** → “Guardar como PDF”.
- **Textos** (título, dedicatoria, adultos) y **niños** (con fecha de nacimiento para ver la edad en cada recuerdo): en Ajustes.
- **Fotos**: se reducen en el móvil antes de subirlas (unos 250-400 KB cada una). El plan gratuito de Vercel incluye 1 GB, unas 3.000 fotos. Si un día se llena, se puede pasar a un plan de pago o guardar las fotos en otro sitio.
- **Borrar**: al borrar un recuerdo o quitar una foto, la foto se elimina también del almacenamiento.
- **Copia de seguridad**: las fotos originales siguen en vuestros móviles; el álbum guarda copias reducidas.

## Para desarrolladores
`npm install`, crea `.env.local` a partir de `.env.example` y `npm run dev`. Sin Redis ni Blob configurados, los datos van a `data/dev-db.json` y las fotos a `data/uploads/`.
