import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Divider } from 'react-native-paper';

export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  showDivider?: boolean;
  style?: any;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  showDivider = true,
  style,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          {title}
        </Text>
        {description && (
          <Text
            style={[
              styles.description,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {description}
          </Text>
        )}
      </View>

      <View style={styles.content}>{children}</View>

      {showDivider && <Divider style={styles.divider} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  content: {
    // Children will be rendered here
  },
  divider: {
    marginTop: 16,
  },
});
