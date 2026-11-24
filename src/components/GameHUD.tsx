import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useWallet } from '../wallet/WalletContext';
import { BallForm } from '../types/game';

interface GameHUDProps {
  levelNumber?: number;
  lives?: number;
  ballSize?: 'small' | 'normal' | 'large';
  ballForm?: BallForm;
  collectedKeys?: string[];
  elapsedTime?: number;
  challengeTimer?: {
    id: string;
    label: string;
    remainingSeconds: number;
    maxSeconds: number;
  } | null;
  onCycleSize?: () => void;
  onOpenPause: () => void;
  onReset?: () => void;
}

function formatLiveTimer(seconds: number = 0): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

const GameHUDComponent: React.FC<GameHUDProps> = ({
  levelNumber = 1,
  lives = 3,
  ballSize,
  ballForm = 'original',
  collectedKeys = [],
  elapsedTime = 0,
  challengeTimer,
  onCycleSize,
  onOpenPause,
  onReset,
}) => {
  const { coins } = useWallet();

  const formLabel =
    ballForm === 'big'
      ? '🟡 BIG'
      : ballForm === 'stone'
      ? '🪨 STONE'
      : ballForm === 'snow'
      ? '❄️ SNOW'
      : '🔴 ORIGINAL';

  return (
    <>
      <View style={styles.hudContainer} pointerEvents="box-none">
        {/* Left: Lives, Coins & Keys */}
      <View style={styles.leftSection} pointerEvents="auto">
        {/* Lives: 3 Bounce Balls Indicator */}
        <View style={styles.livesBadge}>
          <Svg width={18} height={18} viewBox="0 0 18 18">
            <Circle cx="9" cy="9" r="8" fill="#e52521" />
            <Circle cx="6.5" cy="6.5" r="3.2" fill="#ff7b79" opacity="0.6" />
            <Circle cx="5.5" cy="5.5" r="1.5" fill="#ffffff" opacity="0.9" />
          </Svg>
          <Text style={styles.livesText}>x{lives}</Text>
        </View>

        {/* Persistent Wallet Coins Counter */}
        <View style={styles.coinsBadge}>
          <Text style={styles.coinsIcon}>🪙</Text>
          <Text style={styles.coinsText}>{coins.toLocaleString()}</Text>
        </View>

        {/* Collected Keys Badge */}
        {collectedKeys && collectedKeys.length > 0 && (
          <View style={styles.keysBadge}>
            <Text style={styles.keysIcon}>🔑</Text>
            <Text style={styles.keysText}>{collectedKeys.length}</Text>
          </View>
        )}
      </View>

      {/* Center: Level & Form Badge */}
      <View style={styles.centerSection} pointerEvents="box-none">
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>LVL {levelNumber}</Text>
        </View>

        <View style={styles.formBadge}>
          <Text style={styles.formText}>{formLabel}</Text>
        </View>

        {ballSize && onCycleSize && (
          <Pressable
            style={({ pressed }) => [
              styles.sizeBadge,
              ballSize === 'small'
                ? styles.sizeSmall
                : ballSize === 'large'
                ? styles.sizeLarge
                : styles.sizeNormal,
              pressed && styles.buttonPressed,
            ]}
            onPress={onCycleSize}
            accessibilityLabel={`Ball size: ${ballSize}. Tap to toggle size.`}
            accessibilityRole="button"
          >
            <Text style={styles.sizeText}>
              {ballSize === 'small'
                ? '🔵 SMALL'
                : ballSize === 'large'
                ? '🟡 LARGE'
                : '🟢 NORMAL'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Right: Live Timer, Quick Restart & Pause Button */}
      <View style={styles.rightSection} pointerEvents="auto">
        {/* Live Gameplay Timer */}
        <View style={styles.timerBadge}>
          <Text style={styles.timerGlyph}>⏱</Text>
          <Text style={styles.timerText}>{formatLiveTimer(elapsedTime)}</Text>
        </View>

        {/* Quick Restart */}
        {onReset && (
          <Pressable
            style={({ pressed }) => [styles.resetButton, pressed && styles.buttonPressed]}
            onPress={onReset}
            accessibilityLabel="Restart Level"
            accessibilityRole="button"
          >
            <Text style={styles.resetGlyph}>↺</Text>
          </Pressable>
        )}

        {/* Pause Button */}
        <Pressable
          style={({ pressed }) => [styles.pauseButton, pressed && styles.buttonPressed]}
          onPress={onOpenPause}
          accessibilityLabel="Pause Game"
          accessibilityRole="button"
        >
          <Text style={styles.pauseGlyph}>❚❚</Text>
        </Pressable>
      </View>
    </View>

    {challengeTimer && (
      <View style={styles.challengeTimerWrapper} pointerEvents="none">
        <View
          style={[
            styles.challengeTimerBadge,
            challengeTimer.remainingSeconds <= 5.0 && styles.challengeTimerUrgent,
          ]}
        >
          <Text style={styles.challengeTimerLabel}>{challengeTimer.label}</Text>
          <Text
            style={[
              styles.challengeTimerValue,
              challengeTimer.remainingSeconds <= 5.0 && styles.challengeTimerValueUrgent,
            ]}
          >
            ⏳ {challengeTimer.remainingSeconds.toFixed(1)}s
          </Text>
        </View>
      </View>
    )}
  </>
  );
};

const styles = StyleSheet.create({
  challengeTimerWrapper: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 28,
  },
  challengeTimerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(20, 10, 5, 0.88)',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
  },
  challengeTimerUrgent: {
    backgroundColor: 'rgba(50, 5, 5, 0.92)',
    borderColor: '#ef4444',
  },
  challengeTimerLabel: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  challengeTimerValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  challengeTimerValueUrgent: {
    color: '#ef4444',
  },
  hudContainer: {
    position: 'absolute',
    top: 10,
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 30,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  livesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  livesText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  coinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#ffd700',
  },
  coinsIcon: {
    fontSize: 12,
  },
  coinsText: {
    color: '#ffd700',
    fontSize: 12,
    fontWeight: '900',
  },
  keysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#00e5ff',
  },
  keysIcon: {
    fontSize: 12,
  },
  keysText: {
    color: '#00e5ff',
    fontSize: 12,
    fontWeight: '900',
  },
  centerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  levelText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  formBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  formText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sizeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  sizeSmall: {
    backgroundColor: 'rgba(33, 150, 243, 0.25)',
    borderColor: '#2196f3',
  },
  sizeNormal: {
    backgroundColor: 'rgba(76, 175, 80, 0.25)',
    borderColor: '#4caf50',
  },
  sizeLarge: {
    backgroundColor: 'rgba(255, 193, 7, 0.25)',
    borderColor: '#ffc107',
  },
  sizeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  timerGlyph: {
    fontSize: 11,
  },
  timerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  resetButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetGlyph: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  pauseButton: {
    backgroundColor: '#00e5ff',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  pauseGlyph: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});

export const GameHUD = React.memo(GameHUDComponent);
