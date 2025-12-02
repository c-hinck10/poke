import * as React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState("");

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return;

    // Clear any previous errors
    setError("");

    console.log(emailAddress, password);

    // Start sign-up process using email and password provided
    try {
      await signUp.create({
        emailAddress,
        password,
      });

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setPendingVerification(true);
    } catch (err: any) {
      // See https://clerk.com/docs/guides/development/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));

      // Extract user-friendly error message
      const clerkError = err?.errors?.[0];
      if (clerkError) {
        setError(
          clerkError.longMessage ||
            clerkError.message ||
            "An error occurred during sign-up.",
        );
      } else {
        setError("An error occurred during sign-up. Please try again.");
      }
    }
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;

    // Clear any previous errors
    setError("");

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/home");
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signUpAttempt, null, 2));
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: any) {
      // See https://clerk.com/docs/guides/development/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));

      // Extract user-friendly error message
      const clerkError = err?.errors?.[0];
      if (clerkError) {
        setError(
          clerkError.longMessage ||
            clerkError.message ||
            "An error occurred during verification.",
        );
      } else {
        setError("An error occurred during verification. Please try again.");
      }
    }
  };

  if (pendingVerification) {
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
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>
            Verify your email
          </Text>
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
            value={code}
            placeholder="Enter your verification code"
            onChangeText={(code) => setCode(code)}
            style={{
              padding: 10,
              borderRadius: 5,
              borderWidth: 1,
              borderColor: "gray",
            }}
          />
          <TouchableOpacity
            onPress={onVerifyPress}
            style={{
              padding: 10,
              borderRadius: 5,
              borderWidth: 1,
              borderColor: "gray",
              backgroundColor: "blue",
            }}
          >
            <Text style={{ color: "white" }}>Verify</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
        <Text style={{ fontSize: 24, fontWeight: "bold" }}>Sign up</Text>
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
          onChangeText={(email) => setEmailAddress(email)}
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
          onPress={onSignUpPress}
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
          <Text>Already have an account?</Text>
          <Link href="/sign-in">
            <Text>Sign in</Text>
          </Link>
        </View>
      </View>
    </View>
  );
}
