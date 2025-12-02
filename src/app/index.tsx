import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();

  // Wait for Clerk to load
  if (!isLoaded) {
    return null;
  }

  // Redirect based on auth status
  if (isSignedIn) {
    return <Redirect href="/home" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
