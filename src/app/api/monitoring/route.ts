import { NextRequest, NextResponse } from "next/server";
import { performanceMonitor } from "@/lib/monitoring/performance";
import { logger } from "@/lib/monitoring/logger";
import { queryCache } from "@/lib/monitoring/cache";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get("operation");

    // Métricas de rendimiento
    const performanceMetrics = operation
      ? performanceMonitor.getMetrics(operation)
      : performanceMonitor.getMetrics();

    const performanceStats = {
      totalOperations: performanceMetrics.length,
      averageTimes: {} as Record<string, number>,
      slowOperations: performanceMetrics.filter((m) => m.duration > 1000),
      recentMetrics: performanceMetrics.slice(-10),
    };

    // Calcular tiempos promedio por operación
    const operations = [...new Set(performanceMetrics.map((m) => m.operation))];
    operations.forEach((op) => {
      performanceStats.averageTimes[op] = performanceMonitor.getAverageTime(op);
    });

    // Estadísticas de cache
    const cacheStats = queryCache.getStats();

    // Logs recientes
    const recentLogs = logger.getLogs(undefined, 50);
    const errorLogs = logger.getLogs("error", 20);

    const response = {
      timestamp: new Date().toISOString(),
      performance: performanceStats,
      cache: cacheStats,
      logs: {
        total: recentLogs.length,
        errors: errorLogs.length,
        recent: recentLogs.slice(-10),
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error(
      "Error getting monitoring data",
      { error: (error as Error).message, stack: (error as Error).stack },
      "system"
    );
    return NextResponse.json({ error: "Error al obtener datos de monitoreo" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    switch (type) {
      case "performance":
        performanceMonitor.clearMetrics();
        break;
      case "cache":
        queryCache.clear();
        break;
      case "logs":
        logger.clearLogs();
        break;
      case "all":
        performanceMonitor.clearMetrics();
        queryCache.clear();
        logger.clearLogs();
        break;
      default:
        return NextResponse.json(
          { error: "Tipo no válido. Use: performance, cache, logs, o all" },
          { status: 400 }
        );
    }

    logger.info(`Cleared monitoring data: ${type}`, {}, "system");
    return NextResponse.json({ message: `Datos de ${type} limpiados exitosamente` });
  } catch (error) {
    logger.error(
      "Error clearing monitoring data",
      { error: (error as Error).message, stack: (error as Error).stack },
      "system"
    );
    return NextResponse.json({ error: "Error al limpiar datos de monitoreo" }, { status: 500 });
  }
}
