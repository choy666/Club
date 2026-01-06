import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  Database, 
  AlertCircle, 
  Trash2, 
  RefreshCw,
  TrendingUp,
  Zap
} from "lucide-react";

interface MonitoringData {
  timestamp: string;
  performance: {
    totalOperations: number;
    averageTimes: Record<string, number>;
    slowOperations: Array<{
      operation: string;
      duration: number;
      timestamp: string;
    }>;
    recentMetrics: Array<{
      operation: string;
      duration: number;
      timestamp: string;
    }>;
  };
  cache: {
    size: number;
    keys: string[];
  };
  logs: {
    total: number;
    errors: number;
    recent: Array<{
      level: string;
      message: string;
      timestamp: string;
      operation?: string;
    }>;
  };
  system: {
    uptime: number;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers: number;
    };
    nodeVersion: string;
  };
}

export function MonitoringDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/monitoring");
      const monitoringData = await response.json();
      setData(monitoringData);
    } catch (error) {
      console.error("Error fetching monitoring data:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearData = async (type: string) => {
    try {
      await fetch(`/api/monitoring?type=${type}`, { method: "DELETE" });
      await fetchMonitoringData();
    } catch (error) {
      console.error("Error clearing data:", error);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchMonitoringData, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatMemory = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel de Monitoreo</h1>
          <p className="text-muted-foreground">
            Última actualización: {new Date(data.timestamp).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
            Auto Refresh
          </Button>
          <Button onClick={fetchMonitoringData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUptime(data.system.uptime)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memoria</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMemory(data.system.memoryUsage.heapUsed)}</div>
            <p className="text-xs text-muted-foreground">
              Total: {formatMemory(data.system.memoryUsage.heapTotal)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operaciones</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.performance.totalOperations}</div>
            <p className="text-xs text-muted-foreground">
              Operaciones registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.cache.size}</div>
            <p className="text-xs text-muted-foreground">
              Entradas en cache
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tiempos Promedio por Operación</CardTitle>
              <CardDescription>
                Tiempos de respuesta promedio en milisegundos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(data.performance.averageTimes).map(([operation, time]) => (
                  <div key={operation} className="flex justify-between">
                    <span className="font-medium">{operation}</span>
                    <Badge variant={time > 1000 ? "destructive" : "secondary"}>
                      {time.toFixed(2)}ms
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Operaciones Lentas
                <Badge variant="destructive">
                  {data.performance.slowOperations.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {data.performance.slowOperations.map((op, index) => (
                    <div key={index} className="border rounded p-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{op.operation}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(op.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          {op.duration.toFixed(2)}ms
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Estadísticas de Cache
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => clearData("cache")}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpiar Cache
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-2xl font-bold">{data.cache.size} entradas</div>
                <ScrollArea className="h-64">
                  <div className="space-y-1">
                    {data.cache.keys.map((key, index) => (
                      <div key={index} className="text-sm font-mono bg-muted p-1 rounded">
                        {key}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Logs Recientes
                <div className="flex gap-2">
                  <Badge variant="destructive">
                    {data.logs.errors} errores
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => clearData("logs")}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpiar Logs
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {data.logs.recent.map((log, index) => (
                    <div key={index} className="border rounded p-2">
                      <div className="flex items-start gap-2">
                        <Badge 
                          variant={
                            log.level === "error" ? "destructive" : 
                            log.level === "warn" ? "secondary" : "default"
                          }
                        >
                          {log.level}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-medium">{log.message}</p>
                          <div className="flex gap-2 text-sm text-muted-foreground">
                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                            {log.operation && <span>• {log.operation}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Node.js</h4>
                  <p className="text-sm text-muted-foreground">
                    Versión: {data.system.nodeVersion}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Memoria</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Usada: {formatMemory(data.system.memoryUsage.heapUsed)}</div>
                    <div>Total: {formatMemory(data.system.memoryUsage.heapTotal)}</div>
                    <div>RSS: {formatMemory(data.system.memoryUsage.rss)}</div>
                    <div>External: {formatMemory(data.system.memoryUsage.external)}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
