import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// VITE_BASE permite publicar en una subcarpeta, por ejemplo GitHub Pages (/registros-produccion/).
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react()],
  // exceljs se carga aparte, solo al exportar
  build: { chunkSizeWarningLimit: 1000 },
});
