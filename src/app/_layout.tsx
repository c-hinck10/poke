// import { ClerkProvider } from "@clerk/clerk-expo";
// import { tokenCache } from "@clerk/clerk-expo/token-cache";
// import { Slot } from "expo-router";
// import "@/src/utils/global.css";

// export default function RootLayout() {
//   return (
//     <ClerkProvider tokenCache={tokenCache}>
//       <Slot />
//     </ClerkProvider>
//   );
// }

import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import {
  Stack,
  router,
  SplashScreen,
  useSegments,
  useRootNavigationState,
} from "expo-router";
import { useEffect, useState } from "react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

// Keep the splash screen visible while we fetch the session
SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    if (!isLoaded || !navigationState?.key) return;

    const inAuthGroup = segments[0] === "(auth)";

    // Only navigate if we haven't navigated yet
    if (!hasNavigated) {
      if (!isSignedIn && !inAuthGroup) {
        // User is not signed in and trying to access protected route
        router.replace("/(auth)/sign-in");
        setHasNavigated(true);
      } else if (isSignedIn && inAuthGroup) {
        // User is signed in but on auth page
        router.replace("/home");
        setHasNavigated(true);
      } else if (isSignedIn && segments.length === 0) {
        // User is signed in but at root with no segments (initial load)
        router.replace("/home");
        setHasNavigated(true);
      }
    }
  }, [isLoaded, isSignedIn, segments, navigationState, hasNavigated]);

  // While Clerk is loading the session, show nothing or a splash screen
  if (!isLoaded) {
    return null; // Or return a loading indicator
  }

  // This Stack manages which *group* is visible
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <ClerkProvider
      tokenCache={tokenCache}
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <InitialLayout />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
