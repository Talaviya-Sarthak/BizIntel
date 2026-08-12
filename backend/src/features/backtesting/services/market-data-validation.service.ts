export interface ValidationResult {
  isValid: boolean;
  detectedColumns: {
    timestamp: string | null;
    open: string | null;
    high: string | null;
    low: string | null;
    close: string | null;
    volume: string | null;
  };
  errors: string[];
  warnings: string[];
  rowCount: number;
}

interface RawRow {
  [key: string]: unknown;
}

const TIMESTAMP_ALIASES = [
  'timestamp', 'date', 'datetime', 'time', 'trade_date',
  'tradedate', 'dt', 'ts', 'timestamp_ms',
  'date_time', 'trade_datetime', 'time_stamp',
];

const OHLC_ALIASES: Record<string, string[]> = {
  open: ['open', 'Open', 'OPEN', 'opening', 'open_price', 'openprice'],
  high: ['high', 'High', 'HIGH', 'highest', 'high_price', 'highprice'],
  low: ['low', 'Low', 'LOW', 'lowest', 'low_price', 'lowprice'],
  close: ['close', 'Close', 'CLOSE', 'closing', 'close_price', 'closeprice'],
};

const VOLUME_ALIASES = ['volume', 'Volume', 'VOLUME', 'vol', 'Vol', 'VOL', 'traded_volume'];

const MINIMUM_REQUIRED_ROWS = 10;

export class MarketDataValidationService {
  validate(data: RawRow[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(data) || data.length === 0) {
      return {
        isValid: false,
        detectedColumns: { timestamp: null, open: null, high: null, low: null, close: null, volume: null },
        errors: ['Dataset is empty or not an array'],
        warnings: [],
        rowCount: 0,
      };
    }

    const rowCount = data.length;
    const firstRow = data[0]!;
    const columnNames = Object.keys(firstRow);

    if (rowCount < MINIMUM_REQUIRED_ROWS) {
      warnings.push(`Dataset has only ${rowCount} rows; minimum recommended is ${MINIMUM_REQUIRED_ROWS}`);
    }

    const detectedColumns = {
      timestamp: this.detectColumn(columnNames, TIMESTAMP_ALIASES),
      open: this.detectColumn(columnNames, OHLC_ALIASES['open'] ?? []),
      high: this.detectColumn(columnNames, OHLC_ALIASES['high'] ?? []),
      low: this.detectColumn(columnNames, OHLC_ALIASES['low'] ?? []),
      close: this.detectColumn(columnNames, OHLC_ALIASES['close'] ?? []),
      volume: this.detectColumn(columnNames, VOLUME_ALIASES),
    };

    if (!detectedColumns.timestamp) {
      errors.push('Could not detect timestamp column');
    }
    if (!detectedColumns.open) {
      errors.push('Could not detect Open column');
    }
    if (!detectedColumns.high) {
      errors.push('Could not detect High column');
    }
    if (!detectedColumns.low) {
      errors.push('Could not detect Low column');
    }
    if (!detectedColumns.close) {
      errors.push('Could not detect Close column');
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        detectedColumns,
        errors,
        warnings,
        rowCount,
      };
    }

    this.validateNumericTypes(data, detectedColumns, errors);
    this.validateChronologicalOrder(data, detectedColumns.timestamp!, errors);
    this.validateDuplicateTimestamps(data, detectedColumns.timestamp!, warnings);
    this.validateMissingTimestamps(data, detectedColumns.timestamp!, warnings);
    this.validateOHLCRelationships(data, detectedColumns, errors);

