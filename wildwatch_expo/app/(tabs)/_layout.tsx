import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { storage } from "../../lib/storage";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const isSmallDevice = SCREEN_WIDTH < 375;
const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
const isLargeDevice = SCREEN_WIDTH >= 414;

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

// Custom Tab Bar Component
function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  // Filter out the index route and camera route from the tab bar
  const visibleRoutes = state.routes.filter(
    (route: any) =>
      route.name !== "index" &&
      route.name !== "camera" &&
      route.name !== "location"
  );

  return (
    <View style={styles.tabBar}>
      {visibleRoutes.map((route: any, visibleIndex: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? options.title ?? route.name;

        // Check if this route is focused by comparing with the actual focused route
        const focusedRoute = state.routes[state.index];
        const isFocused = route.key === focusedRoute.key;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Special styling for Report button (FAB) - smart routing based on flow step
        if (route.name === "report") {
          const handleReportPress = async () => {
            // Get the current flow step from storage
            const flowStep = await storage.getReportFlowStep();

            console.log("Report tab pressed, routing to flow step:", flowStep);

            // Route to the appropriate screen based on where user left off
            switch (flowStep) {
              case 1:
                navigation.navigate("camera");
                break;
              case 2:
                navigation.navigate("location");
                break;
              case 3:
                navigation.navigate("report");
                break;
              default:
                navigation.navigate("camera"); // Default to camera
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={handleReportPress}
              style={styles.fabContainer}
            >
              <View style={styles.fab}>
                <Ionicons
                  name="warning"
                  size={sizes.fabIconSize}
                  color="#8B0000"
                />
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
                size={sizes.iconSize}
                color={isFocused ? "#D4AF37" : "#FFFFFF"}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color: isFocused ? "#D4AF37" : "#FFFFFF" },
              ]}
            >
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
    case "dashboard":
      return "home";
    case "history":
      return "time";
    case "cases":
      return "globe";
    case "leaderboard":
      return "trophy";
    default:
      return "help-circle";
  }
}

// Responsive sizing calculations
const getResponsiveSizes = () => {
  const baseTabBarHeight = Platform.OS === "ios" ? 85 : 80;
  const bottomPadding =
    Platform.OS === "ios"
      ? SCREEN_HEIGHT >= 812
        ? 20
        : 10 // iPhone X and above have larger safe area
      : 15;

  const fabSize = isSmallDevice ? 65 : isMediumDevice ? 70 : 75;
  const fabIconSize = isSmallDevice ? 34 : isMediumDevice ? 38 : 42;
  const iconSize = isSmallDevice ? 20 : isMediumDevice ? 22 : 24;
  const tabLabelSize = isSmallDevice ? 8 : isMediumDevice ? 9 : 10;
  const fabLabelSize = isSmallDevice ? 9 : isMediumDevice ? 9.5 : 10;

  return {
    tabBarHeight: baseTabBarHeight + bottomPadding,
    bottomPadding,
    topPadding: 12,
    fabSize,
    fabBorderRadius: fabSize / 2,
    fabIconSize,
    iconSize,
    iconContainerSize: iconSize + 6,
    tabLabelSize,
    fabLabelSize,
    tabPaddingVertical: isSmallDevice ? 10 : 12,
    fabMarginTop: isSmallDevice ? -8 : -10,
  };
};

const sizes = getResponsiveSizes();

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#8B0000",
    height: sizes.tabBarHeight,
    paddingBottom: sizes.bottomPadding,
    paddingTop: sizes.topPadding,
    paddingHorizontal: 0,
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    alignItems: "center",
    justifyContent: "space-evenly",
    borderTopWidth: 0,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: sizes.tabPaddingVertical,
    paddingHorizontal: 0,
    minWidth: 60,
    maxWidth: SCREEN_WIDTH / 5,
  },
  iconContainer: {
    width: sizes.iconContainerSize,
    height: sizes.iconContainerSize,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: sizes.tabLabelSize,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 4,
    maxWidth: 70,
  },
  fabContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: sizes.fabMarginTop,
    paddingHorizontal: 0,
    minWidth: 60,
    maxWidth: SCREEN_WIDTH / 5,
  },
  fab: {
    width: sizes.fabSize,
    height: sizes.fabSize,
    borderRadius: sizes.fabBorderRadius,
    backgroundColor: "#ffffff",
    borderWidth: 4,
    borderColor: "#8B0000",
    alignItems: "center",
    justifyContent: "center",
    elevation: 14,
    shadowColor: "#8B0000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
  },
  fabLabel: {
    fontSize: sizes.fabLabelSize,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 3,
  },
  fabSubLabel: {
    fontSize: sizes.fabLabelSize,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.95)",
    textAlign: "center",
    marginTop: -1,
  },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: "Community",
        }}
      />

      <Tabs.Screen
        name="report"
        options={{
          title: "Report",
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: "History",
        }}
      />

      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Leaderboard",
        }}
      />

      <Tabs.Screen
        name="camera"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="location"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
