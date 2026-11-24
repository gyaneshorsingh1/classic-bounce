import React, { memo } from 'react';
import { GameSnapshot } from '../types/game';
import { SvgWorldRenderer } from './SvgWorldRenderer';

interface WorldRendererProps {
  snapshot: GameSnapshot;
  width: number;
  height: number;
  graphicsQuality?: 'high' | 'medium';
}

const WorldRendererComponent: React.FC<WorldRendererProps> = ({
  snapshot,
  width,
  height,
  graphicsQuality = 'high',
}) => {
  return (
    <SvgWorldRenderer
      snapshot={snapshot}
      width={width}
      height={height}
      graphicsQuality={graphicsQuality}
    />
  );
};

export const WorldRenderer = memo(WorldRendererComponent);
