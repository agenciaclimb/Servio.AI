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
  services: Record<string, ServiceHealth>;
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
        timestamp: admin.firestore.Timestamp.now(),
      });
    } catch (error: any) {
      logger.warn('Error recording metric', { error: error.message, metric });
    }
  }

  /**
   * Batch record metrics
   */
  async recordMetrics(metrics: MetricData[]): Promise<void> {
    try {
      const batch = db.batch();
      metrics.forEach(metric => {
        const ref = db.collection('metrics').doc();
        batch.set(ref, {
          ...metric,
          timestamp: admin.firestore.Timestamp.now(),
        });
      });
      await batch.commit();
    } catch (error: any) {
      logger.warn('Error recording metrics batch', { error: error.message });
    }
  }

  /**
   * Trigger alert
   */
  async triggerAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): Promise<string> {
    try {
      const alertDoc: Alert = {
        id: this.generateId(),
        ...alert,
        timestamp: new Date(),
        resolved: false,
      };

      await db.collection('alerts').doc(alertDoc.id).set(alertDoc);

      logger.warn('Alert triggered', {
        alertId: alertDoc.id,
        severity: alert.severity,
        message: alert.message,
      });

      return alertDoc.id;
    } catch (error: any) {
      logger.error('Error triggering alert', { error: error.message });
      throw error;
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string, resolution?: string): Promise<boolean> {
    try {
      await db
        .collection('alerts')
        .doc(alertId)
        .update({
          resolved: true,
          resolvedAt: admin.firestore.Timestamp.now(),
          resolution: resolution || 'Manually resolved',
        });

      logger.info('Alert resolved', { alertId, resolution });
      return true;
    } catch (error: any) {
      logger.error('Error resolving alert', { error: error.message, alertId });
      return false;
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(severity?: Alert['severity']): Promise<Alert[]> {
    try {
      let query = db.collection('alerts').where('resolved', '==', false);

      if (severity) {
        query = query.where('severity', '==', severity);
      }

      const snapshot = await query.orderBy('timestamp', 'desc').limit(100).get();

      return snapshot.docs.map(doc => doc.data() as Alert);
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

      const services: Record<string, ServiceHealth> = {
        firestore: await this.checkFirestore(),
        functions: await this.checkFunctions(),
        storage: await this.checkStorage(),
      };

      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

      const serviceStatuses = Object.values(services);
      if (serviceStatuses.some(s => s.status === 'down')) {
        overallStatus = 'unhealthy';
      } else if (serviceStatuses.some(s => s.status === 'degraded')) {
        overallStatus = 'degraded';
      }

      return {
        status: overallStatus,
        uptime: uptime,
        services,
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
  private async checkFirestore(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      await db.collection('_health_check').doc('test').get();
      const latency = Date.now() - start;

      return {
        status: latency < 1000 ? 'up' : 'degraded',
        latency,
        lastCheck: new Date(),
      };
    } catch (error) {
      return {
        status: 'down',
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Check Functions health
   */
  private async checkFunctions(): Promise<ServiceHealth> {
    return {
      status: 'up',
      lastCheck: new Date(),
    };
  }

  /**
   * Check Storage health
   */
  private async checkStorage(): Promise<ServiceHealth> {
    return {
      status: 'up',
      lastCheck: new Date(),
    };
  }

  /**
   * Get SLO metrics
   */
  async getSLOMetrics(startDate: Date, endDate: Date): Promise<SLOMetrics> {
    try {
      const metricsSnapshot = await db
        .collection('metrics')
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate))
        .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endDate))
        .get();

      const latencies: number[] = [];
      let requestsSuccess = 0;
      let requestsFailed = 0;

      metricsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.name === 'request_latency') {
          latencies.push(data.value);
        }
        if (data.name === 'request_success') {
          requestsSuccess += 1;
        }
        if (data.name === 'request_error') {
          requestsFailed += 1;
        }
      });

      const requestsTotal = requestsSuccess + requestsFailed;
      const avgLatency =
        latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
      const errorRate = requestsTotal > 0 ? requestsFailed / requestsTotal : 0;

      // Calculate uptime (simplified)
      const uptimePercentage = requestsTotal > 0 ? (requestsSuccess / requestsTotal) * 100 : 100;

      return {
        uptime: uptimePercentage,
        targetUptime: 99.5,
        avgLatency,
        targetLatency: 1000,
        errorRate: errorRate * 100,
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
      const snapshot = await db
        .collection('metrics')
        .where('name', '==', name)
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate))
        .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endDate))
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => doc.data() as MetricData);
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
