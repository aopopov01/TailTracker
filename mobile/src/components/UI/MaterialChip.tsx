import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, ChipProps } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { petColors, statusColors } from '@/theme/materialTheme';

interface MaterialChipProps extends ChipProps {
  variant?: 'assist' | 'filter' | 'input' | 'suggestion';
  size?: 'small' | 'medium';
  color?: keyof typeof petColors | keyof typeof statusColors | string;
}

export const MaterialChip: React.FC<MaterialChipProps> = ({
  variant = 'assist',
  size = 'medium',
  color,
  style,
  textStyle,
  children,
  ...props
}) => {
  const theme = useTheme();

  const getChipColor = () => {
    if (color) {
      if (color in petColors) {
        return petColors[color as keyof typeof petColors];
      }
      if (color in statusColors) {
        return statusColors[color as keyof typeof statusColors];
      }
      return color;
    }
    return theme.colors.primary;
  };

  const getChipStyle = () => {
    const chipColor = getChipColor();
    
    switch (variant) {
      case 'filter':
        return {
          backgroundColor: props.selected ? chipColor : theme.colors.surfaceVariant,
          borderColor: chipColor,
          borderWidth: 1,
        };
      case 'input':
        return {
          backgroundColor: theme.colors.surfaceVariant,
          borderColor: theme.colors.outline,
          borderWidth: 1,
        };
      case 'suggestion':
        return {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
          borderWidth: 1,
        };
      default: // assist
        return {
          backgroundColor: chipColor,
        };
    }
  };

  const getTextColor = () => {
    const chipColor = getChipColor();
    
    switch (variant) {
      case 'filter':
        return props.selected ? theme.colors.onPrimary : theme.colors.onSurface;
      case 'input':
      case 'suggestion':
        return theme.colors.onSurface;
      default:
        return theme.colors.onPrimary;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.small;
      default:
        return styles.medium;
    }
  };

  return (
    <Chip
      style={[
        getSizeStyle(),
        getChipStyle(),
        style,
      ]}
      textStyle={[
        { color: getTextColor() },
        textStyle,
      ]}
      {...props}
    >
      {children}
    </Chip>
  );
};

// Specialized chip variants
export const PetTypeChip: React.FC<{ petType: keyof typeof petColors } & MaterialChipProps> = ({
  petType,
  ...props
}) => (
  <MaterialChip
    variant="assist"
    color={petType}
    icon={getPetIcon(petType)}
    {...props}
  >
    {petType.charAt(0).toUpperCase() + petType.slice(1)}
  </MaterialChip>
);

export const StatusChip: React.FC<{ status: keyof typeof statusColors } & MaterialChipProps> = ({
  status,
  ...props
}) => (
  <MaterialChip
    variant="assist"
    color={status}
    icon={getStatusIcon(status)}
    {...props}
  >
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </MaterialChip>
);

export const FilterChipGroup: React.FC<{
  chips: { id: string; label: string; selected: boolean }[];
  onSelectionChange: (id: string) => void;
}> = ({ chips, onSelectionChange }) => (
  <View style={styles.chipGroup}>
    {chips.map((chip) => (
      <MaterialChip
        key={chip.id}
        variant="filter"
        selected={chip.selected}
        onPress={() => onSelectionChange(chip.id)}
        style={styles.chipInGroup}
      >
        {chip.label}
      </MaterialChip>
    ))}
  </View>
);

// Helper functions for icons
const getPetIcon = (petType: keyof typeof petColors): string => {
  const icons = {
    dog: 'dog',
    cat: 'cat',
    bird: 'bird',
    fish: 'fish',
    rabbit: 'rabbit',
    hamster: 'rodent',
    reptile: 'snake',
    other: 'paw',
  };
  return icons[petType] || 'paw';
};

const getStatusIcon = (status: keyof typeof statusColors): string => {
  const icons = {
    safe: 'shield-check',
    alert: 'alert',
    danger: 'alert-circle',
    unknown: 'help-circle',
    offline: 'wifi-off',
  };
  return icons[status] || 'help-circle';
};

const styles = StyleSheet.create({
  small: {
    height: 24,
    paddingHorizontal: 8,
  },
  medium: {
    height: 32,
    paddingHorizontal: 12,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  chipInGroup: {
    marginRight: 8,
    marginBottom: 8,
  },
});