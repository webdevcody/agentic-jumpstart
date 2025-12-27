import { createMiddleware } from "@tanstack/react-start";

export const DevGuardMiddleware = createMiddleware().server(async ({ next }) => {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Dev functions can only be used in development mode.");
  }
  return next();
});
