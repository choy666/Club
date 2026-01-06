interface LogEntry {
  level: "info" | "warn" | "error" | "debug";
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  userId?: string;
  operation?: string;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private createLogEntry(
    level: LogEntry["level"],
    message: string,
    context?: Record<string, unknown>,
    userId?: string,
    operation?: string
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      context,
      userId,
      operation,
    };
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Mantener solo los últimos maxLogs registros
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Output a consola con formato
    const timestamp = entry.timestamp.toISOString();
    const contextStr = entry.context ? ` | Context: ${JSON.stringify(entry.context)}` : "";
    const userStr = entry.userId ? ` | User: ${entry.userId}` : "";
    const opStr = entry.operation ? ` | Op: ${entry.operation}` : "";
    
    const logMessage = `[${timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${contextStr}${userStr}${opStr}`;
    
    switch (entry.level) {
      case "error":
        console.error(logMessage);
        break;
      case "warn":
        console.warn(logMessage);
        break;
      case "debug":
        console.debug(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }

  info(message: string, context?: Record<string, unknown>, userId?: string, operation?: string): void {
    const entry = this.createLogEntry("info", message, context, userId, operation);
    this.addLog(entry);
  }

  warn(message: string, context?: Record<string, unknown>, userId?: string, operation?: string): void {
    const entry = this.createLogEntry("warn", message, context, userId, operation);
    this.addLog(entry);
  }

  error(message: string, context?: Record<string, unknown>, userId?: string, operation?: string): void {
    const entry = this.createLogEntry("error", message, context, userId, operation);
    this.addLog(entry);
  }

  debug(message: string, context?: Record<string, unknown>, userId?: string, operation?: string): void {
    const entry = this.createLogEntry("debug", message, context, userId, operation);
    this.addLog(entry);
  }

  getLogs(level?: LogEntry["level"], limit?: number): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }
    
    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }
    
    return [...filteredLogs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  // Exportar logs a archivo (para auditoría)
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = Logger.getInstance();

// Funciones helper para logging específico
export const logPayment = (
  operation: string,
  memberId: string,
  duesCount: number,
  amount: number,
  success: boolean
): void => {
  logger.info(
    `Payment ${operation}`,
    {
      memberId,
      duesCount,
      amount,
      success,
    },
    memberId,
    "payment"
  );
};

export const logVitalicioPromotion = (
  memberId: string,
  paidDues: number,
  success: boolean
): void => {
  logger.info(
    `Vitalicio promotion ${success ? "completed" : "failed"}`,
    {
      memberId,
      paidDues,
    },
    memberId,
    "vitalicio_promotion"
  );
};

export const logError = (
  operation: string,
  error: Error,
  context?: Record<string, unknown>,
  userId?: string
): void => {
  logger.error(
    `Error in ${operation}: ${error.message}`,
    {
      ...context,
      stack: error.stack,
    },
    userId,
    operation
  );
};
