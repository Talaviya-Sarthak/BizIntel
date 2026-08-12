import { describe, it, expect, beforeEach } from 'vitest';
import { SmaCrossoverStrategy } from '../strategies/sma-crossover.strategy';
import { RsiStrategy } from '../strategies/rsi.strategy';
import { BollingerBandsStrategy } from '../strategies/bollinger-bands.strategy';
import { MarketBar, StrategyContext } from '../types';

function createBar(close: number, date?: Date): MarketBar {
  return {
    timestamp: date ?? new Date('2024-01-01'),
    open: close,
    high: close + 2,
    low: close - 2,
    close,
    volume: 1000,
  };
}

function createBars(closes: number[], startDate?: string): MarketBar[] {
  const base = startDate ? new Date(startDate) : new Date('2024-01-01');
  return closes.map((close, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    return createBar(close, d);
  });
}

function createContext(bars: MarketBar[], currentIndex: number, position = 0, cash = 10000): StrategyContext {
  return {
    bars,
    currentIndex,
    position,
    cash,
    equity: cash + position * bars[currentIndex]!.close,
  };
}

// ──────────────────────── SMA Crossover ────────────────────────

describe('SmaCrossoverStrategy', () => {
  let strategy: SmaCrossoverStrategy;

  beforeEach(() => {
    strategy = new SmaCrossoverStrategy();
  });

  it('should initialize with default parameters', () => {
    strategy.initialize({});
    expect(strategy.config.id).toBe('sma-crossover');
    expect(strategy.config.parameters).toHaveLength(2);
  });

  it('should initialize with custom parameters', () => {
    strategy.initialize({ shortWindow: 10, longWindow: 30 });
    expect(strategy.config.id).toBe('sma-crossover');
  });

  it('should generate HOLD when not enough bars', () => {
    strategy.initialize({ shortWindow: 5, longWindow: 10 });
    const bars = createBars([100, 101, 102, 103, 104]);
    const signal = strategy.onBar(createContext(bars, 3));
    expect(signal.action).toBe('HOLD');
  });

  it('should generate BUY when short SMA crosses above long SMA', () => {
    strategy.initialize({ shortWindow: 3, longWindow: 5 });

    const prices = [100, 100, 100, 100, 100, 102, 104, 106, 108, 110];
    const bars = createBars(prices);
    const signals: string[] = [];

    for (let i = 0; i < bars.length; i++) {
      const signal = strategy.onBar(createContext(bars, i));
      signals.push(signal.action);
    }

    expect(signals).toContain('BUY');
  });

  it('should generate SELL when short SMA crosses below long SMA', () => {
    strategy.initialize({ shortWindow: 3, longWindow: 5 });

    const prices = [110, 110, 110, 110, 110, 108, 106, 104, 102, 100, 98, 96];
    const bars = createBars(prices);
    const signals: string[] = [];

    for (let i = 0; i < bars.length; i++) {
      const signal = strategy.onBar(createContext(bars, i));
      signals.push(signal.action);
    }

    expect(signals).toContain('SELL');
  });

  it('should return HOLD for flat market (all same prices)', () => {
    strategy.initialize({ shortWindow: 3, longWindow: 5 });
    const bars = createBars(Array(20).fill(100));
    const signals: string[] = [];

    for (let i = 0; i < bars.length; i++) {
      const signal = strategy.onBar(createContext(bars, i));
      signals.push(signal.action);
    }

    expect(signals.every((s) => s === 'HOLD')).toBe(true);
  });

  it('should handle edge case with minimum bars', () => {
    strategy.initialize({ shortWindow: 3, longWindow: 5 });
    const bars = createBars([100, 101, 102, 103, 104]);
    const signals: string[] = [];

    for (let i = 0; i < bars.length; i++) {
      const signal = strategy.onBar(createContext(bars, i));
      signals.push(signal.action);
    }

    expect(signals[0]).toBe('HOLD');
    expect(signals[1]).toBe('HOLD');
    expect(signals[2]).toBe('HOLD');
    expect(signals[3]).toBe('HOLD');
  });

  it('should reset state on finalize', () => {
    strategy.initialize({ shortWindow: 3, longWindow: 5 });
    const bars = createBars([100, 101, 102, 103, 104, 105, 106]);

    for (let i = 0; i < bars.length; i++) {
      strategy.onBar(createContext(bars, i));
    }
    strategy.finalize();

    const signal = strategy.onBar(createContext(bars, 0));
    expect(signal.action).toBe('HOLD');
  });
});

