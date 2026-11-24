import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { GAME_LEVELS, LevelConfig } from '../game/levels';
import { saveManager } from '../services/SaveManager';
import { useWallet } from '../wallet/WalletContext';
import {
  COLOR_GROUND_MAIN,
  COLOR_GROUND_TOP,
  COLOR_SKY_BOTTOM,
  COLOR_SKY_TOP,
} from '../game/constants';
import { LevelProgressRecord } from '../types/game';

interface LevelSelectScreenProps {
  onSelectAndPlayLevel: (levelId: number) => void;
  onBackToMenu: () => void;
  onOpenSettings: () => void;
}

function formatBestTime(seconds?: number): string {
  if (seconds === undefined || isNaN(seconds)) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins < 10 ? '0' : ''}${mins}:${parseFloat(secs) < 10 ? '0' : ''}${secs}`;
}

export const LevelSelectScreen: React.FC<LevelSelectScreenProps> = ({
  onSelectAndPlayLevel,
  onBackToMenu,
  onOpenSettings,
}) => {
  const { width, height } = useWindowDimensions();
  const { coins } = useWallet();
  const [, setRefreshState] = useState<number>(0);

  useEffect(() => {
    return saveManager.subscribe(() => {
      setRefreshState((prev) => prev + 1);
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Background Graphic */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="lvlSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={COLOR_SKY_TOP} stopOpacity="1" />
            <Stop offset="1" stopColor={COLOR_SKY_BOTTOM} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="url(#lvlSky)" />

        {/* Ambient clouds */}
        <Circle cx="90" cy="50" r="35" fill="#ffffff" opacity="0.35" />
        <Circle cx="130" cy="40" r="45" fill="#ffffff" opacity="0.35" />
        <Circle cx={width - 120} cy="60" r="40" fill="#ffffff" opacity="0.35" />

        {/* Bottom ground line */}
        <Rect x="0" y={height - 20} width={width} height="20" fill={COLOR_GROUND_MAIN} />
        <Rect x="0" y={height - 20} width={width} height="4" fill={COLOR_GROUND_TOP} />
      </Svg>

      {/* Main Content Area */}
      <View style={styles.contentWrapper} pointerEvents="box-none">
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
            onPress={onBackToMenu}
            accessibilityLabel="Back to Menu"
            accessibilityRole="button"
          >
            <Text style={styles.backButtonText}>🏠 MENU</Text>
          </Pressable>

          <View style={styles.titleGroup}>
            <Text style={styles.screenTitle}>SELECT LEVEL</Text>
            <Text style={styles.screenSub}>CHOOSE YOUR EXPEDITION</Text>
          </View>

          <View style={styles.navRightGroup}>
            {/* Wallet Coins Counter */}
            <View style={styles.walletBadge}>
              <Text style={styles.coinGlyph}>🪙</Text>
              <Text style={styles.walletAmount}>{coins.toLocaleString()}</Text>
            </View>

            {/* Settings shortcut */}
            <Pressable
              style={({ pressed }) => [styles.settingsButton, pressed && styles.buttonPressed]}
              onPress={onOpenSettings}
              accessibilityLabel="Open Settings"
              accessibilityRole="button"
            >
              <Text style={styles.settingsGlyph}>⚙</Text>
            </Pressable>
          </View>
        </View>

        {/* Level Cards Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}
        >
          {GAME_LEVELS.map((lvl: LevelConfig) => {
            const isUnlocked = saveManager.isLevelUnlocked(lvl.id);
            const isCompleted = saveManager.isLevelCompleted(lvl.id);
            const record: LevelProgressRecord = saveManager.getLevelRecord(lvl.id);
            const stars = record.bestStars ?? 0;

            return (
              <Pressable
                key={lvl.id}
                style={({ pressed }) => [
                  styles.levelCard,
                  !isUnlocked && styles.cardLocked,
                  isUnlocked && pressed && styles.buttonPressed,
                ]}
                disabled={!isUnlocked}
                onPress={() => onSelectAndPlayLevel(lvl.id)}
                accessibilityLabel={`Level ${lvl.id}: ${lvl.name}. ${isUnlocked ? 'Play now' : 'Locked'}`}
                accessibilityRole="button"
              >
                {/* Level Card Header with Difficulty Badge */}
                <View style={styles.cardHeader}>
                  <View style={[styles.diffBadge, { backgroundColor: lvl.badgeColor }]}>
                    <Text style={styles.diffText}>{lvl.difficulty}</Text>
                  </View>

                  {isCompleted && (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedText}>✓ DONE</Text>
                    </View>
                  )}
                </View>

                {/* Level Title and Preview */}
                <Text style={styles.cardLevelNum}>LEVEL {lvl.id}</Text>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {lvl.name}
                </Text>
                <Text style={styles.cardSub} numberOfLines={2}>
                  {lvl.subtitle}
                </Text>

                {/* Stars and Best Time Section */}
                <View style={styles.performanceSection}>
                  <View style={styles.starsRow}>
                    {[1, 2, 3].map((starIdx) => (
                      <Text
                        key={starIdx}
                        style={[
                          styles.starGlyph,
                          starIdx <= stars ? styles.starEarned : styles.starEmpty,
                        ]}
                      >
                        ⭐
                      </Text>
                    ))}
                  </View>

                  <View style={styles.bestTimeRow}>
                    <Text style={styles.bestTimeLabel}>BEST TIME:</Text>
                    <Text style={styles.bestTimeValue}>{formatBestTime(record.bestTimeSeconds)}</Text>
                  </View>
                </View>

                {/* Action / Lock Status Pill */}
                <View style={styles.cardFooter}>
                  {isUnlocked ? (
                    <View style={styles.playPill}>
                      <Text style={styles.playPillText}>▶ PLAY LEVEL</Text>
                    </View>
                  ) : (
                    <View style={styles.lockedPill}>
                      <Text style={styles.lockedPillText}>🔒 LOCKED</Text>
                    </View>
                  )}
                </View>

                {/* Locked Dimming Overlay */}
                {!isUnlocked && (
                  <View style={styles.lockedOverlay} pointerEvents="none">
                    <Text style={styles.lockIconLarge}>🔒</Text>
                    <Text style={styles.lockedSubtitle}>Complete Level {lvl.id - 1} to Unlock</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentWrapper: {
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 22,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  titleGroup: {
    alignItems: 'center',
  },
  screenTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  screenSub: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  navRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ffd700',
  },
  coinGlyph: {
    fontSize: 14,
  },
  walletAmount: {
    color: '#ffd700',
    fontSize: 13,
    fontWeight: '900',
  },
  settingsButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsGlyph: {
    color: '#ffffff',
    fontSize: 16,
  },
  cardsContainer: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    paddingHorizontal: 8,
    marginTop: 10,
    marginBottom: 6,
  },
  levelCard: {
    width: 220,
    height: 250,
    backgroundColor: '#1b2838',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(0, 229, 255, 0.65)',
    padding: 14,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  cardLocked: {
    borderColor: 'rgba(255, 255, 255, 0.20)',
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  diffBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  diffText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  completedBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.25)',
    borderWidth: 1,
    borderColor: '#00e676',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  completedText: {
    color: '#00e676',
    fontSize: 8,
    fontWeight: '900',
  },
  cardLevelNum: {
    color: '#00e5ff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 2,
  },
  cardSub: {
    color: '#b0bec5',
    fontSize: 10,
    lineHeight: 13,
    marginBottom: 6,
  },
  performanceSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    marginVertical: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  starGlyph: {
    fontSize: 16,
  },
  starEarned: {
    opacity: 1.0,
  },
  starEmpty: {
    opacity: 0.25,
  },
  bestTimeRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  bestTimeLabel: {
    color: '#90a4ae',
    fontSize: 9,
    fontWeight: '800',
  },
  bestTimeValue: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  cardFooter: {
    marginTop: 6,
  },
  playPill: {
    backgroundColor: '#00e5ff',
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  playPillText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  lockedPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  lockedPillText: {
    color: '#90a4ae',
    fontSize: 11,
    fontWeight: '800',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 16, 26, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  lockIconLarge: {
    fontSize: 32,
    marginBottom: 6,
  },
  lockedSubtitle: {
    color: '#cfd8dc',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
