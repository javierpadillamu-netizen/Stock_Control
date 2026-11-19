import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Identificador unico de cada publicacion. La app lo compara con version.json
// para saber si hay una version nueva y recargarse sola.
const BUILD_ID = new Date().toISOString();

function versionFile(): Plugin {
  return {
    name: "version-file",
    apply: "build",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "version.json", source: JSON.stringify({ version: BUILD_ID }) });
    },
  };
}

// VITE_BASE permite publicar en una subcarpeta, por ejemplo GitHub Pages (/registros-produccion/).
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react(), versionFile()],
  define: { __APP_VERSION__: JSON.stringify(BUILD_ID) },
  // exceljs se carga aparte, solo al exportar
  build: { chunkSizeWarningLimit: 1000 },
});
