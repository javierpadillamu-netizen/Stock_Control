# Registros de producción

App web para el celular que digitaliza el registro diario de tres flujos:

- **Water:** Irrigation (por área y subárea), River, Waste Water y Ponds
- **Stock:** stock por turno y producto, en Tn
- **Pits:** cantidad de producto por turno y pit, en Tn

Cada registro guarda quién lo ingresó. Los registros se pueden corregir desde el historial; al hacerlo quedan marcados como **Modificado**, con el nombre de quien editó y la fecha. Desde el historial se exportan a Excel por rango de fechas.

Los datos se guardan en listas de **SharePoint** (Microsoft 365), así que Power BI se conecta a ellas directamente. Sin configuración, la app corre en **modo demo** y guarda los datos solo en el navegador.

## Probarla en tu computador

Necesitas Node.js 20 o superior.

```bash
npm install
npm run dev
```

Abre la dirección que muestra la terminal. Sin archivo `.env.local` funciona en modo demo.

```bash
npm test         # pruebas de validación
npm run build    # versión para publicar, en dist/
```

## Conectarla a Microsoft 365

1. **Crear las listas de SharePoint.** Ejecuta `sharepoint/crear-listas.ps1` (las instrucciones están al inicio del archivo) o créalas a mano con las columnas que define `src/schema.ts`. Los nombres internos de las columnas deben coincidir.
2. **Registrar la app en Entra ID** (lo hace un administrador en portal.azure.com > Entra ID > Registros de aplicaciones > Nuevo registro):
   - Tipo de cuenta: solo este directorio.
   - URI de redirección: plataforma **Aplicación de página única (SPA)**, con la dirección donde se publique la app (por ejemplo `https://usuario.github.io/registros-produccion/`) y `http://localhost:5173/` para pruebas.
   - Permisos de API: Microsoft Graph, delegado, `Sites.ReadWrite.All`.
3. **Configurar la app.** Copia `.env.example` como `.env.local` y completa el Id. de inquilino, el Id. de aplicación y el sitio (`tuempresa.sharepoint.com:/sites/Produccion`). Ninguno de estos valores es secreto.

Los usuarios entran con su cuenta de la empresa y deben ser miembros del sitio de SharePoint.

## Publicarla con GitHub Pages

El flujo `.github/workflows/deploy.yml` prueba, compila y publica la app en cada push a `main`.

1. En el repositorio, ve a **Settings > Pages** y elige **GitHub Actions** como origen.
2. En **Settings > Secrets and variables > Actions > Variables**, crea `VITE_TENANT_ID`, `VITE_CLIENT_ID` y `VITE_SHAREPOINT_SITE`. Si no las creas, se publica en modo demo.

En el celular, abre la dirección publicada y elige **Agregar a pantalla de inicio** para usarla como app.

## Estructura

| Archivo | Qué contiene |
| --- | --- |
| `src/schema.ts` | Listas, campos, opciones (áreas, ponds, productos) y validaciones |
| `src/App.tsx` | Pantallas y navegación |
| `src/components/` | Formularios, Ponds e historial con edición |
| `src/data/sharepointStore.ts` | Lectura y escritura en SharePoint con Microsoft Graph |
| `src/data/localStore.ts` | Modo demo en el navegador |
| `src/data/exportExcel.ts` | Exportación a Excel |
| `sharepoint/crear-listas.ps1` | Script que crea las listas en SharePoint |

Para agregar un área, un pond o un producto, edita `src/schema.ts` y agrega la misma opción a la columna de SharePoint.

## Notas

- La hora se guarda como texto `hh:mm`, porque SharePoint no tiene un tipo de dato solo para la hora.
- El historial carga todos los registros de la lista y filtra por fecha en el celular. Alcanza para varios miles de registros; si las listas crecen mucho, conviene indexar la columna Fecha y filtrar en el servidor.
