import { Redirect, Stack, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { MD3LightTheme, PaperProvider } from "react-native-paper";

import { useAuthStore } from "../store/auth";

const PUBLIC_ROUTES = new Set(["index", "login", "register"]);

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#136F63",
    onPrimary: "#FFFFFF",
    primaryContainer: "#B8F2E6",
    onPrimaryContainer: "#00201B",
    secondary: "#A44A3F",
    background: "#F7F9F7",
    surface: "#FFFFFF",
    surfaceVariant: "#E5ECE9",
    onSurface: "#17211F",
    onSurfaceVariant: "#44514D",
    outline: "#72807B",
  },
};

export default function RootLayout() {
  const hydrated = useAuthStore((state) => state.hydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrate = useAuthStore((state) => state.hydrate);
  const segments = useSegments();
  const currentRoute = segments[0] ?? "index";

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <PaperProvider theme={theme}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" />
        </View>
      </PaperProvider>
    );
  }

  const isPublicRoute = PUBLIC_ROUTES.has(currentRoute);

  return (
    <PaperProvider theme={theme}>
      {!accessToken && !isPublicRoute ? <Redirect href="/login" /> : null}
      {accessToken && isPublicRoute ? <Redirect href="/home" /> : null}
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}
