import React, { useEffect, useState, useCallback, useRef, memo } from 'react';
import {
  Animated,
  AppState,
  GestureResponderEvent,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { InputController, ControlType } from '../controllers/InputController';
import { saveManager } from '../services/SaveManager';
import { GameSettings } from '../types/game';

interface VirtualControlsProps {
  inputController: InputController;
}

// Directional HitSlop Calibration:
// Prevents hit-box overlap across the gap between Left and Right buttons
const LEFT_BUTTON_HIT_SLOP = { top: 22, bottom: 22, left: 24, right: 4 };
const RIGHT_BUTTON_HIT_SLOP = { top: 22, bottom: 22, left: 4, right: 24 };
const JUMP_BUTTON_HIT_SLOP = { top: 26, bottom: 26, left: 26, right: 26 };

interface ControlButtonProps {
  control: ControlType;
  inputController: InputController;
  accessibilityLabel: string;
  style: any;
  defaultBgColor: string;
  defaultBorderColor: string;
  hitSlop?: { top: number; bottom: number; left: number; right: number };
  children: React.ReactNode;
}

/**
 * High-Performance ControlButton:
 * Multi-touch responsive button tracking distinct finger pointer IDs.
 *
 * Core Guarantees:
 * 1. Zero React State: Visual active state driven by Animated.Value directly on native view.
 *    Eliminates JS thread re-renders and React reconciliation hitching on touch events.
 * 2. Multi-Touch Independence: Lifting or moving one finger never cancels another.
 * 3. Instantaneous: Synchronously calls inputController.press/release without debounce or delays.
 * 4. Slide-Off Protection with Re-entry: Releases if finger slides away, re-engages if it returns.
 * 5. Safety Cleanup: Clears active state if unmounted, cancelled, or app backgrounded.
 */
const ControlButton: React.FC<ControlButtonProps> = memo(
  ({
    control,
    inputController,
    accessibilityLabel,
    style,
    defaultBgColor,
    defaultBorderColor,
    hitSlop,
    children,
  }) => {
    const [activeAnim] = useState(() => new Animated.Value(0));
    const activePointersRef = useRef<Set<number | string>>(new Set());
    const layoutRef = useRef<{ width: number; height: number }>({ width: 72, height: 72 });

    const handleTouchStart = useCallback(
      (e: GestureResponderEvent) => {
        const touches =
          e.nativeEvent.changedTouches && e.nativeEvent.changedTouches.length > 0
            ? e.nativeEvent.changedTouches
            : [e.nativeEvent];

        for (const touch of touches) {
          const pointerId = touch.identifier ?? 0;
          activePointersRef.current.add(pointerId);
          inputController.press(control, pointerId);
        }

        activeAnim.setValue(1);
      },
      [control, inputController, activeAnim]
    );

    const handleTouchMove = useCallback(
      (e: GestureResponderEvent) => {
        const touches =
          e.nativeEvent.changedTouches && e.nativeEvent.changedTouches.length > 0
            ? e.nativeEvent.changedTouches
            : [e.nativeEvent];
        const { width, height } = layoutRef.current;
        // Generous margin around button (60% of button dimension)
        const marginX = width * 0.6;
        const marginY = height * 0.6;

        for (const touch of touches) {
          const pointerId = touch.identifier ?? 0;
          const { locationX, locationY } = touch;

          const isInside =
            locationX >= -marginX &&
            locationX <= width + marginX &&
            locationY >= -marginY &&
            locationY <= height + marginY;

          if (isInside) {
            if (!activePointersRef.current.has(pointerId)) {
              activePointersRef.current.add(pointerId);
              inputController.press(control, pointerId);
            }
          } else {
            if (activePointersRef.current.has(pointerId)) {
              activePointersRef.current.delete(pointerId);
              inputController.release(control, pointerId);
            }
          }
        }

        if (activePointersRef.current.size === 0) {
          activeAnim.setValue(0);
        } else {
          activeAnim.setValue(1);
        }
      },
      [control, inputController, activeAnim]
    );

    const handleTouchEnd = useCallback(
      (e: GestureResponderEvent) => {
        const touches =
          e.nativeEvent.changedTouches && e.nativeEvent.changedTouches.length > 0
            ? e.nativeEvent.changedTouches
            : [e.nativeEvent];

        for (const touch of touches) {
          const pointerId = touch.identifier ?? 0;
          activePointersRef.current.delete(pointerId);
          inputController.release(control, pointerId);
        }

        // Safety fail-safe: if the OS says all touches ended, clear all lingering pointers
        if (
          !e.nativeEvent.touches ||
          e.nativeEvent.touches.length === 0 ||
          activePointersRef.current.size === 0
        ) {
          for (const remaining of activePointersRef.current) {
            inputController.release(control, remaining);
          }
          activePointersRef.current.clear();
          activeAnim.setValue(0);
        }
      },
      [control, inputController, activeAnim]
    );

    const handleTouchCancel = useCallback(
      (e: GestureResponderEvent) => {
        const touches =
          e.nativeEvent.changedTouches && e.nativeEvent.changedTouches.length > 0
            ? e.nativeEvent.changedTouches
            : [e.nativeEvent];

        for (const touch of touches) {
          const pointerId = touch.identifier ?? 0;
          activePointersRef.current.delete(pointerId);
          inputController.release(control, pointerId);
        }

        for (const remaining of activePointersRef.current) {
          inputController.release(control, remaining);
        }
        activePointersRef.current.clear();
        activeAnim.setValue(0);
      },
      [control, inputController, activeAnim]
    );

    // Mouse handlers for PC / Web browser testing
    const handleMouseDown = useCallback(() => {
      activePointersRef.current.add('mouse');
      activeAnim.setValue(1);
      inputController.press(control, 'mouse');
    }, [control, inputController, activeAnim]);

    const handleMouseUp = useCallback(() => {
      activePointersRef.current.delete('mouse');
      if (activePointersRef.current.size === 0) {
        activeAnim.setValue(0);
      }
      inputController.release(control, 'mouse');
    }, [control, inputController, activeAnim]);

    // Safety cleanup on unmount
    useEffect(() => {
      const activePointers = activePointersRef.current;
      const anim = activeAnim;
      return () => {
        for (const remaining of activePointers) {
          inputController.release(control, remaining);
        }
        activePointers.clear();
        anim.setValue(0);
      };
    }, [control, inputController, activeAnim]);

    const animatedScale = activeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.94],
    });

    const animatedBg = activeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [defaultBgColor, '#00e5ff'],
    });

    const animatedBorder = activeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [defaultBorderColor, '#ffffff'],
    });

    return (
      <Animated.View
        collapsable={false}
        hitSlop={hitSlop}
        pointerEvents="auto"
        style={[
          style,
          {
            backgroundColor: animatedBg,
            borderColor: animatedBorder,
            transform: [{ scale: animatedScale }],
          },
        ]}
        onLayout={(e) => {
          layoutRef.current = {
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          };
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        // @ts-ignore Web mouse support
        onMouseDown={handleMouseDown}
        // @ts-ignore Web mouse support
        onMouseUp={handleMouseUp}
        // @ts-ignore Web mouse support
        onMouseLeave={handleMouseUp}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        {children}
      </Animated.View>
    );
  }
);

