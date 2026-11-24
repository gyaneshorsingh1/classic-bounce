import React, { useEffect, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { GAME_LEVELS, LevelConfig } from '../game/levels';
import { useWallet } from '../wallet/WalletContext';
import { saveManager } from '../services/SaveManager';
import { SoundManager } from '../services/SoundManager';
import {
  COLOR_BALL,
  COLOR_BALL_HIGHLIGHT,
  COLOR_BALL_SHADOW,
  COLOR_BALL_SPECULAR,
  COLOR_GROUND_MAIN,
  COLOR_GROUND_TOP,
  COLOR_SKY_BOTTOM,
  COLOR_SKY_TOP,
} from '../game/constants';

interface MainMenuScreenProps {
  selectedLevel: number;
  onSelectLevel: (levelId: number) => void;
  onStartGame: (levelId?: number) => void;
  onOpenLevelSelect: () => void;
  onOpenSettings: () => void;
}

export const MainMenuScreen: React.FC<MainMenuScreenProps> = ({
  selectedLevel,
  onSelectLevel,
  onStartGame,
  onOpenLevelSelect,
  onOpenSettings,
}) => {
  const { width, height } = useWindowDimensions();
  const { coins } = useWallet();
  const [, setRefreshState] = useState<number>(0);

  // Bouncing mascot animation
  const [bounceAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // Start Menu background music (track 0 = bgm_menu)
    SoundManager.playLevelMusic(0);

    const unsubscribe = saveManager.subscribe(() => {
      setRefreshState((prev) => prev + 1);
    });

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -18,
          duration: 480,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 480,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      SoundManager.stopMusic();
      unsubscribe();
    };
  }, [bounceAnim]);

  // Overall progression calculation
  const completedCount = saveManager.getCompletedLevels().length;
  let totalStars = 0;
  for (let i = 1; i <= GAME_LEVELS.length; i++) {
    const rec = saveManager.getLevelRecord(i);
    totalStars += rec.bestStars ?? 0;
  }

  const continueLevel = saveManager.getNextUncompletedLevel();
  const isSelectedUnlocked = saveManager.isLevelUnlocked(selectedLevel);

  return (
    <View style={styles.container}>
      {/* Background: Retro Sky & Fluffy Clouds */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="menuSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={COLOR_SKY_TOP} stopOpacity="1" />
            <Stop offset="1" stopColor={COLOR_SKY_BOTTOM} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Sky */}
        <Rect x="0" y="0" width={width} height={height} fill="url(#menuSky)" />

        {/* Clouds */}
        <Circle cx="100" cy="60" r="38" fill="#ffffff" opacity="0.4" />
        <Circle cx="140" cy="50" r="50" fill="#ffffff" opacity="0.4" />
        <Circle cx="180" cy="65" r="35" fill="#ffffff" opacity="0.4" />

        <Circle cx={width - 160} cy="70" r="42" fill="#ffffff" opacity="0.4" />
        <Circle cx={width - 120} cy="55" r="54" fill="#ffffff" opacity="0.4" />
        <Circle cx={width - 70} cy="75" r="38" fill="#ffffff" opacity="0.4" />

        {/* Ground strip at bottom */}
        <Rect
          x="0"
          y={height - 24}
          width={width}
          height="24"
          fill={COLOR_GROUND_MAIN}
        />
        <Rect
          x="0"
          y={height - 24}
          width={width}
          height="5"
          fill={COLOR_GROUND_TOP}
        />
      </Svg>

      {/* Main Content Layout */}
      <View style={styles.contentWrapper} pointerEvents="box-none">
        {/* Top Header: Title, Progression, Coins Badge & Settings */}
        <View style={styles.topRow}>
          <View style={styles.headerArea}>
            <Animated.View
              style={[
                styles.mascotBallContainer,
                { transform: [{ translateY: bounceAnim }] },
              ]}
            >
              <Svg width="44" height="44" viewBox="0 0 44 44">
                <Circle cx="22" cy="22" r="20" fill={COLOR_BALL} />
                <Circle cx="26" cy="26" r="16" fill={COLOR_BALL_SHADOW} opacity="0.35" />
                <Circle cx="15" cy="15" r="7.5" fill={COLOR_BALL_HIGHLIGHT} opacity="0.5" />
                <Circle cx="13" cy="13" r="3.5" fill={COLOR_BALL_SPECULAR} opacity="0.9" />
              </Svg>
            </Animated.View>

            <View style={styles.titleColumn}>
              <Text style={styles.gameTitle}>BOUNCE</Text>
              <Text style={styles.gameTagline}>CLASSIC 2D PLATFORMER</Text>
            </View>
          </View>

          {/* Progress & Wallet Badges */}
          <View style={styles.headerRightGroup}>
            {/* Overall Progression Badge */}
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>
                ⭐ {totalStars}/{GAME_LEVELS.length * 3} STARS • {completedCount}/{GAME_LEVELS.length} COMPLETED
              </Text>
            </View>

            {/* Persistent Wallet Coins Badge */}
            <View style={styles.walletBadge}>
              <Text style={styles.coinGlyph}>🪙</Text>
              <Text style={styles.walletAmount}>{coins.toLocaleString()}</Text>
            </View>

            {/* Settings Button */}
            <Pressable
              style={({ pressed }) => [styles.settingsButton, pressed && styles.cardPressed]}
              onPress={onOpenSettings}
              accessibilityLabel="Settings"
              accessibilityRole="button"
            >
              <Text style={styles.settingsGlyph}>⚙</Text>
            </Pressable>
          </View>
        </View>

        {/* Quick Level Selector Cards Preview */}
        <View style={styles.levelSection}>
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionHeading}>EXPEDITIONS</Text>
            <Pressable
              style={({ pressed }) => [styles.viewAllPill, pressed && styles.cardPressed]}
              onPress={onOpenLevelSelect}
              accessibilityRole="button"
            >
              <Text style={styles.viewAllText}>VIEW ALL ➔</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsRow}
          >
            {GAME_LEVELS.map((lvl: LevelConfig) => {
              const isSelected = lvl.id === selectedLevel;
              const isUnlocked = saveManager.isLevelUnlocked(lvl.id);
              const isCompleted = saveManager.isLevelCompleted(lvl.id);
              const rec = saveManager.getLevelRecord(lvl.id);
              const stars = rec.bestStars ?? 0;

              return (
                <Pressable
                  key={lvl.id}
                  style={({ pressed }) => [
                    styles.levelCard,
                    !isUnlocked && styles.levelCardLocked,
                    isSelected && isUnlocked && styles.levelCardSelected,
                    pressed && isUnlocked && styles.cardPressed,
                  ]}
                  disabled={!isUnlocked}
                  onPress={() => onSelectLevel(lvl.id)}
                  accessibilityLabel={`Level ${lvl.id}: ${lvl.name}. ${isUnlocked ? 'Select level' : 'Locked'}`}
                  accessibilityRole="button"
                >
                  {/* Difficulty Tag */}
                  <View style={styles.cardTopRow}>
                    <View
                      style={[
                        styles.difficultyBadge,
                        { backgroundColor: isUnlocked ? lvl.badgeColor : '#546e7a' },
                      ]}
                    >
                      <Text style={styles.difficultyText}>{lvl.difficulty}</Text>
                    </View>

                    {isCompleted && (
                      <View style={styles.checkDoneBadge}>
                        <Text style={styles.checkDoneText}>✓</Text>
                      </View>
                    )}
                  </View>

                  {/* Level Number & Name */}
                  <Text style={styles.cardLevelNumber}>
                    LEVEL {lvl.id} {!isUnlocked && '🔒'}
                  </Text>
                  <Text style={styles.cardLevelName} numberOfLines={1}>
                    {lvl.name}
                  </Text>

                  {/* Stars earned */}
                  {isUnlocked && (
                    <View style={styles.cardStarsRow}>
                      {[1, 2, 3].map((s) => (
                        <Text key={s} style={[styles.miniStar, s <= stars ? styles.starOn : styles.starOff]}>
                          ⭐
                        </Text>
                      ))}
                    </View>
                  )}

                  {/* Active Selection Checkmark / Pill */}
                  {isUnlocked ? (
                    isSelected ? (
                      <View style={styles.activeCheckPill}>
                        <Text style={styles.activeCheckText}>✓ SELECTED</Text>
                      </View>
                    ) : (
                      <View style={styles.inactivePill}>
                        <Text style={styles.inactivePillText}>SELECT</Text>
                      </View>
                    )
                  ) : (
                    <View style={styles.lockedPill}>
                      <Text style={styles.lockedPillText}>LOCKED</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Bottom Actions: Continue, Start Game, and Level Select */}
        <View style={styles.bottomArea}>
          <View style={styles.actionButtonsRow}>
            {/* Continue Button */}
            <Pressable
              style={({ pressed }) => [
                styles.continueButton,
                pressed && styles.startButtonPressed,
              ]}
              onPress={() => onStartGame(continueLevel)}
              accessibilityLabel={`Continue Level ${continueLevel}`}
              accessibilityRole="button"
            >
              <Text style={styles.continueIcon}>⚡</Text>
              <Text style={styles.continueText}>CONTINUE (LVL {continueLevel})</Text>
            </Pressable>

            {/* Play Selected Level Button */}
            <Pressable
              style={({ pressed }) => [
                styles.startButton,
                !isSelectedUnlocked && styles.buttonDisabled,
                pressed && isSelectedUnlocked && styles.startButtonPressed,
              ]}
              disabled={!isSelectedUnlocked}
              onPress={() => onStartGame(selectedLevel)}
              accessibilityLabel={`Start Level ${selectedLevel}`}
              accessibilityRole="button"
            >
              <Text style={styles.startIcon}>▶</Text>
              <Text style={styles.startText}>PLAY LEVEL {selectedLevel}</Text>
            </Pressable>

            {/* Level Select Screen Button */}
            <Pressable
              style={({ pressed }) => [
                styles.levelSelectNavButton,
                pressed && styles.cardPressed,
              ]}
              onPress={onOpenLevelSelect}
              accessibilityLabel="Level Select"
              accessibilityRole="button"
            >
              <Text style={styles.levelSelectNavText}>🗺️ ALL LEVELS</Text>
            </Pressable>
          </View>

          {/* Quick Help Guide */}
          <View style={styles.guideBadge}>
            <Text style={styles.guideText}>
              ◀ ▶ <Text style={styles.guideHighlight}>Roll</Text>   •   ▲{' '}
              <Text style={styles.guideHighlight}>Jump</Text>   •   ❚❚{' '}
              <Text style={styles.guideHighlight}>Pause</Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#58a0de',
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topRow: {
    width: '100%',
    maxWidth: 780,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mascotBallContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleColumn: {
    justifyContent: 'center',
  },
  gameTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  gameTagline: {
    color: '#d4edff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  progressText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingVertical: 5,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsGlyph: {
    color: '#ffffff',
    fontSize: 15,
  },
  levelSection: {
    width: '100%',
    maxWidth: 780,
    alignItems: 'center',
    marginVertical: 4,
  },
  sectionHeadingRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeading: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  viewAllPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  viewAllText: {
    color: '#00e5ff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  levelCard: {
    width: 190,
    backgroundColor: 'rgba(10, 24, 42, 0.88)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    padding: 12,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  levelCardSelected: {
    borderColor: '#00e5ff',
    backgroundColor: '#1b2838',
    transform: [{ scale: 1.02 }],
  },
  levelCardLocked: {
    opacity: 0.65,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  difficultyText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  checkDoneBadge: {
    backgroundColor: '#00e676',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkDoneText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
  },
  cardLevelNumber: {
    color: '#00e5ff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  cardLevelName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardStarsRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 6,
  },
  miniStar: {
    fontSize: 12,
  },
  starOn: {
    opacity: 1.0,
  },
  starOff: {
    opacity: 0.25,
  },
  activeCheckPill: {
    backgroundColor: '#00e5ff',
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeCheckText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  inactivePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  inactivePillText: {
    color: '#b0bec5',
    fontSize: 10,
    fontWeight: '800',
  },
  lockedPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  lockedPillText: {
    color: '#78909c',
    fontSize: 9,
    fontWeight: '800',
  },
  bottomArea: {
    width: '100%',
    maxWidth: 780,
    alignItems: 'center',
    gap: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
  },
  continueButton: {
    flex: 1.2,
    backgroundColor: '#ffd700',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  continueIcon: {
    fontSize: 14,
  },
  continueText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  startButton: {
    flex: 1.1,
    backgroundColor: '#00e5ff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  startIcon: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
  },
  startText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  levelSelectNavButton: {
    flex: 0.9,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
  },
  levelSelectNavText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  startButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  guideBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  guideText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  guideHighlight: {
    color: '#ffd700',
    fontWeight: '900',
  },
});
