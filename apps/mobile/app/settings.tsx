import { router } from "expo-router";
import { useColorScheme } from "react-native";
import { Button, Card, Text } from "react-native-paper";

export default function SettingsScreen() {
  const scheme = useColorScheme();
  return <Card style={{ margin: 20, borderRadius: 20 }}><Card.Content>
    <Button icon="arrow-left" onPress={() => router.back()} compact>Back</Button>
    <Text variant="headlineMedium" style={{ fontWeight: "800", marginTop: 8 }}>Settings</Text>
    <Text style={{ opacity: 0.68, marginTop: 6, lineHeight: 22 }}>StudyBuddy follows your device appearance automatically.</Text>
    <Text variant="titleMedium" style={{ marginTop: 24 }}>Appearance</Text>
    <Text style={{ marginTop: 6 }}>Current mode: {scheme === "dark" ? "Dark" : "Light"}</Text>
    <Button mode="outlined" icon="account" onPress={() => router.push("/profile")} style={{ marginTop: 20 }}>Learning profile</Button>
    <Button mode="outlined" icon="shield-check" onPress={() => undefined} style={{ marginTop: 10 }}>Privacy & security</Button>
  </Card.Content></Card>;
}