// ──────────────────────── RSI ───────────────────────────────────

describe('RsiStrategy', () => {
  let strategy: RsiStrategy;

  beforeEach(() => {
    strategy = new RsiStrategy();
  });

  it('should initialize with default parameters', () => {
    strategy.initialize({});
    expect(strategy.config.id).toBe('rsi');
    expect(strategy.config.parameters).toHaveLength(3);
  });

  it('should initialize with custom parameters', () => {
    strategy.initialize({ period: 10, oversold: 25, overbought: 75 });
    expect(strategy.config.id).toBe('rsi');
  });

  it('should generate HOLD when not enough bars', () => {
    strategy.initialize({ period: 5, oversold: 30, overbought: 70 });
    const bars = createBars([100, 101, 102]);
    const signal = strategy.onBar(createContext(bars, 0));
    expect(signal.action).toBe('HOLD');
  });

  it('should generate BUY when RSI crosses above oversold from below', () => {
    strategy.initialize({ period: 3, oversold: 30, overbought: 70 });

    const prices = [100, 90, 80, 70, 60, 55, 52, 50, 52, 55, 60, 65, 70, 75, 80];
    const bars = createBars(prices);
    const signals: string[] = [];

    for (let i = 0; i < bars.length; i++) {
      const signal = strategy.onBar(createContext(bars, i));
      signals.push(signal.action);
    }

    expect(signals).toContain('BUY');
  });

  it('should generate SELL when RSI crosses below overbought from above', () => {
    strategy.initialize({ period: 3, oversold: 30, overbought: 70 });

    const prices = [50, 60, 70, 80, 90, 95, 98, 100, 98, 95, 90, 85, 80, 75, 70, 65];
    const bars = createBars(prices);
    const signals: string[] = [];

    for (let i = 0; i < bars.length; i++) {
      const signal = strategy.onBar(createContext(bars, i));
      signals.push(signal.action);
    }

    expect(signals).toContain('SELL');
  });

  it('should handle edge case with constant prices (RSI undefined)', () => {
    strategy.initialize({ period: 3, oversold: 30, overbought: 70 });
    const bars = createBars(Array(20).fill(100));
    const signals: string[] = [];

    for (let i = 0; i < bars.length; i++) {
      const signal = strategy.onBar(createContext(bars, i));
      signals.push(signal.action);
    }

    expect(signals.every((s) => s === 'HOLD')).toBe(true);
  });

  it('should reset state on finalize', () => {
    strategy.initialize({ period: 3, oversold: 30, overbought: 70 });
    const bars = createBars([100, 90, 80, 70, 60, 55, 50, 55, 60, 65]);

    for (let i = 0; i < bars.length; i++) {
      strategy.onBar(createContext(bars, i));
    }
    strategy.finalize();

    const signal = strategy.onBar(createContext(bars, 0));
    expect(signal.action).toBe('HOLD');
  });
});

// ──────────────────────── Bollinger Bands ───────────────────────

