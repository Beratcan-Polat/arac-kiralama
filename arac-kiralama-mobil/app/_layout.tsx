import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log('Auth state:', { isAuthenticated, isLoading, user: user?.rol, segment: segments[0] });

    if (isLoading) return;

    const currentSegment = segments[0] as string;
    const inLoginPage = currentSegment === 'login' || currentSegment === 'register';
    const inRoleBasedPage = currentSegment === '(admin)' || currentSegment === '(personel)' || currentSegment === '(musteri)';
    const inSharedPage = currentSegment === 'rent' || currentSegment === 'car';

    console.log('Navigation check:', { inLoginPage, inRoleBasedPage, inSharedPage, isAuthenticated, role: user?.rol });

    if (!isAuthenticated && !inLoginPage) {
      console.log('Redirecting to login...');
      router.replace('/login' as any);
    } else if (isAuthenticated && !inRoleBasedPage && !inSharedPage) {
      // Giriş yapmış ama henüz rol sayfasında değil, yönlendir
      console.log('Redirecting based on role:', user?.rol);
      if (user?.rol === 'ADMIN') {
        router.replace('/(admin)' as any);
      } else if (user?.rol === 'PERSONEL') {
        router.replace('/(personel)' as any);
      } else {
        router.replace('/(musteri)' as any);
      }
    }
  }, [isAuthenticated, isLoading, segments, user]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ animation: 'none' }} />
        <Stack.Screen name="register" options={{ animation: 'none' }} />
        <Stack.Screen name="(musteri)" />
        <Stack.Screen name="(personel)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="car/[id]" options={{ headerShown: true, title: 'Araç Detayı' }} />
        <Stack.Screen name="rent" options={{ headerShown: true, title: 'Kiralama' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
