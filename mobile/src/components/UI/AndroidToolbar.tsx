import React from 'react';
import { StyleSheet, View, StatusBar, Platform } from 'react-native';
import { Appbar, Menu, Searchbar } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface AndroidToolbarProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  actions?: ToolbarAction[];
  searchMode?: boolean;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  onSearchSubmit?: (text: string) => void;
  onSearchClose?: () => void;
  elevated?: boolean;
  centerTitle?: boolean;
  transparent?: boolean;
}

export interface ToolbarAction {
  icon: string;
  label?: string;
  onPress: () => void;
  showAsAction?: 'always' | 'ifRoom' | 'never';
  disabled?: boolean;
}

export const AndroidToolbar: React.FC<AndroidToolbarProps> = ({
  title = '',
  subtitle,
  showBackButton = false,
  showMenuButton = false,
  onBackPress,
  onMenuPress,
  actions = [],
  searchMode = false,
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  onSearchClose,
  elevated = true,
  centerTitle = false,
  transparent = false,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = React.useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const visibleActions = actions.filter(action => 
    action.showAsAction === 'always' || action.showAsAction === 'ifRoom'
  );
  const menuActions = actions.filter(action => 
    action.showAsAction === 'never' || 
    (action.showAsAction === 'ifRoom' && visibleActions.length > 2)
  );

  const toolbarStyle = [
    styles.toolbar,
    {
      backgroundColor: transparent ? 'transparent' : theme.colors.primary,
      elevation: elevated ? 4 : 0,
      shadowOpacity: elevated ? 0.2 : 0,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top,
    },
  ];

  if (searchMode) {
    return (
      <View style={toolbarStyle}>
        <Searchbar
          placeholder="Search..."
          onChangeText={onSearchChange}
          value={searchValue}
          onSubmitEditing={(e) => onSearchSubmit?.(e.nativeEvent.text)}
          style={styles.searchbar}
          inputStyle={{ color: theme.colors.onSurface }}
          iconColor={theme.colors.onSurfaceVariant}
          onIconPress={onSearchClose}
          icon="arrow-left"
        />
      </View>
    );
  }

  return (
    <View style={toolbarStyle}>
      <Appbar.Header
        style={[
          styles.header,
          { backgroundColor: transparent ? 'transparent' : theme.colors.primary }
        ]}
        statusBarHeight={0} // We handle this above
        elevated={false} // We handle elevation above
      >
        {showBackButton && (
          <Appbar.BackAction
            onPress={onBackPress}
            iconColor={theme.colors.onPrimary}
          />
        )}
        
        {showMenuButton && (
          <Appbar.Action
            icon="menu"
            onPress={onMenuPress}
            iconColor={theme.colors.onPrimary}
          />
        )}

        <Appbar.Content
          title={title}
          subtitle={subtitle}
          titleStyle={[
            styles.title,
            {
              color: theme.colors.onPrimary,
              textAlign: centerTitle ? 'center' : 'left',
            },
          ]}
          subtitleStyle={[
            styles.subtitle,
            { color: theme.colors.onPrimary },
          ]}
        />

        {/* Visible actions */}
        {visibleActions.slice(0, 2).map((action, index) => (
          <Appbar.Action
            key={`action-${index}`}
            icon={action.icon}
            onPress={action.onPress}
            disabled={action.disabled}
            iconColor={theme.colors.onPrimary}
          />
        ))}

        {/* Menu for overflow actions */}
        {menuActions.length > 0 && (
          <Menu
            visible={menuVisible}
            onDismiss={closeMenu}
            anchor={
              <Appbar.Action
                icon="dots-vertical"
                onPress={openMenu}
                iconColor={theme.colors.onPrimary}
              />
            }
            contentStyle={styles.menu}
          >
            {menuActions.map((action, index) => (
              <Menu.Item
                key={`menu-${index}`}
                onPress={() => {
                  action.onPress();
                  closeMenu();
                }}
                title={action.label || ''}
                leadingIcon={action.icon}
                disabled={action.disabled}
              />
            ))}
          </Menu>
        )}
      </Appbar.Header>
    </View>
  );
};

// Specialized toolbar components
export const HomeToolbar: React.FC<{
  onMenuPress: () => void;
  onSearchPress: () => void;
  onNotificationPress: () => void;
  notificationCount?: number;
}> = ({ onMenuPress, onSearchPress, onNotificationPress, notificationCount = 0 }) => (
  <AndroidToolbar
    title="TailTracker"
    showMenuButton={true}
    onMenuPress={onMenuPress}
    actions={[
      {
        icon: 'magnify',
        onPress: onSearchPress,
        showAsAction: 'always',
      },
      {
        icon: notificationCount > 0 ? 'bell-badge' : 'bell',
        onPress: onNotificationPress,
        showAsAction: 'always',
      },
    ]}
  />
);

export const PetDetailToolbar: React.FC<{
  petName: string;
  onBackPress: () => void;
  onEditPress: () => void;
  onDeletePress: () => void;
  onSharePress: () => void;
}> = ({ petName, onBackPress, onEditPress, onDeletePress, onSharePress }) => (
  <AndroidToolbar
    title={petName}
    showBackButton={true}
    onBackPress={onBackPress}
    actions={[
      {
        icon: 'share-variant',
        label: 'Share',
        onPress: onSharePress,
        showAsAction: 'ifRoom',
      },
      {
        icon: 'pencil',
        label: 'Edit',
        onPress: onEditPress,
        showAsAction: 'never',
      },
      {
        icon: 'delete',
        label: 'Delete',
        onPress: onDeletePress,
        showAsAction: 'never',
      },
    ]}
  />
);

export const SearchToolbar: React.FC<{
  searchValue: string;
  onSearchChange: (text: string) => void;
  onSearchSubmit: (text: string) => void;
  onSearchClose: () => void;
}> = (props) => (
  <AndroidToolbar
    searchMode={true}
    {...props}
  />
);

const styles = StyleSheet.create({
  toolbar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 1,
  },
  header: {
    elevation: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  searchbar: {
    margin: 8,
    elevation: 2,
  },
  menu: {
    marginTop: 48,
  },
});