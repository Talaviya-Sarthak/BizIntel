# Backtesting Module

The backtesting module enables strategy simulation against historical market data with realistic execution modeling, transaction costs, and comprehensive performance metrics.

## Architecture

### Module Structure

```
backend/src/features/backtesting/
├── controllers/       # HTTP request handlers
│   └── backtest.controller.ts
├── engines/           # Core backtesting engine
│   └── backtest.engine.ts
├── metrics/           # Performance metric calculations
│   └── metrics.engine.ts
├── repositories/      # Database access layer
│   └── backtest.repository.ts
├── routes/            # Express route definitions
│   ├── backtest.routes.ts
│   └── backtesting.routes.ts
├── services/          # Business logic orchestration
│   ├── backtest.service.ts
│   └── market-data-validation.service.ts
├── strategies/        # Trading strategy implementations
│   ├── strategy.interface.ts
│   ├── sma-crossover.strategy.ts
│   ├── rsi.strategy.ts
│   ├── bollinger-bands.strategy.ts
│   └── index.ts
├── types/             # TypeScript type definitions
│   └── index.ts
├── utils/             # Benchmark calculations
│   └── benchmark.ts
└── validators/        # Zod request validation schemas
    └── backtest.validator.ts

frontend/src/features/backtesting/
├── components/        # UI components
│   ├── BacktestResultDashboard.tsx
│   ├── BacktestWizard.tsx
│   ├── BenchmarkComparison.tsx
│   ├── DrawdownChart.tsx
│   ├── EquityCurveChart.tsx
│   ├── ParameterForm.tsx
│   ├── StrategyCard.tsx
│   └── TradeTable.tsx
├── hooks/             # React hooks
│   └── useBacktest.ts
├── pages/             # Route pages
│   ├── BacktestCreatePage.tsx
│   ├── BacktestDetailPage.tsx
│   └── BacktestListPage.tsx
├── services/          # API service layer
│   └── backtest.service.ts
├── types/             # Frontend types
│   └── index.ts
└── index.ts           # Feature exports
```

### Data Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│  1. User uploads CSV → DuckDB (dataset table)                            │
│  2. User configures backtest (strategy, params, capital)                 │
│  3. MarketDataValidationService validates OHLC data                      │
│  4. BacktestEngine runs strategy against historical bars                 │
│  5. MetricsEngine calculates performance metrics                         │
│  6. BenchmarkCalculator computes Buy & Hold comparison                   │
│  7. Results persisted to backtest, trades, equity, metrics tables        │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component Diagram

```
                    ┌─────────────────┐
                    │   Backtest API   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ BacktestService  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Validation   │  │  BacktestEngine │  │ MetricsEngine   │
│  Service      │  │                 │  │                 │
└───────────────┘  └────────┬────────┘  └─────────────────┘
                            │
                    ┌───────▼───────┐
                    │   Strategy    │
                    │  (onBar())    │
                    └───────────────┘
```

---

## Supported Datasets

### Required Columns

| Column | Description | Required |
|--------|-------------|----------|
| timestamp/date | Bar timestamp (ISO 8601 format) | Yes |
| open | Opening price | Yes |
| high | Highest price in bar | Yes |
| low | Lowest price in bar | Yes |
| close | Closing price | Yes |
| volume | Trading volume | No |

### Supported Column Aliases

**Timestamp aliases:**
`timestamp`, `date`, `datetime`, `time`, `trade_date`, `tradedate`, `dt`, `ts`, `timestamp_ms`, `date_time`, `trade_datetime`, `time_stamp`

**Open aliases:**
`open`, `Open`, `OPEN`, `opening`, `open_price`, `openprice`

**High aliases:**
`high`, `High`, `HIGH`, `highest`, `high_price`, `highprice`

**Low aliases:**
`low`, `Low`, `LOW`, `lowest`, `low_price`, `lowprice`

**Close aliases:**
`close`, `Close`, `CLOSE`, `closing`, `close_price`, `closeprice`

**Volume aliases:**
`volume`, `Volume`, `VOLUME`, `vol`, `Vol`, `VOL`, `traded_volume`

