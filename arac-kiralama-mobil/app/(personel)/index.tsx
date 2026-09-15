import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { personelAPI } from '@/services/api';
import { Duyuru } from '@/types/types';

interface DashboardStats {
    toplamArac: number;
    aktifKiralama: number;
    bakimdakiArac: number;
    onayBekleyen: number; // Add this
    duyurular: Duyuru[];
}

export default function PersonnelDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            fetchDashboard();
        }, [])
    );

    const fetchDashboard = async () => {
        try {
            console.log('Dashboard verisi isteniyor...');
            const response = await personelAPI.dashboard();

            console.log('Dashboard yanıtı:', JSON.stringify(response.data, null, 2));
            setStats(response.data);
        } catch (error: any) {
            console.error('Dashboard hatası:', error);
            if (error.response) {
                console.error('Hata detayı:', error.response.data);
            }
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#1a73e8" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={fetchDashboard} />
            }
        >
            <Text style={styles.welcomeText}>Hoşgeldiniz, Personel 👋</Text>

            {/* Notification Banner */}
            {stats?.onayBekleyen ? (
                <View style={styles.notificationBanner}>
                    <View style={styles.bannerIcon}>
                        <Ionicons name="hourglass-outline" size={24} color="#f57c00" />
                    </View>
                    <View style={styles.bannerContent}>
                        <Text style={styles.bannerTitle}>Onay Bekleyen Araçlarınız Var</Text>
                        <Text style={styles.bannerText}>
                            {stats.onayBekleyen} adet araç yönetici onayı bekliyor. Onaylanana kadar müşteri listesinde görünmeyecekler.
                        </Text>
                    </View>
                    <View style={styles.bannerBadge}>
                        <Text style={styles.bannerBadgeText}>İşlemde</Text>
                    </View>
                </View>
            ) : null}

            {/* İstatistikler */}
            <View style={styles.statsGrid}>
                {/* Sistemdeki Araçlar */}
                <View style={[styles.statCard, { backgroundColor: '#1a73e8' }]}>
                    <View style={styles.statIconContainer}>
                        <Ionicons name="car" size={24} color="#fff" />
                    </View>
                    <View style={styles.statContent}>
                        <Text style={styles.statLabel}>TOPLAM ARAÇ</Text>
                        <Text style={styles.statValue}>{stats?.toplamArac || 0}</Text>
                    </View>
                </View>

                {/* Aktif Kiralamalar */}
                <View style={[styles.statCard, { backgroundColor: '#34a853' }]}>
                    <View style={styles.statIconContainer}>
                        <Ionicons name="calendar" size={24} color="#fff" />
                    </View>
                    <View style={styles.statContent}>
                        <Text style={styles.statLabel}>AKTİF KİRALAMA</Text>
                        <Text style={styles.statValue}>{stats?.aktifKiralama || 0}</Text>
                    </View>
                </View>

                {/* Bakım Bekleyen */}
                <View style={[styles.statCard, { backgroundColor: '#fbbc04' }]}>
                    <View style={styles.statIconContainer}>
                        <Ionicons name="construct" size={24} color="#333" />
                    </View>
                    <View style={styles.statContent}>
                        <Text style={[styles.statLabel, { color: '#333' }]}>BAKIM BEKLEYEN</Text>
                        <Text style={[styles.statValue, { color: '#333' }]}>{stats?.bakimdakiArac || 0}</Text>
                    </View>
                </View>
            </View>

            {/* Hızlı İşlemler */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚡ Hızlı İşlemler</Text>
                <View style={styles.quickAccess}>
                    <TouchableOpacity
                        style={styles.quickItem}
                        onPress={() => router.push('/(personel)/active')}
                    >
                        <View style={[styles.quickIcon, { backgroundColor: '#1a73e8' }]}>
                            <Ionicons name="calendar-outline" size={24} color="#fff" />
                        </View>
                        <Text style={styles.quickLabel}>Rezervasyon</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickItem}
                        onPress={() => router.push('/(personel)/return')}
                    >
                        <View style={[styles.quickIcon, { backgroundColor: '#333' }]}>
                            <Ionicons name="refresh" size={24} color="#fff" />
                        </View>
                        <Text style={styles.quickLabel}>Teslim Al</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickItem}
                        onPress={() => router.push('/(personel)/add-vehicle')}
                    >
                        <View style={[styles.quickIcon, { backgroundColor: '#1a73e8' }]}>
                            <Ionicons name="add" size={24} color="#fff" />
                        </View>
                        <Text style={styles.quickLabel}>Araç Ekle</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickItem}
                        onPress={() => router.push('/(personel)/list')}
                    >
                        <View style={[styles.quickIcon, { backgroundColor: '#34a853' }]}>
                            <Ionicons name="search" size={24} color="#fff" />
                        </View>
                        <Text style={styles.quickLabel}>Araç Listesi</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Duyurular */}
            <View style={[styles.section, { backgroundColor: '#00bcd4', marginBottom: 40 }]}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="megaphone" size={20} color="#fff" />
                    <Text style={[styles.sectionTitle, { color: '#fff' }]}>Duyurular</Text>
                </View>

                {stats?.duyurular && stats.duyurular.length > 0 ? (
                    stats.duyurular.map((duyuru) => (
                        <View key={duyuru.id} style={styles.announcementCard}>
                            <View style={styles.announcementHeader}>
                                <Text style={styles.announcementTitle}>{duyuru.baslik}</Text>
                                <Text style={styles.announcementDate}>
                                    {new Date(duyuru.tarih).toLocaleDateString('tr-TR')}
                                </Text>
                            </View>
                            <Text style={styles.announcementContent}>{duyuru.icerik}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={{ color: '#fff', padding: 10 }}>Henüz duyuru yok.</Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        padding: 16,
        paddingBottom: 8,
    },
    statsGrid: {
        paddingHorizontal: 16,
        gap: 12,
    },
    statCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    statIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statContent: {
        flex: 1,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
        letterSpacing: 0.5,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 2,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    quickAccess: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        gap: 16,
        justifyContent: 'space-between',
    },
    quickItem: {
        alignItems: 'center',
        width: '22%',
    },
    quickIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quickLabel: {
        fontSize: 11,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    announcementCard: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#fff',
    },
    announcementHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    announcementTitle: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    announcementDate: {
        fontSize: 11,
        backgroundColor: '#fff',
        color: '#00bcd4', // Blue text on white badge
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
    announcementContent: {
        color: '#fff',
        fontSize: 13,
    },
    notificationBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fffde7', // Light yellow
        borderWidth: 1,
        borderColor: '#fff59d',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 12,
        borderRadius: 12,
        gap: 12,
    },
    bannerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff9c4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bannerContent: {
        flex: 1,
    },
    bannerTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#f57c00',
        marginBottom: 2,
    },
    bannerText: {
        fontSize: 12,
        color: '#f9a825',
        lineHeight: 16,
    },
    bannerBadge: {
        backgroundColor: '#fbc02d',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    bannerBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
});
