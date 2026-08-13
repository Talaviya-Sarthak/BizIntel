import React from 'react';
import type { AIResponseMetadata } from '../../types/ai.types';

interface ToolIndicatorProps {
  metadata?: AIResponseMetadata;
}

/**
 * Developer Diagnostics Indicator.
 * Returns null by default to preserve a clean production experience for end users.
 */
export const ToolIndicator: React.FC<ToolIndicatorProps> = () => {
  return null;
};
