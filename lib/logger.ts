type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  sessionId?: string;
  userId?: string;
  stage?: string;
  [key: string]: unknown;
}

function emit(
  level: LogLevel,
  message: string,
  context?: LogContext
): void {
  const entry = {
    level,
    message,
    service: "reviewlens",
    timestamp: new Date().toISOString(),
    ...context,
  };

  const line = JSON.stringify(entry);

  /* eslint-disable no-console -- structured JSON logging */
  switch (level) {
    case "error":
      console.error(line);
      break;
    case "warn":
      console.warn(line);
      break;
    default:
      console.log(line);
  }
  /* eslint-enable no-console */
}

export function createLogger(baseContext: LogContext = {}) {
  return {
    debug(message: string, extra?: LogContext) {
      if (process.env.NODE_ENV === "development") {
        emit("debug", message, { ...baseContext, ...extra });
      }
    },
    info(message: string, extra?: LogContext) {
      emit("info", message, { ...baseContext, ...extra });
    },
    warn(message: string, extra?: LogContext) {
      emit("warn", message, { ...baseContext, ...extra });
    },
    error(message: string, extra?: LogContext) {
      emit("error", message, { ...baseContext, ...extra });
    },
    stage(stage: string, durationMs: number, extra?: LogContext) {
      emit("info", `Stage complete: ${stage}`, {
        ...baseContext,
        ...extra,
        stage,
        durationMs,
      });
    },
    openaiUsage(
      operation: string,
      tokens: { prompt?: number; completion?: number; total?: number },
      extra?: LogContext
    ) {
      emit("info", `OpenAI usage: ${operation}`, {
        ...baseContext,
        ...extra,
        operation,
        promptTokens: tokens.prompt,
        completionTokens: tokens.completion,
        totalTokens: tokens.total,
      });
    },
  };
}

export const logger = createLogger();
