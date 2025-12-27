import { createMiddleware } from "@tanstack/react-start";

// === SCOPE CONSTANTS ===
export const LOG_SCOPES = {
  DEFAULT: "default",
  PAYMENTS: "payments",
  AUTH: "auth",
  AFFILIATES: "affiliates",
  EARLY_ACCESS: "early-access",
  APP_SETTINGS: "app-settings",
} as const;

export type LogScope = (typeof LOG_SCOPES)[keyof typeof LOG_SCOPES];

// === CONFIG: Record<scope, boolean> ===
export const logScopeConfig: Record<LogScope, boolean> = {
  default: process.env.NODE_ENV === "development",
  payments: true, // always log payments
  auth: true,
  affiliates: false, // disabled - too noisy
  "early-access": false,
  "app-settings": false,
};

// === HELPERS ===
function decodeBase64(str: string): string {
  // URL-safe base64 -> standard base64
  const standardBase64 = str.replace(/-/g, "+").replace(/_/g, "/");
  return atob(standardBase64);
}

function parseFunctionId(functionId: string): string {
  try {
    const decoded = JSON.parse(decodeBase64(functionId));
    return decoded.export?.replace(/_createServerFn_handler$/, "") ?? "unknown";
  } catch {
    return "unknown";
  }
}

// === FACTORY ===
function createLogMiddlewareForScope(scope: LogScope = LOG_SCOPES.DEFAULT) {
  return createMiddleware({ type: "function" }).server(
    async ({ next, functionId }) => {
      const isEnabled = logScopeConfig[scope] ?? logScopeConfig.default;

      if (!isEnabled) {
        return next();
      }

      const functionName = parseFunctionId(functionId);
      const start = Date.now();

      const result = await next();

      const duration = Date.now() - start;
      console.log(`[${functionName}] ${duration}ms`);

      return result;
    }
  );
}

// === EXPORT: backward compat + callable ===
const defaultMiddleware = createLogMiddlewareForScope(LOG_SCOPES.DEFAULT);

export const logMiddleware = Object.assign(
  (scope: LogScope) => createLogMiddlewareForScope(scope),
  defaultMiddleware
);
