import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const SUBJECTS_KEY = "studybuddy_subjects";

export async function saveSubjects(subjects: string[]): Promise<void> {
  const value = JSON.stringify(subjects);
  if (Platform.OS === "web") {
    localStorage.setItem(SUBJECTS_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(SUBJECTS_KEY, value);
}

export async function loadSubjects(): Promise<string[]> {
  const value = Platform.OS === "web"
    ? localStorage.getItem(SUBJECTS_KEY)
    : await SecureStore.getItemAsync(SUBJECTS_KEY);

  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string")
      ? parsed
      : [];
  } catch {
    return [];
  }
}

export async function clearSubjects(): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(SUBJECTS_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(SUBJECTS_KEY);
}
