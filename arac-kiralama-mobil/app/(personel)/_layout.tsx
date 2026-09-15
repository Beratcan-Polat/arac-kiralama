import { Tabs } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

const LogoutButton = () => {
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        Alert.alert(
            'Çıkış Yap',
            'Hesabınızdan çıkmak istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Çıkış Yap',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/login' as any);
                    },
                },
            ]
        );
    };

    return (
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#ff3b30" />
        </TouchableOpacity>
    );
};

const HeaderTitle = () => (
    <View style={styles.headerTitle}>
        <FontAwesome5 name="road" size={24} color="#1a73e8" />
        <Text style={styles.headerTitleText}>RotaCar</Text>
        <View style={styles.personelBadge}>
            <Text style={styles.personelBadgeText}>Personel</Text>
        </View>
    </View>
);

export default function PersonelLayout() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#34c759',
                tabBarInactiveTintColor: isDark ? '#888' : '#666',
                tabBarStyle: {
                    backgroundColor: isDark ? '#1c1c1e' : '#fff',
                    borderTopColor: isDark ? '#333' : '#e0e0e0',
                },
                headerStyle: {
                    backgroundColor: isDark ? '#1c1c1e' : '#fff',
                },
                headerTintColor: isDark ? '#fff' : '#333',
                headerTitle: () => <HeaderTitle />,
                headerRight: () => <LogoutButton />,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Panel',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="active"
                options={{
                    title: 'Rezervasyon',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="calendar" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="add-vehicle"
                options={{
                    href: null, // Listeden erişilecek
                }}
            />
            <Tabs.Screen
                name="maintenance"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="return"
                options={{
                    title: 'Teslim Al',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="return-down-back" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="list"
                options={{
                    title: 'Araç Listesi',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="car-sport" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    headerTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitleText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a73e8',
    },
    personelBadge: {
        backgroundColor: '#34c759',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    personelBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    logoutButton: {
        marginRight: 16,
        padding: 8,
    },
});
