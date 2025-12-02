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
import { Stack, SplashScreen, useRootNavigationState } from "expo-router";
import { useEffect } from "react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

// Keep the splash screen visible while we fetch the session
SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const { isLoaded } = useAuth();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Hide splash screen once Clerk is loaded and navigation is ready
    if (isLoaded && navigationState?.key) {
      SplashScreen.hideAsync();
    }
  }, [isLoaded, navigationState]);

  // While Clerk is loading the session, keep showing splash screen
  if (!isLoaded) {
    return null;
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
