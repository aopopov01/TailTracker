import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Card, CardProps } from 'react-native-paper';
import { useTheme } from 'react-native-paper';

interface MaterialCardProps extends CardProps {
  variant?: 'elevated' | 'filled' | 'outlined';
  padding?: number;
  margin?: number;
}

export const MaterialCard: React.FC<MaterialCardProps> = ({
  variant = 'elevated',
  padding = 16,
  margin = 0,
  style,
  children,
  ...props
}) => {
  const theme = useTheme();

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.roundness,
      margin,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surface,
          elevation: 4,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        };
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surfaceVariant,
          elevation: 0,
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.outline,
          elevation: 0,
        };
      default:
        return baseStyle;
    }
  };

  return (
    <Card
      style={[
        getCardStyle(),
        style,
      ]}
      contentStyle={[
        { padding },
      ]}
      {...props}
    >
      {children}
    </Card>
  );
};

// Card variants for specific use cases
export const PetCard: React.FC<MaterialCardProps> = (props) => (
  <MaterialCard
    variant="elevated"
    padding={12}
    margin={8}
    {...props}
  />
);

export const InfoCard: React.FC<MaterialCardProps> = (props) => (
  <MaterialCard
    variant="filled"
    padding={16}
    margin={4}
    {...props}
  />
);

export const AlertCard: React.FC<MaterialCardProps> = (props) => {
  const theme = useTheme();
  return (
    <MaterialCard
      variant="outlined"
      padding={16}
      margin={8}
      style={[
        {
          borderColor: theme.colors.error,
          backgroundColor: theme.colors.errorContainer,
        },
        props.style,
      ]}
      {...props}
    />
  );
};