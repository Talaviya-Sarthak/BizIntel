import { describe, it, expect } from 'vitest';
import { MarketDataValidationService } from '../services/market-data-validation.service';

function createRow(overrides: Record<string, unknown> = {}) {
  return {
    timestamp: '2024-01-01',
    open: 100,
    high: 110,
    low: 90,
    close: 105,
    volume: 1000,
    ...overrides,
  };
}

function createRows(count: number, overrides: Record<string, unknown> = {}) {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: `2024-01-${String(i + 1).padStart(2, '0')}`,
    open: 100 + i,
    high: 110 + i,
    low: 90 + i,
    close: 105 + i,
    volume: 1000,
    ...overrides,
  }));
}

describe('MarketDataValidationService', () => {
  const service = new MarketDataValidationService();

  // ─── Column Detection ──────────────────────────────────────

  describe('column detection', () => {
    it('should detect standard column names', () => {
      const data = createRows(15);
      const result = service.validate(data);
      expect(result.detectedColumns.timestamp).toBe('timestamp');
      expect(result.detectedColumns.open).toBe('open');
      expect(result.detectedColumns.high).toBe('high');
      expect(result.detectedColumns.low).toBe('low');
      expect(result.detectedColumns.close).toBe('close');
      expect(result.detectedColumns.volume).toBe('volume');
    });

    it('should detect timestamp aliases: "date"', () => {
      const data = createRows(15);
      data.forEach((row) => {
        const ts = (row as Record<string, unknown>)['timestamp'];
        delete (row as Record<string, unknown>)['timestamp'];
        (row as Record<string, unknown>)['date'] = ts;
      });
      const result = service.validate(data);
      expect(result.detectedColumns.timestamp).toBe('date');
    });

    it('should detect timestamp aliases: "datetime"', () => {
      const data = createRows(15);
      data.forEach((row) => {
        const ts = (row as Record<string, unknown>)['timestamp'];
        delete (row as Record<string, unknown>)['timestamp'];
        (row as Record<string, unknown>)['datetime'] = ts;
      });
      const result = service.validate(data);
      expect(result.detectedColumns.timestamp).toBe('datetime');
    });

    it('should detect timestamp aliases: "ts"', () => {
      const data = createRows(15);
      data.forEach((row) => {
        const ts = (row as Record<string, unknown>)['timestamp'];
        delete (row as Record<string, unknown>)['timestamp'];
        (row as Record<string, unknown>)['ts'] = ts;
      });
      const result = service.validate(data);
      expect(result.detectedColumns.timestamp).toBe('ts');
    });

    it('should detect OHLC column aliases (case insensitive)', () => {
      const data = createRows(15);
      data.forEach((row) => {
        delete (row as Record<string, unknown>)['open'];
        delete (row as Record<string, unknown>)['high'];
        delete (row as Record<string, unknown>)['low'];
        delete (row as Record<string, unknown>)['close'];
        (row as Record<string, unknown>)['Open'] = 100;
        (row as Record<string, unknown>)['High'] = 110;
        (row as Record<string, unknown>)['Low'] = 90;
        (row as Record<string, unknown>)['Close'] = 105;
      });
      const result = service.validate(data);
      expect(result.detectedColumns.open).toBe('Open');
      expect(result.detectedColumns.high).toBe('High');
      expect(result.detectedColumns.low).toBe('Low');
      expect(result.detectedColumns.close).toBe('Close');
    });

    it('should detect volume aliases: "Vol"', () => {
      const data = createRows(15);
      data.forEach((row) => {
        delete (row as Record<string, unknown>)['volume'];
        (row as Record<string, unknown>)['Vol'] = 1000;
      });
      const result = service.validate(data);
      expect(result.detectedColumns.volume).toBe('Vol');
    });
  });

  // ─── Rejection of Invalid Data ─────────────────────────────

  describe('rejection of invalid data', () => {
    it('should reject non-numeric OHLC values', () => {
      const data = createRows(15);
      (data[5] as Record<string, unknown>)['open'] = 'not-a-number';
      const result = service.validate(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('non-numeric'))).toBe(true);
    });

    it('should reject datasets with too few rows (warning)', () => {
      const data = createRows(5);
      const result = service.validate(data);
      expect(result.warnings.some((w) => w.includes('only 5 rows'))).toBe(true);
    });

    it('should handle empty datasets', () => {
      const result = service.validate([]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Dataset is empty or not an array');
      expect(result.rowCount).toBe(0);
    });

    it('should handle non-array input', () => {
      const result = service.validate('not an array' as unknown as Record<string, unknown>[]);
      expect(result.isValid).toBe(false);
    });

    it('should reject when timestamp column is missing', () => {
      const data = createRows(15);
      data.forEach((row) => {
        delete (row as Record<string, unknown>)['timestamp'];
        delete (row as Record<string, unknown>)['date'];
        delete (row as Record<string, unknown>)['ts'];
      });
      const result = service.validate(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('timestamp'))).toBe(true);
    });
  });

  // ─── Duplicate & Chronological Validation ──────────────────

  describe('timestamp validation', () => {
    it('should detect duplicate timestamps', () => {
      const data = createRows(15);
      // Make two rows have the same timestamp
      data[5]!.timestamp = data[4]!.timestamp;
      const result = service.validate(data);
      expect(result.warnings.some((w) => w.includes('duplicate'))).toBe(true);
    });

    it('should detect out-of-order timestamps', () => {
      const data = createRows(15);
      // Swap two rows to create out-of-order
      const temp = { ...data[10]! };
      data[10]! = { ...data[5]! };
      data[5]! = temp;
      const result = service.validate(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('not in ascending order'))).toBe(true);
    });
  });

  // ─── OHLC Relationship Validation ──────────────────────────

  describe('OHLC relationships', () => {
    it('should reject High < max(Open, Close)', () => {
      const data = createRows(15);
      (data[3] as Record<string, unknown>)['open'] = 100;
      (data[3] as Record<string, unknown>)['close'] = 110;
      (data[3] as Record<string, unknown>)['high'] = 105; // less than close
      const result = service.validate(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('High') && e.includes('less than'))).toBe(true);
    });

    it('should reject Low > min(Open, Close)', () => {
      const data = createRows(15);
      (data[3] as Record<string, unknown>)['open'] = 100;
      (data[3] as Record<string, unknown>)['close'] = 110;
      (data[3] as Record<string, unknown>)['low'] = 105; // greater than open
      const result = service.validate(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Low') && e.includes('greater than'))).toBe(true);
    });

    it('should accept valid OHLC relationships', () => {
      const data = createRows(15);
      const result = service.validate(data);
      expect(result.isValid).toBe(true);
    });
  });

  // ─── Edge Cases ────────────────────────────────────────────

  describe('edge cases', () => {
    it('should accept exactly MINIMUM_REQUIRED_ROWS (10)', () => {
      const data = createRows(10);
      const result = service.validate(data);
      expect(result.isValid).toBe(true);
      expect(result.warnings.some((w) => w.includes('rows'))).toBe(false);
    });

    it('should handle numeric string OHLC values', () => {
      const data = createRows(15);
      data.forEach((row) => {
        (row as Record<string, unknown>)['open'] = String(row.open);
        (row as Record<string, unknown>)['high'] = String(row.high);
        (row as Record<string, unknown>)['low'] = String(row.low);
        (row as Record<string, unknown>)['close'] = String(row.close);
      });
      const result = service.validate(data);
      expect(result.isValid).toBe(true);
    });

    it('should handle null/undefined values in OHLC columns', () => {
      const data = createRows(15);
      (data[3] as Record<string, unknown>)['close'] = null;
      const result = service.validate(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('null'))).toBe(true);
    });
  });
});
