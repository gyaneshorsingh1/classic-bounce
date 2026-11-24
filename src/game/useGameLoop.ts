import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, Platform } from 'react-native';
import { PhysicsWorld } from './physics';
import {
  CoinData,
  GameSnapshot,
  LevelTheme,
  PlatformData,
  Position,
  BallSize,
  BallDensity,
  BallForm,
  KeyData,
  RisingZoneConfig,
  ChallengeTimerConfig,
} from '../types/game';
import { InputController } from '../controllers/InputController';
import { saveManager } from '../services/SaveManager';
import {
  BALL_INITIAL_X,
  BALL_INITIAL_Y,
  BALL_RADIUS,
  LEVEL_PLATFORMS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './constants';

export function useGameLoop(
  viewportWidth: number,
  viewportHeight: number,
  platforms: PlatformData[] = LEVEL_PLATFORMS,
  worldWidth: number = WORLD_WIDTH,
  worldHeight: number = WORLD_HEIGHT,
  initialBallX: number = BALL_INITIAL_X,
  initialBallY: number = BALL_INITIAL_Y,
  theme: LevelTheme = 'meadow',
  coins: CoinData[] = [],
  onCoinCollected?: (coin: CoinData) => void,
  keys: KeyData[] = [],
  onKeyCollected?: (key: KeyData) => void,
  isPaused: boolean = false,
  isMobile: boolean = Platform.OS !== 'web',
  risingZone?: RisingZoneConfig,
  challengeTimers?: ChallengeTimerConfig[]
) {
  const physicsRef = useRef<PhysicsWorld | null>(null);
  const [inputController] = useState(() => new InputController());

  const initialCamX = Math.max(0, initialBallX - Math.max(viewportWidth, 320) * 0.38);
  const initialCamY = Math.max(0, initialBallY - Math.max(viewportHeight, 200) * 0.52);
  const cameraRef = useRef<Position>({
    x: initialCamX,
    y: initialCamY,
  });
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const cachedCollectedKeysRef = useRef<string[]>(Array.from(saveManager.getCollectedKeyIds()));

  // Wrapped key collector to update cachedCollectedKeysRef only on actual collection
  const handleKeyCollectedWrapped = useCallback(
    (key: KeyData) => {
      cachedCollectedKeysRef.current = Array.from(saveManager.getCollectedKeyIds());
      onKeyCollected?.(key);
    },
    [onKeyCollected]
  );

  // Initial game snapshot
  const [snapshot, setSnapshot] = useState<GameSnapshot>(() => ({
    ball: {
      x: initialBallX,
      y: initialBallY,
      radius: BALL_RADIUS,
      angle: 0,
      vx: 0,
      vy: 0,
      scaleX: 1.0,
      scaleY: 1.0,
      isGrounded: false,
    },
    camera: { x: initialCamX, y: initialCamY },
    platforms: platforms,
    coins: coins,
    keys: keys,
    collectedKeyIds: Array.from(saveManager.getCollectedKeyIds()),
    worldWidth: worldWidth,
    worldHeight: worldHeight,
    theme,
    isLevelComplete: false,
    lives: 3,
    isInvulnerable: false,
    gameOverNotification: null,
    elapsedTime: 0,
    deaths: 0,
    challengeTimer: null,
  }));

  // Re-initialize when level configuration changes
  useEffect(() => {
    physicsRef.current = new PhysicsWorld(
      platforms,
      worldWidth,
      worldHeight,
      initialBallX,
      initialBallY,
      coins,
      onCoinCollected,
      keys,
      handleKeyCollectedWrapped,
      isMobile,
      risingZone,
      challengeTimers
    );

    const effectiveVpW = Math.max(viewportWidth, 320);
    const effectiveVpH = Math.max(viewportHeight, 200);
    const initCamX = Math.max(0, Math.min(initialBallX - effectiveVpW * 0.38, Math.max(0, worldWidth - effectiveVpW)));
    const initCamY = Math.max(0, Math.min(initialBallY - effectiveVpH * 0.52, Math.max(0, worldHeight - effectiveVpH)));

    cameraRef.current = { x: initCamX, y: initCamY };
    lastTimeRef.current = 0;
    accumulatorRef.current = 0;
    inputController.resetAll();

    setSnapshot({
      ball: physicsRef.current.getBallState(),
      camera: { x: initCamX, y: initCamY },
      platforms: physicsRef.current.getPlatforms(),
      coins: physicsRef.current.getActiveCoins(),
      keys: physicsRef.current.getActiveKeys(),
      collectedKeyIds: Array.from(saveManager.getCollectedKeyIds()),
      worldWidth,
      worldHeight,
      theme,
      isLevelComplete: false,
      lives: physicsRef.current.getLives(),
      isInvulnerable: physicsRef.current.getIsInvulnerable(),
      gameOverNotification: null,
      elapsedTime: 0,
      deaths: 0,
    });
  }, [platforms, worldWidth, worldHeight, initialBallX, initialBallY, theme, coins, onCoinCollected, keys, handleKeyCollectedWrapped, inputController, viewportWidth, viewportHeight, isMobile, risingZone, challengeTimers]);

  const resetGame = useCallback(() => {
    lastTimeRef.current = 0;
    accumulatorRef.current = 0;
    physicsRef.current?.resetBall(true);
    inputController.resetAll();
  }, [inputController]);

  const setBallSize = useCallback((size: BallSize, density?: BallDensity) => {
    return physicsRef.current?.setBallSize(size, density) ?? false;
  }, []);

  const setBallForm = useCallback((form: BallForm) => {
    return physicsRef.current?.setBallForm(form) ?? false;
  }, []);

  // Auto-reset inputs when app loses focus or notification shade is pulled down
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'background' || status === 'inactive') {
        inputController.resetAll();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [inputController]);

  // Auto-reset inputs when gameplay pauses or unpauses
  useEffect(() => {
    if (isPaused) {
      inputController.resetAll();
    }
  }, [isPaused, inputController]);

  useEffect(() => {
    let isRunning = true;

    const loop = (currentTime: number) => {
      if (!isRunning) return;

      const physics = physicsRef.current;
      if (!physics) return;

      if (isPaused) {
        lastTimeRef.current = 0;
        accumulatorRef.current = 0;
        animationFrameIdRef.current = requestAnimationFrame(loop);
        return;
      }

      const now = typeof currentTime === 'number' && currentTime > 0
        ? currentTime
        : (typeof performance !== 'undefined' ? performance.now() : Date.now());

      if (!lastTimeRef.current) {
        lastTimeRef.current = now;
        accumulatorRef.current = 0;
      }

      const rawDelta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Clamp rawDelta to prevent spiral of death during backgrounding / large hitches (max 64ms)
      const safeDelta = Math.min(Math.max(rawDelta, 0), 64);
      accumulatorRef.current += safeDelta;

      // Fixed physics timestep at 60 Hz (~16.6667ms per step)
      const FIXED_TIMESTEP = 1000 / 60;
      const MAX_SUB_STEPS = 4;
      let steps = 0;

      // If level is complete, ignore inputs and flush physics accumulator
      if (physics.getIsLevelComplete()) {
        inputController.resetAll();
        accumulatorRef.current = 0;
      } else {
        while (accumulatorRef.current >= FIXED_TIMESTEP && steps < MAX_SUB_STEPS) {
          physics.step(FIXED_TIMESTEP, inputController);
          accumulatorRef.current -= FIXED_TIMESTEP;
          steps++;
          if (physics.getIsLevelComplete()) {
            inputController.resetAll();
            accumulatorRef.current = 0;
            break;
          }
        }
      }

      // If still lagging after maximum sub-steps, flush accumulator to prevent death spiral
      if (accumulatorRef.current > FIXED_TIMESTEP * 1.5) {
        accumulatorRef.current = 0;
      }

      const ball = physics.getBallState();
      const isLevelComplete = physics.getIsLevelComplete();

      // 2. Camera Tracking along both X and Y
      const effectiveVpWidth = Math.max(viewportWidth, 320);
      const effectiveVpHeight = Math.max(viewportHeight, 200);

      const targetCamX = ball.x - effectiveVpWidth * 0.38;
      const maxCamX = Math.max(0, worldWidth - effectiveVpWidth);
      const clampedTargetX = Math.max(0, Math.min(targetCamX, maxCamX));

      const targetCamY = ball.y - effectiveVpHeight * 0.52;
      const maxCamY = Math.max(0, worldHeight - effectiveVpHeight);
      const clampedTargetY = Math.max(0, Math.min(targetCamY, maxCamY));

      // Smooth camera interpolation (gentler on mobile to prevent motion sickness)
      const camLerp = isMobile ? 0.08 : 0.14;
      const diffX = clampedTargetX - cameraRef.current.x;
      const diffY = clampedTargetY - cameraRef.current.y;
      cameraRef.current.x += Math.abs(diffX) < 0.2 ? diffX : diffX * camLerp;
      cameraRef.current.y += Math.abs(diffY) < 0.2 ? diffY : diffY * camLerp;

      // 3. Update React snapshot
      setSnapshot({
        ball,
        camera: {
          x: Math.round(cameraRef.current.x * 10) / 10,
          y: Math.round(cameraRef.current.y * 10) / 10,
        },
        platforms: physics.getPlatforms(),
        coins: physics.getActiveCoins(),
        keys: physics.getActiveKeys(),
        collectedKeyIds: cachedCollectedKeysRef.current,
        worldWidth,
        worldHeight,
        theme,
        isLevelComplete,
        risingLavaY: physics.getRisingLavaY(),
        risingZoneStartX: physics.getRisingZoneConfig()?.startX,
        risingZoneEndX: physics.getRisingZoneConfig()?.endX,
        lives: physics.getLives(),
        isInvulnerable: physics.getIsInvulnerable(),
        gameOverNotification: physics.getGameOverNotification(),
        elapsedTime: physics.getElapsedGameplayTime(),
        deaths: physics.getDeathCount(),
        challengeTimer: physics.getChallengeTimer(),
      });

      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      isRunning = false;
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [inputController, viewportWidth, viewportHeight, worldWidth, worldHeight, theme, isPaused, isMobile]);

  return {
    snapshot,
    inputController,
    resetGame,
    setBallSize,
    setBallForm,
  };
}
