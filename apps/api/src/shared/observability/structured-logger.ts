export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogValue = boolean | number | string | null | undefined;
export interface LogContext {
  [field: string]: LogValue | Error | LogContext | LogContext[];
}

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  correlation_id?: string;
  [field: string]: unknown;
}

export interface StructuredLogSink {
  write(entry: StructuredLogEntry): void;
}

export interface StructuredLoggerOptions {
  service: string;
  sink?: StructuredLogSink;
  now?: () => Date;
}

const SENSITIVE_FIELD = /(?:authorization|cookie|password|secret|token|api[-_]?key|session)/i;

export class JsonConsoleLogSink implements StructuredLogSink {
  write(entry: StructuredLogEntry): void {
    console.log(JSON.stringify(entry));
  }
}

export class StructuredLogger {
  private readonly sink: StructuredLogSink;
  private readonly now: () => Date;

  constructor(private readonly options: StructuredLoggerOptions) {
    if (!options.service.trim()) throw new Error("logger_service_required");
    this.sink = options.sink ?? new JsonConsoleLogSink();
    this.now = options.now ?? (() => new Date());
  }

  debug(message: string, context?: LogContext): void {
    this.write("debug", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.write("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.write("warn", message, context);
  }

  error(message: string, context?: LogContext): void {
    this.write("error", message, context);
  }

  private write(level: LogLevel, message: string, context: LogContext = {}): void {
    if (!message.trim()) throw new Error("logger_message_required");
    const sanitized = sanitizeLogContext(context);
    const correlationId = typeof sanitized.correlation_id === "string" ? sanitized.correlation_id : undefined;
    const entry: StructuredLogEntry = {
      timestamp: this.now().toISOString(),
      level,
      service: this.options.service,
      message,
      ...sanitized,
      ...(correlationId ? { correlation_id: correlationId } : {}),
    };
    this.sink.write(entry);
  }
}

export function sanitizeLogContext(context: LogContext): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      SENSITIVE_FIELD.test(key) ? "[REDACTED]" : sanitizeValue(value),
    ]),
  );
}

function sanitizeValue(value: LogContext[string]): unknown {
  if (value instanceof Error) return { name: value.name, message: value.message };
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item));
  if (value && typeof value === "object") return sanitizeLogContext(value as LogContext);
  return value;
}
