import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="run/[runId]"
        options={{
          headerShown: true,
          title: "Run Details",
        }}
      />
      <Stack.Screen
        name="run/pokedex/[runId]"
        options={{
          headerShown: true,
          title: "Pokédex",
        }}
      />
      <Stack.Screen
        name="run/party/[runId]"
        options={{
          headerShown: true,
          title: "Party",
        }}
      />
    </Stack>
  );
}
