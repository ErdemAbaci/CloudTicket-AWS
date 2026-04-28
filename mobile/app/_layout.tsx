import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { Amplify } from 'aws-amplify';
import { signIn } from 'aws-amplify/auth';
import { Authenticator } from '@aws-amplify/ui-react-native';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.EXPO_PUBLIC_USER_POOL_ID || '',
      userPoolClientId: process.env.EXPO_PUBLIC_USER_POOL_CLIENT_ID || '',
      loginWith: {
        email: true,
      },
    },
  },
});

const authServices = {
  async handleSignIn(input: Parameters<typeof signIn>[0]) {
    return signIn({
      ...input,
      options: {
        ...input.options,
        authFlowType: 'USER_PASSWORD_AUTH',
      },
    });
  },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <Authenticator.Provider>
      <Authenticator loginMechanisms={['email']} services={authServices}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </Authenticator>
    </Authenticator.Provider>
  );
}
