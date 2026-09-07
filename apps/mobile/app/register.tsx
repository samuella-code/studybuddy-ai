import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";

import { register } from "../services/api";
import { useAuthStore } from "../store/auth";

export default function RegisterScreen() {
  const setSession = useAuthStore((state) => state.setSession);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const response = await register(name.trim(), email.trim(), password);
      setSession(response.user, response.access_token);
      router.replace("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="displaySmall" style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Let's personalize your StudyBuddy experience.</Text>

        <TextInput label="Name" value={name} onChangeText={setName} style={styles.input} />
        <TextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
        <TextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
        <HelperText type="error" visible={Boolean(error)}>{error}</HelperText>

        <Button mode="contained" loading={loading} disabled={loading || !name || !email || !password} onPress={handleRegister} style={styles.button}>
          Create account
        </Button>
        <Button onPress={() => router.replace("/login")}>I already have an account</Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  content: { width: "100%", maxWidth: 520, alignSelf: "center" },
  title: { fontWeight: "800", marginBottom: 8 },
  subtitle: { opacity: 0.7, marginBottom: 28, lineHeight: 22 },
  input: { marginBottom: 12 },
  button: { marginTop: 8, marginBottom: 8, borderRadius: 14, paddingVertical: 5 },
});