    return {
      isValid: errors.length === 0,
      detectedColumns,
      errors,
      warnings,
      rowCount,
    };
  }

  private detectColumn(columnNames: string[], aliases: string[]): string | null {
    const lowerAliases = aliases.map((a) => a.toLowerCase());

    for (let i = 0; i < columnNames.length; i++) {
      const name = columnNames[i]!;
      const lowerName = name.toLowerCase();
      if (lowerAliases.indexOf(lowerName) !== -1) {
        return name;
      }
    }

    for (let i = 0; i < columnNames.length; i++) {
      const name = columnNames[i]!;
      const lowerName = name.toLowerCase();
      for (const alias of lowerAliases) {
        if (lowerName.includes(alias) || alias.includes(lowerName)) {
          return name;
        }
      }
    }

    return null;
  }

  private validateNumericTypes(
    data: RawRow[],
    detectedColumns: ValidationResult['detectedColumns'],
    errors: string[]
  ): void {
    const ohlcFields = ['open', 'high', 'low', 'close'] as const;

    for (const field of ohlcFields) {
      const col = detectedColumns[field];
      if (!col) continue;

      for (let i = 0; i < data.length; i++) {
        const row = data[i]!;
        const val = row[col];
        if (val === null || val === undefined || val === '') {
          errors.push(`${field} column has null/undefined/empty value at row ${i}`);
          break;
        }
        if (typeof val === 'number' && !isFinite(val)) {
          errors.push(`${field} column has non-finite number at row ${i}: ${val}`);
          break;
        }
        if (typeof val !== 'number') {
          const num = Number(val);
          if (isNaN(num)) {
            errors.push(`${field} column has non-numeric value at row ${i}: "${val}"`);
            break;
          }
        }
      }
    }

    if (detectedColumns.volume) {
      for (let i = 0; i < data.length; i++) {
        const row = data[i]!;
        const val = row[detectedColumns.volume!];
        if (val !== null && val !== undefined && val !== '' && typeof val !== 'number') {
          const num = Number(val);
          if (isNaN(num)) {
            errors.push(`Volume column has non-numeric value at row ${i}: "${val}"`);
            break;
          }
        }
      }
    }
  }

  private validateChronologicalOrder(
    data: RawRow[],
    timestampCol: string,
    errors: string[]
  ): void {
    for (let i = 1; i < data.length; i++) {
      const prevRow = data[i - 1]!;
      const currRow = data[i]!;
      const prev = new Date(prevRow[timestampCol] as string | number);
      const curr = new Date(currRow[timestampCol] as string | number);

      if (isNaN(prev.getTime()) || isNaN(curr.getTime())) {
        errors.push(`Invalid date value detected at row ${i - 1} or ${i}`);
        break;
      }

      if (curr.getTime() < prev.getTime()) {
        errors.push(
          `Timestamps not in ascending order at rows ${i - 1} and ${i}: ${prev.toISOString()} > ${curr.toISOString()}`
        );
        break;
      }
    }
  }

  private validateDuplicateTimestamps(
    data: RawRow[],
    timestampCol: string,
    warnings: string[]
  ): void {
    const seen = new Set<string>();
    let duplicateCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i]!;
      const ts = String(row[timestampCol]);
      if (seen.has(ts)) {
        duplicateCount++;
      } else {
        seen.add(ts);
      }
    }

    if (duplicateCount > 0) {
      warnings.push(`Found ${duplicateCount} duplicate timestamp(s) in the dataset`);
    }
  }

  private validateMissingTimestamps(
    data: RawRow[],
    timestampCol: string,
    warnings: string[]
  ): void {
    if (data.length < 2) return;

    const timestamps: number[] = [];
    let hasInvalidDates = false;

    for (let i = 0; i < data.length; i++) {
      const row = data[i]!;
      const d = new Date(row[timestampCol] as string | number);
      if (isNaN(d.getTime())) {
        hasInvalidDates = true;
        break;
      }
      timestamps.push(d.getTime());
    }

    if (hasInvalidDates) return;

    const diffs = new Set<number>();
    for (let i = 1; i < timestamps.length; i++) {
      diffs.add(timestamps[i]! - timestamps[i - 1]!);
    }

    if (diffs.size > 1) {
      const dayMs = 24 * 60 * 60 * 1000;
      const diffsArray = Array.from(diffs).filter((d) => d > 0 && d < 10 * dayMs);
      if (diffsArray.length > 1) {
        const sorted = diffsArray.sort((a, b) => a - b);
        const medianDiff = sorted[Math.floor(sorted.length / 2)]!;
        let gapCount = 0;

        for (let i = 1; i < timestamps.length; i++) {
          const diff = timestamps[i]! - timestamps[i - 1]!;
          if (diff > medianDiff * 1.5) {
            gapCount++;
          }
        }

        if (gapCount > 0) {
          warnings.push(`Detected ${gapCount} potential gap(s) in timestamps`);
        }
      }
    }
  }

  private validateOHLCRelationships(
    data: RawRow[],
    detectedColumns: ValidationResult['detectedColumns'],
    errors: string[]
  ): void {
    const openCol = detectedColumns.open!;
    const highCol = detectedColumns.high!;
    const lowCol = detectedColumns.low!;
    const closeCol = detectedColumns.close!;

    for (let i = 0; i < data.length; i++) {
      const row = data[i]!;
      const open = this.toNumber(row[openCol]);
      const high = this.toNumber(row[highCol]);
      const low = this.toNumber(row[lowCol]);
      const close = this.toNumber(row[closeCol]);

      if (high < Math.max(open, close)) {
        errors.push(
          `High (${high}) is less than max(Open, Close) (${Math.max(open, close)}) at row ${i}`
        );
        break;
      }

      if (low > Math.min(open, close)) {
        errors.push(
          `Low (${low}) is greater than min(Open, Close) (${Math.min(open, close)}) at row ${i}`
        );
        break;
      }
    }
  }

  private toNumber(val: unknown): number {
    if (typeof val === 'number') return val;
    return Number(val);
  }
}
