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
        <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
    </View>
);

export default function AdminLayout() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#1a73e8',
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
                        <Ionicons name="stats-chart" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="vehicles"
                options={{
                    title: 'Araçlar',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="car" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="users"
                options={{
                    title: 'Kullanıcılar',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="pricing"
                options={{
                    title: 'Fiyatlar',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="pricetags" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="announcements"
                options={{
                    title: 'Duyurular',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="megaphone" size={size} color={color} />
                    ),
                }}
            />
            {/* Profile sayfasını gizle */}
            <Tabs.Screen
                name="profile"
                options={{
                    href: null,
                }}
            />
            {/* Ciro raporu sayfası - tab'da görünmez */}
            <Tabs.Screen
                name="revenue"
                options={{
                    href: null,
                    headerShown: true,
                    headerTitle: () => <Text style={styles.revenueTitle}>Ciro Raporu</Text>,
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
    adminBadge: {
        backgroundColor: '#ff3b30',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    adminBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    logoutButton: {
        marginRight: 16,
        padding: 8,
    },
    revenueTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
});
