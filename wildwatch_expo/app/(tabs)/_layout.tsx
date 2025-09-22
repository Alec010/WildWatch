import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

// Custom Tab Bar Component
function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  // Filter out the index route from the tab bar
  const visibleRoutes = state.routes.filter((route: any) => route.name !== 'index');
  
  return (
    <View style={styles.tabBar}>
      {visibleRoutes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? options.title ?? route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Special styling for Report button (FAB)
        if (route.name === 'report') {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.fabContainer}
            >
              <View style={styles.fab}>
                <Ionicons name="warning" size={30} color="#8B0000" />
              </View>
              <Text style={styles.fabLabel}>Report</Text>
              <Text style={styles.fabSubLabel}>Incident</Text>
            </TouchableOpacity>
          );
        }

        // Regular tab styling
        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tab}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={getIconName(route.name)}
                size={24}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.tabLabel}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function getIconName(routeName: string) {
  switch (routeName) {
    case 'dashboard':
      return 'bar-chart';
    case 'history':
      return 'time';
    case 'cases':
      return 'document-text';
    case 'leaderboard':
      return 'trophy';
    default:
      return 'help-circle';
  }
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#8B0000',
    height: 95,
    paddingBottom: 20,
    paddingTop: 12,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 1,
  },
  iconContainer: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 6,
  },
  fabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10,
  },
  fab: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#8B0000',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12,
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
  },
  fabLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 2,
  },
  fabSubLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
  },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: 'Cases',
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
        }}
      />
    </Tabs>
  );
}
