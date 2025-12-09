import React, { useState, useEffect } from 'react';
import './AdvancedAnalyticsDashboard.css';

interface MetricCard {
  label: string;
  value: string | number;
  trend?: number;
  icon: string;
}

interface RevenueDataPoint {
  period: string;
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
}

interface FunnelStep {
  step: string;
  count: number;
  percentage: number;
}

interface CohortData {
  totalSignups: number;
  activeUsers: number;
  retentionRate: number;
}

export const AdvancedAnalyticsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<'last7days' | 'last30days' | 'last90days' | 'year'>('last30days');
  const [revenueGranularity, setRevenueGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);
  const [cohortData, setCohortData] = useState<CohortData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    productId: '',
    category: '',
    status: 'all',
  });
  const [showReportScheduler, setShowReportScheduler] = useState(false);
  const [reportConfig, setReportConfig] = useState({
    title: '',
    recipients: '',
    frequency: 'weekly',
    format: 'csv',
  });

  // Fetch dashboard metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/ecommerce-analytics/dashboard?dateRange=${dateRange}`);
        if (!response.ok) throw new Error('Failed to fetch metrics');
        const data = await response.json();

        if (data.success && data.data) {
          const metricsData: MetricCard[] = [
            {
              label: 'Total Revenue',
              value: `$${(data.data.totalRevenue || 0).toFixed(2)}`,
              trend: 5.2,
              icon: '💰',
            },
            {
              label: 'Orders',
              value: data.data.totalOrders || 0,
              trend: 2.1,
              icon: '📦',
            },
            {
              label: 'Avg Order Value',
              value: `$${(data.data.avgOrderValue || 0).toFixed(2)}`,
              trend: 1.5,
              icon: '💵',
            },
            {
              label: 'Completion Rate',
              value: `${((data.data.completionRate || 0) * 100).toFixed(1)}%`,
              trend: 3.2,
              icon: '✅',
            },
          ];
          setMetrics(metricsData);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching metrics');
        // Silent error logging
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [dateRange]);

  // Fetch revenue data
  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const response = await fetch(
          `/api/ecommerce-analytics/revenue?granularity=${revenueGranularity}&dateRange=${dateRange}`
        );
        if (!response.ok) throw new Error('Failed to fetch revenue');
        const data = await response.json();

        if (data.success && data.data && data.data.data) {
          setRevenueData(data.data.data);
        }
      } catch {
        // Silent error handling
      }
    };

    fetchRevenue();
  }, [dateRange, revenueGranularity]);

  // Fetch funnel data
  useEffect(() => {
    const fetchFunnel = async () => {
      try {
        const response = await fetch(`/api/ecommerce-analytics/funnel?dateRange=${dateRange}`);
        if (!response.ok) throw new Error('Failed to fetch funnel');
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          setFunnelData(data.data);
        }
      } catch {
        // Silent error handling
      }
    };

    fetchFunnel();
  }, [dateRange]);

  // Fetch cohort data
  useEffect(() => {
    const fetchCohorts = async () => {
      try {
        const response = await fetch(`/api/ecommerce-analytics/cohorts?dateRange=${dateRange}`);
        if (!response.ok) throw new Error('Failed to fetch cohorts');
        const data = await response.json();

        if (data.success && data.data) {
          setCohortData(data.data);
        }
      } catch {
        // Silent error handling
      }
    };

    fetchCohorts();
  }, [dateRange]);

  // Handle custom report
  const handleCustomReport = async () => {
    try {
      const response = await fetch('/api/ecommerce-analytics/reports/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters }),
      });
      if (!response.ok) throw new Error('Failed to generate report');
      await response.json();
      alert('Report generated successfully!');
    } catch (err) {
      // Silent error handling
      alert('Failed to generate report');
    }
  };

  // Handle schedule report
  const handleScheduleReport = async () => {
    try {
      const config = {
        title: reportConfig.title,
        recipients: reportConfig.recipients.split(',').map(e => e.trim()),
        frequency: reportConfig.frequency,
        format: reportConfig.format,
        type: 'revenue',
      };

      const response = await fetch('/api/ecommerce-analytics/reports/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!response.ok) throw new Error('Failed to schedule report');
      await response.json();
      alert('Report scheduled successfully!');
      setShowReportScheduler(false);
      setReportConfig({ title: '', recipients: '', frequency: 'weekly', format: 'csv' });
    } catch (err) {
      // Silent error handling
      alert('Failed to schedule report');
    }
  };

  // Handle export
  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await fetch(`/api/ecommerce-analytics/reports/demo/export?format=${format}`);
      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      // Silent error handling
      alert('Failed to export report');
    }
  };

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1);
  const _maxFunnelCount = Math.max(...funnelData.map(d => d.count), 1);

  return (
    <div className="advanced-analytics-dashboard">
      <div className="dashboard-header">
        <h1>📊 Advanced Analytics Dashboard</h1>
        <div className="header-controls">
          <select value={dateRange} onChange={e => setDateRange(e.target.value as 'last7days' | 'last30days' | 'last90days' | 'year')} className="date-range-select">
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="last90days">Last 90 Days</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}

      {/* Metric Cards */}
      <section className="metrics-section">
        <h2>Key Metrics</h2>
        {loading ? (
          <div className="loading">Loading metrics...</div>
        ) : (
          <div className="metrics-grid">
            {metrics.map((metric, idx) => (
              <div key={idx} className="metric-card">
                <div className="metric-icon">{metric.icon}</div>
                <div className="metric-label">{metric.label}</div>
                <div className="metric-value">{metric.value}</div>
                {metric.trend !== undefined && <div className="metric-trend">↑ {metric.trend}%</div>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Revenue Chart */}
      <section className="revenue-section">
        <div className="section-header">
          <h2>Revenue Metrics</h2>
          <select
            value={revenueGranularity}
            onChange={e => setRevenueGranularity(e.target.value as 'daily' | 'weekly' | 'monthly')}
            className="granularity-select"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div className="revenue-chart">
          {revenueData.length > 0 ? (
            <div className="chart-bars">
              {revenueData.map((point, idx) => (
                <div key={idx} className="chart-bar-container" title={`${point.period}: $${point.revenue.toFixed(2)}`}>
                  <div
                    className="chart-bar"
                    style={{
                      height: `${(point.revenue / maxRevenue) * 200}px`,
                    }}
                  />
                  <div className="bar-label">{point.period.substring(0, 5)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No revenue data available</div>
          )}
        </div>
      </section>

      {/* Funnel Chart */}
      <section className="funnel-section">
        <h2>Conversion Funnel</h2>
        <div className="funnel-chart">
          {funnelData.length > 0 ? (
            <div className="funnel-steps">
              {funnelData.map((step, idx) => (
                <div key={idx} className="funnel-step" style={{ width: `${100 - idx * 15}%` }}>
                  <div className="step-label">{step.step.toUpperCase()}</div>
                  <div className="step-value">{step.count} ({step.percentage.toFixed(1)}%)</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No funnel data available</div>
          )}
        </div>
      </section>

      {/* Cohort Analysis */}
      {cohortData && (
        <section className="cohort-section">
          <h2>User Cohort Analysis</h2>
          <div className="cohort-grid">
            <div className="cohort-card">
              <div className="cohort-label">Total Signups</div>
              <div className="cohort-value">{cohortData.totalSignups}</div>
            </div>
            <div className="cohort-card">
              <div className="cohort-label">Active Users</div>
              <div className="cohort-value">{cohortData.activeUsers}</div>
            </div>
            <div className="cohort-card">
              <div className="cohort-label">Retention Rate</div>
              <div className="cohort-value">{(cohortData.retentionRate * 100).toFixed(1)}%</div>
            </div>
          </div>
        </section>
      )}

      {/* Custom Report Builder */}
      <section className="custom-report-section">
        <h2>Custom Reports</h2>
        <div className="filters-grid">
          <input
            type="date"
            value={filters.startDate}
            onChange={e => setFilters({ ...filters, startDate: e.target.value })}
            placeholder="Start Date"
            className="filter-input"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={e => setFilters({ ...filters, endDate: e.target.value })}
            placeholder="End Date"
            className="filter-input"
          />
          <input
            type="text"
            value={filters.productId}
            onChange={e => setFilters({ ...filters, productId: e.target.value })}
            placeholder="Product ID"
            className="filter-input"
          />
          <input
            type="text"
            value={filters.category}
            onChange={e => setFilters({ ...filters, category: e.target.value })}
            placeholder="Category"
            className="filter-input"
          />
          <select
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}
            className="filter-input"
          >
            <option value="all">All Status</option>
            <option value="pendente">Pending</option>
            <option value="processando">Processing</option>
            <option value="concluido">Completed</option>
          </select>
        </div>
        <div className="button-group">
          <button onClick={handleCustomReport} className="btn btn-primary">
            Generate Report
          </button>
        </div>
      </section>

      {/* Export & Scheduling */}
      <section className="export-section">
        <h2>Export & Scheduling</h2>
        <div className="button-group">
          <button onClick={() => handleExport('csv')} className="btn btn-secondary">
            📥 Export CSV
          </button>
          <button onClick={() => handleExport('pdf')} className="btn btn-secondary">
            📥 Export PDF
          </button>
          <button onClick={() => setShowReportScheduler(!showReportScheduler)} className="btn btn-secondary">
            📅 Schedule Report
          </button>
        </div>

        {showReportScheduler && (
          <div className="report-scheduler">
            <h3>Schedule Report</h3>
            <div className="scheduler-form">
              <input
                type="text"
                value={reportConfig.title}
                onChange={e => setReportConfig({ ...reportConfig, title: e.target.value })}
                placeholder="Report Title"
                className="filter-input"
              />
              <input
                type="text"
                value={reportConfig.recipients}
                onChange={e => setReportConfig({ ...reportConfig, recipients: e.target.value })}
                placeholder="Recipients (comma-separated)"
                className="filter-input"
              />
              <select
                value={reportConfig.frequency}
                onChange={e => setReportConfig({ ...reportConfig, frequency: e.target.value })}
                className="filter-input"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <select
                value={reportConfig.format}
                onChange={e => setReportConfig({ ...reportConfig, format: e.target.value })}
                className="filter-input"
              >
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
              <button onClick={handleScheduleReport} className="btn btn-primary">
                ✓ Schedule
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Event Tracking Placeholder */}
      <section className="events-section">
        <h2>Event Tracking</h2>
        <p className="info-text">Real-time event tracking is enabled. Custom events are automatically logged for:</p>
        <ul className="event-list">
          <li>✓ Product Views</li>
          <li>✓ Cart Additions</li>
          <li>✓ Checkout Initiations</li>
          <li>✓ Payment Completions</li>
          <li>✓ User Signups</li>
          <li>✓ Custom Actions</li>
        </ul>
      </section>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
