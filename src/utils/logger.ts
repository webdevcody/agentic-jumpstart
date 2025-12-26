/**
 * Structured logger for production-ready logging.
 * Outputs JSON format with timestamp, level, and context for easy parsing.
 */

type LogContext = Record<string, unknown>;

export const logger = {
  info: (message: string, context?: LogContext) => {
    console.log(
      JSON.stringify({
        level: "info",
        timestamp: new Date().toISOString(),
        message,
        ...context,
      })
    );
  },
  warn: (message: string, context?: LogContext) => {
    console.warn(
      JSON.stringify({
        level: "warn",
        timestamp: new Date().toISOString(),
        message,
        ...context,
      })
    );
  },
  error: (message: string, context?: LogContext) => {
    console.error(
      JSON.stringify({
        level: "error",
        timestamp: new Date().toISOString(),
        message,
        ...context,
      })
    );
  },
};
