import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function PersonelProfileScreen() {
    const { user, logout } = useAuth();
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
        <ScrollView style={styles.container}>
            {/* Profil Kartı */}
            <View style={styles.profileCard}>
                <View style={styles.avatarContainer}>
                    <Ionicons name="person-circle" size={80} color="#34c759" />
                </View>
                <Text style={styles.userName}>{user?.ad || 'Personel'}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
                <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>Personel</Text>
                </View>
            </View>

            {/* Menü */}
            <View style={styles.menuSection}>
                <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={24} color="#ff3b30" />
                    <Text style={[styles.menuItemText, { color: '#ff3b30' }]}>Çıkış Yap</Text>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    profileCard: {
        backgroundColor: '#fff',
        margin: 16,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    avatarContainer: {
        marginBottom: 12,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    roleBadge: {
        backgroundColor: '#e8f5e9',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
        marginTop: 12,
    },
    roleText: {
        color: '#388e3c',
        fontWeight: '600',
    },
    menuSection: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    menuItemText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
});
