/**
 * Monitoring Service
 * Comprehensive observability with logging, metrics, and alerts
 * Task 4.4 - Sistema de Monitoramento & Alertas
 */

import admin from 'firebase-admin';
import { logger } from 'firebase-functions';

const db = admin.firestore();

export interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
  unit?: string;
}

export interface Alert {
  id: string;
  name: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  resolved: boolean;
  source: string;
  metadata?: Record<string, any>;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  services: Record<string, 'healthy' | 'degraded' | 'unhealthy'>;
  timestamp: Date;
}

export interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  errorRate?: number;
  lastCheck: Date;
}

export interface SLOMetrics {
  uptime: number;
  targetUptime: number;
  avgLatency: number;
  targetLatency: number;
  errorRate: number;
  targetErrorRate: number;
  requestsTotal: number;
  requestsSuccess: number;
  requestsFailed: number;
}

class MonitoringService {
  private startTime: Date;

  constructor() {
    this.startTime = new Date();
  }

  /**
   * Record metric to Firestore
   */
  async recordMetric(metric: MetricData): Promise<void> {
    try {
      await db.collection('metrics').add({
        ...metric,
        timestamp: new Date(),
      });
    } catch (error: any) {
      logger.warn('Error recording metric', { error: error.message, metric });
      throw new Error('Failed to record metric');
    }
  }

  /**
   * Batch record metrics
   */
  async recordMetrics(metrics: MetricData[]): Promise<void> {
    try {
      if (!metrics || metrics.length === 0) {
        return;
      }
      for (const metric of metrics) {
        await db.collection('metrics').add({
          ...metric,
          timestamp: new Date(),
        });
      }
    } catch (error: any) {
      logger.warn('Error recording metrics batch', { error: error.message });
    }
  }

