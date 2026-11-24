import React from 'react';
import { Group, Line, Rect, vec } from '@shopify/react-native-skia';
import { PlatformData } from '../types/game';
import {
  COLOR_GROUND_BORDER,
  COLOR_GROUND_MAIN,
  COLOR_GROUND_TOP,
  COLOR_PLATFORM_BORDER,
  COLOR_PLATFORM_MAIN,
  COLOR_PLATFORM_TOP,
} from '../game/constants';

interface PlatformRendererProps {
  platforms: PlatformData[];
}

export const PlatformRenderer: React.FC<PlatformRendererProps> = ({ platforms }) => {
  return (
    <Group>
      {platforms.map((plat) => {
        const left = plat.x - plat.width / 2;
        const top = plat.y - plat.height / 2;

        if (plat.type === 'ground') {
          // Brick column interval marks
          const brickWidth = 48;
          const numBricks = Math.floor(plat.width / brickWidth);
          const dividers = Array.from({ length: numBricks }, (_, i) => left + i * brickWidth);

          return (
            <Group key={plat.id}>
              {/* Main Ground Block */}
              <Rect
                x={left}
                y={top}
                width={plat.width}
                height={plat.height}
                color={COLOR_GROUND_MAIN}
              />
              {/* Top Accent Rim */}
              <Rect
                x={left}
                y={top}
                width={plat.width}
                height={8}
                color={COLOR_GROUND_TOP}
              />
              {/* Top Border Line */}
              <Line
                p1={vec(left, top)}
                p2={vec(left + plat.width, top)}
                color={COLOR_GROUND_BORDER}
                strokeWidth={2}
              />
              {/* Vertical Brick Lines */}
              {dividers.map((dx, idx) => (
                <Line
                  key={`div_${idx}`}
                  p1={vec(dx, top + 8)}
                  p2={vec(dx, top + plat.height)}
                  color={COLOR_GROUND_BORDER}
                  strokeWidth={1.5}
                  opacity={0.4}
                />
              ))}
            </Group>
          );
        }

        if (plat.type === 'floating') {
          // Floating Platform with Brick Structure
          const brickWidth = 36;
          const numBricks = Math.floor(plat.width / brickWidth);
          const dividers = Array.from({ length: numBricks - 1 }, (_, i) => left + (i + 1) * brickWidth);

          return (
            <Group key={plat.id}>
              {/* Main Body */}
              <Rect
                x={left}
                y={top}
                width={plat.width}
                height={plat.height}
                color={COLOR_PLATFORM_MAIN}
              />
              {/* Top Highlight Rim */}
              <Rect
                x={left}
                y={top}
                width={plat.width}
                height={6}
                color={COLOR_PLATFORM_TOP}
              />
              {/* Platform Outlines */}
              <Rect
                x={left}
                y={top}
                width={plat.width}
                height={plat.height}
                color={COLOR_PLATFORM_BORDER}
                style="stroke"
                strokeWidth={2}
              />
              {/* Brick Segment Dividers */}
              {dividers.map((dx, idx) => (
                <Line
                  key={`pdiv_${idx}`}
                  p1={vec(dx, top + 6)}
                  p2={vec(dx, top + plat.height)}
                  color={COLOR_PLATFORM_BORDER}
                  strokeWidth={1.5}
                  opacity={0.45}
                />
              ))}
            </Group>
          );
        }

        // Invisible / Minimal Boundary Walls
        return (
          <Rect
            key={plat.id}
            x={left}
            y={top}
            width={plat.width}
            height={plat.height}
            color={COLOR_GROUND_BORDER}
            opacity={0.15}
          />
        );
      })}
    </Group>
  );
};
