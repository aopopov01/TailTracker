import React from 'react';
import { FAB, Portal } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AndroidFABProps {
  icon: string;
  onPress: () => void;
  visible?: boolean;
  extended?: boolean;
  label?: string;
  small?: boolean;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'surface';
  style?: any;
}

export const AndroidFAB: React.FC<AndroidFABProps> = ({
  icon,
  onPress,
  visible = true,
  extended = false,
  label,
  small = false,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: theme.colors.secondary,
          color: theme.colors.onSecondary,
        };
      case 'tertiary':
        return {
          backgroundColor: theme.colors.tertiary,
          color: theme.colors.onTertiary,
        };
      case 'surface':
        return {
          backgroundColor: theme.colors.surface,
          color: theme.colors.primary,
        };
      default: // primary
        return {
          backgroundColor: theme.colors.primary,
          color: theme.colors.onPrimary,
        };
    }
  };

  const variantStyle = getVariantStyle();

  if (!visible) return null;

  return (
    <Portal>
      <FAB
        icon={icon}
        label={extended ? label : undefined}
        onPress={onPress}
        loading={loading}
        disabled={disabled}
        visible={visible}
        size={small ? 'small' : 'medium'}
        style={[
          styles.fab,
          {
            bottom: insets.bottom + 16,
            right: 16,
            backgroundColor: variantStyle.backgroundColor,
          },
          style,
        ]}
        color={variantStyle.color}
        customSize={small ? 40 : extended ? undefined : 56}
        mode={extended ? 'elevated' : 'elevated'}
        animated={true}
      />
    </Portal>
  );
};

// Specialized FAB components
export const AddPetFAB: React.FC<{ onPress: () => void; visible?: boolean }> = ({
  onPress,
  visible = true,
}) => (
  <AndroidFAB
    icon="plus"
    onPress={onPress}
    visible={visible}
    extended={true}
    label="Add Pet"
    variant="primary"
  />
);

export const LocationFAB: React.FC<{ onPress: () => void; visible?: boolean }> = ({
  onPress,
  visible = true,
}) => (
  <AndroidFAB
    icon="crosshairs-gps"
    onPress={onPress}
    visible={visible}
    variant="secondary"
  />
);

export const SyncFAB: React.FC<{ onPress: () => void; loading?: boolean; visible?: boolean }> = ({
  onPress,
  loading = false,
  visible = true,
}) => (
  <AndroidFAB
    icon="sync"
    onPress={onPress}
    loading={loading}
    visible={visible}
    small={true}
    variant="surface"
  />
);

// Multi-action FAB component
interface MultiActionFABProps {
  actions: Array<{
    icon: string;
    label: string;
    onPress: () => void;
    color?: string;
  }>;
  visible?: boolean;
}

export const MultiActionFAB: React.FC<MultiActionFABProps> = ({
  actions,
  visible = true,
}) => {
  const [open, setOpen] = React.useState(false);
  const theme = useTheme();

  const onStateChange = ({ open }: { open: boolean }) => setOpen(open);

  if (!visible) return null;

  return (
    <Portal>
      <FAB.Group
        open={open}
        visible={visible}
        icon={open ? 'close' : 'plus'}
        actions={actions.map((action) => ({
          ...action,
          small: true,
          color: action.color || theme.colors.onSecondaryContainer,
          style: {
            backgroundColor: theme.colors.secondaryContainer,
          },
        }))}
        onStateChange={onStateChange}
        fabStyle={{
          backgroundColor: theme.colors.primary,
        }}
        color={theme.colors.onPrimary}
      />
    </Portal>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});