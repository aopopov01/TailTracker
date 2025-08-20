import React, { forwardRef, useImperativeHandle } from 'react';
import { 
  View, 
  StyleSheet, 
  PanResponder, 
  Animated, 
  Dimensions, 
  Modal,
  TouchableWithoutFeedback,
  BackHandler,
} from 'react-native';
import { Surface, Text, Divider } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { height: screenHeight } = Dimensions.get('window');

export interface BottomSheetRef {
  open: () => void;
  close: () => void;
  expand: () => void;
  collapse: () => void;
}

interface MaterialBottomSheetProps {
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[]; // Percentage of screen height
  initialIndex?: number;
  onClose?: () => void;
  onStateChange?: (state: 'closed' | 'collapsed' | 'expanded') => void;
  showHandle?: boolean;
  showHeader?: boolean;
  headerActions?: React.ReactNode;
  backdrop?: boolean;
  modal?: boolean;
}

export const MaterialBottomSheet = forwardRef<BottomSheetRef, MaterialBottomSheetProps>(({
  children,
  title,
  snapPoints = [30, 60, 90],
  initialIndex = 0,
  onClose,
  onStateChange,
  showHandle = true,
  showHeader = true,
  headerActions,
  backdrop = true,
  modal = false,
}, ref) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  const [visible, setVisible] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  
  const translateY = React.useRef(new Animated.Value(screenHeight)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;
  
  const snapPointsInPixels = snapPoints.map(point => screenHeight * (1 - point / 100));

  useImperativeHandle(ref, () => ({
    open: () => openSheet(),
    close: () => closeSheet(),
    expand: () => animateToIndex(snapPoints.length - 1),
    collapse: () => animateToIndex(0),
  }));

  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        closeSheet();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > 10;
    },
    onPanResponderMove: (_, gestureState) => {
      const newTranslateY = snapPointsInPixels[currentIndex] + gestureState.dy;
      if (newTranslateY >= snapPointsInPixels[snapPoints.length - 1] && 
          newTranslateY <= screenHeight) {
        translateY.setValue(newTranslateY);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      const currentY = snapPointsInPixels[currentIndex] + gestureState.dy;
      let targetIndex = currentIndex;
      
      // Determine the closest snap point
      let minDistance = Infinity;
      snapPointsInPixels.forEach((point, index) => {
        const distance = Math.abs(currentY - point);
        if (distance < minDistance) {
          minDistance = distance;
          targetIndex = index;
        }
      });
      
      // If dragged down significantly, close the sheet
      if (gestureState.dy > 100 && gestureState.vy > 0.5) {
        closeSheet();
      } else {
        animateToIndex(targetIndex);
      }
    },
  });

  const openSheet = () => {
    setVisible(true);
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: snapPointsInPixels[initialIndex],
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start();
    
    onStateChange?.(initialIndex === 0 ? 'collapsed' : 'expanded');
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setVisible(false);
      onClose?.();
    });
    
    onStateChange?.('closed');
  };

  const animateToIndex = (index: number) => {
    setCurrentIndex(index);
    Animated.spring(translateY, {
      toValue: snapPointsInPixels[index],
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
    
    onStateChange?.(index === 0 ? 'collapsed' : 'expanded');
  };

  const sheetContent = (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          backgroundColor: theme.colors.surface,
        },
      ]}
      {...panResponder.panHandlers}
    >
      {showHandle && (
        <View style={styles.handleContainer}>
          <View
            style={[
              styles.handle,
              { backgroundColor: theme.colors.onSurfaceVariant },
            ]}
          />
        </View>
      )}
      
      {showHeader && (
        <>
          <View style={styles.header}>
            {title && (
              <Text variant="titleLarge" style={styles.title}>
                {title}
              </Text>
            )}
            <View style={styles.headerActions}>
              {headerActions}
              <Icon
                name="close"
                size={24}
                color={theme.colors.onSurfaceVariant}
                onPress={closeSheet}
                style={styles.closeIcon}
              />
            </View>
          </View>
          <Divider />
        </>
      )}
      
      <View
        style={[
          styles.content,
          { paddingBottom: insets.bottom },
        ]}
      >
        {children}
      </View>
    </Animated.View>
  );

  if (modal) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="none"
        statusBarTranslucent={true}
      >
        <View style={styles.modalContainer}>
          {backdrop && (
            <TouchableWithoutFeedback onPress={closeSheet}>
              <Animated.View
                style={[
                  styles.backdrop,
                  { opacity: opacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.5],
                  }) },
                ]}
              />
            </TouchableWithoutFeedback>
          )}
          {sheetContent}
        </View>
      </Modal>
    );
  }

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      {backdrop && (
        <TouchableWithoutFeedback onPress={closeSheet}>
          <Animated.View
            style={[
              styles.backdrop,
              { opacity: opacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }) },
            ]}
          />
        </TouchableWithoutFeedback>
      )}
      {sheetContent}
    </View>
  );
});

// Specialized bottom sheet components
export const ActionBottomSheet = forwardRef<BottomSheetRef, {
  actions: Array<{
    title: string;
    icon: string;
    onPress: () => void;
    destructive?: boolean;
  }>;
  onClose?: () => void;
}>(({ actions, onClose }, ref) => {
  const theme = useTheme();
  
  return (
    <MaterialBottomSheet
      ref={ref}
      snapPoints={[30]}
      showHeader={false}
      onClose={onClose}
    >
      <View style={styles.actionList}>
        {actions.map((action, index) => (
          <TouchableWithoutFeedback
            key={index}
            onPress={() => {
              action.onPress();
              (ref as any)?.current?.close();
            }}
          >
            <View style={styles.actionItem}>
              <Icon
                name={action.icon}
                size={24}
                color={action.destructive ? theme.colors.error : theme.colors.onSurface}
                style={styles.actionIcon}
              />
              <Text
                variant="bodyLarge"
                style={[
                  styles.actionText,
                  {
                    color: action.destructive 
                      ? theme.colors.error 
                      : theme.colors.onSurface,
                  },
                ]}
              >
                {action.title}
              </Text>
            </View>
          </TouchableWithoutFeedback>
        ))}
      </View>
    </MaterialBottomSheet>
  );
});

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 200,
    maxHeight: screenHeight * 0.95,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 32,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    flex: 1,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeIcon: {
    marginLeft: 16,
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  actionList: {
    paddingVertical: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  actionIcon: {
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
});