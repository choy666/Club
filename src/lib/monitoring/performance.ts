import { performance } from "perf_hooks";

interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private static instance: PerformanceMonitor;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(operation: string): () => PerformanceMetrics {
    const startTime = performance.now();
    
    return (): PerformanceMetrics => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const metric: PerformanceMetrics = {
        operation,
        duration,
        timestamp: new Date(),
      };

      this.metrics.push(metric);
      this.logMetric(metric);
      
      return metric;
    };
  }

  private logMetric(metric: PerformanceMetrics): void {
    console.log(`[PERFORMANCE] ${metric.operation}: ${metric.duration.toFixed(2)}ms`);
    
    // Alerta si la operación es lenta
    if (metric.duration > 1000) {
      console.warn(`[SLOW OPERATION] ${metric.operation} took ${metric.duration.toFixed(2)}ms`);
    }
  }

  getMetrics(operation?: string): PerformanceMetrics[] {
    if (operation) {
      return this.metrics.filter(m => m.operation === operation);
    }
    return [...this.metrics];
  }

  getAverageTime(operation: string): number {
    const operationMetrics = this.getMetrics(operation);
    if (operationMetrics.length === 0) return 0;
    
    const total = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / operationMetrics.length;
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Decorador para medir funciones asíncronas
export function measurePerformance(operationName?: string) {
  return function (target: { constructor: { name: string } }, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const operation = operationName || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: unknown[]) {
      const endTimer = performanceMonitor.startTimer(operation);
      
      try {
        const result = await method.apply(this, args);
        endTimer();
        return result;
      } catch (error) {
        endTimer();
        throw error;
      }
    };

    return descriptor;
  };
}
