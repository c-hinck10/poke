import { Tabs, Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  // Wait until Clerk finishes loading the session state
  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    // If they aren't signed in, send them to the sign-in page
    return <Redirect href="/sign-in" />;
  }

  // Otherwise, render the tabs normally
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      {/* Your Tabs.Screen definitions for home, profile, poke */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="poke"
        options={{
          title: "Poke",
          tabBarLabel: "Poke",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="paw" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
