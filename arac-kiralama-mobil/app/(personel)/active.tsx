import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { personelAPI } from '@/services/api';
import { Kiralama } from '@/types/types';
import { useRouter } from 'expo-router';

export default function RezervasyonlarScreen() {
    const [rezervasyonlar, setRezervasyonlar] = useState<Kiralama[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchRezervasyonlar();
    }, []);

    const fetchRezervasyonlar = async () => {
        try {
            const response = await personelAPI.rezervasyonlar();
            setRezervasyonlar(response.data);
        } catch (error) {
            console.error('Rezervasyon yükleme hatası:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const handleTeslimEt = (kiralama: Kiralama) => {
        Alert.alert(
            'Araç Teslimi',
            `${kiralama.arac?.plaka} plakalı aracı müşteriye teslim etmek istiyor musunuz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Teslim Et',
                    onPress: async () => {
                        try {
                            await personelAPI.teslimEt(kiralama.id);
                            Alert.alert('Başarılı', 'Araç teslim edildi.');
                            fetchRezervasyonlar();
                        } catch (error: any) {
                            Alert.alert('Hata', error.response?.data?.hata || 'Teslim işlemi başarısız');
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: Kiralama }) => (
        <View style={styles.card}>
            {/* Header - Mavi Arkaplan */}
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                    {item.arac?.marka} {item.arac?.model}
                </Text>
                <View style={styles.plateContainer}>
                    <Text style={styles.plateText}>{item.arac?.plaka}</Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                {/* Müşteri ve Tutar Satırı */}
                <View style={styles.row}>
                    <View>
                        <Text style={styles.label}>Müşteri</Text>
                        <Text style={styles.value}>{item.kullanici?.ad}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.label}>Tutar</Text>
                        <Text style={styles.priceValue}>{item.toplamFiyat ? `${item.toplamFiyat} ₺` : 'Hesaplanıyor'}</Text>
                    </View>
                </View>

                {/* Ayırıcı Çizgi */}
                <View style={styles.divider} />

                {/* Tarih Satırı */}
                <View style={styles.row}>
                    <View>
                        <Text style={styles.label}>Alış Tarihi</Text>
                        <Text style={styles.dateValue}>{item.alisTarihi}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.label}>İade Tarihi</Text>
                        <Text style={styles.dateValue}>{item.iadeTarihi}</Text>
                    </View>
                </View>
            </View>

            {/* Teslim Et Butonu */}
            <TouchableOpacity
                style={styles.deliverButton}
                onPress={() => handleTeslimEt(item)}
            >
                <Ionicons name="key" size={20} color="#fff" />
                <Text style={styles.deliverButtonText}>Aracı Müşteriye Teslim Et</Text>
            </TouchableOpacity>
        </View>
    );

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#00bcd4" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={rezervasyonlar}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchRezervasyonlar} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={60} color="#ccc" />
                        <Text style={styles.emptyText}>Bekleyen rezervasyon yok</Text>
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
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#eee',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#00bcd4', // Turkuaz/Mavi
        padding: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    plateContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    plateText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#00bcd4',
    },
    cardBody: {
        padding: 16,
        paddingBottom: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    label: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    priceValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2e7d32', // Yeşil
    },
    dateValue: {
        fontSize: 16,
        fontWeight: '500',
        color: '#555',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginBottom: 12,
    },
    deliverButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0d6efd', // Koyu Mavi Buton
        padding: 16,
        gap: 10,
        margin: 16,
        marginTop: 0,
        borderRadius: 8,
    },
    deliverButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
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
});
