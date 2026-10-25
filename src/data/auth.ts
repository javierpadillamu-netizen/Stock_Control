import { PublicClientApplication, InteractionRequiredAuthError, type AccountInfo } from "@azure/msal-browser";
import { config } from "../config";

const SCOPES = ["https://graph.microsoft.com/Sites.ReadWrite.All"];

let msal: PublicClientApplication | null = null;

export async function initAuth(): Promise<AccountInfo | null> {
  msal = new PublicClientApplication({
    auth: {
      clientId: config.clientId!,
      authority: `https://login.microsoftonline.com/${config.tenantId}`,
      redirectUri: window.location.origin + import.meta.env.BASE_URL,
    },
    cache: { cacheLocation: "localStorage" },
  });
  await msal.initialize();
  const result = await msal.handleRedirectPromise();
  const account = result?.account ?? msal.getAllAccounts()[0] ?? null;
  if (account) msal.setActiveAccount(account);
  return account;
}

export function login() {
  return msal!.loginRedirect({ scopes: SCOPES });
}

export function logout() {
  return msal!.logoutRedirect();
}

export async function getToken(): Promise<string> {
  const account = msal!.getActiveAccount();
  if (!account) throw new Error("Debes iniciar sesión");
  try {
    const res = await msal!.acquireTokenSilent({ scopes: SCOPES, account });
    return res.accessToken;
  } catch (e) {
    if (e instanceof InteractionRequiredAuthError) {
      await msal!.acquireTokenRedirect({ scopes: SCOPES, account });
    }
    throw e;
  }
}