### Data Format Requirements

- **CSV files** with headers
- **Numeric values** for OHLC columns (integers or decimals)
- **Date/timestamp values** parseable by JavaScript `Date` constructor
- **No null/empty values** in required OHLC columns

### Minimum Row Requirements

- Minimum recommended: **10 rows** (warning issued below this)
- Strategies require additional bars for indicator warmup (see strategy documentation)

---

## Market Data Requirements

### OHLC Validation Rules

The `MarketDataValidationService` performs the following validations:

1. **Numeric type validation** — All OHLC values must be valid numbers (not NaN, not Infinity, not empty)

2. **Chronological ordering** — Timestamps must be in ascending order

3. **Duplicate detection** — Warns if duplicate timestamps exist

4. **Missing data detection** — Warns if gaps are detected in timestamp sequence

5. **OHLC relationship validation**:
   - `high >= max(open, close)` — High must be at least as high as open and close
   - `low <= min(open, close)` — Low must be at most as low as open and close

### Validation Result

```typescript
interface ValidationResult {
  isValid: boolean;
  detectedColumns: {
    timestamp: string | null;
    open: string | null;
    high: string | null;
    low: string | null;
    close: string | null;
    volume: string | null;
  };
  errors: string[];    // Blocking errors
  warnings: string[];  // Non-blocking warnings
  rowCount: number;
}
```

---

## Strategy Interface

All strategies implement the `Strategy` interface:

```typescript
interface Strategy {
  readonly config: StrategyConfig;

  initialize(params: Record<string, number>): void;
  onBar(context: StrategyContext): Signal;
  finalize(): void;
}
```

### initialize(params)

Called once before backtesting begins. Sets strategy-specific parameters from user input or defaults.

### onBar(context)

Called for each bar in the dataset. Receives a `StrategyContext` containing only historical data (prevents look-ahead bias).

```typescript
interface StrategyContext {
  bars: MarketBar[];     // bars[0..currentIndex] — historical data only
  currentIndex: number;  // Index of current bar
  position: number;      // Current shares held
  cash: number;          // Current cash balance
  equity: number;        // Total equity (cash + position value)
}
```

### finalize()

Called after all bars are processed. Resets internal state.

### Signal Types

```typescript
interface Signal {
  action: 'BUY' | 'SELL' | 'HOLD';
  quantity?: number;  // Number of shares (required for BUY/SELL)
}
```

| Signal | Description |
|--------|-------------|
| `BUY` | Open or add to long position |
| `SELL` | Close or reduce long position |
| `HOLD` | Take no action |

---

## Strategy Implementations

### SMA Crossover

**ID:** `sma-crossover`

**Description:** Simple Moving Average crossover strategy. Generates buy signal when short-term SMA crosses above long-term SMA, and sell signal on the reverse crossover.

**Parameters:**

| Parameter | Label | Default | Min | Max | Step | Description |
|-----------|-------|---------|-----|-----|------|-------------|
| `shortWindow` | Short SMA Window | 20 | 5 | 200 | 1 | Period for short-term moving average |
| `longWindow` | Long SMA Window | 50 | 10 | 500 | 1 | Period for long-term moving average |

**Logic:**

```
SMA_short = mean(close[t-shortWindow+1 ... t])
SMA_long = mean(close[t-longWindow+1 ... t])

BUY when:  SMA_short[t-1] <= SMA_long[t-1] AND SMA_short[t] > SMA_long[t]
SELL when: SMA_short[t-1] >= SMA_long[t-1] AND SMA_short[t] < SMA_long[t]
HOLD otherwise
```

**Use cases:** Trending markets with clear directional moves.

**Warmup period:** Requires `longWindow` bars before generating signals.

---

### RSI Strategy

**ID:** `rsi`

**Description:** Relative Strength Index strategy. Generates buy signal when RSI crosses above oversold level, and sell signal when RSI crosses below overbought level.

**Parameters:**

