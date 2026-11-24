import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { BackHandler, StyleSheet, View } from 'react-native';
import { MainMenuScreen } from './src/screens/MainMenuScreen';
import { LevelSelectScreen } from './src/screens/LevelSelectScreen';
import { GameScreen } from './src/screens/GameScreen';
import { SettingsModal } from './src/components/SettingsModal';
import { WalletProvider } from './src/wallet/WalletContext';
import { saveManager } from './src/services/SaveManager';

type ScreenType = 'menu' | 'level_select' | 'game';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('menu');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [showGlobalSettings, setShowGlobalSettings] = useState<boolean>(false);

  useEffect(() => {
    saveManager.loadAllSaveData().then(() => {
      const last = saveManager.getLastPlayedLevel();
      if (last >= 1 && last <= 5) {
        setSelectedLevel(last);
      }
    });
  }, []);

  // Global hardware back button trap on Android
  useEffect(() => {
    const onBackPress = () => {
      if (showGlobalSettings) {
        setShowGlobalSettings(false);
        return true;
      }
      if (currentScreen === 'game') {
        setCurrentScreen('menu');
        return true;
      }
      if (currentScreen === 'level_select') {
        setCurrentScreen('menu');
        return true;
      }
      return false; // let Android handle back on main menu
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [currentScreen, showGlobalSettings]);

  return (
    <WalletProvider>
      <View style={styles.root}>
        <StatusBar hidden />

        {currentScreen === 'menu' && (
          <MainMenuScreen
            selectedLevel={selectedLevel}
            onSelectLevel={(levelId) => setSelectedLevel(levelId)}
            onStartGame={(levelId) => {
              if (levelId) setSelectedLevel(levelId);
              setCurrentScreen('game');
            }}
            onOpenLevelSelect={() => setCurrentScreen('level_select')}
            onOpenSettings={() => setShowGlobalSettings(true)}
          />
        )}

        {currentScreen === 'level_select' && (
          <LevelSelectScreen
            onSelectAndPlayLevel={(levelId) => {
              setSelectedLevel(levelId);
              setCurrentScreen('game');
            }}
            onBackToMenu={() => setCurrentScreen('menu')}
            onOpenSettings={() => setShowGlobalSettings(true)}
          />
        )}

        {currentScreen === 'game' && (
          <GameScreen
            key={`game-lvl-${selectedLevel}`}
            levelNumber={selectedLevel}
            onBackToMenu={() => setCurrentScreen('menu')}
            onPlayNextLevel={(nextLvl) => {
              setSelectedLevel(nextLvl);
            }}
          />
        )}

        {/* Global Settings Modal accessible across screens */}
        <SettingsModal
          visible={showGlobalSettings}
          onClose={() => setShowGlobalSettings(false)}
        />
      </View>
    </WalletProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