ControlButton.displayName = 'ControlButton';

/**
 * VirtualControls:
 * Mobile on-screen touch and keyboard controls.
 * Integrates directly with authoritative InputController.
 */
const VirtualControlsComponent: React.FC<VirtualControlsProps> = ({ inputController }) => {
  const [settings, setSettings] = useState<GameSettings>(() => saveManager.getSettings());

  useEffect(() => {
    return saveManager.subscribe(() => {
      setSettings(saveManager.getSettings());
    });
  }, []);

  // Reset inputs when app is backgrounded, inactive, or unmounted
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        inputController.resetAll();
      }
    });

    return () => {
      subscription.remove();
      inputController.resetAll();
    };
  }, [inputController]);

  // Keyboard listeners for PC / Web development testing
  useEffect(() => {
    if (
      Platform.OS !== 'web' ||
      typeof window === 'undefined' ||
      typeof window.addEventListener !== 'function'
    ) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          inputController.press('left', 'keyboard');
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'KeyD':
          inputController.press('right', 'keyboard');
          e.preventDefault();
          break;
        case 'Space':
        case 'ArrowUp':
        case 'KeyW':
          inputController.press('jump', 'keyboard');
          e.preventDefault();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          inputController.release('left', 'keyboard');
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'KeyD':
          inputController.release('right', 'keyboard');
          e.preventDefault();
          break;
        case 'Space':
        case 'ArrowUp':
        case 'KeyW':
          inputController.release('jump', 'keyboard');
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      }
    };
  }, [inputController]);

  // Dynamic Button Dimensions based on Settings
  const isCompact = settings.controlButtonSize === 'compact';
  const isLarge = settings.controlButtonSize === 'large';

  const dpadDim = isCompact ? 60 : isLarge ? 86 : 72;
  const jumpDim = isCompact ? 70 : isLarge ? 98 : 82;

  const dpadStyle = {
    width: dpadDim,
    height: dpadDim,
    borderRadius: dpadDim / 2,
  };

  const jumpStyle = {
    width: jumpDim,
    height: jumpDim,
    borderRadius: jumpDim / 2,
  };

  const layout = settings.controlLayout;

  return (
    <View style={styles.controlsContainer} pointerEvents="box-none">
      <View
        style={[
          styles.bottomControlsBar,
          layout === 'left-cluster' && styles.barLeftCluster,
          layout === 'right-cluster' && styles.barRightCluster,
        ]}
        pointerEvents="box-none"
      >
        {/* Left D-Pad Group */}
        <View style={styles.leftControlsGroup} pointerEvents="box-none">
          {/* Move Left Button */}
          <ControlButton
            control="left"
            inputController={inputController}
            style={[styles.dpadButton, dpadStyle]}
            defaultBgColor="rgba(255, 255, 255, 0.22)"
            defaultBorderColor="rgba(255, 255, 255, 0.75)"
            hitSlop={LEFT_BUTTON_HIT_SLOP}
            accessibilityLabel="Move Left"
          >
            <Text style={styles.arrowGlyph} pointerEvents="none">◀</Text>
          </ControlButton>

          {/* Move Right Button */}
          <ControlButton
            control="right"
            inputController={inputController}
            style={[styles.dpadButton, dpadStyle]}
            defaultBgColor="rgba(255, 255, 255, 0.22)"
            defaultBorderColor="rgba(255, 255, 255, 0.75)"
            hitSlop={RIGHT_BUTTON_HIT_SLOP}
            accessibilityLabel="Move Right"
          >
            <Text style={styles.arrowGlyph} pointerEvents="none">▶</Text>
          </ControlButton>
        </View>

        {/* Jump Button */}
        <View style={styles.rightControlsGroup} pointerEvents="box-none">
          <ControlButton
            control="jump"
            inputController={inputController}
            style={[styles.jumpButton, jumpStyle]}
            defaultBgColor="rgba(255, 255, 255, 0.25)"
            defaultBorderColor="rgba(255, 255, 255, 0.85)"
            hitSlop={JUMP_BUTTON_HIT_SLOP}
            accessibilityLabel="Jump"
          >
            <Text style={styles.jumpGlyph} pointerEvents="none">▲</Text>
            <Text style={styles.jumpText} pointerEvents="none">JUMP</Text>
          </ControlButton>
        </View>
      </View>
    </View>
  );
};

export const VirtualControls = memo(VirtualControlsComponent);

const styles = StyleSheet.create({
  controlsContainer: {
    position: 'absolute',
    top: 55, // Leaves HUD interactive at top
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  bottomControlsBar: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 48,
    paddingBottom: 22,
  },
  barLeftCluster: {
    justifyContent: 'flex-start',
    gap: 24,
  },
  barRightCluster: {
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse',
    gap: 24,
  },
  leftControlsGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  rightControlsGroup: {
    // Jump button container
  },
  dpadButton: {
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    userSelect: 'none',
  },
  jumpButton: {
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    userSelect: 'none',
  },
  arrowGlyph: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    userSelect: 'none',
  },
  jumpGlyph: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    userSelect: 'none',
  },
  jumpText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: -2,
    userSelect: 'none',
  },
});
