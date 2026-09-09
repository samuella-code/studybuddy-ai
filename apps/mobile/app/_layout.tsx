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
    primary: "#7C3AED",
    onPrimary: "#FFFFFF",
    primaryContainer: "#EDE9FE",
    onPrimaryContainer: "#2E1065",
    secondary: "#111111",
    onSecondary: "#FFFFFF",
    secondaryContainer: "#EDEDED",
    onSecondaryContainer: "#111111",
    background: "#FAF9FC",
    surface: "#FFFFFF",
    surfaceVariant: "#F0EDF3",
    onSurface: "#111111",
    onSurfaceVariant: "#625E6B",
    outline: "#8A8593",
  },
};

export default function RootLayout() {
  const hydrated = useAuthStore(s => s.hydrated);
  const accessToken = useAuthStore(s => s.accessToken);
  const hydrate = useAuthStore(s => s.hydrate);
  const segments = useSegments();
  const currentRoute = segments[0] ?? "index";

  useEffect(() => { void hydrate(); }, [hydrate]);

  if (!hydrated) return <PaperProvider theme={theme}><View style={{flex:1,alignItems:"center",justifyContent:"center",backgroundColor:"#FAF9FC"}}><ActivityIndicator size="large" color="#7C3AED" /></View></PaperProvider>;

  const isPublicRoute = PUBLIC_ROUTES.has(currentRoute);
  return <PaperProvider theme={theme}>
    {!accessToken && !isPublicRoute ? <Redirect href="/login" /> : null}
    {accessToken && isPublicRoute ? <Redirect href="/home" /> : null}
    <Stack screenOptions={{headerShown:false}} />
  </PaperProvider>;
}