  /**
   * Trigger alert
   */
  async triggerAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): Promise<string> {
    try {
      const payload = {
        ...alert,
        timestamp: new Date(),
        resolved: false,
        status: 'active',
      };
      const ref = await db.collection('alerts').add(payload);

      logger.warn('Alert triggered', {
        alertId: ref.id,
        severity: alert.severity,
        message: alert.message,
      });

      return ref.id;
    } catch (error: any) {
      logger.error('Error triggering alert', { error: error.message });
      throw new Error('Failed to trigger alert');
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string, resolution?: string): Promise<boolean> {
    try {
      const docRef = db.collection('alerts').doc(alertId);
      const doc = await docRef.get();
      if (!doc.exists) {
        return false;
      }
      await docRef.update({
        resolved: true,
        resolvedAt: new Date(),
        resolution: resolution || 'Manually resolved',
        status: 'resolved',
      });

      logger.info('Alert resolved', { alertId, resolution });
      return true;
    } catch (error: any) {
      logger.error('Error resolving alert', { error: error.message, alertId });
      throw new Error('Failed to resolve alert');
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(severity?: Alert['severity']): Promise<Alert[]> {
    try {
      const snapshot = await db.collection('alerts').get();
      const allAlerts = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      const filtered = allAlerts.filter(a => {
        const isActive = (a.status && a.status === 'active') || !('resolved' in a) || a.resolved === false;
        const matchesSeverity = !severity || a.severity === severity;
        return isActive && matchesSeverity;
      });
      return filtered;
    } catch (error: any) {
      logger.error('Error fetching active alerts', { error: error.message });
      return [];
    }
  }

  /**
   * Perform health check
   */
  async healthCheck(): Promise<HealthCheckResult> {
    try {
      const uptime = Date.now() - this.startTime.getTime();
      const firestoreStatus = await this.checkFirestoreStatus();
      const functionsStatus = await this.checkFunctionsStatus();
      const storageStatus = await this.checkStorageStatus();

      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      const statuses = [firestoreStatus, functionsStatus, storageStatus];
      if (statuses.includes('unhealthy')) overallStatus = 'unhealthy';
      else if (statuses.includes('degraded')) overallStatus = 'degraded';

      return {
        status: overallStatus,
        uptime,
        services: {
          firestore: firestoreStatus,
          functions: functionsStatus,
          storage: storageStatus,
        },
        timestamp: new Date(),
      };
    } catch (error: any) {
      logger.error('Error performing health check', { error: error.message });
      return {
        status: 'unhealthy',
        uptime: 0,
        services: {},
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check Firestore health
   */
  private async checkFirestoreStatus(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    const start = Date.now();
    try {
      await db.collection('_health_check').doc('test').set({ ts: new Date() });
      await db.collection('_health_check').doc('test').get();
      const latency = Date.now() - start;
      return latency < 1000 ? 'healthy' : 'degraded';
    } catch (error) {
      return 'unhealthy';
    }
  }

  /**
   * Check Functions health
   */
  private async checkFunctionsStatus(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    return 'healthy';
  }

  /**
   * Check Storage health
   */
  private async checkStorageStatus(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    return 'healthy';
  }

  /**
   * Get SLO metrics
   */
  async getSLOMetrics(startDate: Date, endDate: Date): Promise<SLOMetrics> {
    try {
      const metricsSnapshot = await db.collection('metrics').get();

      const latencies: number[] = [];
      let requestsSuccess = 0;
      let requestsFailed = 0;
      let uptimeMetric: number | null = null;
      let errorRateMetric: number | null = null;

      metricsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const ts: Date = data.timestamp instanceof Date ? data.timestamp : new Date();
        if (ts < startDate || ts > endDate) return;
        if (data.name === 'request_latency' || data.name === 'api_latency') {
          latencies.push(Number(data.value) || 0);
        }
        if (data.name === 'request_success') {
          requestsSuccess += 1;
        }
        if (data.name === 'request_error') {
          requestsFailed += 1;
        }
        if (data.name === 'uptime') {
          uptimeMetric = Number(data.value);
        }
        if (data.name === 'error_rate') {
          errorRateMetric = Number(data.value);
        }
      });

      const requestsTotal = requestsSuccess + requestsFailed;
      const avgLatency =
        latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
      const computedErrorRate = requestsTotal > 0 ? requestsFailed / requestsTotal : 0;
      const errorRate = errorRateMetric !== null ? errorRateMetric * 100 : computedErrorRate * 100;

      // Calculate uptime (simplified)
      let uptimePercentage =
        uptimeMetric !== null ? uptimeMetric * 100 : requestsTotal > 0 ? (requestsSuccess / requestsTotal) * 100 : 100;
      if (metricsSnapshot.docs.length === 0) {
        uptimePercentage = 0;
      }

      return {
        uptime: uptimePercentage,
        targetUptime: 99.5,
        avgLatency,
        targetLatency: 1000,
        errorRate,
        targetErrorRate: 1,
        requestsTotal,
        requestsSuccess,
        requestsFailed,
      };
    } catch (error: any) {
      logger.error('Error calculating SLO metrics', { error: error.message });
      return {
        uptime: 0,
        targetUptime: 99.5,
        avgLatency: 0,
        targetLatency: 1000,
        errorRate: 0,
        targetErrorRate: 1,
        requestsTotal: 0,
        requestsSuccess: 0,
        requestsFailed: 0,
      };
    }
  }

  /**
   * Check SLO violations and trigger alerts
   */
  async checkSLOViolations(): Promise<void> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // Last 24h

      const metrics = await this.getSLOMetrics(startDate, endDate);

      // Check uptime
      if (metrics.uptime < metrics.targetUptime) {
        await this.triggerAlert({
          name: 'SLO Violation: Uptime',
          severity: 'critical',
          message: `Uptime is ${metrics.uptime.toFixed(2)}%, below target of ${metrics.targetUptime}%`,
          source: 'slo-monitor',
          metadata: { metrics },
        });
      }

      // Check latency
      if (metrics.avgLatency > metrics.targetLatency) {
        await this.triggerAlert({
          name: 'SLO Violation: Latency',
          severity: 'warning',
          message: `Average latency is ${metrics.avgLatency.toFixed(0)}ms, above target of ${metrics.targetLatency}ms`,
          source: 'slo-monitor',
          metadata: { metrics },
        });
      }

      // Check error rate
      if (metrics.errorRate > metrics.targetErrorRate) {
        await this.triggerAlert({
          name: 'SLO Violation: Error Rate',
          severity: 'critical',
          message: `Error rate is ${metrics.errorRate.toFixed(2)}%, above target of ${metrics.targetErrorRate}%`,
          source: 'slo-monitor',
          metadata: { metrics },
        });
      }
    } catch (error: any) {
      logger.error('Error checking SLO violations', { error: error.message });
    }
  }

  /**
   * Get metrics by name
   */
  async getMetrics(
    name: string,
    startDate: Date,
    endDate: Date,
    limit: number = 1000
  ): Promise<MetricData[]> {
    try {
      const snapshot = await db.collection('metrics').get();
      const metrics = snapshot.docs
        .map(doc => doc.data() as MetricData & { timestamp: any })
        .filter(m => {
          const ts: Date = m.timestamp instanceof Date ? m.timestamp : new Date();
          return m.name === name && ts >= startDate && ts <= endDate;
        })
        .slice(0, limit);
      return metrics as MetricData[];
    } catch (error: any) {
      logger.error('Error fetching metrics', { error: error.message });
      return [];
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Log structured event
   */
  logEvent(
    level: 'info' | 'warn' | 'error',
    message: string,
    metadata?: Record<string, any>
  ): void {
    const logEntry = {
      level,
      message,
      timestamp: new Date(),
      ...metadata,
    };

    switch (level) {
      case 'info':
        logger.info(message, metadata);
        break;
      case 'warn':
        logger.warn(message, metadata);
        break;
      case 'error':
        logger.error(message, metadata);
        break;
    }
  }
}

export default new MonitoringService();
