// Sin estas variables la app corre en modo demo (datos solo en el navegador).
export const config = {
  tenantId: import.meta.env.VITE_TENANT_ID as string | undefined,
  clientId: import.meta.env.VITE_CLIENT_ID as string | undefined,
  sharepointSite: import.meta.env.VITE_SHAREPOINT_SITE as string | undefined,
};

export const isDemo = !(config.tenantId && config.clientId && config.sharepointSite);
