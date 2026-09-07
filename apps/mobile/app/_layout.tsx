import { Redirect, Stack, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { PaperProvider } from "react-native-paper";

import { useAuthStore } from "../store/auth";

const PUBLIC_ROUTES = new Set(["index", "login", "register"]);

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
      <PaperProvider>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" />
        </View>
      </PaperProvider>
    );
  }

  const isPublicRoute = PUBLIC_ROUTES.has(currentRoute);

  return (
    <PaperProvider>
      {!accessToken && !isPublicRoute ? <Redirect href="/login" /> : null}
      {accessToken && isPublicRoute ? <Redirect href="/home" /> : null}
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}
