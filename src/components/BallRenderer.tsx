import React from 'react';
import { Circle, Group, Line, vec } from '@shopify/react-native-skia';
import { BallState } from '../types/game';
import {
  COLOR_BALL,
  COLOR_BALL_HIGHLIGHT,
  COLOR_BALL_SHADOW,
  COLOR_BALL_SPECULAR,
} from '../game/constants';

interface BallRendererProps {
  ball: BallState;
}

export const BallRenderer: React.FC<BallRendererProps> = ({ ball }) => {
  const r = ball.radius;

  return (
    <Group
      transform={[
        { translateX: ball.x },
        { translateY: ball.y },
        { rotate: ball.angle },
      ]}
    >
      {/* Base Red Sphere */}
      <Circle cx={0} cy={0} r={r} color={COLOR_BALL} />

      {/* Dark Depth Shadow (Bottom-Right quadrant) */}
      <Circle
        cx={r * 0.22}
        cy={r * 0.22}
        r={r * 0.82}
        color={COLOR_BALL_SHADOW}
        opacity={0.35}
      />

      {/* Rolling Visual Markers: Crosshairs & Notch to clearly display rotation */}
      <Line
        p1={vec(-r * 0.72, 0)}
        p2={vec(r * 0.72, 0)}
        color="#700f0d"
        strokeWidth={3}
        opacity={0.55}
      />
      <Line
        p1={vec(0, -r * 0.72)}
        p2={vec(0, r * 0.72)}
        color="#700f0d"
        strokeWidth={3}
        opacity={0.55}
      />
      {/* Secondary accent dots on rolling axes */}
      <Circle cx={r * 0.45} cy={0} r={2.5} color="#ffd4d3" opacity={0.7} />
      <Circle cx={-r * 0.45} cy={0} r={2.5} color="#ffd4d3" opacity={0.7} />
      <Circle cx={0} cy={r * 0.45} r={2.5} color="#ffd4d3" opacity={0.7} />
      <Circle cx={0} cy={-r * 0.45} r={2.5} color="#ffd4d3" opacity={0.7} />

      {/* 3D Glossy Sphere Specular Highlight (Classic Nokia Bounce look) */}
      <Circle
        cx={-r * 0.32}
        cy={-r * 0.32}
        r={r * 0.38}
        color={COLOR_BALL_HIGHLIGHT}
        opacity={0.5}
      />
      <Circle
        cx={-r * 0.38}
        cy={-r * 0.38}
        r={r * 0.16}
        color={COLOR_BALL_SPECULAR}
        opacity={0.88}
      />
    </Group>
  );
};
