import React, { useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { saveManager } from '../services/SaveManager';
import { GameSettings } from '../types/game';

interface PauseModalProps {
  visible: boolean;
  levelNumber: number;
  levelName?: string;
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onBackToMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  visible,
  levelNumber,
  levelName = '',
  onResume,
  onRestart,
  onOpenSettings,
  onBackToMenu,
}) => {
  const [settings, setSettings] = useState<GameSettings>(() => saveManager.getSettings());

  useEffect(() => {
    return saveManager.subscribe(() => {
      setSettings(saveManager.getSettings());
    });
  }, []);

  // Trap Android hardware Back button so pressing back resumes the game safely without crashing/exiting
  useEffect(() => {
    if (!visible) return;

    const onHardwareBack = () => {
      onResume();
      return true; // Handled: prevents default Activity.finish()
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => {
      sub.remove();
    };
  }, [visible, onResume]);

  if (!visible) return null;

  const toggleSoundMute = () => {
    saveManager.updateSettings({ soundMuted: !settings.soundMuted }).catch(() => {});
  };

  const toggleMusicMute = () => {
    saveManager.updateSettings({ musicMuted: !settings.musicMuted }).catch(() => {});
  };

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        {/* Header */}
        <Text style={styles.pauseBadge}>GAME PAUSED</Text>
        <Text style={styles.levelTitle}>
          LEVEL {levelNumber}{levelName ? `: ${levelName}` : ''}
        </Text>

        {/* Quick Audio Controls */}
        <View style={styles.quickAudioRow}>
          <Pressable
            style={[styles.audioPill, settings.soundMuted && styles.audioPillMuted]}
            onPress={toggleSoundMute}
            accessibilityLabel={settings.soundMuted ? 'Unmute Sound' : 'Mute Sound'}
            accessibilityRole="button"
          >
            <Text style={styles.audioPillText}>
              {settings.soundMuted ? '🔇 SFX OFF' : '🔊 SFX ON'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.audioPill, settings.musicMuted && styles.audioPillMuted]}
            onPress={toggleMusicMute}
            accessibilityLabel={settings.musicMuted ? 'Unmute Music' : 'Mute Music'}
            accessibilityRole="button"
          >
            <Text style={styles.audioPillText}>
              {settings.musicMuted ? '🎵 MUSIC OFF' : '🎶 MUSIC ON'}
            </Text>
          </Pressable>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsColumn}>
          {/* Resume Button */}
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            onPress={onResume}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>▶ RESUME</Text>
          </Pressable>

          {/* Restart Level Button */}
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            onPress={onRestart}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>↺ RESTART LEVEL</Text>
          </Pressable>

          {/* Settings Button */}
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            onPress={onOpenSettings}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>⚙ SETTINGS</Text>
          </Pressable>

          {/* Main Menu Button */}
          <Pressable
            style={({ pressed }) => [styles.dangerButton, pressed && styles.buttonPressed]}
            onPress={onBackToMenu}
            accessibilityRole="button"
          >
            <Text style={styles.dangerButtonText}>🏠 MAIN MENU</Text>
          </Pressable>
        </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
    padding: 16,
  },
  card: {
    backgroundColor: '#1b2838',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00e5ff',
    paddingVertical: 22,
    paddingHorizontal: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  pauseBadge: {
    color: '#00e5ff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  levelTitle: {
    color: '#cfd8dc',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 16,
    textAlign: 'center',
  },
  quickAudioRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  audioPill: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: '#00e5ff',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  audioPillMuted: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  audioPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  buttonsColumn: {
    width: '100%',
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#00e5ff',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  secondaryButton: {
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
  dangerButton: {
    backgroundColor: 'rgba(211, 47, 47, 0.25)',
    borderWidth: 1.5,
    borderColor: '#e53935',
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#ff8a80',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
