import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Good to see you 👋</Text>
      <Text style={styles.subtitle}>Your StudyBuddy dashboard will grow here as we build the app.</Text>
      <View style={styles.card}>
        <Text variant="titleLarge">Talk to StudyBuddy</Text>
        <Text style={styles.cardText}>Voice tutoring is coming in the next phase.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 18 },
  title: { fontWeight: "800", marginTop: 24 },
  subtitle: { opacity: 0.7, lineHeight: 22 },
  card: { padding: 22, borderRadius: 20, backgroundColor: "rgba(100,100,100,0.08)", gap: 8 },
  cardText: { opacity: 0.7 },
});