| Parameter | Label | Default | Min | Max | Step | Description |
|-----------|-------|---------|-----|-----|------|-------------|
| `period` | RSI Period | 14 | 2 | 100 | 1 | Number of periods for RSI calculation |
| `oversold` | Oversold Level | 30 | 10 | 45 | 1 | RSI level considered oversold (buy signal) |
| `overbought` | Overbought Level | 70 | 55 | 90 | 1 | RSI level considered overbought (sell signal) |

**Logic:**

```
RSI = 100 - (100 / (1 + RS))
RS = avg_gain(period) / avg_loss(period)

BUY when:  RSI[t-1] <= oversold AND RSI[t] > oversold
SELL when: RSI[t-1] >= overbought AND RSI[t] < overbought
HOLD otherwise
```

**Use cases:** Range-bound markets with clear support/resistance levels.

**Warmup period:** Requires `period + 1` bars before generating signals.

---

### Bollinger Bands

**ID:** `bollinger-bands`

**Description:** Bollinger Bands strategy. Generates buy signal when price crosses above lower band from below, and sell signal when price crosses below upper band from above.

**Parameters:**

| Parameter | Label | Default | Min | Max | Step | Description |
|-----------|-------|---------|-----|-----|------|-------------|
| `period` | Period | 20 | 5 | 100 | 1 | Number of periods for middle band SMA |
| `stdDev` | Standard Deviation Multiplier | 2 | 0.5 | 4 | 0.1 | Number of standard deviations for bands |

**Logic:**

```
middle = SMA(close, period)
std = stddev(close, period)
upper = middle + (stdDev × std)
lower = middle - (stdDev × std)

BUY when:  price[t-1] <= lower[t-1] AND price[t] > lower[t]
SELL when: price[t-1] >= upper[t-1] AND price[t] < upper[t]
HOLD otherwise
```

**Use cases:** Volatile markets with mean-reversion tendencies.

**Warmup period:** Requires `period` bars before generating signals.

---

## Execution Model

### Signal Timing

- **Signal generation:** Occurs at bar T's close price
- **Order execution:** Occurs at bar T+1's open price (next-bar execution)
- **Last bar constraint:** Signals generated on the final bar cannot be executed (no next bar available)

### Position Rules

- **Long-only:** No short selling supported
- **No leverage:** Cannot buy more shares than cash allows
- **Full position:** BUY signals purchase maximum affordable shares
- **Full liquidation:** SELL signals sell all held shares

### Execution Flow

```
Bar T:
  1. Execute pending signal from Bar T-1 at Bar T's open price
  2. Strategy.onBar() called with bars[0..T]
  3. If signal generated, queue for execution at Bar T+1
  4. Update equity using Bar T's close price
```

---

## Transaction Costs

### Commission

Fixed commission per trade (absolute value).

```
commission = configured_commission_value
```

### Slippage

Percentage adjustment to execution price to simulate market impact.

**BUY execution:**
```
executionPrice = marketPrice × (1 + slippage)
slippageAmount = executionPrice - marketPrice
```

**SELL execution:**
```
executionPrice = marketPrice × (1 - slippage)
slippageAmount = marketPrice - executionPrice
```

### Cost Impact

```
BUY cost:  quantity × executionPrice + commission
SELL proceeds: quantity × executionPrice - commission
```

---

## Look-Ahead Bias Prevention

The backtesting engine implements strict safeguards against look-ahead bias:

### Data Isolation

```typescript
// Engine only passes bars[0..currentIndex] to strategy
const contextBars = bars.slice(0, i + 1);
const context: StrategyContext = {
  bars: contextBars,
  currentIndex: i,
  // ...
};
```

### Next-Bar Execution

- Signals are queued and executed at the **next bar's open price**
- Strategy decisions are based on **current bar's close**
- This prevents the strategy from using information that wouldn't be available in real-time

### Testing Approach

The engine is designed so that:
1. Strategy `onBar()` never receives future data
2. Execution occurs at a time when the signal would realistically be placed
3. Transaction costs simulate real-world friction

---

## Performance Metrics

All metrics are calculated by the `MetricsEngine` class.

### Return Metrics

**Total Return:**
```
totalReturn = (finalEquity - initialCapital) / initialCapital
```