describe('BollingerBandsStrategy', () => {
  let strategy: BollingerBandsStrategy;

  beforeEach(() => {
    strategy = new BollingerBandsStrategy();
  });

  it('should initialize with default parameters', () => {
    strategy.initialize({});
    expect(strategy.config.id).toBe('bollinger-bands');
    expect(strategy.config.parameters).toHaveLength(2);
  });

  it('should initialize with custom parameters', () => {
    strategy.initialize({ period: 15, stdDev: 1.5 });
    expect(strategy.config.id).toBe('bollinger-bands');
  });

  it('should generate HOLD when not enough bars', () => {
    strategy.initialize({ period: 5, stdDev: 2 });
    const bars = createBars([100, 101, 102, 103]);
    const signal = strategy.onBar(createContext(bars, 2));
    expect(signal.action).toBe('HOLD');
  });

  it('should generate BUY when price crosses above lower band from below', () => {
    strategy.initialize({ period: 5, stdDev: 2 });

    const prices = [100, 100, 100, 100, 100, 80, 95, 100, 102];
    const bars = createBars(prices);
    const signals: string[] = [];

    for (let i = 0; i < bars.length; i++) {
      const signal = strategy.onBar(createContext(bars, i));
      signals.push(signal.action);
    }

    expect(signals).toContain('BUY');
  });

  it('should generate SELL when price crosses below upper band from above', () => {
    strategy.initialize({ period: 5, stdDev: 2 });

    const prices = [100, 100, 100, 100, 100, 120, 105, 100, 98];
    const bars = createBars(prices);
    const signals: string[] = [];

    for (let i = 0; i < bars.length; i++) {
      const signal = strategy.onBar(createContext(bars, i));
      signals.push(signal.action);
    }

    expect(signals).toContain('SELL');
  });

  it('should return HOLD for constant prices (zero std dev)', () => {
    strategy.initialize({ period: 5, stdDev: 2 });
    const bars = createBars(Array(20).fill(100));
    const signals: string[] = [];

    for (let i = 0; i < bars.length; i++) {
      const signal = strategy.onBar(createContext(bars, i));
      signals.push(signal.action);
    }

    expect(signals.every((s) => s === 'HOLD')).toBe(true);
  });

  it('should reset state on finalize', () => {
    strategy.initialize({ period: 5, stdDev: 2 });
    const bars = createBars([100, 100, 100, 100, 100, 80, 95, 100]);

    for (let i = 0; i < bars.length; i++) {
      strategy.onBar(createContext(bars, i));
    }
    strategy.finalize();

    const signal = strategy.onBar(createContext(bars, 0));
    expect(signal.action).toBe('HOLD');
  });
});

// ──────────────────────── Determinism ───────────────────────────

describe('Strategy determinism', () => {
  it('SMA: same inputs produce same outputs', () => {
    const prices = [100, 101, 99, 102, 98, 103, 97, 104, 96, 105];
    const bars = createBars(prices);

    const run = () => {
      const s = new SmaCrossoverStrategy();
      s.initialize({ shortWindow: 3, longWindow: 5 });
      return Array.from({ length: bars.length }, (_, i) =>
        s.onBar(createContext(bars, i)).action
      );
    };

    expect(run()).toEqual(run());
  });

  it('RSI: same inputs produce same outputs', () => {
    const prices = [100, 95, 105, 90, 110, 85, 115, 80, 120, 75];
    const bars = createBars(prices);

    const run = () => {
      const s = new RsiStrategy();
      s.initialize({ period: 3, oversold: 30, overbought: 70 });
      return Array.from({ length: bars.length }, (_, i) =>
        s.onBar(createContext(bars, i)).action
      );
    };

    expect(run()).toEqual(run());
  });

  it('Bollinger: same inputs produce same outputs', () => {
    const prices = [100, 102, 98, 104, 96, 106, 94, 108, 92, 110];
    const bars = createBars(prices);

    const run = () => {
      const s = new BollingerBandsStrategy();
      s.initialize({ period: 5, stdDev: 2 });
      return Array.from({ length: bars.length }, (_, i) =>
        s.onBar(createContext(bars, i)).action
      );
    };

    expect(run()).toEqual(run());
  });
});
