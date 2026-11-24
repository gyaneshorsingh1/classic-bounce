import React, { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useGameLoop } from '../game/useGameLoop';
import { WorldRenderer } from '../components/WorldRenderer';
import { VirtualControls } from '../controls/VirtualControls';
import { GameHUD } from '../components/GameHUD';
import { calculateStars, getLevelData, GAME_LEVELS } from '../game/levels';
import { useWallet } from '../wallet/WalletContext';
import { CoinData, GameSettings, LevelRunSummary } from '../types/game';
import { SoundManager } from '../services/SoundManager';
import { AudioManager } from '../services/AudioManager';
import { saveManager } from '../services/SaveManager';
import { PauseModal } from '../components/PauseModal';
import { LevelCompleteModal } from '../components/LevelCompleteModal';
import { SettingsModal } from '../components/SettingsModal';

interface GameScreenProps {
  levelNumber?: number;
  onBackToMenu?: () => void;
  onPlayNextLevel?: (nextLevelId: number) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  levelNumber = 1,
  onBackToMenu,
  onPlayNextLevel,
}) => {
  const { width, height } = useWindowDimensions();
  const { coins: walletCoins, addCoins } = useWallet();

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [settings, setSettings] = useState<GameSettings>(() => saveManager.getSettings());
  const [runSummary, setRunSummary] = useState<LevelRunSummary | null>(null);
  const runCoinsEarnedRef = useRef<number>(0);
  const completionHandledRef = useRef<boolean>(false);

  // Sync settings when changed in SettingsModal
  useEffect(() => {
    return saveManager.subscribe((updatedSettings) => {
      setSettings(updatedSettings);
    });
  }, []);

  // Play Level Background Music on mount
  useEffect(() => {
    SoundManager.playLevelMusic(levelNumber);
    saveManager.setLastPlayedLevel(levelNumber).catch(() => {});

    return () => {
      SoundManager.stopMusic();
    };
  }, [levelNumber]);

  // Pause / Resume music during pause state changes
  useEffect(() => {
    try {
      if (isPaused) {
        SoundManager.pauseMusic();
      } else {
        SoundManager.resumeMusic();
      }
    } catch (e) {
      console.warn('Music pause/resume error:', e);
    }
  }, [isPaused]);

  const handleCoinCollected = useCallback(
    (coin: CoinData) => {
      const val = coin.value ?? 1;
      runCoinsEarnedRef.current += val;
      addCoins(val).catch(() => {});
    },
    [addCoins]
  );

  // Load level configuration
  const levelData = useMemo(() => getLevelData(levelNumber), [levelNumber]);
  const { snapshot, inputController, resetGame, setBallSize } = useGameLoop(
    width,
    height,
    levelData.platforms,
    levelData.worldWidth,
    levelData.worldHeight,
    levelData.initialBallX,
    levelData.initialBallY,
    levelData.theme,
    levelData.coins ?? [],
    handleCoinCollected,
    levelData.keys ?? [],
    undefined,
    isPaused,
    undefined,
    levelData.risingZone,
    levelData.challengeTimers
  );

  // Handle Level Completion Evaluation
  useEffect(() => {
    if (snapshot.isLevelComplete && !completionHandledRef.current) {
      completionHandledRef.current = true;

      const elapsed = snapshot.elapsedTime ?? 0;
      const deathCount = snapshot.deaths ?? 0;
      const earnedStars = calculateStars(levelNumber, elapsed, deathCount);

      // 1. Immediately create run summary synchronously so the victory screen displays instantly
      setRunSummary({
        levelId: levelNumber,
        levelName: levelData.name,
        timeSeconds: elapsed,
        deaths: deathCount,
        stars: earnedStars,
        coinsEarned: runCoinsEarnedRef.current,
        isNewBestTime: false,
        isNewBestStars: false,
      });

      // 2. Pause level BGM so the victory fanfare can be heard cleanly
      AudioManager.pauseMusic();

      // 3. Persist progress asynchronously
      saveManager
        .recordLevelCompletion(levelNumber, elapsed, earnedStars)
        .then(({ isNewBestTime, isNewBestStars }) => {
          setRunSummary((prev) =>
            prev
              ? {
                  ...prev,
                  isNewBestTime,
                  isNewBestStars,
                }
              : null
          );
        })
        .catch(() => {});
    }
  }, [snapshot.isLevelComplete, snapshot.elapsedTime, snapshot.deaths, levelNumber, levelData.name]);

  const handleCycleSize = useCallback(() => {
    const current = snapshot.ball.size ?? 'normal';
    const next = current === 'normal' ? 'large' : current === 'large' ? 'small' : 'normal';
    setBallSize(next);
  }, [snapshot.ball.size, setBallSize]);

  const handleRestartLevel = useCallback(() => {
    completionHandledRef.current = false;
    runCoinsEarnedRef.current = 0;
    setRunSummary(null);
    setIsPaused(false);
    resetGame();
    AudioManager.resumeMusic();
  }, [resetGame]);

  const handleOpenPause = useCallback(() => {
    setIsPaused(true);
  }, []);

  // Lock orientation to Landscape on native mobile
  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        if (ScreenOrientation && typeof ScreenOrientation.lockAsync === 'function') {
          ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
        }
      } catch {}
    }
  }, []);

  const hasNextLevel = levelNumber < GAME_LEVELS.length;

  return (
    <View style={styles.container}>
      {/* 2D Platform World (Hardware-Accelerated SVG, 100% Expo Go Compatible) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <WorldRenderer
          snapshot={snapshot}
          width={width}
          height={height}
          graphicsQuality={settings.graphicsQuality}
        />
      </View>

      {/* Classic Nokia Bounce Game HUD with Live Lives, Keys & Pause Button */}
      <GameHUD
        levelNumber={levelNumber}
        lives={snapshot.lives}
        ballForm={snapshot.ball.form ?? 'original'}
        collectedKeys={snapshot.collectedKeyIds}
        elapsedTime={Math.floor(snapshot.elapsedTime ?? 0)}
        challengeTimer={snapshot.challengeTimer}
        ballSize={
          levelNumber === 2 && (snapshot.ball.form === 'original' || !snapshot.ball.form)
            ? (snapshot.ball.size ?? 'normal')
            : undefined
        }
        onCycleSize={levelNumber === 2 ? handleCycleSize : undefined}
        onOpenPause={handleOpenPause}
        onReset={handleRestartLevel}
      />

      {/* Game Over / Level Restart Notification Banner */}
      {snapshot.gameOverNotification && (
        <View style={styles.gameOverBanner} pointerEvents="none">
          <Text style={styles.gameOverText}>{snapshot.gameOverNotification}</Text>
        </View>
      )}

      {/* On-Screen Mobile Touch & Keyboard Controls */}
      <VirtualControls inputController={inputController} />

      {/* Pause Menu Modal */}
      <PauseModal
        visible={isPaused && !showSettings && !snapshot.isLevelComplete}
        levelNumber={levelNumber}
        levelName={levelData.name}
        onResume={() => setIsPaused(false)}
        onRestart={handleRestartLevel}
        onOpenSettings={() => setShowSettings(true)}
        onBackToMenu={onBackToMenu ?? (() => {})}
      />

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onResetProgressConfirmed={handleRestartLevel}
      />

      {/* Level Complete Victory Screen */}
      {snapshot.isLevelComplete && runSummary && (
        <LevelCompleteModal
          visible={snapshot.isLevelComplete}
          levelNumber={levelNumber}
          levelName={runSummary.levelName}
          timeSeconds={runSummary.timeSeconds}
          deaths={runSummary.deaths}
          coinsEarned={runSummary.coinsEarned}
          totalWalletCoins={walletCoins}
          stars={runSummary.stars}
          isNewBestTime={runSummary.isNewBestTime}
          isNewBestStars={runSummary.isNewBestStars}
          hasNextLevel={hasNextLevel}
          onNextLevel={() => {
            AudioManager.resumeMusic();
            onPlayNextLevel?.(levelNumber + 1);
          }}
          onReplay={handleRestartLevel}
          onBackToMenu={() => {
            AudioManager.resumeMusic();
            onBackToMenu?.();
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gameOverBanner: {
    position: 'absolute',
    top: 54,
    alignSelf: 'center',
    backgroundColor: 'rgba(211, 47, 47, 0.92)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 150,
  },
  gameOverText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
