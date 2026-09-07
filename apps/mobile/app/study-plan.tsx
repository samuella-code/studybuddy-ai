import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Chip, Text } from "react-native-paper";

const PLAN = [
  { day: "Today", subject: "Mathematics", topic: "Quadratic equations", minutes: 30 },
  { day: "Tomorrow", subject: "Biology", topic: "Cell structure", minutes: 25 },
  { day: "Wednesday", subject: "Computer Science", topic: "Data structures", minutes: 35 },
  { day: "Thursday", subject: "Chemistry", topic: "Chemical bonding", minutes: 30 },
];

export default function StudyPlanScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Button icon="arrow-left" onPress={() => router.back()} compact>Back</Button>
        <Text variant="headlineMedium" style={styles.title}>Your study plan</Text>
        <Text style={styles.subtitle}>A simple weekly rhythm you can adjust as you learn.</Text>

        <Card style={styles.summary} mode="contained">
          <Card.Content>
            <Text variant="titleMedium" style={styles.bold}>This week</Text>
            <Text style={styles.muted}>4 planned sessions · 120 minutes</Text>
            <View style={styles.chips}>
              <Chip icon="target">Build consistency</Chip>
              <Chip icon="clock-outline">30 min average</Chip>
            </View>
          </Card.Content>
        </Card>

        {PLAN.map((item) => (
          <Card key={item.day} style={styles.card}>
            <Card.Content>
              <View style={styles.row}>
                <View style={styles.copy}>
                  <Text variant="labelLarge">{item.day}</Text>
                  <Text variant="titleMedium" style={styles.bold}>{item.subject}</Text>
                  <Text style={styles.muted}>{item.topic}</Text>
                </View>
                <Chip icon="clock-outline">{item.minutes} min</Chip>
              </View>
            </Card.Content>
          </Card>
        ))}

        <Button mode="contained" icon="plus" onPress={() => {}} style={styles.button}>Add study session</Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  content: { width: "100%", maxWidth: 820, alignSelf: "center", gap: 12 },
  title: { fontWeight: "800", marginTop: 4 },
  subtitle: { opacity: 0.68, lineHeight: 22, marginBottom: 8 },
  summary: { borderRadius: 20, marginBottom: 4 },
  card: { borderRadius: 18 },
  bold: { fontWeight: "800" },
  muted: { opacity: 0.68, marginTop: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  copy: { flex: 1 },
  button: { borderRadius: 14, marginTop: 8 },
});
