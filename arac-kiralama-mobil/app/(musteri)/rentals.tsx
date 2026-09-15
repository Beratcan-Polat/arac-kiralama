import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { kiralamaAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Kiralama } from '@/types/types';

export default function RentalsScreen() {
    const [kiralamalar, setKiralamalar] = useState<Kiralama[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (user?.id) {
            fetchKiralamalar();
        }
    }, [user]);

    const fetchKiralamalar = async () => {
        try {
            const response = await kiralamaAPI.gecmisKiralamalar(user!.id);
            setKiralamalar(response.data);
        } catch (error) {
            console.error('Kiralama yükleme hatası:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchKiralamalar();
    };

    const handleCancel = async (id: number) => {
        Alert.alert(
            'Rezervasyonu İptal Et',
            'Bu rezervasyonu iptal etmek istediğinize emin misiniz?',
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'İptal Et',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await kiralamaAPI.kiralamaIptal(id);
                            Alert.alert('Başarılı', 'Rezervasyon iptal edildi.');
                            fetchKiralamalar(); // Listeyi yenile
                        } catch (error: any) {
                            Alert.alert('Hata', error.response?.data || 'İptal işlemi başarısız.');
                        }
                    }
                }
            ]
        );
    };

    const getDurumBadge = (durum: string) => {
        const styles: { [key: string]: { bg: string; text: string; label: string } } = {
            'REZERVE': { bg: '#e3f2fd', text: '#1976d2', label: 'Rezerve' },
            'TESLIM_EDILDI': { bg: '#fff3e0', text: '#f57c00', label: 'Kirada' },
            'TESLIM_ALINDI': { bg: '#e8f5e9', text: '#388e3c', label: 'Tamamlandı' },
            'IPTAL': { bg: '#ffebee', text: '#d32f2f', label: 'İptal' },
        };
        return styles[durum] || { bg: '#f5f5f5', text: '#666', label: durum };
    };

    const renderKiralamaCard = ({ item }: { item: Kiralama }) => {
        const badge = getDurumBadge(item.durum);
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>
                        {item.arac?.marka} {item.arac?.model}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={16} color="#666" />
                        <Text style={styles.infoText}>
                            {item.alisTarihi} - {item.iadeTarihi}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="cash-outline" size={16} color="#666" />
                        <Text style={styles.infoText}>₺{item.toplamFiyat}</Text>
                    </View>
                    {item.gecikmeGunSayisi > 0 && (
                        <View style={styles.infoRow}>
                            <Ionicons name="warning-outline" size={16} color="#f57c00" />
                            <Text style={[styles.infoText, { color: '#f57c00' }]}>
                                {item.gecikmeGunSayisi} gün gecikme (+₺{item.ekUcret})
                            </Text>
                        </View>
                    )}
                </View>

                {item.durum === 'REZERVE' && (
                    <View style={styles.cardFooter}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => handleCancel(item.id)}
                        >
                            <Text style={styles.cancelButtonText}>Rezervasyonu İptal Et</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={kiralamalar}
                renderItem={renderKiralamaCard}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={60} color="#ccc" />
                        <Text style={styles.emptyText}>Henüz kiralama geçmişiniz yok</Text>
                    </View>
                }
            />
        </View>
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
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    cardBody: {
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        color: '#999',
    },
    cardFooter: {
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 12,
    },
    cancelButton: {
        backgroundColor: '#ffebee',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#d32f2f',
        fontSize: 14,
        fontWeight: '600',
    },
});
