import React, { useEffect } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';

interface LevelCompleteModalProps {
  visible: boolean;
  levelNumber: number;
  levelName: string;
  timeSeconds: number;
  deaths: number;
  coinsEarned: number;
  totalWalletCoins: number;
  stars: number;
  isNewBestTime?: boolean;
  isNewBestStars?: boolean;
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onBackToMenu: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins < 10 ? '0' : ''}${mins}:${parseFloat(secs) < 10 ? '0' : ''}${secs}`;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  visible,
  levelNumber,
  levelName,
  timeSeconds,
  deaths,
  coinsEarned,
  totalWalletCoins,
  stars,
  isNewBestTime = false,
  isNewBestStars = false,
  hasNextLevel,
  onNextLevel,
  onReplay,
  onBackToMenu,
}) => {
  // Trap hardware Back button on Android so it safely returns to Main Menu instead of exiting app
  useEffect(() => {
    if (!visible) return;

    const onHardwareBack = () => {
      onBackToMenu();
      return true; // Handled: prevents default Activity.finish()
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => {
      sub.remove();
    };
  }, [visible, onBackToMenu]);

  if (!visible) return null;

  return (
    <View style={styles.overlayContainer}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Trophy Header */}
          <Text style={styles.trophyIcon}>🏆</Text>
          <Text style={styles.title}>LEVEL {levelNumber} COMPLETE!</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {levelName}
          </Text>

          {/* Three Stars Display */}
          <View style={styles.starsRow}>
            {[1, 2, 3].map((starNum) => {
              const isEarned = starNum <= stars;
              return (
                <View key={starNum} style={styles.starSlot}>
                  <Text style={[styles.starGlyph, isEarned ? styles.starEarned : styles.starDim]}>
                    ⭐
                  </Text>
                </View>
              );
            })}
          </View>

          {isNewBestStars && (
            <View style={styles.newBestPill}>
              <Text style={styles.newBestText}>★ NEW RECORD RATING! ★</Text>
            </View>
          )}

          {/* Statistics Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>COMPLETION TIME</Text>
              <Text style={styles.statValue}>{formatTime(timeSeconds)}</Text>
              {isNewBestTime && (
                <Text style={styles.bestTimeBadge}>NEW BEST TIME!</Text>
              )}
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>DEATHS</Text>
              <Text style={styles.statValue}>{deaths}</Text>
              <Text style={styles.statSub}>{deaths === 0 ? 'FLAWLESS!' : 'SURVIVED'}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>COINS EARNED</Text>
              <Text style={[styles.statValue, { color: '#ffd700' }]}>+{coinsEarned}</Text>
              <Text style={styles.statSub}>THIS RUN</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>WALLET TOTAL</Text>
              <Text style={[styles.statValue, { color: '#ffd700' }]}>
                🪙 {totalWalletCoins.toLocaleString()}
              </Text>
              <Text style={styles.statSub}>BALANCE</Text>
            </View>
          </View>

          {/* Action Buttons: Next Level, Replay, Menu */}
          <View style={styles.buttonsColumn}>
            {hasNextLevel && (
              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
                onPress={onNextLevel}
                accessibilityRole="button"
                accessibilityLabel="Next Level"
              >
                <Text style={styles.primaryButtonText}>NEXT LEVEL ➔</Text>
              </Pressable>
            )}

            <View style={styles.dualButtonsRow}>
              <Pressable
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
                onPress={onReplay}
                accessibilityRole="button"
                accessibilityLabel="Replay Level"
              >
                <Text style={styles.secondaryButtonText}>↺ REPLAY</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
                onPress={onBackToMenu}
                accessibilityRole="button"
                accessibilityLabel="Back to Menu"
              >
                <Text style={styles.secondaryButtonText}>🏠 MENU</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 24,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1b2838',
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: '#ffd700',
    paddingVertical: 22,
    paddingHorizontal: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 440,
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  trophyIcon: {
    fontSize: 42,
    marginBottom: 4,
  },
  title: {
    color: '#ffd700',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  subtitle: {
    color: '#cfd8dc',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  starSlot: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  starGlyph: {
    fontSize: 34,
  },
  starEarned: {
    opacity: 1.0,
  },
  starDim: {
    opacity: 0.22,
  },
  newBestPill: {
    backgroundColor: '#ffd700',
    paddingVertical: 3,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  newBestText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    marginBottom: 18,
  },
  statBox: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  statLabel: {
    color: '#90a4ae',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statSub: {
    color: '#78909c',
    fontSize: 9,
    fontWeight: '700',
  },
  bestTimeBadge: {
    color: '#00e676',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  buttonsColumn: {
    width: '100%',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#ffd700',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  dualButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
