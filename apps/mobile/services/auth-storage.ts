import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "studybuddy_access_token";
const USER_KEY = "studybuddy_user";

export async function saveSession(token: string, user: unknown) {
  const serializedUser = JSON.stringify(user);
  if (Platform.OS === "web") {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, serializedUser);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, serializedUser);
}

export async function loadSession(): Promise<{ token: string; user: { id: string; email: string; name: string } } | null> {
  let token: string | null;
  let serializedUser: string | null;
  if (Platform.OS === "web") {
    token = localStorage.getItem(TOKEN_KEY);
    serializedUser = localStorage.getItem(USER_KEY);
  } else {
    token = await SecureStore.getItemAsync(TOKEN_KEY);
    serializedUser = await SecureStore.getItemAsync(USER_KEY);
  }
  if (!token || !serializedUser) return null;
  try {
    return { token, user: JSON.parse(serializedUser) };
  } catch {
    return null;
  }
}

export async function clearStoredSession() {
  if (Platform.OS === "web") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}