**CAGR (Compound Annual Growth Rate):**
```
annualizedReturn = (finalEquity / initialCapital)^(252/tradingDays) - 1
```
Where `252` represents approximate trading days per year.

### Risk Metrics

**Volatility (Annualized):**
```
volatility = stddev(dailyReturns) × √252
```

**Sharpe Ratio (risk-free rate = 0):**
```
sharpeRatio = (meanReturn / stddev(dailyReturns)) × √252
```

**Sortino Ratio:**
```
downsideReturns = dailyReturns where return < 0
downsideStd = stddev(downsideReturns)
sortinoRatio = (meanReturn / downsideStd) × √252
```

**Maximum Drawdown:**
```
maxDrawdown = max((peak - equity) / peak) for all peaks
```

**Calmar Ratio:**
```
calmarRatio = annualizedReturn / maxDrawdown
```

### Trade Statistics

**Win Rate:**
```
winRate = winningTrades / totalTrades
```

**Profit Factor:**
```
profitFactor = totalWinningPnl / |totalLosingPnl|
```

**Additional Statistics:**
- Total trades count
- Winning trades count
- Losing trades count
- Average winning trade PnL
- Average losing trade PnL
- Largest winning trade PnL
- Largest losing trade PnL
- Average trade PnL

---

## Benchmark

### Buy & Hold Implementation

The `BenchmarkCalculator` simulates a passive Buy & Hold strategy:

1. **Entry:** Buy shares at first bar's open price with all initial capital
2. **Hold:** Maintain position throughout entire period
3. **Exit:** Sell at last bar's close price

```
shares = initialCapital / entryPrice
finalEquity = shares × exitPrice
totalReturn = (finalEquity - initialCapital) / initialCapital
```

### Comparison Metrics

Benchmark provides:
- Total return
- Annualized return (CAGR)
- Maximum drawdown
- Volatility
- Final equity value

---

## Database Model

### backtests Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner reference (FK → users) |
| dataset_id | UUID | Dataset reference (FK → datasets) |
| strategy_id | TEXT | Strategy identifier |
| name | TEXT | Display name |
| parameters | JSONB | Strategy parameters |
| initial_capital | DECIMAL | Starting capital |
| commission | DECIMAL | Commission per trade |
| slippage | DECIMAL | Slippage percentage |
| start_date | DATE | Optional backtest start |
| end_date | DATE | Optional backtest end |
| status | ENUM | pending/running/completed/failed |
| error_message | TEXT | Error details if failed |
| started_at | TIMESTAMPTZ | Execution start time |
| completed_at | TIMESTAMPTZ | Execution completion time |
| created_at | TIMESTAMPTZ | Record creation time |
| updated_at | TIMESTAMPTZ | Last update time |

### backtest_trades Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| backtest_id | UUID | Parent backtest (FK → backtests) |
| timestamp | TIMESTAMPTZ | Trade execution time |
| side | TEXT | BUY or SELL |
| quantity | INTEGER | Number of shares |
| price | DECIMAL | Market price at signal |
| execution_price | DECIMAL | Actual execution price |
| commission | DECIMAL | Commission charged |
| slippage_amount | DECIMAL | Slippage cost |
| pnl | DECIMAL | Profit/loss (SELL only) |
| created_at | TIMESTAMPTZ | Record creation time |

### backtest_metrics Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| backtest_id | UUID | Parent backtest (FK → backtests) |
| total_return | DECIMAL | Total return percentage |
| annualized_return | DECIMAL | CAGR |
| volatility | DECIMAL | Annualized volatility |
| sharpe_ratio | DECIMAL | Sharpe ratio |
| sortino_ratio | DECIMAL | Sortino ratio |
| max_drawdown | DECIMAL | Maximum drawdown |
| calmar_ratio | DECIMAL | Calmar ratio |
| win_rate | DECIMAL | Win rate percentage |
| profit_factor | DECIMAL | Profit factor |
| total_trades | INTEGER | Total completed trades |
| winning_trades | INTEGER | Number of winning trades |
| losing_trades | INTEGER | Number of losing trades |
| avg_winning_trade | DECIMAL | Average winning trade PnL |
| avg_losing_trade | DECIMAL | Average losing trade PnL |
| largest_winning_trade | DECIMAL | Largest winning trade PnL |
| largest_losing_trade | DECIMAL | Largest losing trade PnL |
| avg_trade | DECIMAL | Average trade PnL |
| created_at | TIMESTAMPTZ | Record creation time |

