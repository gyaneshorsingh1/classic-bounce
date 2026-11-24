import React, { useEffect, useState } from 'react';
import { Alert, BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { saveManager } from '../services/SaveManager';
import { GameSettings } from '../types/game';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onResetProgressConfirmed?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  onResetProgressConfirmed,
}) => {
  const [settings, setSettings] = useState<GameSettings>(() => saveManager.getSettings());
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  useEffect(() => {
    return saveManager.subscribe(() => {
      setSettings(saveManager.getSettings());
    });
  }, []);

  // Trap Android hardware Back button
  useEffect(() => {
    if (!visible) return;

    const onHardwareBack = () => {
      onClose();
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => {
      sub.remove();
    };
  }, [visible, onClose]);

  if (!visible) return null;

  const update = (partial: Partial<GameSettings>) => {
    saveManager.updateSettings(partial).catch(() => {});
  };

  const handleResetProgress = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = async () => {
    setShowResetConfirm(false);
    await saveManager.resetAllProgress();
    onResetProgressConfirmed?.();
    Alert.alert('Progress Reset', 'Game progress has been reset to Level 1.');
  };

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>⚙ GAME SETTINGS</Text>
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="Close Settings"
              accessibilityRole="button"
            >
              <Text style={styles.closeGlyph}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* 1. SOUND EFFECTS */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>🔊 SOUND EFFECTS (SFX)</Text>
                <Pressable
                  style={[styles.mutePill, settings.soundMuted && styles.mutePillActive]}
                  onPress={() => update({ soundMuted: !settings.soundMuted })}
                  accessibilityRole="button"
                >
                  <Text style={styles.mutePillText}>
                    {settings.soundMuted ? 'MUTED' : 'ACTIVE'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.volumeRow}>
                {[0.0, 0.25, 0.5, 0.75, 1.0].map((vol) => {
                  const isSelected = Math.abs(settings.soundVolume - vol) < 0.1 && !settings.soundMuted;
                  return (
                    <Pressable
                      key={vol}
                      style={[styles.stepButton, isSelected && styles.stepButtonActive]}
                      onPress={() => update({ soundVolume: vol, soundMuted: false })}
                    >
                      <Text style={[styles.stepText, isSelected && styles.stepTextActive]}>
                        {Math.round(vol * 100)}%
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 2. BACKGROUND MUSIC */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>🎵 BACKGROUND MUSIC</Text>
                <Pressable
                  style={[styles.mutePill, settings.musicMuted && styles.mutePillActive]}
                  onPress={() => update({ musicMuted: !settings.musicMuted })}
                  accessibilityRole="button"
                >
                  <Text style={styles.mutePillText}>
                    {settings.musicMuted ? 'MUTED' : 'ACTIVE'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.volumeRow}>
                {[0.0, 0.25, 0.5, 0.75, 1.0].map((vol) => {
                  const isSelected = Math.abs(settings.musicVolume - vol) < 0.1 && !settings.musicMuted;
                  return (
                    <Pressable
                      key={vol}
                      style={[styles.stepButton, isSelected && styles.stepButtonActive]}
                      onPress={() => update({ musicVolume: vol, musicMuted: false })}
                    >
                      <Text style={[styles.stepText, isSelected && styles.stepTextActive]}>
                        {Math.round(vol * 100)}%
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 3. CONTROL LAYOUT */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎮 TOUCH CONTROL LAYOUT</Text>
              <View style={styles.optionsRow}>
                {(['split', 'left-cluster', 'right-cluster'] as const).map((layout) => {
                  const isSelected = settings.controlLayout === layout;
                  const label =
                    layout === 'split' ? 'SPLIT' : layout === 'left-cluster' ? 'LEFT' : 'RIGHT';
                  return (
                    <Pressable
                      key={layout}
                      style={[styles.optionPill, isSelected && styles.optionPillActive]}
                      onPress={() => update({ controlLayout: layout })}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 4. BUTTON SIZE */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔘 BUTTON SIZE</Text>
              <View style={styles.optionsRow}>
                {(['compact', 'normal', 'large'] as const).map((size) => {
                  const isSelected = settings.controlButtonSize === size;
                  return (
                    <Pressable
                      key={size}
                      style={[styles.optionPill, isSelected && styles.optionPillActive]}
                      onPress={() => update({ controlButtonSize: size })}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                        {size.toUpperCase()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 5. GRAPHICS QUALITY */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✨ GRAPHICS QUALITY</Text>
              <View style={styles.optionsRow}>
                {(['high', 'medium'] as const).map((quality) => {
                  const isSelected = settings.graphicsQuality === quality;
                  return (
                    <Pressable
                      key={quality}
                      style={[styles.optionPill, isSelected && styles.optionPillActive]}
                      onPress={() => update({ graphicsQuality: quality })}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                        {quality.toUpperCase()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 6. RESET PROGRESS */}
            <View style={styles.dangerSection}>
              {!showResetConfirm ? (
                <Pressable
                  style={({ pressed }) => [styles.resetButton, pressed && styles.buttonPressed]}
                  onPress={handleResetProgress}
                  accessibilityRole="button"
                >
                  <Text style={styles.resetButtonText}>⚠️ RESET GAME PROGRESS</Text>
                </Pressable>
              ) : (
                <View style={styles.confirmBox}>
                  <Text style={styles.confirmTitle}>ARE YOU SURE?</Text>
                  <Text style={styles.confirmSub}>
                    This resets all completed levels, stars, and coins back to Level 1.
                  </Text>
                  <View style={styles.confirmActionsRow}>
                    <Pressable
                      style={styles.cancelButton}
                      onPress={() => setShowResetConfirm(false)}
                    >
                      <Text style={styles.cancelText}>CANCEL</Text>
                    </Pressable>
                    <Pressable
                      style={styles.confirmButton}
                      onPress={confirmReset}
                    >
                      <Text style={styles.confirmText}>YES, RESET</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Done Button */}
          <Pressable
            style={({ pressed }) => [styles.doneButton, pressed && styles.buttonPressed]}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text style={styles.doneButtonText}>DONE</Text>
          </Pressable>
        </View>
      </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 250,
    padding: 16,
  },
  card: {
    backgroundColor: '#1b2838',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#00e5ff',
    paddingVertical: 18,
    paddingHorizontal: 22,
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    paddingBottom: 10,
  },
  title: {
    color: '#00e5ff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  closeButton: {
    padding: 6,
  },
  closeGlyph: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  scrollArea: {
    maxHeight: 280,
    marginBottom: 14,
  },
  section: {
    marginBottom: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#cfd8dc',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  mutePill: {
    backgroundColor: 'rgba(0, 230, 118, 0.18)',
    borderWidth: 1,
    borderColor: '#00e676',
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  mutePillActive: {
    backgroundColor: 'rgba(255, 82, 82, 0.22)',
    borderColor: '#ff5252',
  },
  mutePillText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  volumeRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  stepButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  stepButtonActive: {
    backgroundColor: '#00e5ff',
    borderColor: '#ffffff',
  },
  stepText: {
    color: '#b0bec5',
    fontSize: 10,
    fontWeight: '800',
  },
  stepTextActive: {
    color: '#000000',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  optionPill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionPillActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.22)',
    borderColor: '#00e5ff',
  },
  optionText: {
    color: '#b0bec5',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  optionTextActive: {
    color: '#00e5ff',
  },
  dualSettingsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCol: {
    flex: 1,
  },
  toggleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.20)',
    borderColor: '#00e676',
  },
  toggleText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  dangerSection: {
    marginTop: 6,
    marginBottom: 6,
  },
  resetButton: {
    backgroundColor: 'rgba(211, 47, 47, 0.22)',
    borderWidth: 1.5,
    borderColor: '#e53935',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#ff8a80',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  confirmBox: {
    backgroundColor: 'rgba(211, 47, 47, 0.35)',
    borderWidth: 1.5,
    borderColor: '#e53935',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  confirmTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },
  confirmSub: {
    color: '#ffcdd2',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 10,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#d32f2f',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  doneButton: {
    backgroundColor: '#00e5ff',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
