import { Strategy } from './strategy.interface';
import { StrategyConfig } from '../types';
import { SmaCrossoverStrategy } from './sma-crossover.strategy';
import { RsiStrategy } from './rsi.strategy';
import { BollingerBandsStrategy } from './bollinger-bands.strategy';

export type { Strategy } from './strategy.interface';

const strategies = new Map<string, Strategy>();

export function registerStrategy(strategy: Strategy): void {
  strategies.set(strategy.config.id, strategy);
}

export function getStrategy(id: string): Strategy | undefined {
  return strategies.get(id);
}

export function getAllStrategies(): StrategyConfig[] {
  return Array.from(strategies.values()).map((s) => s.config);
}

registerStrategy(new SmaCrossoverStrategy());
registerStrategy(new RsiStrategy());
registerStrategy(new BollingerBandsStrategy());
