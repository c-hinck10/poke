import { Stack } from "expo-router";

export default function StackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="[pokeId]"
        options={{
          headerShown: true,
          headerTitle: "",
        }}
      />
    </Stack>
  );
}
