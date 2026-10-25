# Registros de producción

App web para el celular que digitaliza el registro diario de tres flujos:

- **Water:** Irrigation (por área y subárea), River, Waste Water y Ponds
- **Stock:** stock por turno y producto, en Tn
- **Pits:** cantidad de producto por turno y pit, en Tn

Cada registro guarda quién lo ingresó. Los registros se pueden corregir desde el historial; al hacerlo quedan marcados como **Modificado**, con el nombre de quien editó y la fecha.

Los datos se guardan en **Firebase (Firestore)**, así que todas las personas que abren el link comparten la misma base de datos. Sin configuración, la app corre en **modo demo** y guarda los datos solo en el navegador.

Desde el historial se exporta a Excel una lista, o **todas las listas en un solo archivo** con las mismas hojas y columnas que `Registros Water Stock Pits.xlsx`.

## Configurar Firebase (una vez)

1. Entra a [console.firebase.google.com](https://console.firebase.google.com) con una cuenta de Google y crea un proyecto (Google Analytics no hace falta). El plan gratuito Spark alcanza.
2. **Firestore Database > Crear base de datos**, en modo de producción, en una ubicación cercana (por ejemplo `australia-southeast1`).
3. **Firestore Database > Reglas:** reemplaza el contenido por el de `firestore.rules` y pulsa **Publicar**.
4. **Authentication > Comenzar > Método de acceso:** habilita **Anónimo**. La app abre una sesión anónima para poder usar la base de datos.
5. **Authentication > Configuración > Dominios autorizados:** agrega `tu-usuario.github.io`.
6. **Configuración del proyecto > Tus apps > Web (`</>`):** registra la app y copia `apiKey`, `authDomain`, `projectId` y `appId` de `firebaseConfig` en la constante `FIREBASE` de `src/config.ts`.

Estos valores no son secretos y pueden ir en GitHub: la base de datos la protegen las reglas.

### Qué permiten las reglas

- Leer y registrar datos: cualquier persona que abra la app.
- Corregir un registro: solo marcándolo como modificado, con el nombre de quien edita. No se puede cambiar quién lo ingresó ni cuándo.
- Borrar registros: nadie desde la app. Se borran en la consola de Firebase.

Como cualquiera con el link puede registrar datos, compártelo solo con los equipos que lo usan.

## Publicar con GitHub Pages

El flujo `.github/workflows/deploy.yml` prueba, compila y publica la app en cada push a `main`.

1. En el repositorio, ve a **Settings > Pages** y elige **GitHub Actions** como origen.
2. Haz push a `main`. En la pestaña **Actions** se ve el avance; al terminar, la app queda en `https://tu-usuario.github.io/<repositorio>/`.

En el celular, abre la dirección y elige **Agregar a pantalla de inicio** para usarla como app.

## Probarla en tu computador

Necesitas Node.js 20 o superior.

```bash
npm install
npm run dev      # modo demo, sin Firebase
npm test         # pruebas de validación
npm run build    # versión para publicar, en dist/
```

Para probar con Firebase sin tocar los datos reales, usa los emuladores (requieren Java):

```bash
npx firebase-tools emulators:start --only firestore,auth --project demo-registros
```

En otra terminal, crea `.env.local` con `VITE_FIREBASE_EMULATOR=true`, `VITE_FIREBASE_API_KEY=fake`, `VITE_FIREBASE_PROJECT_ID=demo-registros` y `VITE_FIREBASE_APP_ID=1:1:web:1`, y ejecuta `npm run dev`.

## Estructura

| Archivo | Qué contiene |
| --- | --- |
| `src/schema.ts` | Listas, campos, opciones (áreas, ponds, productos) y validaciones |
| `src/App.tsx` | Pantallas y navegación |
| `src/components/` | Formularios, Ponds e historial con edición |
| `src/data/firebaseStore.ts` | Lectura y escritura en Firestore |
| `src/data/localStore.ts` | Modo demo en el navegador |
| `src/data/exportExcel.ts` | Exportación a Excel |
| `firestore.rules` | Reglas de seguridad de la base de datos |
| `src/config.ts` | Configuración de Firebase |

Para agregar un área, un pond o un producto, edita `src/schema.ts`.

## Notas

- Cada lista es una colección de Firestore: `irrigation`, `river`, `wastewater`, `ponds`, `stock` y `pits`.
- La fecha se guarda como texto `AAAA-MM-DD` y la hora como `hh:mm`, para que no cambien con la zona horaria.
- El historial pide a Firebase solo los registros del rango de fechas elegido.
