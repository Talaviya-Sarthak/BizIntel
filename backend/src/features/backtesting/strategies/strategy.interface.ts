import { MarketBar, Signal, StrategyConfig, StrategyContext } from '../types';

export interface Strategy {
  readonly config: StrategyConfig;

  initialize(params: Record<string, number>): void;

  onBar(context: StrategyContext): Signal;

  finalize(): void;
}
