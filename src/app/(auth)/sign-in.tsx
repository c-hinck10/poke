import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import React from "react";

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return;

    // Clear any previous errors
    setError("");

    // Validate inputs
    if (!emailAddress.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!password) {
      setError("Please enter your password");
      return;
    }

    // Start the sign-in process using the email and password provided
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/home");
      } else {
        // If the status isn't complete, check why. User might need to
        // complete further steps.
        console.error("Sign-in incomplete, status:", signInAttempt.status);
        setError("Sign-in incomplete. Please try again.");
      }
    } catch (err: any) {
      // See https://clerk.com/docs/guides/development/custom-flows/error-handling
      // for more info on error handling
      console.error("Sign-in error:", err);

      // Extract user-friendly error message
      const clerkError = err?.errors?.[0];
      if (clerkError) {
        setError(
          clerkError.longMessage ||
            clerkError.message ||
            "An error occurred during sign-in.",
        );
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError("An error occurred during sign-in. Please try again.");
      }
    }
  };

  return (
    <View
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        gap: 20,
      }}
    >
      <View
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          borderStyle: "solid",
          borderColor: "black",
          borderWidth: 1,
          borderRadius: 10,
          padding: 20,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "white",
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "bold" }}>Sign in</Text>
        {error ? (
          <View
            style={{
              backgroundColor: "#fee",
              padding: 10,
              borderRadius: 5,
              borderWidth: 1,
              borderColor: "#fcc",
            }}
          >
            <Text style={{ color: "#c00" }}>{error}</Text>
          </View>
        ) : null}
        <TextInput
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Enter email"
          onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
          style={{
            padding: 10,
            borderRadius: 5,
            borderWidth: 1,
            borderColor: "gray",
          }}
        />
        <TextInput
          value={password}
          placeholder="Enter password"
          secureTextEntry={true}
          onChangeText={(password) => setPassword(password)}
          style={{
            padding: 10,
            borderRadius: 5,
            borderWidth: 1,
            borderColor: "gray",
          }}
        />
        <TouchableOpacity
          onPress={onSignInPress}
          style={{
            padding: 10,
            borderRadius: 5,
            borderWidth: 1,
            borderColor: "gray",
            backgroundColor: "blue",
          }}
        >
          <Text style={{ color: "white" }}>Continue</Text>
        </TouchableOpacity>
        <View style={{ display: "flex", flexDirection: "row", gap: 3 }}>
          <Text>Don&apos;t have an account?</Text>
          <Link href="/sign-up">
            <Text>Sign up</Text>
          </Link>
        </View>
      </View>
    </View>
  );
}
