import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { GameSnapshot } from '../types/game';
import {
  COLOR_ANCIENT_GROUND_BORDER,
  COLOR_ANCIENT_GROUND_MAIN,
  COLOR_ANCIENT_GROUND_TOP,
  COLOR_ANCIENT_PLAT_BORDER,
  COLOR_ANCIENT_PLAT_MAIN,
  COLOR_ANCIENT_PLAT_TOP,
  COLOR_ANCIENT_PYRAMID_FAR,
  COLOR_ANCIENT_PYRAMID_NEAR,
  COLOR_ANCIENT_SKY_BOTTOM,
  COLOR_ANCIENT_SKY_TOP,
  COLOR_BALL,
  COLOR_BALL_HIGHLIGHT,
  COLOR_BALL_SHADOW,
  COLOR_BALL_SPECULAR,
  COLOR_BASALT_BORDER,
  COLOR_BASALT_MAIN,
  COLOR_BASALT_TOP,
  COLOR_CAVERN_BOTTOM,
  COLOR_CAVERN_TOP,
  COLOR_CHECKPOINT_ACTIVE,
  COLOR_CHECKPOINT_INACTIVE,
  COLOR_CHECKPOINT_LAVA_ACTIVE,
  COLOR_CHECKPOINT_LAVA_INACTIVE,
  COLOR_CRUMBLING_MAIN,
  COLOR_CRUMBLING_TOP,
  COLOR_EXIT_GLOW,
  COLOR_EXIT_RING,
  COLOR_FALLING_ROCK,
  COLOR_FROZEN_GROUND_BORDER,
  COLOR_FROZEN_GROUND_MAIN,
  COLOR_FROZEN_GROUND_TOP,
  COLOR_FROZEN_PEAK_FAR,
  COLOR_FROZEN_PEAK_NEAR,
  COLOR_FROZEN_PINE,
  COLOR_FROZEN_SKY_BOTTOM,
  COLOR_FROZEN_SKY_TOP,
  COLOR_GEYSER_STEAM,
  COLOR_GROUND_BORDER,
  COLOR_GROUND_MAIN,
  COLOR_GROUND_TOP,
  COLOR_ICE_BORDER,
  COLOR_ICE_MAIN,
  COLOR_ICE_TOP,
  COLOR_ICICLE_CORE,
  COLOR_ICICLE_MAIN,
  COLOR_LAVA_CORE,
  COLOR_LAVA_DEEP,
  COLOR_LAVA_MID,
  COLOR_LAVA_SKY_BOTTOM,
  COLOR_LAVA_SKY_TOP,
  COLOR_MOVING_ACCENT,
  COLOR_OBSIDIAN_BORDER,
  COLOR_OBSIDIAN_MAIN,
  COLOR_OBSIDIAN_TOP,
  COLOR_PLATFORM_BORDER,
  COLOR_PLATFORM_MAIN,
  COLOR_PLATFORM_TOP,
  COLOR_PRESSURE_PLATE_ACTIVE,
  COLOR_PRESSURE_PLATE_BASE,
  COLOR_SKY_BOTTOM,
  COLOR_SKY_ISLAND_BORDER,
  COLOR_SKY_ISLAND_FAR,
  COLOR_SKY_ISLAND_MAIN,
  COLOR_SKY_ISLAND_NEAR,
  COLOR_SKY_ISLAND_TOP,
  COLOR_SKY_PLAT_BORDER,
  COLOR_SKY_PLAT_MAIN,
  COLOR_SKY_PLAT_TOP,
  COLOR_SKY_REALM_BOTTOM,
  COLOR_SKY_REALM_TOP,
  COLOR_SKY_TOP,
  COLOR_SNOW_BALL,
  COLOR_SNOW_BORDER,
  COLOR_SNOW_CORE,
  COLOR_SNOW_MAIN,
  COLOR_SNOW_SHADOW,
  COLOR_SNOW_TOP,
  COLOR_SPIKE,
  COLOR_SPIKE_BORDER,
  COLOR_STONE_BALL,
  COLOR_STONE_CRACK,
  COLOR_STONE_GATE,
  COLOR_STONE_HIGHLIGHT,
  COLOR_STONE_SHADOW,
} from '../game/constants';

interface SvgWorldRendererProps {
  snapshot: GameSnapshot;
  width: number;
  height: number;
  graphicsQuality?: 'high' | 'medium';
}