### backtest_equity Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| backtest_id | UUID | Parent backtest (FK → backtests) |
| timestamp | TIMESTAMPTZ | Bar timestamp |
| equity | DECIMAL | Total equity at bar |
| cash | DECIMAL | Cash balance at bar |
| position_value | DECIMAL | Position value at bar |
| daily_return | DECIMAL | Return from previous bar |
| drawdown | DECIMAL | Drawdown from peak |
| created_at | TIMESTAMPTZ | Record creation time |

---

## API Endpoints

### POST /api/v1/backtests

Create and run a new backtest.

**Request:**
```json
{
  "datasetId": "uuid",
  "strategyId": "sma-crossover",
  "parameters": {
    "shortWindow": 20,
    "longWindow": 50
  },
  "initialCapital": 10000,
  "commission": 0,
  "slippage": 0.001,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "backtest": {
      "id": "uuid",
      "status": "completed",
      // ... full backtest object
    }
  },
  "message": "Backtest created and completed successfully"
}
```

**Validation Rules:**
- `datasetId` must be a valid UUID
- `strategyId` must match a registered strategy
- `initialCapital` must be positive
- `commission` and `slippage` must be non-negative

---

### GET /api/v1/backtests

List backtests for authenticated user.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max 100) |
| sort | string | created_at | Sort field |

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

### GET /api/v1/backtests/:id

Get backtest details with metrics and equity curve.

**Response:**
```json
{
  "success": true,
  "data": {
    "backtest": { ... },
    "metrics": { ... },
    "equity": [...]
  }
}
```

---

### DELETE /api/v1/backtests/:id

Delete a backtest and all associated data (trades, metrics, equity).

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Backtest deleted successfully"
}
```

---

### GET /api/v1/backtesting/strategies

List all available strategies with their configurations.

**Response:**
```json
{
  "success": true,
  "data": {
    "strategies": [
      {
        "id": "sma-crossover",
        "name": "SMA Crossover",
        "description": "...",
        "parameters": [...]
      }
    ]
  }
}
```

---

## Frontend Components

### BacktestWizard

Multi-step form for configuring and creating backtests:
1. Dataset selection
2. Strategy selection
3. Parameter configuration
4. Capital and cost settings
5. Review and submit

### BacktestResultDashboard

Displays complete backtest results:
- Performance metrics cards
- Equity curve chart
- Drawdown chart
- Trade table
- Benchmark comparison

### EquityCurveChart

Line chart showing equity progression over time, with benchmark overlay.

### DrawdownChart

Area chart showing drawdown from peak equity over time.

### TradeTable

Sortable table displaying all executed trades with PnL, timestamps, and execution details.

### BenchmarkComparison

Side-by-side comparison of strategy performance vs Buy & Hold benchmark.

---

## Future Enhancements

### Short Selling

- Allow negative positions
- Sell before buy (open short)
- Cover short positions
- Margin requirements

### Leverage

- Configurable leverage multiplier
- Margin interest costs
- Liquidation thresholds

### Portfolio Optimization

- Multi-asset backtesting
- Position sizing algorithms
- Risk parity
- Mean-variance optimization

### ML Strategies

- Integration with TensorFlow.js
- Custom model inference
- Feature engineering pipeline
- Walk-forward optimization

### Asynchronous Execution

- Queue-based backtest processing
- Progress streaming via WebSocket
- Parallel strategy optimization
- Resource pooling

### Advanced Metrics

- Information ratio
- Treynor ratio
- Jensen's alpha
- Value at Risk (VaR)
- Conditional VaR

### Additional Order Types

- Stop-loss orders
- Take-profit orders
- Trailing stops
- Limit orders
- Time-in-force options
