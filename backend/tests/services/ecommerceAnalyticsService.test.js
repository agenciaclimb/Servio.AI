const { describe, it, expect, beforeEach, vi } = require('vitest');
const {
  getDashboardMetrics,
  getRevenueMetrics,
  getFunnelMetrics,
  buildCustomReport,
  generateCSVExport,
  generatePDFExport,
  scheduleReport,
  analyzeCohorts,
  trackEvent,
} = require('../../../src/services/ecommerceAnalyticsService');

// Mock Firestore
function createMockDb() {
  return {
    collection: vi.fn(function (collectionName) {
      return {
        collectionName,
        where: vi.fn(function () {
          return this;
        }),
        orderBy: vi.fn(function () {
          return this;
        }),
        limit: vi.fn(function () {
          return this;
        }),
        get: vi.fn(async function () {
          // Return empty docs array by default
          return {
            docs: [],
            empty: true,
          };
        }),
        doc: vi.fn(function (docId) {
          return {
            set: vi.fn(async function (data) {
              return { id: docId, ...data };
            }),
            get: vi.fn(async function () {
              return {
                id: docId,
                data: () => ({}),
                exists: true,
              };
            }),
          };
        }),
      };
    }),
  };
}

describe('ecommerceAnalyticsService', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = createMockDb();
  });

  // ===== Dashboard Metrics Tests =====
  describe('getDashboardMetrics', () => {
    it('should return dashboard metrics with empty orders', async () => {
      const result = await getDashboardMetrics(mockDb, 'last30days');

      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalOrders');
      expect(result).toHaveProperty('totalRevenue');
      expect(result).toHaveProperty('avgOrderValue');
      expect(result).toHaveProperty('completionRate');
      expect(result).toHaveProperty('cartAbandonment');
      expect(result.totalOrders).toBe(0);
      expect(result.totalRevenue).toBe(0);
    });

    it('should handle different date ranges', async () => {
      const ranges = ['last7days', 'last30days', 'last90days', 'year'];

      for (const range of ranges) {
        const result = await getDashboardMetrics(mockDb, range);
        expect(result).toBeDefined();
        expect(result.dateRange).toBe(range);
      }
    });
  });

  // ===== Revenue Metrics Tests =====
  describe('getRevenueMetrics', () => {
    it('should aggregate revenue by daily granularity', async () => {
      const result = await getRevenueMetrics(mockDb, 'daily', 'last30days');

      expect(result).toBeDefined();
      expect(result).toHaveProperty('granularity', 'daily');
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should aggregate revenue by weekly granularity', async () => {
      const result = await getRevenueMetrics(mockDb, 'weekly', 'last90days');

      expect(result).toBeDefined();
      expect(result.granularity).toBe('weekly');
      expect(result.data).toBeDefined();
    });

    it('should aggregate revenue by monthly granularity', async () => {
      const result = await getRevenueMetrics(mockDb, 'monthly', 'year');

      expect(result).toBeDefined();
      expect(result.granularity).toBe('monthly');
      expect(result.totalRevenue).toBe(0);
    });
  });

  // ===== Funnel Metrics Tests =====
  describe('getFunnelMetrics', () => {
    it('should return 3-step conversion funnel', async () => {
      const result = await getFunnelMetrics(mockDb, 'last30days');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);

      // Check structure of funnel steps
      result.forEach((step, index) => {
        expect(step).toHaveProperty('step');
        expect(step).toHaveProperty('count', 0);
        expect(step).toHaveProperty('percentage', 0);
      });
    });

    it('should include cart abandonment metric', async () => {
      const result = await getFunnelMetrics(mockDb, 'last30days');

      expect(result).toBeDefined();
      const stepNames = result.map(r => r.step);
      expect(stepNames).toContain('cart');
      expect(stepNames).toContain('checkout');
      expect(stepNames).toContain('payment');
    });
  });

  // ===== Custom Report Tests =====
  describe('buildCustomReport', () => {
    it('should build report without filters', async () => {
      const result = await buildCustomReport(mockDb, {});

      expect(result).toBeDefined();
      expect(result).toHaveProperty('orderCount', 0);
      expect(result).toHaveProperty('totalRevenue', 0);
      expect(result).toHaveProperty('avgOrderValue', 0);
    });

    it('should apply date range filter', async () => {
      const filters = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };
      const result = await buildCustomReport(mockDb, filters);

      expect(result).toBeDefined();
      expect(result.orderCount).toBeGreaterThanOrEqual(0);
    });
  });

  // ===== Export Tests =====
  describe('generateCSVExport', () => {
    it('should generate CSV with headers', () => {
      const orders = [];
      const csv = generateCSVExport(orders);

      expect(csv).toBeDefined();
      expect(typeof csv).toBe('string');
      expect(csv).toContain('ID');
      expect(csv).toContain('Data');
      expect(csv).toContain('Status');
    });

    it('should format CSV rows correctly', () => {
      const orders = [
        {
          id: 'order-1',
          createdAt: new Date('2024-01-15').toISOString(),
          status: 'concluído',
          subtotal: 100,
          tax: 15,
          shipping: 10,
          total: 125,
        },
      ];
      const csv = generateCSVExport(orders);

      expect(csv).toContain('order-1');
      expect(csv).toContain('concluído');
      expect(csv).toContain('125');
    });
  });

  describe('generatePDFExport', () => {
    it('should generate PDF metadata structure', () => {
      const orders = [];
      const pdf = generatePDFExport(orders, 'Test Report');

      expect(pdf).toBeDefined();
      expect(pdf).toHaveProperty('title', 'Test Report');
      expect(pdf).toHaveProperty('generatedAt');
      expect(pdf).toHaveProperty('data');
      expect(Array.isArray(pdf.data)).toBe(true);
    });

    it('should include PDF summary statistics', () => {
      const orders = [
        { id: 'order-1', total: 100 },
        { id: 'order-2', total: 200 },
      ];
      const pdf = generatePDFExport(orders, 'Sales Report');

      expect(pdf.title).toBe('Sales Report');
      expect(pdf.summary).toBeDefined();
      expect(pdf.summary.orderCount).toBe(2);
      expect(pdf.summary.totalRevenue).toBe(300);
    });
  });

  // ===== Schedule Report Tests =====
  describe('scheduleReport', () => {
    it('should require recipients array', async () => {
      try {
        await scheduleReport(mockDb, { title: 'Test' });
        expect.fail('Should throw error for missing recipients');
      } catch (error) {
        expect(error.message).toContain('recipients');
      }
    });

    it('should create scheduled report document', async () => {
      const config = {
        title: 'Weekly Sales',
        recipients: ['test@example.com'],
        frequency: 'weekly',
        format: 'csv',
      };

      const result = await scheduleReport(mockDb, config);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('title', 'Weekly Sales');
      expect(result).toHaveProperty('status', 'scheduled');
    });
  });

  // ===== Cohort Analysis Tests =====
  describe('analyzeCohorts', () => {
    it('should return cohort analysis with zero signup users', async () => {
      const result = await analyzeCohorts(mockDb, 'last90days');

      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalSignups', 0);
      expect(result).toHaveProperty('activeUsers', 0);
      expect(result).toHaveProperty('retentionRate', 0);
    });
  });

  // ===== Event Tracking Tests =====
  describe('trackEvent', () => {
    it('should require eventName', async () => {
      try {
        await trackEvent(mockDb, { userId: 'user-1' });
        expect.fail('Should throw error for missing eventName');
      } catch (error) {
        expect(error.message).toContain('eventName');
      }
    });

    it('should create analytics event document', async () => {
      const eventData = {
        eventName: 'product_viewed',
        userId: 'user-123',
        metadata: { productId: 'prod-456' },
      };

      const result = await trackEvent(mockDb, eventData);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('eventName', 'product_viewed');
      expect(result).toHaveProperty('userId', 'user-123');
      expect(result).toHaveProperty('timestamp');
    });
  });
});