const SvgWorldRendererComponent: React.FC<SvgWorldRendererProps> = ({
  snapshot,
  width,
  height,
  graphicsQuality = 'high',
}) => {
  const {
    camera,
    ball,
    platforms,
    coins = [],
    keys = [],
    theme = 'meadow',
    isInvulnerable = false,
  } = snapshot;
  const isCavern = theme === 'crystal_cave';
  const isLava = theme === 'lava_kingdom';
  const isFrozen = theme === 'frozen_mountain';
  const isAncient = theme === 'ancient_temple';
  const isSky = theme === 'sky_kingdom';
  const r = ball.radius;
  const ballDeg = (ball.angle * 180) / Math.PI;
  const ballForm = ball.form ?? 'original';

  // Viewport frustum culling boundaries (with generous margin to prevent pop-in)
  const screenW = width > 0 ? width : 800;
  const screenH = height > 0 ? height : 400;
  const CULL_MARGIN = 160;
  const viewLeft = camera.x - CULL_MARGIN;
  const viewRight = camera.x + screenW + CULL_MARGIN;
  const viewTop = camera.y - CULL_MARGIN;
  const viewBottom = camera.y + screenH + CULL_MARGIN;

  // Dynamic theme colors
  const groundMain = isAncient
    ? COLOR_ANCIENT_GROUND_MAIN
    : isSky
    ? COLOR_SKY_ISLAND_MAIN
    : isFrozen
    ? COLOR_FROZEN_GROUND_MAIN
    : isLava
    ? COLOR_BASALT_MAIN
    : isCavern
    ? COLOR_OBSIDIAN_MAIN
    : COLOR_GROUND_MAIN;
  const groundTop = isAncient
    ? COLOR_ANCIENT_GROUND_TOP
    : isSky
    ? COLOR_SKY_ISLAND_TOP
    : isFrozen
    ? COLOR_FROZEN_GROUND_TOP
    : isLava
    ? COLOR_BASALT_TOP
    : isCavern
    ? COLOR_OBSIDIAN_TOP
    : COLOR_GROUND_TOP;
  const groundBorder = isAncient
    ? COLOR_ANCIENT_GROUND_BORDER
    : isSky
    ? COLOR_SKY_ISLAND_BORDER
    : isFrozen
    ? COLOR_FROZEN_GROUND_BORDER
    : isLava
    ? COLOR_BASALT_BORDER
    : isCavern
    ? COLOR_OBSIDIAN_BORDER
    : COLOR_GROUND_BORDER;

  const platMain = isAncient
    ? COLOR_ANCIENT_PLAT_MAIN
    : isSky
    ? COLOR_SKY_PLAT_MAIN
    : isFrozen
    ? COLOR_FROZEN_GROUND_MAIN
    : isLava
    ? COLOR_BASALT_MAIN
    : isCavern
    ? COLOR_OBSIDIAN_MAIN
    : COLOR_PLATFORM_MAIN;
  const platTop = isAncient
    ? COLOR_ANCIENT_PLAT_TOP
    : isSky
    ? COLOR_SKY_PLAT_TOP
    : isFrozen
    ? COLOR_FROZEN_GROUND_TOP
    : isLava
    ? COLOR_BASALT_TOP
    : isCavern
    ? COLOR_OBSIDIAN_TOP
    : COLOR_PLATFORM_TOP;
  const platBorder = isAncient
    ? COLOR_ANCIENT_PLAT_BORDER
    : isSky
    ? COLOR_SKY_PLAT_BORDER
    : isFrozen
    ? COLOR_FROZEN_GROUND_BORDER
    : isLava
    ? COLOR_BASALT_BORDER
    : isCavern
    ? COLOR_OBSIDIAN_BORDER
    : COLOR_PLATFORM_BORDER;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          {/* Sky Gradient (Meadow vs Cavern vs Lava vs Frozen vs Ancient vs Sky) */}
          <LinearGradient id="backdropGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop
              offset="0"
              stopColor={
                isAncient
                  ? COLOR_ANCIENT_SKY_TOP
                  : isSky
                  ? COLOR_SKY_REALM_TOP
                  : isFrozen
                  ? COLOR_FROZEN_SKY_TOP
                  : isLava
                  ? COLOR_LAVA_SKY_TOP
                  : isCavern
                  ? COLOR_CAVERN_TOP
                  : COLOR_SKY_TOP
              }
              stopOpacity="1"
            />
            <Stop
              offset="0.7"
              stopColor={
                isAncient
                  ? COLOR_ANCIENT_SKY_BOTTOM
                  : isSky
                  ? COLOR_SKY_REALM_BOTTOM
                  : isFrozen
                  ? COLOR_FROZEN_SKY_BOTTOM
                  : isLava
                  ? COLOR_LAVA_SKY_BOTTOM
                  : isCavern
                  ? COLOR_CAVERN_BOTTOM
                  : COLOR_SKY_BOTTOM
              }
              stopOpacity="1"
            />
            <Stop
              offset="1"
              stopColor={
                isAncient
                  ? '#23141f'
                  : isSky
                  ? '#e0f2fe'
                  : isFrozen
                  ? '#90a4ae'
                  : isLava
                  ? '#541908'
                  : isCavern
                  ? '#0b1422'
                  : '#b3e5fc'
              }
              stopOpacity="1"
            />
          </LinearGradient>

          {/* Ice Platform Gradient */}
          <LinearGradient id="iceGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={COLOR_ICE_TOP} stopOpacity="0.95" />
            <Stop offset="0.4" stopColor={COLOR_ICE_MAIN} stopOpacity="0.9" />
            <Stop offset="1" stopColor={COLOR_ICE_BORDER} stopOpacity="0.98" />
          </LinearGradient>

          {/* Snow Platform Gradient */}
          <LinearGradient id="snowGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={COLOR_SNOW_TOP} stopOpacity="1" />
            <Stop offset="0.4" stopColor={COLOR_SNOW_MAIN} stopOpacity="1" />
            <Stop offset="1" stopColor={COLOR_SNOW_BORDER} stopOpacity="1" />
          </LinearGradient>

          {/* Stone Ball & Cracked Wall Gradient */}
          <LinearGradient id="stoneBallGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={COLOR_STONE_HIGHLIGHT} stopOpacity="1" />
            <Stop offset="0.6" stopColor={COLOR_STONE_BALL} stopOpacity="1" />
            <Stop offset="1" stopColor={COLOR_STONE_SHADOW} stopOpacity="1" />
          </LinearGradient>

          <LinearGradient id="crackedWallGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#546e7a" stopOpacity="1" />
            <Stop offset="0.5" stopColor="#37474f" stopOpacity="1" />
            <Stop offset="1" stopColor="#263238" stopOpacity="1" />
          </LinearGradient>

          {/* Snow Ball Gradient */}
          <LinearGradient id="snowBallGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#ffffff" stopOpacity="1" />
            <Stop offset="0.5" stopColor={COLOR_SNOW_BALL} stopOpacity="1" />
            <Stop offset="1" stopColor={COLOR_SNOW_SHADOW} stopOpacity="1" />
          </LinearGradient>

          {/* Icicle Gradient */}
          <LinearGradient id="icicleGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={COLOR_ICICLE_MAIN} stopOpacity="0.95" />
            <Stop offset="1" stopColor={COLOR_ICICLE_CORE} stopOpacity="1" />
          </LinearGradient>

          {/* Molten Lava Gradient */}
          <LinearGradient id="lavaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={COLOR_LAVA_CORE} stopOpacity="1" />
            <Stop offset="0.25" stopColor={COLOR_LAVA_MID} stopOpacity="1" />
            <Stop offset="1" stopColor={COLOR_LAVA_DEEP} stopOpacity="1" />
          </LinearGradient>

          {/* Erupting Geyser Plume Gradient */}
          <LinearGradient id="geyserGrad" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={COLOR_LAVA_DEEP} stopOpacity="1" />
            <Stop offset="0.6" stopColor={COLOR_LAVA_MID} stopOpacity="0.95" />
            <Stop offset="1" stopColor={COLOR_LAVA_CORE} stopOpacity="0.9" />
          </LinearGradient>

          {/* Golden Ring Gradient */}
          <LinearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#fff176" stopOpacity="1" />
            <Stop offset="0.5" stopColor={COLOR_EXIT_RING} stopOpacity="1" />
            <Stop offset="1" stopColor="#f57f17" stopOpacity="1" />
          </LinearGradient>

          {/* Bronze Key Gradient */}
          <LinearGradient id="bronzeGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#e6a760" stopOpacity="1" />
            <Stop offset="0.5" stopColor="#cd7f32" stopOpacity="1" />
            <Stop offset="1" stopColor="#8c4b12" stopOpacity="1" />
          </LinearGradient>

          {/* Frost / Sapphire Key Gradient */}
          <LinearGradient id="frostKeyGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#e0f2fe" stopOpacity="1" />
            <Stop offset="0.5" stopColor="#38bdf8" stopOpacity="1" />
            <Stop offset="1" stopColor="#0284c7" stopOpacity="1" />
          </LinearGradient>

          {/* Cosmic Portal Gradient */}
          <LinearGradient id="portalGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#00e5ff" stopOpacity="1" />
            <Stop offset="0.5" stopColor="#7c3aed" stopOpacity="1" />
            <Stop offset="1" stopColor="#ec4899" stopOpacity="1" />
          </LinearGradient>

          {/* Steel Saw Gradient */}
          <LinearGradient id="sawGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#f1f5f9" stopOpacity="1" />
            <Stop offset="0.5" stopColor="#94a3b8" stopOpacity="1" />
            <Stop offset="1" stopColor="#475569" stopOpacity="1" />
          </LinearGradient>

          {/* Phasing Crystal Platform Gradient */}
          <LinearGradient id="crystalPlatGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#c084fc" stopOpacity="0.85" />
            <Stop offset="1" stopColor="#38bdf8" stopOpacity="0.85" />
          </LinearGradient>

          {/* Distant Hills / Caverns / Volcano / Alpine / Ancient / Sky Gradients */}
          <LinearGradient id="bgFarGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop
              offset="0"
              stopColor={
                isAncient
                  ? COLOR_ANCIENT_PYRAMID_FAR
                  : isSky
                  ? COLOR_SKY_ISLAND_FAR
                  : isFrozen
                  ? COLOR_FROZEN_PEAK_FAR
                  : isLava
                  ? '#361109'
                  : isCavern
                  ? '#1e1430'
                  : '#81c784'
              }
              stopOpacity={
                isAncient ? 0.8 : isSky ? 0.7 : isFrozen ? 0.75 : isLava ? 0.75 : isCavern ? 0.6 : 0.45
              }
            />
            <Stop
              offset="1"
              stopColor={
                isAncient
                  ? '#170c18'
                  : isSky
                  ? '#3b82f6'
                  : isFrozen
                  ? '#455a64'
                  : isLava
                  ? '#170603'
                  : isCavern
                  ? '#0d0e1c'
                  : '#388e3c'
              }
              stopOpacity={
                isAncient ? 0.95 : isSky ? 0.85 : isFrozen ? 0.95 : isLava ? 0.95 : isCavern ? 0.85 : 0.65
              }
            />
          </LinearGradient>

          <LinearGradient id="bgMidGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop
              offset="0"
              stopColor={
                isAncient
                  ? COLOR_ANCIENT_PYRAMID_NEAR
                  : isSky
                  ? COLOR_SKY_ISLAND_NEAR
                  : isFrozen
                  ? COLOR_FROZEN_PEAK_NEAR
                  : isLava
                  ? '#4a170b'
                  : isCavern
                  ? '#16283d'
                  : '#66bb6a'
              }
              stopOpacity={
                isAncient ? 0.85 : isSky ? 0.8 : isFrozen ? 0.85 : isLava ? 0.85 : isCavern ? 0.75 : 0.65
              }
            />
            <Stop
              offset="1"
              stopColor={
                isAncient
                  ? '#1f101a'
                  : isSky
                  ? '#1e40af'
                  : isFrozen
                  ? '#263238'
                  : isLava
                  ? '#200905'
                  : isCavern
                  ? '#091522'
                  : '#2e7d32'
              }
              stopOpacity={
                isAncient ? 0.98 : isSky ? 0.95 : isFrozen ? 0.98 : isLava ? 0.98 : isCavern ? 0.95 : 0.85
              }
            />
          </LinearGradient>

          {/* Water & Fluid Gradients */}
          <LinearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#00e5ff" stopOpacity={0.65} />
            <Stop offset="0.35" stopColor="#0288d1" stopOpacity={0.78} />
            <Stop offset="1" stopColor="#01579b" stopOpacity={0.92} />
          </LinearGradient>

          <LinearGradient id="waterfallGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#e1f5fe" stopOpacity={0.8} />
            <Stop offset="0.5" stopColor="#80d8ff" stopOpacity={0.7} />
            <Stop offset="1" stopColor="#00b0ff" stopOpacity={0.6} />
          </LinearGradient>

          {/* Transformer Gate Gradients */}
          <LinearGradient id="shrinkGateGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#00e5ff" />
            <Stop offset="1" stopColor="#0d47a1" />
          </LinearGradient>

          <LinearGradient id="growGateGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#ffd700" />
            <Stop offset="1" stopColor="#ff6f00" />
          </LinearGradient>

          <LinearGradient id="normalGateGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#69f0ae" />
            <Stop offset="1" stopColor="#1b5e20" />
          </LinearGradient>
        </Defs>

        {/* 1. Backdrop */}
        <Rect x="0" y="0" width={width} height={height} fill="url(#backdropGrad)" />

        {/* 2. Layer 1 Parallax: Distant Hills / Caverns / Volcano / Alpine / Ancient Pyramids / Sky Islands */}
        <G
          transform={`translate(${-camera.x * 0.05}, ${
            -camera.y * 0.03 + (isFrozen ? 140 : isAncient ? 150 : isSky ? 110 : isLava ? 180 : isCavern ? 150 : 80)
          })`}
        >
          {isFrozen ? (
            <Path
              d="M -100 450 L 200 220 L 500 400 L 900 180 L 1300 380 L 1800 160 L 2300 390 L 2800 200 L 3300 410 L 3900 170 L 4500 390 L 5100 190 L 5800 420 L 6400 160 L 7000 380 L 7700 180 L 8500 420 L 9200 150 L 9500 450 L 9500 1200 L -100 1200 Z"
              fill="url(#bgFarGrad)"
            />
          ) : isAncient ? (
            <Path
              d="M -100 450 L 300 190 L 700 450 L 1100 230 L 1500 450 L 2100 170 L 2700 450 L 3300 210 L 3900 450 L 4600 180 L 5300 450 L 6000 200 L 6700 450 L 7500 170 L 8300 450 L 9100 210 L 9900 450 L 10500 180 L 11000 450 L 11000 1400 L -100 1400 Z"
              fill="url(#bgFarGrad)"
            />
          ) : isSky ? (
            <Path
              d="M -100 360 L 200 280 L 500 340 L 900 210 L 1300 310 L 1800 190 L 2300 330 L 2800 180 L 3400 310 L 4000 200 L 4600 330 L 5300 180 L 6000 320 L 6800 190 L 7600 330 L 8400 180 L 9200 320 L 10100 180 L 11000 350 L 11000 1400 L -100 1400 Z"
              fill="url(#bgFarGrad)"
            />
          ) : (
            <Path
              d="M -100 400 Q 300 220 700 380 Q 1100 240 1500 390 Q 1900 250 2300 370 Q 2700 230 3100 380 Q 3500 240 3900 390 Q 4300 230 4700 380 Q 5100 240 5500 390 Q 5900 240 6500 390 Q 7000 250 7800 380 L 7800 1200 L -100 1200 Z"
              fill="url(#bgFarGrad)"
            />
          )}
        </G>

        {/* 3. Layer 2 Parallax: Mid-Ground Crags / Snowy Ridges / Ruined Pillars / Floating Isles */}
        <G
          transform={`translate(${-camera.x * 0.12}, ${
            -camera.y * 0.06 + (isFrozen ? 190 : isAncient ? 200 : isSky ? 140 : isLava ? 220 : isCavern ? 200 : 120)
          })`}
        >
          {isFrozen ? (
            <G>
              <Path
                d="M -100 480 L 150 310 L 450 460 L 800 280 L 1200 440 L 1650 290 L 2100 470 L 2600 300 L 3100 480 L 3650 270 L 4200 460 L 4800 290 L 5400 480 L 6050 260 L 6700 470 L 7400 290 L 8100 490 L 8900 270 L 9500 480 L 9500 1200 L -100 1200 Z"
                fill="url(#bgMidGrad)"
              />
              {/* Alpine Pine Tree Silhouettes */}
              {Array.from({ length: 18 }, (_, i) => {
                const px = i * 500 + 80;
                return (
                  <Polygon
                    key={`pine_${i}`}
                    points={`${px},360 ${px - 14},410 ${px + 14},410`}
                    fill={COLOR_FROZEN_PINE}
                    opacity={0.8}
                  />
                );
              })}
            </G>
          ) : isAncient ? (
            <G>
              <Path
                d="M -100 490 L 250 330 L 600 480 L 1000 300 L 1400 460 L 1950 310 L 2500 490 L 3100 290 L 3700 480 L 4400 300 L 5100 480 L 5900 290 L 6700 490 L 7500 310 L 8300 480 L 9200 290 L 10100 490 L 11000 320 L 11000 1400 L -100 1400 Z"
                fill="url(#bgMidGrad)"
              />
              {/* Ancient Ruined Obelisk & Pillar Silhouettes */}
              {Array.from({ length: 16 }, (_, i) => {
                const px = i * 650 + 120;
                return (
                  <Rect
                    key={`obelisk_${i}`}
                    x={px}
                    y={320}
                    width={22}
                    height={120}
                    fill="#3a1e28"
                    opacity={0.7}
                  />
                );
              })}
            </G>
          ) : isSky ? (
            <G>
              <Path
                d="M -100 420 Q 300 290 700 410 Q 1200 280 1700 400 Q 2300 270 2900 410 Q 3600 280 4300 410 Q 5100 270 5900 410 Q 6800 280 7700 410 Q 8600 270 9500 410 Q 10300 290 11000 420 L 11000 1400 L -100 1400 Z"
                fill="url(#bgMidGrad)"
              />
              {/* Floating Low-Poly Sky Island Shards */}
              {Array.from({ length: 14 }, (_, i) => {
                const cx = i * 750 + 180;
                return (
                  <Polygon
                    key={`sky_isle_${i}`}
                    points={`${cx},260 ${cx + 70},280 ${cx + 40},320 ${cx - 30},310`}
                    fill="#60a5fa"
                    opacity={0.65}
                  />
                );
              })}
            </G>
          ) : (
            <Path
              d="M -100 450 Q 200 320 600 440 Q 1000 310 1400 450 Q 1800 320 2200 440 Q 2600 310 3000 450 Q 3400 320 3800 440 Q 4200 310 4600 450 Q 5000 320 5400 440 Q 5800 310 6500 440 Q 7100 330 7800 450 L 7800 1200 L -100 1200 Z"
              fill="url(#bgMidGrad)"
            />
          )}
        </G>

        {/* 4. Layer 3 Parallax: Subterranean Crystals / Lava Embers / Snowflakes / Torch Embers / Sky Shimmer */}
        <G transform={`translate(${-camera.x * 0.18}, ${-camera.y * 0.08})`}>
          {isAncient ? (
            // Ancient Temple Torch Embers & Golden Dust
            <>
              {Array.from({ length: 24 }, (_, i) => {
                const ex = (i * 420 + 80) % 10500;
                const ey = 50 + ((i * 53) % 200);
                const er = 2.5 + (i % 3);
                return (
                  <Circle
                    key={`ancient_ember_${i}`}
                    cx={ex}
                    cy={ey}
                    r={er}
                    fill={i % 2 === 0 ? '#fbbf24' : '#f97316'}
                    opacity={0.65 + (i % 3) * 0.12}
                  />
                );
              })}
            </>
          ) : isSky ? (
            // Sky Shimmer Sparkles & Low-Poly Puffy Floating Cloudlets
            <>
              {Array.from({ length: 20 }, (_, i) => {
                const sx = (i * 520 + 100) % 11000;
                const sy = 40 + ((i * 49) % 240);
                const sr = 18 + (i % 3) * 10;
                return (
                  <Circle
                    key={`sky_puff_${i}`}
                    cx={sx}
                    cy={sy}
                    r={sr}
                    fill="#ffffff"
                    opacity={0.35 + (i % 3) * 0.1}
                  />
                );
              })}
            </>
          ) : isFrozen ? (
            // Gentle Alpine Snowflakes & Frost Crystals
            <>
              {Array.from({ length: 24 }, (_, i) => {
                const sx = (i * 380 + 90) % 9200;
                const sy = 40 + ((i * 47) % 220);
                const sr = 2.5 + (i % 3) * 1.2;
                return (
                  <Circle
                    key={`flake_${i}`}
                    cx={sx}
                    cy={sy}
                    r={sr}
                    fill="#ffffff"
                    opacity={0.55 + (i % 4) * 0.12}
                  />
                );
              })}
            </>
          ) : isLava ? (
            // Glowing Rising Heat Embers & Sparks
            <>
              <Circle cx="350" cy="180" r="3.5" fill="#ff9100" opacity="0.85" />
              <Circle cx="720" cy="130" r="2.5" fill="#fff176" opacity="0.9" />
              <Circle cx="1200" cy="160" r="3" fill="#ff5722" opacity="0.8" />
              <Circle cx="1750" cy="110" r="2" fill="#fff176" opacity="0.9" />
              <Circle cx="2300" cy="170" r="4" fill="#ff9100" opacity="0.75" />
              <Circle cx="2900" cy="120" r="2.5" fill="#ff5722" opacity="0.85" />
              <Circle cx="3600" cy="180" r="3.5" fill="#fff176" opacity="0.9" />
              <Circle cx="4300" cy="140" r="2.5" fill="#ff9100" opacity="0.8" />
              <Circle cx="5000" cy="165" r="3" fill="#ff5722" opacity="0.9" />
              <Circle cx="5800" cy="125" r="2" fill="#fff176" opacity="0.95" />
              <Circle cx="6500" cy="175" r="3.5" fill="#ff9100" opacity="0.85" />
              <Circle cx="7200" cy="135" r="3" fill="#fff176" opacity="0.9" />
            </>
          ) : isCavern ? (
            // Glowing Subterranean Crystal Particles
            <>
              <Circle cx="220" cy="120" r="4" fill="#00e5ff" opacity="0.6" />
              <Circle cx="450" cy="80" r="3" fill="#e040fb" opacity="0.5" />
              <Circle cx="780" cy="140" r="5" fill="#00e5ff" opacity="0.7" />
              <Circle cx="1120" cy="90" r="3.5" fill="#7c4dff" opacity="0.6" />
              <Circle cx="1500" cy="160" r="4" fill="#00e5ff" opacity="0.5" />
              <Circle cx="1900" cy="100" r="5" fill="#e040fb" opacity="0.6" />
              <Circle cx="2300" cy="130" r="3" fill="#00e5ff" opacity="0.7" />
              <Circle cx="2800" cy="90" r="4.5" fill="#7c4dff" opacity="0.5" />
              <Circle cx="3300" cy="140" r="5" fill="#00e5ff" opacity="0.6" />
              <Circle cx="3900" cy="110" r="4" fill="#e040fb" opacity="0.7" />
              <Circle cx="4500" cy="150" r="5" fill="#00e5ff" opacity="0.6" />
              <Circle cx="5100" cy="95" r="3.5" fill="#7c4dff" opacity="0.5" />
              <Circle cx="5700" cy="130" r="4.5" fill="#00e5ff" opacity="0.7" />
            </>
          ) : (
            // Meadow Clouds
            <>
              <Circle cx="180" cy="70" r="42" fill="#ffffff" opacity="0.4" />
              <Circle cx="220" cy="60" r="58" fill="#ffffff" opacity="0.4" />
              <Circle cx="265" cy="75" r="38" fill="#ffffff" opacity="0.4" />
              <Circle cx="740" cy="90" r="48" fill="#ffffff" opacity="0.35" />
              <Circle cx="790" cy="80" r="62" fill="#ffffff" opacity="0.35" />
              <Circle cx="845" cy="95" r="42" fill="#ffffff" opacity="0.35" />
              <Circle cx="1380" cy="60" r="50" fill="#ffffff" opacity="0.4" />
              <Circle cx="1435" cy="45" r="68" fill="#ffffff" opacity="0.4" />
              <Circle cx="1490" cy="65" r="48" fill="#ffffff" opacity="0.4" />
              <Circle cx="2040" cy="85" r="46" fill="#ffffff" opacity="0.35" />
              <Circle cx="2090" cy="70" r="60" fill="#ffffff" opacity="0.35" />
              <Circle cx="2700" cy="65" r="52" fill="#ffffff" opacity="0.4" />
              <Circle cx="3400" cy="80" r="48" fill="#ffffff" opacity="0.35" />
              <Circle cx="4100" cy="55" r="54" fill="#ffffff" opacity="0.4" />
              <Circle cx="4800" cy="75" r="48" fill="#ffffff" opacity="0.35" />
            </>
          )}
        </G>

        {/* 5. Main Game World (Translated by Camera) */}
        <G transform={`translate(${-camera.x}, ${-camera.y})`}>
          {platforms.map((plat) => {
            const left = plat.x - plat.width / 2;
            const top = plat.y - plat.height / 2;
            const right = left + plat.width;
            const bottom = top + plat.height;

            // Viewport frustum culling: skip rendering if platform is completely outside camera viewport
            let checkLeft = left;
            let checkRight = right;
            let checkTop = top;
            let checkBottom = bottom;

            if (plat.type === 'rotating_spikes') {
              const r = (plat.armLength ?? 80) + 25;
              checkLeft = plat.x - r;
              checkRight = plat.x + r;
              checkTop = plat.y - r;
              checkBottom = plat.y + r;
            } else if (plat.type === 'geyser') {
              const gh = plat.geyserHeight ?? 150;
              checkTop = plat.y - gh - plat.height / 2;
            } else if (plat.type === 'moving_saw') {
              if (plat.pathStartX !== undefined && plat.pathEndX !== undefined) {
                checkLeft = Math.min(plat.pathStartX, plat.pathEndX, plat.x) - 35;
                checkRight = Math.max(plat.pathStartX, plat.pathEndX, plat.x) + 35;
              }
            } else if (plat.type === 'wind_zone') {
              checkLeft = Math.min(checkLeft, plat.x - 100);
              checkRight = Math.max(checkRight, plat.x + 100);
              checkTop = Math.min(checkTop, plat.y - 100);
              checkBottom = Math.max(checkBottom, plat.y + 100);
            }

            if (checkRight < viewLeft || checkLeft > viewRight || checkBottom < viewTop || checkTop > viewBottom) {
              return null;
            }

            // --- GROUND PLATFORMS ---
            if (plat.type === 'ground') {
              const brickWidth = 48;
              const numBricks = Math.floor(plat.width / brickWidth);
              const dividers = Array.from({ length: numBricks }, (_, i) => left + i * brickWidth);

              return (
                <G key={plat.id}>
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill={groundMain}
                  />
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={8}
                    fill={groundTop}
                  />
                  <Line
                    x1={left}
                    y1={top}
                    x2={left + plat.width}
                    y2={top}
                    stroke={groundBorder}
                    strokeWidth={2}
                  />
                  {dividers.map((dx, idx) => (
                    <Line
                      key={`gdiv_${idx}`}
                      x1={dx}
                      y1={top + 8}
                      x2={dx}
                      y2={top + plat.height}
                      stroke={groundBorder}
                      strokeWidth={1.5}
                      opacity={0.4}
                    />
                  ))}
                </G>
              );
            }

            // --- FLOATING PLATFORMS ---
            if (plat.type === 'floating') {
              const brickWidth = 36;
              const numBricks = Math.floor(plat.width / brickWidth);
              const dividers = Array.from(
                { length: Math.max(0, numBricks - 1) },
                (_, i) => left + (i + 1) * brickWidth
              );

              return (
                <G key={plat.id}>
                  {plat.pivotX !== undefined && plat.pivotY !== undefined && (
                    <G>
                      {/* Connecting Mechanical Gear Arm */}
                      <Line
                        x1={plat.pivotX}
                        y1={plat.pivotY}
                        x2={plat.x}
                        y2={plat.y}
                        stroke="#78350f"
                        strokeWidth={4}
                        opacity={0.75}
                      />
                      {/* Center Ancient Cog Pivot */}
                      <Circle
                        cx={plat.pivotX}
                        cy={plat.pivotY}
                        r={14}
                        fill="#451a03"
                        stroke="#b45309"
                        strokeWidth={2}
                      />
                      <Circle cx={plat.pivotX} cy={plat.pivotY} r={5} fill="#fbbf24" />
                    </G>
                  )}
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill={platMain}
                  />
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={6}
                    fill={platTop}
                  />
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill="none"
                    stroke={platBorder}
                    strokeWidth={2}
                  />
                  {dividers.map((dx, idx) => (
                    <Line
                      key={`fdiv_${idx}`}
                      x1={dx}
                      y1={top + 6}
                      x2={dx}
                      y2={top + plat.height}
                      stroke={platBorder}
                      strokeWidth={1.5}
                      opacity={0.45}
                    />
                  ))}
                </G>
              );
            }

            // --- ICE PLATFORMS ---
            if (plat.type === 'ice') {
              return (
                <G key={plat.id}>
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill="url(#iceGrad)"
                    rx={4}
                  />
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill="none"
                    stroke={COLOR_ICE_BORDER}
                    strokeWidth={2}
                    rx={4}
                  />
                  {/* Crystalline surface shine */}
                  <Line
                    x1={left + 4}
                    y1={top + 3}
                    x2={left + plat.width - 4}
                    y2={top + 3}
                    stroke="#ffffff"
                    strokeWidth={2}
                    opacity={0.8}
                  />
                  {/* Diagonal ice refraction streaks */}
                  {Array.from({ length: Math.max(1, Math.floor(plat.width / 70)) }, (_, i) => {
                    const gx = left + 20 + i * 70;
                    return (
                      <Line
                        key={`ig_${i}`}
                        x1={gx}
                        y1={top + 6}
                        x2={gx + 18}
                        y2={top + plat.height - 4}
                        stroke="#ffffff"
                        strokeWidth={1.5}
                        opacity={0.4}
                      />
                    );
                  })}
                </G>
              );
            }

            // --- SNOW PLATFORMS (Fragile / Floating Snow) ---
            if (plat.type === 'snow_platform') {
              if (plat.isCollapsed) return null;

              return (
                <G key={plat.id}>
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill="url(#snowGrad)"
                    rx={6}
                  />
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill="none"
                    stroke={COLOR_SNOW_BORDER}
                    strokeWidth={2}
                    rx={6}
                  />
                  {/* Fluffy Snow Pillows on Top */}
                  <Line
                    x1={left + 6}
                    y1={top + 2}
                    x2={left + plat.width - 6}
                    y2={top + 2}
                    stroke="#ffffff"
                    strokeWidth={3}
                  />
                  {/* Gentle frost accents */}
                  <Circle cx={left + 14} cy={top + 6} r={2.5} fill="#ffffff" opacity={0.9} />
                  <Circle cx={left + plat.width - 14} cy={top + 6} r={2.5} fill="#ffffff" opacity={0.9} />
                </G>
              );
            }

            // --- CRACKED STONE WALLS ---
            if (plat.type === 'cracked_wall') {
              if (plat.isBroken) return null;

              return (
                <G key={plat.id}>
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill="url(#crackedWallGrad)"
                    rx={3}
                  />
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill="none"
                    stroke="#263238"
                    strokeWidth={2}
                    rx={3}
                  />
                  {/* Deep Structural Fissures (Requires Stone Ball to smash) */}
                  <Path
                    d={`M ${left + plat.width * 0.3} ${top + 4} L ${left + plat.width * 0.55} ${
                      top + plat.height * 0.45
                    } L ${left + plat.width * 0.25} ${top + plat.height * 0.75} L ${
                      left + plat.width * 0.6
                    } ${top + plat.height - 4}`}
                    stroke={COLOR_STONE_CRACK}
                    strokeWidth={2.5}
                    fill="none"
                  />
                  <Path
                    d={`M ${left + plat.width * 0.7} ${top + 8} L ${left + plat.width * 0.45} ${
                      top + plat.height * 0.5
                    } L ${left + plat.width * 0.75} ${top + plat.height * 0.85}`}
                    stroke={COLOR_STONE_CRACK}
                    strokeWidth={1.8}
                    fill="none"
                  />
                  {/* Stone hammer icon indicator */}
                  <Circle
                    cx={plat.x}
                    cy={plat.y}
                    r={9}
                    fill="#1e272c"
                    opacity={0.6}
                  />
                  <Line
                    x1={plat.x - 4}
                    y1={plat.y - 4}
                    x2={plat.x + 4}
                    y2={plat.y + 4}
                    stroke="#ffab00"
                    strokeWidth={2}
                  />
                </G>
              );
            }

            // --- HEAVY PRESSURE PLATES & SWITCH PLATES ---
            if (plat.type === 'heavy_pressure_plate' || plat.type === 'pressure_plate') {
              const isPressed = plat.isPressed;
              const plateY = isPressed ? top + 7 : top + 2;
              const plateHeight = isPressed ? 5 : 8;

              return (
                <G key={plat.id}>
                  {/* Plate Base */}
                  <Rect
                    x={left}
                    y={top + 8}
                    width={plat.width}
                    height={plat.height - 8}
                    fill={COLOR_PRESSURE_PLATE_BASE}
                    rx={2}
                  />
                  {/* Movable Depressible Plate */}
                  <Rect
                    x={left + 4}
                    y={plateY}
                    width={plat.width - 8}
                    height={plateHeight}
                    fill={isPressed ? COLOR_PRESSURE_PLATE_ACTIVE : '#90a4ae'}
                    stroke={isPressed ? '#ffffff' : '#37474f'}
                    strokeWidth={1.5}
                    rx={2}
                  />
                  {/* Status Indicator */}
                  <Circle
                    cx={plat.x}
                    cy={plateY + plateHeight / 2}
                    r={2.5}
                    fill={isPressed ? '#ffffff' : '#ff9800'}
                  />
                </G>
              );
            }

            // --- STONE GATES (Linked to Pressure Plates) ---
            if (plat.type === 'stone_gate') {
              const isOpen = plat.isOpen;
              if (isOpen) {
                // Open Gate archway outline
                return (
                  <G key={plat.id}>
                    <Rect
                      x={left}
                      y={top}
                      width={plat.width}
                      height={plat.height}
                      fill="none"
                      stroke="#00e5ff"
                      strokeWidth={1.5}
                      strokeDasharray="6,4"
                      opacity={0.6}
                    />
                    <Circle cx={plat.x} cy={plat.y} r={10} fill="#00e5ff" opacity={0.2} />
                  </G>
                );
              }

              // Closed Heavy Fortified Portcullis
              return (
                <G key={plat.id}>
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill={COLOR_STONE_GATE}
                    rx={3}
                  />
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill="none"
                    stroke="#102027"
                    strokeWidth={2.5}
                    rx={3}
                  />
                  {/* Vertical Iron Bars */}
                  {Array.from({ length: Math.max(1, Math.floor(plat.width / 16)) }, (_, i) => {
                    const bx = left + 8 + i * 16;
                    return (
                      <Line
                        key={`gb_${i}`}
                        x1={bx}
                        y1={top + 4}
                        x2={bx}
                        y2={top + plat.height - 4}
                        stroke="#263238"
                        strokeWidth={2.5}
                      />
                    );
                  })}
                  {/* Iron Rivet Studs */}
                  <Circle cx={left + 6} cy={top + 8} r={2} fill="#ffc107" />
                  <Circle cx={left + plat.width - 6} cy={top + 8} r={2} fill="#ffc107" />
                  <Circle cx={left + 6} cy={top + plat.height - 8} r={2} fill="#ffc107" />
                  <Circle cx={left + plat.width - 6} cy={top + plat.height - 8} r={2} fill="#ffc107" />
                </G>
              );
            }

            // --- WIND ZONES ---
            if (plat.type === 'wind_zone') {
              const fx = plat.windForceX ?? 0;
              const isRight = fx >= 0;

              return (
                <G key={plat.id}>
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill="#e0f7fa"
                    opacity={0.12}
                    rx={6}
                  />
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill="none"
                    stroke="#80deea"
                    strokeWidth={1}
                    strokeDasharray="8,6"
                    opacity={0.35}
                    rx={6}
                  />
                  {/* Swirling Gust Streaks with Direction Indicators */}
                  {Array.from({ length: 4 }, (_, i) => {
                    const wy = top + 35 + i * (plat.height / 5);
                    const wx1 = isRight ? left + 20 : left + plat.width - 20;
                    const wx2 = isRight ? left + plat.width - 20 : left + 20;
                    const arrowX = isRight ? wx2 - 10 : wx2 + 10;
                    return (
                      <G key={`gust_${i}`}>
                        <Line
                          x1={wx1}
                          y1={wy}
                          x2={wx2}
                          y2={wy}
                          stroke="#b2ebf2"
                          strokeWidth={2}
                          strokeDasharray="14,10"
                          opacity={0.65}
                        />
                        <Polygon
                          points={
                            isRight
                              ? `${arrowX},${wy - 5} ${arrowX + 8},${wy} ${arrowX},${wy + 5}`
                              : `${arrowX},${wy - 5} ${arrowX - 8},${wy} ${arrowX},${wy + 5}`
                          }
                          fill="#80deea"
                          opacity={0.8}
                        />
                      </G>
                    );
                  })}
                </G>
              );
            }

            // --- FALLING ICICLES ---
            if (plat.type === 'falling_icicle') {
              if (plat.isBroken) return null;

              return (
                <G key={plat.id}>
                  {plat.isDropping && (
                    <Line
                      x1={plat.x}
                      y1={top - 20}
                      x2={plat.x}
                      y2={top}
                      stroke="#80deea"
                      strokeWidth={2}
                      strokeDasharray="4,4"
                      opacity={0.7}
                    />
                  )}
                  <Polygon
                    points={`${left},${top} ${left + plat.width},${top} ${plat.x},${top + plat.height}`}
                    fill="url(#icicleGrad)"
                    stroke="#ffffff"
                    strokeWidth={1}
                  />
                  <Circle cx={plat.x} cy={top + 6} r={2} fill="#ffffff" opacity={0.9} />
                </G>
              );
            }

            // --- FORM TRANSFORMER GATES (Big, Stone, Snow, Original) ---
            if (plat.type === 'transformer_big') {
              return (
                <G key={plat.id}>
                  <Circle
                    cx={plat.x}
                    cy={plat.y}
                    r={28}
                    fill="none"
                    stroke="#ffd700"
                    strokeWidth={3.5}
                    strokeDasharray="7,4"
                  />
                  <Circle cx={plat.x} cy={plat.y} r={20} fill="#ff9800" opacity={0.3} />
                  <Circle cx={plat.x} cy={plat.y} r={11} fill="#ffb74d" />
                  <Circle cx={plat.x} cy={plat.y} r={6} fill="#ffffff" opacity={0.8} />
                  <SvgText
                    x={plat.x}
                    y={plat.y - 34}
                    textAnchor="middle"
                    fill="#ffd700"
                    fontSize="10"
                    fontWeight="900"
                    letterSpacing="0.8"
                  >
                    BIG
                  </SvgText>
                </G>
              );
            }

            if (plat.type === 'transformer_stone') {
              return (
                <G key={plat.id}>
                  <Circle
                    cx={plat.x}
                    cy={plat.y}
                    r={26}
                    fill="none"
                    stroke="#78909c"
                    strokeWidth={3.5}
                    strokeDasharray="8,4"
                  />
                  <Circle cx={plat.x} cy={plat.y} r={18} fill="#37474f" opacity={0.35} />
                  <Circle cx={plat.x} cy={plat.y} r={10} fill="#607d8b" />
                  <SvgText
                    x={plat.x}
                    y={plat.y - 34}
                    textAnchor="middle"
                    fill="#b0bec5"
                    fontSize="10"
                    fontWeight="900"
                    letterSpacing="0.8"
                  >
                    STONE
                  </SvgText>
                </G>
              );
            }

            if (plat.type === 'transformer_snow') {
              return (
                <G key={plat.id}>
                  <Circle
                    cx={plat.x}
                    cy={plat.y}
                    r={24}
                    fill="none"
                    stroke="#80deea"
                    strokeWidth={3}
                    strokeDasharray="6,3"
                  />
                  <Circle cx={plat.x} cy={plat.y} r={16} fill="#e0f7fa" opacity={0.3} />
                  <Circle cx={plat.x} cy={plat.y} r={8} fill="#ffffff" />
                  <SvgText
                    x={plat.x}
                    y={plat.y - 32}
                    textAnchor="middle"
                    fill="#80deea"
                    fontSize="10"
                    fontWeight="900"
                    letterSpacing="0.8"
                  >
                    SNOW
                  </SvgText>
                </G>
              );
            }

            if (plat.type === 'transformer_original') {
              return (
                <G key={plat.id}>
                  <Circle
                    cx={plat.x}
                    cy={plat.y}
                    r={24}
                    fill="none"
                    stroke="#ef5350"
                    strokeWidth={3}
                  />
                  <Circle cx={plat.x} cy={plat.y} r={16} fill="#ffcdd2" opacity={0.25} />
                  <Circle cx={plat.x} cy={plat.y} r={8} fill="#e52521" />
                  <SvgText
                    x={plat.x}
                    y={plat.y - 32}
                    textAnchor="middle"
                    fill="#ef5350"
                    fontSize="10"
                    fontWeight="900"
                    letterSpacing="0.8"
                  >
                    NORMAL
                  </SvgText>
                </G>
              );
            }

            // --- MOVING PLATFORMS ---
            if (plat.type === 'moving') {
              return (
                <G key={plat.id}>
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill={isFrozen ? '#37474f' : isCavern ? '#152232' : '#c84e2a'}
                    rx={4}
                  />
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill="none"
                    stroke={isFrozen ? '#80deea' : COLOR_MOVING_ACCENT}
                    strokeWidth={2.5}
                    rx={4}
                  />
                  <Rect
                    x={left + 3}
                    y={top + 2}
                    width={plat.width - 6}
                    height={5}
                    fill={isFrozen ? '#b2ebf2' : isCavern ? '#00e5ff' : '#ff8a65'}
                  />
                  <Circle cx={plat.x - 25} cy={plat.y + 2} r="3" fill={isFrozen ? '#80deea' : COLOR_MOVING_ACCENT} />
                  <Circle cx={plat.x} cy={plat.y + 2} r="3.5" fill="#ffffff" />
                  <Circle cx={plat.x + 25} cy={plat.y + 2} r="3" fill={isFrozen ? '#80deea' : COLOR_MOVING_ACCENT} />
                </G>
              );
            }

            // --- CRUMBLING PLATFORMS ---
            if (plat.type === 'crumbling') {
              if (plat.isCollapsed) return null;

              return (
                <G key={plat.id}>
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill={COLOR_CRUMBLING_MAIN}
                    rx={3}
                  />
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={5}
                    fill={COLOR_CRUMBLING_TOP}
                  />
                  {/* Fissure crack marks */}
                  <Line
                    x1={left + 25}
                    y1={top + 5}
                    x2={left + 35}
                    y2={top + plat.height - 4}
                    stroke="#ff7043"
                    strokeWidth={1.5}
                  />
                  <Line
                    x1={left + plat.width - 35}
                    y1={top + 5}
                    x2={left + plat.width - 25}
                    y2={top + plat.height - 4}
                    stroke="#ff7043"
                    strokeWidth={1.5}
                  />
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill="none"
                    stroke="#5d4037"
                    strokeWidth={1.5}
                    strokeDasharray="4,2"
                    rx={3}
                  />
                </G>
              );
            }

            // --- CHECKPOINT BEACONS ---
            if (plat.type === 'checkpoint') {
              const isActive = plat.isActivated;
              const crystalColor = isFrozen
                ? isActive
                  ? '#00e5ff'
                  : '#546e7a'
                : isLava
                ? isActive
                  ? COLOR_CHECKPOINT_LAVA_ACTIVE
                  : COLOR_CHECKPOINT_LAVA_INACTIVE
                : isActive
                ? COLOR_CHECKPOINT_ACTIVE
                : COLOR_CHECKPOINT_INACTIVE;

              return (
                <G key={plat.id}>
                  {/* Base Pedestal */}
                  <Rect
                    x={plat.x - 14}
                    y={plat.y + 12}
                    width={28}
                    height={10}
                    fill={isFrozen ? '#263238' : isLava ? '#1a110f' : '#263238'}
                    rx={2}
                    stroke={isFrozen ? '#80deea' : isLava ? '#ff5722' : 'none'}
                    strokeWidth={isFrozen || isLava ? 1 : 0}
                  />
                  {/* Floating Crystal Diamond */}
                  <Polygon
                    points={`${plat.x},${plat.y - 18} ${plat.x + 12},${plat.y} ${plat.x},${plat.y + 14} ${plat.x - 12},${plat.y}`}
                    fill={crystalColor}
                    stroke={isActive ? '#ffffff' : isFrozen ? '#80deea' : isLava ? '#ff3d00' : '#4a148c'}
                    strokeWidth={1.5}
                  />
                  {/* Radiant Glow when active */}
                  {isActive && (
                    <>
                      <Circle cx={plat.x} cy={plat.y - 2} r="18" fill={isFrozen ? '#00e5ff' : '#ffd700'} opacity="0.35" />
                      <Circle cx={plat.x - 4} cy={plat.y - 8} r="2" fill="#ffffff" />
                    </>
                  )}
                </G>
              );
            }

            // --- WATER & FLUID ZONES ---
            if (plat.type === 'water') {
              return (
                <G key={plat.id}>
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill="url(#waterGrad)"
                    rx={4}
                  />
                  {/* Surface Shimmer Line */}
                  <Line
                    x1={left}
                    y1={top}
                    x2={left + plat.width}
                    y2={top}
                    stroke="#80d8ff"
                    strokeWidth={3}
                  />
                  {/* Floating Subsurface Bubbles */}
                  {Array.from({ length: Math.max(2, Math.floor(plat.width / 80)) }, (_, i) => (
                    <Circle
                      key={`wbub_${i}`}
                      cx={left + 30 + i * 80}
                      cy={top + 20 + ((i * 17) % Math.max(20, plat.height - 30))}
                      r={3}
                      fill="#ffffff"
                      opacity={0.65}
                    />
                  ))}
                </G>
              );
            }

            // --- CASCADING WATERFALLS ---
            if (plat.type === 'waterfall') {
              return (
                <G key={plat.id}>
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill="url(#waterfallGrad)"
                    rx={2}
                  />
                  <Line
                    x1={plat.x - 25}
                    y1={top}
                    x2={plat.x - 25}
                    y2={top + plat.height}
                    stroke="#ffffff"
                    strokeWidth={2}
                    strokeDasharray="20,10"
                    opacity={0.7}
                  />
                  <Line
                    x1={plat.x + 25}
                    y1={top}
                    x2={plat.x + 25}
                    y2={top + plat.height}
                    stroke="#ffffff"
                    strokeWidth={2}
                    strokeDasharray="16,14"
                    opacity={0.7}
                  />
                  <Circle cx={plat.x} cy={top + plat.height} r={32} fill="#b3e5fc" opacity={0.45} />
                </G>
              );
            }

            // --- TRANSFORMER GATES (Deflator / Inflator / Reset) ---
            if (plat.type === 'transformer_shrink') {
              return (
                <G key={plat.id}>
                  <Circle
                    cx={plat.x}
                    cy={plat.y}
                    r={22}
                    fill="none"
                    stroke="url(#shrinkGateGrad)"
                    strokeWidth={3.5}
                    strokeDasharray="6,3"
                  />
                  <Circle cx={plat.x} cy={plat.y} r={14} fill="#00e5ff" opacity={0.25} />
                  <Polygon
                    points={`${plat.x},${plat.y + 6} ${plat.x - 6},${plat.y - 4} ${plat.x + 6},${plat.y - 4}`}
                    fill="#00e5ff"
                  />
                </G>
              );
            }

            if (plat.type === 'transformer_grow') {
              return (
                <G key={plat.id}>
                  <Circle
                    cx={plat.x}
                    cy={plat.y}
                    r={26}
                    fill="none"
                    stroke="url(#growGateGrad)"
                    strokeWidth={4}
                    strokeDasharray="8,4"
                  />
                  <Circle cx={plat.x} cy={plat.y} r={18} fill="#ffd700" opacity={0.25} />
                  <Polygon
                    points={`${plat.x},${plat.y - 7} ${plat.x - 7},${plat.y + 5} ${plat.x + 7},${plat.y + 5}`}
                    fill="#ffd700"
                  />
                </G>
              );
            }

            if (plat.type === 'transformer_normal') {
              return (
                <G key={plat.id}>
                  <Circle
                    cx={plat.x}
                    cy={plat.y}
                    r={24}
                    fill="none"
                    stroke="url(#normalGateGrad)"
                    strokeWidth={3}
                  />
                  <Circle cx={plat.x} cy={plat.y} r={16} fill="#69f0ae" opacity={0.2} />
                  <Circle cx={plat.x} cy={plat.y} r={6} fill="#69f0ae" />
                </G>
              );
            }

            // --- LAVA PITS & LAKES ---
            if (plat.type === 'lava') {
              return (
                <G key={plat.id}>
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill="url(#lavaGrad)"
                  />
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={4}
                    fill={COLOR_LAVA_CORE}
                  />
                  {Array.from({ length: Math.max(2, Math.floor(plat.width / 40)) }, (_, i) => (
                    <Circle
                      key={`lbub_${i}`}
                      cx={left + 20 + i * 40}
                      cy={top + 2}
                      r={3}
                      fill={COLOR_LAVA_CORE}
                      opacity={0.8}
                    />
                  ))}
                </G>
              );
            }

            // --- FIRE ELEMENT / LAVA GEYSERS ---
            if (plat.type === 'geyser') {
              const isErupting = plat.isErupting;
              const gHeight = plat.geyserHeight ?? 150;

              return (
                <G key={plat.id}>
                  {/* Fire Burner / Nozzle Base */}
                  <Polygon
                    points={`${plat.x - 22},${plat.y + 12} ${plat.x + 22},${plat.y + 12} ${plat.x + 14},${plat.y - 6} ${plat.x - 14},${plat.y - 6}`}
                    fill="#140d0b"
                    stroke="#ff5722"
                    strokeWidth={1.5}
                  />
                  <Rect
                    x={plat.x - 14}
                    y={plat.y - 8}
                    width={28}
                    height={4}
                    fill="#d84315"
                    rx={1}
                  />
                  {isErupting ? (
                    <G>
                      {/* Outer Flame Plume */}
                      <Polygon
                        points={`${plat.x - 18},${plat.y - 6} ${plat.x + 18},${plat.y - 6} ${plat.x + 10},${plat.y - gHeight} ${plat.x - 10},${plat.y - gHeight}`}
                        fill="url(#geyserGrad)"
                      />
                      {/* Inner Bright Flame Core */}
                      <Polygon
                        points={`${plat.x - 10},${plat.y - 6} ${plat.x + 10},${plat.y - 6} ${plat.x + 5},${plat.y - gHeight + 15} ${plat.x - 5},${plat.y - gHeight + 15}`}
                        fill="#ffeb3b"
                        opacity={0.8}
                      />
                      <Line
                        x1={plat.x}
                        y1={plat.y - 6}
                        x2={plat.x}
                        y2={plat.y - gHeight + 10}
                        stroke="#ffffff"
                        strokeWidth={3}
                        strokeLinecap="round"
                        opacity={0.85}
                      />
                      {/* Erupting Flame Tip Burst */}
                      <Circle cx={plat.x} cy={plat.y - gHeight} r={16} fill={COLOR_LAVA_CORE} opacity={0.85} />
                      <Circle cx={plat.x} cy={plat.y - gHeight} r={8} fill="#ffffff" opacity={0.9} />
                    </G>
                  ) : plat.isWarning ? (
                    /* Pre-eruption visual warning: intense flickering amber core and warning sparks */
                    <G>
                      <Circle cx={plat.x} cy={plat.y - 12} r={10} fill="#ff5722" opacity={0.8} />
                      <Circle cx={plat.x} cy={plat.y - 12} r={6} fill="#ffeb3b" opacity={0.9} />
                      <Circle cx={plat.x - 6} cy={plat.y - 20} r={3} fill="#ff9800" opacity={0.85} />
                      <Circle cx={plat.x + 6} cy={plat.y - 24} r={3.5} fill="#ffeb3b" opacity={0.85} />
                      <Line
                        x1={plat.x}
                        y1={plat.y - 8}
                        x2={plat.x}
                        y2={plat.y - 32}
                        stroke="#ffeb3b"
                        strokeWidth={2}
                        strokeDasharray="4,4"
                        opacity={0.8}
                      />
                    </G>
                  ) : (
                    /* Inactive steam/ember smoke puffs */
                    <G>
                      <Circle cx={plat.x} cy={plat.y - 12} r={8} fill={COLOR_GEYSER_STEAM} />
                      <Circle cx={plat.x + 4} cy={plat.y - 20} r={5} fill={COLOR_GEYSER_STEAM} opacity={0.5} />
                    </G>
                  )}
                </G>
              );
            }

            // --- FALLING VOLCANIC ROCKS ---
            if (plat.type === 'falling_rock') {
              if (plat.y < -100) return null;
              const rRad = plat.width / 2;

              return (
                <G key={plat.id}>
                  <Polygon
                    points={`${plat.x - rRad * 0.7},${plat.y} ${plat.x + rRad * 0.7},${plat.y} ${plat.x},${plat.y - 28}`}
                    fill="#ff5722"
                    opacity={0.7}
                  />
                  <Circle cx={plat.x} cy={plat.y} r={rRad} fill={COLOR_FALLING_ROCK} stroke="#ff3d00" strokeWidth={2} />
                  <Circle cx={plat.x - 4} cy={plat.y - 4} r={3} fill="#fff176" opacity={0.8} />
                </G>
              );
            }

            // --- SPIKE HAZARDS (Floor, Ceiling, Wall) ---
            if (plat.type === 'spike') {
              const isCeiling = plat.spikeDirection === 'down';
              const isWallRight = plat.spikeDirection === 'right';

              if (isWallRight) {
                const toothHeight = 20;
                const numTeeth = Math.max(1, Math.floor(plat.height / toothHeight));
                const teeth = Array.from({ length: numTeeth }, (_, i) => {
                  const ty1 = top + i * toothHeight;
                  const ty2 = ty1 + toothHeight / 2;
                  const ty3 = ty1 + toothHeight;
                  return `${left},${ty1} ${left + plat.width},${ty2} ${left},${ty3}`;
                });

                return (
                  <G key={plat.id}>
                    {teeth.map((pts, idx) => (
                      <Polygon
                        key={`wspike_${idx}`}
                        points={pts}
                        fill={COLOR_SPIKE}
                        stroke={COLOR_SPIKE_BORDER}
                        strokeWidth={1.5}
                      />
                    ))}
                  </G>
                );
              }

              const toothWidth = 20;
              const numTeeth = Math.max(1, Math.floor(plat.width / toothWidth));
              const teeth = Array.from({ length: numTeeth }, (_, i) => {
                const tx1 = left + i * toothWidth;
                const tx2 = tx1 + toothWidth / 2;
                const tx3 = tx1 + toothWidth;
                const tyBase = isCeiling ? top : top + plat.height;
                const tyTip = isCeiling ? top + plat.height : top;
                return `${tx1},${tyBase} ${tx2},${tyTip} ${tx3},${tyBase}`;
              });

              return (
                <G key={plat.id}>
                  <Line
                    x1={left}
                    y1={isCeiling ? top : top + plat.height}
                    x2={left + plat.width}
                    y2={isCeiling ? top : top + plat.height}
                    stroke={COLOR_SPIKE_BORDER}
                    strokeWidth={3}
                  />
                  {teeth.map((pts, idx) => (
                    <Polygon
                      key={`spike_${idx}`}
                      points={pts}
                      fill={COLOR_SPIKE}
                      stroke={COLOR_SPIKE_BORDER}
                      strokeWidth={1.5}
                    />
                  ))}
                </G>
              );
            }

            // --- GOLDEN EXIT RING ---
            if (plat.type === 'exit') {
              const ringRadius = plat.width / 2;
              return (
                <G key={plat.id}>
                  <Circle
                    cx={plat.x}
                    cy={plat.y}
                    r={ringRadius + 8}
                    fill={COLOR_EXIT_GLOW}
                    opacity={0.4}
                  />
                  <Circle
                    cx={plat.x}
                    cy={plat.y}
                    r={ringRadius}
                    fill="url(#goldGrad)"
                    stroke="#ff6f00"
                    strokeWidth={3}
                  />
                  <Circle
                    cx={plat.x}
                    cy={plat.y}
                    r={ringRadius - 10}
                    fill={
                      isFrozen
                        ? '#1a2327'
                        : isLava
                        ? '#1e0805'
                        : isCavern
                        ? '#0e1828'
                        : COLOR_SKY_BOTTOM
                    }
                    stroke="#ffa000"
                    strokeWidth={2}
                  />
                  <Circle cx={plat.x - 12} cy={plat.y - 12} r="3" fill="#ffffff" />
                  <Circle cx={plat.x + 10} cy={plat.y + 10} r="2" fill="#ffffff" opacity={0.7} />
                </G>
              );
            }

            // --- LOCKED DOORS ---
            if (plat.type === 'locked_door') {
              const isOpen = plat.isOpen || plat.doorState === 'open';
              const doorKeyColor = plat.keyColor ?? '#ffd700';

              if (isOpen) {
                return (
                  <G key={plat.id}>
                    <Rect
                      x={left}
                      y={top}
                      width={plat.width}
                      height={plat.height}
                      fill="none"
                      stroke={doorKeyColor}
                      strokeWidth={1.5}
                      strokeDasharray="4,4"
                      opacity={0.35}
                    />
                    <Circle cx={plat.x} cy={plat.y} r={12} fill={doorKeyColor} opacity={0.15} />
                  </G>
                );
              }

              return (
                <G key={plat.id}>
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill="#1e222a"
                    stroke="#334155"
                    strokeWidth={2}
                    rx={3}
                  />
                  <Rect
                    x={left + 3}
                    y={top + 3}
                    width={plat.width - 6}
                    height={plat.height - 6}
                    fill="#334155"
                    rx={2}
                  />
                  <Circle
                    cx={plat.x}
                    cy={plat.y}
                    r={Math.min(13, plat.width * 0.35)}
                    fill={doorKeyColor}
                    opacity={0.85}
                  />
                  <Circle cx={plat.x} cy={plat.y - 2} r={3.5} fill="#0f172a" />
                  <Polygon
                    points={`${plat.x - 2},${plat.y} ${plat.x + 2},${plat.y} ${plat.x + 3.5},${plat.y + 7} ${plat.x - 3.5},${plat.y + 7}`}
                    fill="#0f172a"
                  />
                </G>
              );
            }

            // --- WALL SWITCHES ---
            if (plat.type === 'wall_switch') {
              const isActive = plat.isActivated || plat.isPressed;
              return (
                <G key={plat.id}>
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill="#1e293b"
                    stroke="#475569"
                    strokeWidth={1.5}
                    rx={3}
                  />
                  <Line
                    x1={plat.x}
                    y1={plat.y + 4}
                    x2={isActive ? plat.x + 8 : plat.x - 8}
                    y2={isActive ? plat.y - 8 : plat.y - 8}
                    stroke="#94a3b8"
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                  <Circle
                    cx={isActive ? plat.x + 8 : plat.x - 8}
                    cy={plat.y - 8}
                    r={4}
                    fill="#cbd5e1"
                  />
                  <Circle
                    cx={plat.x}
                    cy={top + 5}
                    r={2.5}
                    fill={isActive ? '#22c55e' : '#ef4444'}
                  />
                </G>
              );
            }

            // --- BOUNCE / SPRING PADS & LAUNCH MACHINES ---
            if (plat.type === 'bounce_pad') {
              const isLaunch = plat.isLaunchMachine || plat.id.includes('launch');
              const comp = plat.springCompression ?? 0;
              const padY = top + comp * (isLaunch ? 12 : 8);
              const padH = isLaunch ? 14 : 10;
              const baseH = isLaunch ? 12 : 8;
              const baseY = top + plat.height - baseH;

              if (isLaunch) {
                return (
                  <G key={plat.id}>
                    {/* Ancient Temple Launch Catapult Base */}
                    <Rect
                      x={left - 4}
                      y={baseY}
                      width={plat.width + 8}
                      height={baseH + 4}
                      fill="#1c1917"
                      stroke="#78350f"
                      strokeWidth={2}
                      rx={3}
                    />
                    {/* Lateral Pneumatic Cylinders */}
                    <Rect
                      x={left}
                      y={baseY - 14}
                      width={10}
                      height={18}
                      fill="#b45309"
                      stroke="#d97706"
                      strokeWidth={1}
                      rx={2}
                    />
                    <Rect
                      x={left + plat.width - 10}
                      y={baseY - 14}
                      width={10}
                      height={18}
                      fill="#b45309"
                      stroke="#d97706"
                      strokeWidth={1}
                      rx={2}
                    />
                    {/* Central High-Tension Heavy Coil */}
                    <Path
                      d={`M ${left + plat.width * 0.35} ${baseY} 
                          L ${left + plat.width * 0.65} ${baseY - 5 * (1 - comp)} 
                          L ${left + plat.width * 0.35} ${baseY - 10 * (1 - comp)} 
                          L ${left + plat.width * 0.65} ${baseY - 15 * (1 - comp)} 
                          L ${left + plat.width * 0.5} ${padY + padH}`}
                      stroke="#f59e0b"
                      strokeWidth={4}
                      fill="none"
                    />
                    {/* Heavy Launch Catapult Plate with Sun Rune */}
                    <Rect
                      x={left - 2}
                      y={padY}
                      width={plat.width + 4}
                      height={padH}
                      fill="#f59e0b"
                      stroke="#fbbf24"
                      strokeWidth={2}
                      rx={3}
                    />
                    {/* Rune Glyphs on Plate */}
                    <Circle cx={plat.x} cy={padY + padH / 2} r={3.5} fill="#78350f" />
                    <Line
                      x1={plat.x - 12}
                      y1={padY + padH / 2}
                      x2={plat.x + 12}
                      y2={padY + padH / 2}
                      stroke="#78350f"
                      strokeWidth={2}
                    />
                    {/* Upward Energy Thrust Arrow */}
                    <Polygon
                      points={`${plat.x},${padY - 8} ${plat.x - 6},${padY - 2} ${plat.x + 6},${padY - 2}`}
                      fill="#fef08a"
                      opacity={comp > 0.1 ? 0.95 : 0.6}
                    />
                  </G>
                );
              }

              return (
                <G key={plat.id}>
                  <Rect
                    x={left}
                    y={baseY}
                    width={plat.width}
                    height={baseH}
                    fill="#334155"
                    stroke="#1e293b"
                    strokeWidth={1.5}
                    rx={2}
                  />
                  <Path
                    d={`M ${left + plat.width * 0.3} ${baseY} 
                        L ${left + plat.width * 0.7} ${baseY - 4 * (1 - comp)} 
                        L ${left + plat.width * 0.3} ${baseY - 8 * (1 - comp)} 
                        L ${left + plat.width * 0.7} ${baseY - 12 * (1 - comp)} 
                        L ${left + plat.width * 0.5} ${padY + padH}`}
                    stroke="#94a3b8"
                    strokeWidth={3}
                    fill="none"
                  />
                  <Rect
                    x={left + 2}
                    y={padY}
                    width={plat.width - 4}
                    height={padH}
                    fill="#eab308"
                    stroke="#ca8a04"
                    strokeWidth={1.5}
                    rx={3}
                  />
                  <Line
                    x1={left + 8}
                    y1={padY + padH}
                    x2={left + 16}
                    y2={padY}
                    stroke="#1e293b"
                    strokeWidth={2.5}
                  />
                  <Line
                    x1={plat.x - 4}
                    y1={padY + padH}
                    x2={plat.x + 4}
                    y2={padY}
                    stroke="#1e293b"
                    strokeWidth={2.5}
                  />
                  <Line
                    x1={left + plat.width - 16}
                    y1={padY + padH}
                    x2={left + plat.width - 8}
                    y2={padY}
                    stroke="#1e293b"
                    strokeWidth={2.5}
                  />
                </G>
              );
            }

            // --- PAIRED TELEPORTERS ---
            if (plat.type === 'teleporter') {
              const pColor = plat.portalColor ?? '#38bdf8';
              const ringR = plat.width / 2;
              return (
                <G key={plat.id}>
                  <Circle cx={plat.x} cy={plat.y} r={ringR + 10} fill={pColor} opacity={0.2} />
                  <Circle
                    cx={plat.x}
                    cy={plat.y}
                    r={ringR}
                    fill="none"
                    stroke="url(#portalGrad)"
                    strokeWidth={3}
                  />
                  <Circle
                    cx={plat.x}
                    cy={plat.y}
                    r={ringR - 6}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    strokeDasharray="6,4"
                    opacity={0.8}
                  />
                  <Circle cx={plat.x} cy={plat.y} r={5} fill="#ffffff" opacity={0.9} />
                </G>
              );
            }

            // --- ROTATING SPIKES ---
            if (plat.type === 'rotating_spikes') {
              const armLen = plat.armLength ?? 80;
              const count = plat.spikeCount ?? 2;
              const angle = plat.currentAngle ?? 0;

              return (
                <G key={plat.id}>
                  <Circle cx={plat.x} cy={plat.y} r={8} fill="#475569" stroke="#1e293b" strokeWidth={2} />
                  {Array.from({ length: count }, (_, i) => {
                    const spkAngle = angle + (i * 2 * Math.PI) / count;
                    const hx = plat.x + Math.cos(spkAngle) * armLen;
                    const hy = plat.y + Math.sin(spkAngle) * armLen;

                    return (
                      <G key={`rs_${i}`}>
                        <Line
                          x1={plat.x}
                          y1={plat.y}
                          x2={hx}
                          y2={hy}
                          stroke="#334155"
                          strokeWidth={3}
                        />
                        <Circle
                          cx={hx}
                          cy={hy}
                          r={13}
                          fill={COLOR_SPIKE}
                          stroke={COLOR_SPIKE_BORDER}
                          strokeWidth={1.5}
                        />
                        {[0, 1, 2, 3].map((sIdx) => {
                          const sAng = (sIdx * Math.PI) / 2 + spkAngle;
                          const tipX = hx + Math.cos(sAng) * 20;
                          const tipY = hy + Math.sin(sAng) * 20;
                          const b1X = hx + Math.cos(sAng + 0.3) * 12;
                          const b1Y = hy + Math.sin(sAng + 0.3) * 12;
                          const b2X = hx + Math.cos(sAng - 0.3) * 12;
                          const b2Y = hy + Math.sin(sAng - 0.3) * 12;
                          return (
                            <Polygon
                              key={`stud_${sIdx}`}
                              points={`${tipX},${tipY} ${b1X},${b1Y} ${b2X},${b2Y}`}
                              fill="#ef4444"
                              stroke={COLOR_SPIKE_BORDER}
                              strokeWidth={1}
                            />
                          );
                        })}
                      </G>
                    );
                  })}
                </G>
              );
            }

            // --- MOVING SAWS ---
            if (plat.type === 'moving_saw') {
              const sawR = plat.sawRadius ?? 22;
              const spinDeg = ((plat.x * 3) % 360);

              return (
                <G key={plat.id}>
                  {plat.pathStartX !== undefined && plat.pathEndX !== undefined && (
                    <Line
                      x1={plat.pathStartX}
                      y1={plat.pathStartY ?? plat.y}
                      x2={plat.pathEndX}
                      y2={plat.pathEndY ?? plat.y}
                      stroke="#1e293b"
                      strokeWidth={4}
                      strokeDasharray="4,4"
                      opacity={0.4}
                    />
                  )}
                  <G transform={`translate(${plat.x}, ${plat.y}) rotate(${spinDeg})`}>
                    <Circle cx={0} cy={0} r={sawR} fill="url(#sawGrad)" stroke="#475569" strokeWidth={1.5} />
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                      const rad = (deg * Math.PI) / 180;
                      const tx = Math.cos(rad) * (sawR + 6);
                      const ty = Math.sin(rad) * (sawR + 6);
                      const b1 = Math.cos(rad + 0.22) * sawR;
                      const b2 = Math.sin(rad + 0.22) * sawR;
                      const b3 = Math.cos(rad - 0.1) * (sawR - 3);
                      const b4 = Math.sin(rad - 0.1) * (sawR - 3);
                      return (
                        <Polygon
                          key={`tooth_${deg}`}
                          points={`${tx},${ty} ${b1},${b2} ${b3},${b4}`}
                          fill="#cbd5e1"
                          stroke="#334155"
                          strokeWidth={0.8}
                        />
                      );
                    })}
                    <Circle cx={0} cy={0} r={5} fill="#f59e0b" stroke="#78350f" strokeWidth={1} />
                  </G>
                </G>
              );
            }

            // --- TIMED DOORS ---
            if (plat.type === 'timed_door') {
              const isOpen = plat.isOpen || plat.doorState === 'open';
              const doorY = isOpen ? top - plat.height + 8 : top;

              return (
                <G key={plat.id}>
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill="none"
                    stroke="#475569"
                    strokeWidth={2}
                    opacity={0.3}
                  />
                  <Rect
                    x={left + 2}
                    y={doorY}
                    width={plat.width - 4}
                    height={plat.height}
                    fill="#1e293b"
                    stroke="#64748b"
                    strokeWidth={1.5}
                    rx={2}
                  />
                  {[0.25, 0.5, 0.75].map((ratio) => (
                    <Line
                      key={`bar_${ratio}`}
                      x1={left + plat.width * ratio}
                      y1={doorY + 4}
                      x2={left + plat.width * ratio}
                      y2={doorY + plat.height - 4}
                      stroke="#475569"
                      strokeWidth={2}
                    />
                  ))}
                  <Circle
                    cx={plat.x}
                    cy={top + 6}
                    r={3}
                    fill={isOpen ? '#22c55e' : '#ef4444'}
                  />
                </G>
              );
            }

            // --- DISAPPEARING PLATFORMS ---
            if (plat.type === 'disappearing_platform') {
              const isCollapsed = plat.isCollapsed;
              return (
                <G key={plat.id}>
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill="url(#crystalPlatGrad)"
                    stroke="#e879f9"
                    strokeWidth={1.5}
                    rx={4}
                    opacity={isCollapsed ? 0.12 : 0.88}
                  />
                  {!isCollapsed && (
                    <>
                      <Circle cx={left + 8} cy={top + 8} r={2} fill="#ffffff" opacity={0.9} />
                      <Circle cx={left + plat.width - 8} cy={top + plat.height - 8} r={1.5} fill="#ffffff" opacity={0.9} />
                    </>
                  )}
                </G>
              );
            }

            // --- FALLING PLATFORMS ---
            if (plat.type === 'falling_platform') {
              const isShaking = plat.isShaking;
              return (
                <G key={plat.id}>
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill={isShaking ? '#f97316' : '#64748b'}
                    stroke={isShaking ? '#ea580c' : '#334155'}
                    strokeWidth={2}
                    rx={3}
                  />
                  <Path
                    d={`M ${left + plat.width * 0.3} ${top} L ${left + plat.width * 0.45} ${top + plat.height * 0.6} L ${left + plat.width * 0.35} ${top + plat.height}`}
                    stroke="#1e293b"
                    strokeWidth={1.5}
                    fill="none"
                  />
                </G>
              );
            }

            // --- SECRET PASSAGES / FALSE WALLS ---
            if (plat.type === 'secret_passage') {
              const isRevealed = plat.isRevealed;
              return (
                <G key={plat.id} opacity={isRevealed ? 0.2 : 0.95}>
                  <Rect
                    x={left}
                    y={top}
                    width={plat.width}
                    height={plat.height}
                    fill={groundMain}
                    stroke={groundBorder}
                    strokeWidth={1.5}
                  />
                  <Circle cx={plat.x - 6} cy={plat.y} r={2} fill="#10b981" opacity={0.6} />
                  <Circle cx={plat.x + 4} cy={plat.y + 3} r={1.5} fill="#10b981" opacity={0.5} />
                </G>
              );
            }

            // --- BOUNDARY WALLS ---
            return (
              <Rect
                key={plat.id}
                x={left}
                y={top}
                width={plat.width}
                height={plat.height}
                fill={groundBorder}
                opacity={0.15}
              />
            );
          })}

          {/* Rising Hazard Zone (Waterfall Surge / Caldera Pressure) */}
          {snapshot.risingLavaY !== undefined && (() => {
            const rzStartX = snapshot.risingZoneStartX ?? 5400;
            const rzEndX = snapshot.risingZoneEndX ?? 6600;
            const rzWidth = rzEndX - rzStartX;
            const rzY = snapshot.risingLavaY;
            const rzHeight = Math.max(100, snapshot.worldHeight - rzY + 100);

            return (
              <G>
                {/* Main Body of Rising Hazard Zone */}
                <Rect
                  x={rzStartX}
                  y={rzY}
                  width={rzWidth}
                  height={rzHeight}
                  fill="url(#lavaGrad)"
                  opacity={0.92}
                />
                {/* Intense Glowing Surface Crest Line */}
                <Rect
                  x={rzStartX}
                  y={rzY}
                  width={rzWidth}
                  height={6}
                  fill={COLOR_LAVA_CORE}
                />
                <Line
                  x1={rzStartX}
                  y1={rzY}
                  x2={rzEndX}
                  y2={rzY}
                  stroke="#ffffff"
                  strokeWidth={2}
                  opacity={0.8}
                />
                {/* Boiling Surface Wave Highlights and Embers */}
                {Array.from({ length: 12 }, (_, i) => {
                  const bx = rzStartX + 40 + i * 95;
                  return (
                    <Circle
                      key={`rz_bubble_${i}`}
                      cx={bx}
                      cy={rzY + 2 + ((i * 7) % 6)}
                      r={3.5 + (i % 3)}
                      fill={COLOR_LAVA_CORE}
                      opacity={0.85}
                    />
                  );
                })}
              </G>
            );
          })()}

          {/* Collectible Golden Coins */}
          {coins.map((c) => {
            if (
              c.x + 25 < viewLeft ||
              c.x - 25 > viewRight ||
              c.y + 25 < viewTop ||
              c.y - 25 > viewBottom
            ) {
              return null;
            }
            return (
              <G key={c.id}>
                {/* Outer Golden Glow */}
                <Circle cx={c.x} cy={c.y} r={14} fill="#ffd700" opacity={0.25} />
                {/* Main Coin Disc */}
                <Circle
                  cx={c.x}
                  cy={c.y}
                  r={11}
                  fill="url(#goldGrad)"
                  stroke="#ff8f00"
                  strokeWidth={1.5}
                />
                {/* Inner Embossed Ring */}
                <Circle
                  cx={c.x}
                  cy={c.y}
                  r={7.5}
                  fill="none"
                  stroke="#fff9c4"
                  strokeWidth={1}
                  opacity={0.8}
                />
                {/* Center Specular Glint */}
                <Circle cx={c.x - 3} cy={c.y - 3} r={2} fill="#ffffff" opacity={0.9} />
              </G>
            );
          })}

          {/* Collectible Keys (Bronze, Silver, Gold, Sapphire, Frost) */}
          {keys.map((k) => {
            if (
              k.x + 30 < viewLeft ||
              k.x - 30 > viewRight ||
              k.y + 30 < viewTop ||
              k.y - 30 > viewBottom
            ) {
              return null;
            }
            const keyColor = k.color || '#ffd700';
            return (
              <G key={k.id}>
                {/* Radiant Glow */}
                <Circle cx={k.x} cy={k.y} r={16} fill={keyColor} opacity={0.3} />
                {/* Key Bow (Ring) */}
                <Circle
                  cx={k.x}
                  cy={k.y - 7}
                  r={8}
                  fill="none"
                  stroke={keyColor}
                  strokeWidth={3}
                />
                {/* Key Stem / Shaft */}
                <Line
                  x1={k.x}
                  y1={k.y}
                  x2={k.x}
                  y2={k.y + 12}
                  stroke={keyColor}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                {/* Key Wards / Teeth */}
                <Line
                  x1={k.x}
                  y1={k.y + 8}
                  x2={k.x + 5}
                  y2={k.y + 8}
                  stroke={keyColor}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
                <Line
                  x1={k.x}
                  y1={k.y + 12}
                  x2={k.x + 4}
                  y2={k.y + 12}
                  stroke={keyColor}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
                {/* Center Specular Glint */}
                <Circle cx={k.x - 2} cy={k.y - 9} r={1.5} fill="#ffffff" opacity={0.9} />
              </G>
            );
          })}

          {/* 6. Player Character (Original / Stone / Snow Ball Forms) */}
          <G
            transform={`translate(${ball.x}, ${ball.y}) scale(${ball.scaleX}, ${ball.scaleY}) rotate(${ballDeg})`}
          >
            {/* Protective Invulnerability Shield Aura */}
            {isInvulnerable && (
              <Circle
                cx="0"
                cy="0"
                r={r + 6}
                fill="none"
                stroke="#00e5ff"
                strokeWidth="2.5"
                strokeDasharray="6,4"
              />
            )}
            {/* Volcanic High-Contrast Halo */}
            {isLava && (
              <Circle
                cx="0"
                cy="0"
                r={r + 3}
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                opacity={0.9}
              />
            )}
            {/* Water Ripple Halo when submerged */}
            {ball.isInWater && (
              <Circle
                cx="0"
                cy="0"
                r={r + 4}
                fill="none"
                stroke="#80d8ff"
                strokeWidth="2"
                strokeDasharray="4,4"
                opacity={0.85}
              />
            )}

            {/* Transformation Shockwave Energy Burst */}
            {ball.transformationEffect && (
              <G>
                <Circle
                  cx="0"
                  cy="0"
                  r={r + 10}
                  fill="none"
                  stroke={
                    ball.transformationEffect.form === 'big'
                      ? '#ffd700'
                      : ball.transformationEffect.form === 'stone'
                      ? '#90a4ae'
                      : ball.transformationEffect.form === 'snow'
                      ? '#80deea'
                      : '#ef5350'
                  }
                  strokeWidth="3.5"
                  opacity={0.85}
                />
                <Circle
                  cx="0"
                  cy="0"
                  r={r + 18}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                  opacity={0.7}
                />
              </G>
            )}

            {/* BALL FORM 0: BIG BALL */}
            {ballForm === 'big' && (
              <G>
                {/* Large Ball Golden Expansion Aura */}
                <Circle
                  cx="0"
                  cy="0"
                  r={r + 5}
                  fill="none"
                  stroke="#ffd700"
                  strokeWidth={2.5}
                  strokeDasharray="6,4"
                  opacity={0.85}
                />
                <Circle cx="0" cy="0" r={r} fill="#ff9800" />
                <Circle
                  cx={r * 0.22}
                  cy={r * 0.22}
                  r={r * 0.82}
                  fill="#b26a00"
                  opacity={0.4}
                />
                {/* Concentric Bounce Rings */}
                <Circle
                  cx="0"
                  cy="0"
                  r={r * 0.65}
                  fill="none"
                  stroke="#ffe082"
                  strokeWidth={1.8}
                  opacity={0.65}
                />
                <Line
                  x1={-r * 0.72}
                  y1="0"
                  x2={r * 0.72}
                  y2="0"
                  stroke="#e65100"
                  strokeWidth="3.2"
                  opacity="0.5"
                />
                <Line
                  x1="0"
                  y1={-r * 0.72}
                  x2="0"
                  y2={r * 0.72}
                  stroke="#e65100"
                  strokeWidth="3.2"
                  opacity="0.5"
                />
                {/* Big Specular Highlight */}
                <Circle
                  cx={-r * 0.35}
                  cy={-r * 0.35}
                  r={r * 0.36}
                  fill="#ffffff"
                  opacity={0.6}
                />
                <Circle
                  cx={-r * 0.42}
                  cy={-r * 0.42}
                  r={r * 0.16}
                  fill="#ffffff"
                  opacity={0.9}
                />
              </G>
            )}

            {/* BALL FORM 1: STONE BALL */}
            {ballForm === 'stone' && (
              <G>
                {/* Heavy Granite Core */}
                <Circle
                  cx="0"
                  cy="0"
                  r={r}
                  fill="url(#stoneBallGrad)"
                  stroke="#263238"
                  strokeWidth={2}
                />
                {/* Rugged Chiseled Surface Fractures */}
                <Path
                  d={`M ${-r * 0.6} ${-r * 0.2} L ${-r * 0.15} ${r * 0.1} L ${r * 0.2} ${
                    -r * 0.35
                  } L ${r * 0.6} ${r * 0.15}`}
                  stroke={COLOR_STONE_CRACK}
                  strokeWidth={2}
                  fill="none"
                />
                <Path
                  d={`M ${-r * 0.3} ${r * 0.45} L ${r * 0.05} ${r * 0.2} L ${r * 0.4} ${r * 0.55}`}
                  stroke={COLOR_STONE_CRACK}
                  strokeWidth={1.6}
                  fill="none"
                />
                {/* Granite flecks & specks */}
                <Circle cx={-r * 0.45} cy={-r * 0.45} r={2} fill="#eceff1" opacity={0.8} />
                <Circle cx={r * 0.4} cy={-r * 0.3} r={1.8} fill="#263238" opacity={0.9} />
                <Circle cx={-r * 0.1} cy={r * 0.5} r={2.2} fill="#eceff1" opacity={0.7} />
                <Circle cx={r * 0.45} cy={r * 0.35} r={1.5} fill="#263238" opacity={0.9} />
                {/* Stone Specular Reflection */}
                <Circle
                  cx={-r * 0.35}
                  cy={-r * 0.35}
                  r={r * 0.22}
                  fill="#ffffff"
                  opacity={0.4}
                />
              </G>
            )}

            {/* BALL FORM 2: SNOW BALL */}
            {ballForm === 'snow' && (
              <G>
                {/* Soft Snowy Sphere */}
                <Circle
                  cx="0"
                  cy="0"
                  r={r}
                  fill="url(#snowBallGrad)"
                  stroke="#b0bec5"
                  strokeWidth={1.2}
                />
                {/* Soft Cyan Frozen Core */}
                <Circle cx="0" cy="0" r={r * 0.62} fill={COLOR_SNOW_CORE} opacity={0.35} />
                {/* 6-Armed Snowflake Emblem */}
                <Line
                  x1={-r * 0.5}
                  y1="0"
                  x2={r * 0.5}
                  y2="0"
                  stroke="#80deea"
                  strokeWidth={1.6}
                  opacity={0.8}
                />
                <Line
                  x1="0"
                  y1={-r * 0.5}
                  x2="0"
                  y2={r * 0.5}
                  stroke="#80deea"
                  strokeWidth={1.6}
                  opacity={0.8}
                />
                <Line
                  x1={-r * 0.35}
                  y1={-r * 0.35}
                  x2={r * 0.35}
                  y2={r * 0.35}
                  stroke="#80deea"
                  strokeWidth={1.4}
                  opacity={0.75}
                />
                <Line
                  x1={-r * 0.35}
                  y1={r * 0.35}
                  x2={r * 0.35}
                  y2={-r * 0.35}
                  stroke="#80deea"
                  strokeWidth={1.4}
                  opacity={0.75}
                />
                {/* Fluffy Specular Highlight */}
                <Circle
                  cx={-r * 0.35}
                  cy={-r * 0.35}
                  r={r * 0.32}
                  fill="#ffffff"
                  opacity={0.85}
                />
              </G>
            )}

            {/* BALL FORM 3: ORIGINAL RED BALL */}
            {ballForm === 'original' && (
              <G>
                {/* Small Ball Energy Halo */}
                {ball.size === 'small' && (
                  <Circle
                    cx="0"
                    cy="0"
                    r={r + 3}
                    fill="none"
                    stroke="#00e5ff"
                    strokeWidth={1.5}
                    opacity={0.75}
                  />
                )}
                {/* Large Ball Golden Expansion Halo */}
                {ball.size === 'large' && (
                  <Circle
                    cx="0"
                    cy="0"
                    r={r + 4}
                    fill="none"
                    stroke="#ffd700"
                    strokeWidth={2}
                    opacity={0.85}
                  />
                )}
                <Circle cx="0" cy="0" r={r} fill={COLOR_BALL} />
                <Circle
                  cx={r * 0.22}
                  cy={r * 0.22}
                  r={r * 0.82}
                  fill={COLOR_BALL_SHADOW}
                  opacity={0.35}
                />
                <Line
                  x1={-r * 0.72}
                  y1="0"
                  x2={r * 0.72}
                  y2="0"
                  stroke="#700f0d"
                  strokeWidth="3"
                  opacity="0.55"
                />
                <Line
                  x1="0"
                  y1={-r * 0.72}
                  x2="0"
                  y2={r * 0.72}
                  stroke="#700f0d"
                  strokeWidth="3"
                  opacity="0.55"
                />
                <Circle cx={r * 0.45} cy="0" r="2.5" fill="#ffd4d3" opacity="0.7" />
                <Circle cx={-r * 0.45} cy="0" r="2.5" fill="#ffd4d3" opacity="0.7" />
                <Circle cx="0" cy={r * 0.45} r="2.5" fill="#ffd4d3" opacity="0.7" />
                <Circle cx="0" cy={-r * 0.45} r="2.5" fill="#ffd4d3" opacity="0.7" />
                <Circle
                  cx={-r * 0.32}
                  cy={-r * 0.32}
                  r={r * 0.38}
                  fill={COLOR_BALL_HIGHLIGHT}
                  opacity={0.5}
                />
                <Circle
                  cx={-r * 0.38}
                  cy={-r * 0.38}
                  r={r * 0.16}
                  fill={COLOR_BALL_SPECULAR}
                  opacity={0.9}
                />
              </G>
            )}

            {/* Dynamic Ball Motion Effects (Ripples & Dust Trails) */}
            {ball.isInWater && (
              <G>
                <Circle cx={0} cy={-r - 4} r={3} fill="#e0f7fa" opacity={0.7} />
                <Circle cx={r * 0.4} cy={-r - 10} r={2} fill="#e0f7fa" opacity={0.6} />
                <Circle cx={-r * 0.3} cy={-r - 14} r={2.5} fill="#ffffff" opacity={0.5} />
              </G>
            )}
            {!ball.isInWater && Math.abs(ball.vx) > 3.5 && (
              <G>
                <Circle
                  cx={-Math.sign(ball.vx) * (r + 4)}
                  cy={r - 2}
                  r={3.2}
                  fill="#bdbdbd"
                  opacity={0.5}
                />
                <Circle
                  cx={-Math.sign(ball.vx) * (r + 10)}
                  cy={r - 4}
                  r={2.2}
                  fill="#e0e0e0"
                  opacity={0.35}
                />
              </G>
            )}
          </G>
        </G>

        {/* 6. Foreground Environmental Ambient Particles (High Quality only) */}
        {graphicsQuality !== 'medium' && (
          <G transform={`translate(${-camera.x * 0.04}, ${-camera.y * 0.02})`}>
            {isFrozen ? (
              // Alpine Snow Flurry Foreground Motes
              <>
                {Array.from({ length: 20 }, (_, i) => {
                  const fx = (i * 260 + 45) % 5200;
                  const fy = 20 + ((i * 37) % 360);
                  const fr = 1.8 + (i % 3) * 0.9;
                  return (
                    <Circle
                      key={`fg_snow_${i}`}
                      cx={fx}
                      cy={fy}
                      r={fr}
                      fill="#ffffff"
                      opacity={0.4 + (i % 3) * 0.2}
                    />
                  );
                })}
              </>
            ) : isLava ? (
              // Volcanic Rising Embers Foreground
              <>
                {Array.from({ length: 18 }, (_, i) => {
                  const ex = (i * 290 + 60) % 5200;
                  const ey = 30 + ((i * 43) % 340);
                  const er = 1.5 + (i % 3) * 0.8;
                  const col = i % 2 === 0 ? '#ffab00' : '#ff3d00';
                  return (
                    <Circle
                      key={`fg_ember_${i}`}
                      cx={ex}
                      cy={ey}
                      r={er}
                      fill={col}
                      opacity={0.55 + (i % 3) * 0.15}
                    />
                  );
                })}
              </>
            ) : isCavern ? (
              // Cavern Glowing Bioluminescent Spores
              <>
                {Array.from({ length: 16 }, (_, i) => {
                  const cx = (i * 320 + 80) % 5200;
                  const cy = 25 + ((i * 41) % 350);
                  const cr = 2 + (i % 3) * 0.8;
                  const ccol = i % 2 === 0 ? '#00e5ff' : '#ea80fc';
                  return (
                    <Circle
                      key={`fg_spore_${i}`}
                      cx={cx}
                      cy={cy}
                      r={cr}
                      fill={ccol}
                      opacity={0.45 + (i % 3) * 0.2}
                    />
                  );
                })}
              </>
            ) : (
              // Meadow Pollen & Dandelion Drift
              <>
                {Array.from({ length: 18 }, (_, i) => {
                  const mx = (i * 280 + 50) % 5200;
                  const my = 20 + ((i * 39) % 350);
                  const mr = 1.6 + (i % 3) * 0.7;
                  return (
                    <Circle
                      key={`fg_pollen_${i}`}
                      cx={mx}
                      cy={my}
                      r={mr}
                      fill="#fff9c4"
                      opacity={0.4 + (i % 3) * 0.18}
                    />
                  );
                })}
              </>
            )}
          </G>
        )}
      </Svg>
    </View>
  );
};

export const SvgWorldRenderer = React.memo(SvgWorldRendererComponent);
