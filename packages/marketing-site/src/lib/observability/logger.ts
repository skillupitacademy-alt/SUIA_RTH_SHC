export function analyticsLogger(level: "debug" | "info" | "warn" | "error", message: string, context?: Record<string, unknown>) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    message,
    ...context,
  });

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else if (level === "debug") console.debug(line);
  else console.info(line);
}

