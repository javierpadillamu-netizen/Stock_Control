# Registros de producción

App web para el celular que digitaliza el registro diario de tres flujos:

- **Water:** Irrigation (por pond, área y subárea), River, Waste Water y Ponds
- **Stock:** Production Stock o Stock Onhand, por turno, almacenamiento y producto, en Tn
- **Pits:** cantidad de producto por turno y pit, en Tn

Cada persona entra con **su propia cuenta** (correo y contraseña) y lo que puede hacer depende de su rol. Cada registro guarda la cuenta que lo ingresó. Los registros se pueden corregir desde el historial; al hacerlo quedan marcados como **Modificado**, con la cuenta de quien editó y la fecha.

Los datos se guardan en **Firebase (Firestore)**, así que todas las personas que abren el link comparten la misma base de datos. Sin configuración, la app corre en **modo demo** y guarda los datos solo en el navegador.

Desde el historial se exporta a Excel una lista, o **todas las listas en un solo archivo** con las mismas hojas y columnas que `Registros Water Stock Pits.xlsx`.

## Configurar Firebase (una vez)

1. Entra a [console.firebase.google.com](https://console.firebase.google.com) con una cuenta de Google y crea un proyecto (Google Analytics no hace falta). El plan gratuito Spark alcanza.
2. **Firestore Database > Crear base de datos**, en modo de producción, en una ubicación cercana (por ejemplo `australia-southeast1`).
3. **Firestore Database > Reglas:** reemplaza el contenido por el de `firestore.rules` y pulsa **Publicar**.
4. **Authentication > Comenzar > Método de acceso:** habilita **Correo electrónico/contraseña** (sin "vínculo de correo electrónico"). Si estaba habilitado **Anónimo** de la versión anterior, deshabilítalo.
5. **Authentication > Configuración > Dominios autorizados:** agrega `tu-usuario.github.io`.
6. **Configuración del proyecto > Tus apps > Web (`</>`):** registra la app y copia `apiKey`, `authDomain`, `projectId` y `appId` de `firebaseConfig` en la constante `FIREBASE` de `src/config.ts`.

Estos valores no son secretos y pueden ir en GitHub: la base de datos la protegen las reglas.

## Cuentas y roles

Cada persona crea su cuenta desde la app con **Create an account** (nombre, correo y contraseña). La cuenta queda **Pending** y no ve nada hasta que un admin le asigna un rol:

| Rol | Qué puede hacer |
| --- | --- |
| Pending | Nada, espera aprobación |
| Viewer | Ver los registros y exportar a Excel |
| Editor | Además, registrar y corregir |
| Admin | Además, aprobar cuentas y cambiar roles |

El admin cambia los roles tocando su inicial arriba a la derecha (**Account > Users**). La pantalla de la persona se actualiza sola cuando la aprueban. Un admin no puede cambiar su propio rol, para que la app no se quede sin admin. Si alguien olvida su contraseña, usa **Forgot your password?** y le llega un correo para cambiarla.

### Primer admin (una vez)

Las cuentas siempre nacen como Pending, así que el primer admin se marca a mano en la consola:

1. Crea tu cuenta desde la app con **Create an account**. Verás "Waiting for approval".
2. En la consola de Firebase, ve a **Firestore Database > Datos > users** y abre el documento con tu correo.
3. Cambia el campo `role` de `pending` a `admin` y guarda. La app te deja entrar sola, sin recargar.

Desde ahí apruebas a los demás desde la app.

### Qué permiten las reglas

- Ver registros: cuentas Viewer, Editor y Admin.
- Registrar: cuentas Editor y Admin. El registro lleva la cuenta (`createdBy`) y el nombre de quien lo ingresa; las reglas comprueban que coincidan con la cuenta que tiene la sesión, así que nadie puede registrar a nombre de otro.
- Corregir: cuentas Editor y Admin, solo marcándolo como modificado, con la cuenta (`modifiedBy`) y el nombre de quien edita. No se puede cambiar quién lo ingresó ni cuándo. Los registros anteriores a las cuentas (sin `createdBy`) también se pueden corregir.
- Cambiar roles: solo un Admin, y no el suyo propio. Cada persona crea solo su propio perfil, siempre como Pending.
- Borrar registros o cuentas: nadie desde la app. Se borran en la consola de Firebase (la cuenta en **Authentication > Usuarios** y su perfil en **Firestore > users**). Para quitarle el acceso a alguien basta con ponerlo en Pending.

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
| `src/auth/` | Cuentas, roles y sesión (Firebase Auth o modo demo) |
| `src/components/Login.tsx` | Entrar, crear cuenta y recuperar contraseña |
| `src/components/Account.tsx` | Cuenta y administración de usuarios |
| `src/data/localStore.ts` | Modo demo en el navegador |
| `src/data/exportExcel.ts` | Exportación a Excel |
| `firestore.rules` | Reglas de seguridad de la base de datos |
| `src/config.ts` | Configuración de Firebase |

Para agregar un área, un pond o un producto, edita `src/schema.ts`.

## Notas

- Los perfiles de las cuentas están en la colección `users`, con `name`, `email` y `role`.
- En modo demo cualquier correo entra como Admin y todo queda en el navegador.
- Cada lista es una colección de Firestore: `irrigation`, `river`, `wastewater`, `ponds`, `productionStock`, `stockOnhand` y `pits`. Las reglas aún permiten leer `stock`, la colección anterior a la separación.
- La fecha se guarda como texto `AAAA-MM-DD` y la hora como `hh:mm`, para que no cambien con la zona horaria.
- El historial pide a Firebase solo los registros del rango de fechas elegido.
