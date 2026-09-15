import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI, personelAPI } from '@/services/api';
import { Kiralama, Bakim, CiroRaporu } from '@/types/types';

interface CiroDetay extends CiroRaporu {
    tamamlanmisKiralamalar?: Kiralama[];
    bakimlar?: Bakim[];
    toplamGider?: number;
    netKar?: number;
}

export default function RevenueScreen() {
    const [data, setData] = useState<CiroDetay | null>(null);
    const [kiralamalar, setKiralamalar] = useState<Kiralama[]>([]);
    const [bakimlar, setBakimlar] = useState<Bakim[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const fetchData = async () => {
        try {
            const ciroResponse = await adminAPI.ciro();
            const ciroData = ciroResponse.data;

            // Verileri güncelle
            setData({
                ...ciroData,
                toplamGider: ciroData.toplamGider || 0,
                netKar: (ciroData.toplamCiro || 0) - (ciroData.toplamGider || 0),
            });

            // Tamamlanmış kiralamalar
            if (ciroData.tamamlanmisKiralamalar) {
                setKiralamalar(ciroData.tamamlanmisKiralamalar);
            }

            // Bakımlar (Backend artık tüm bakımları döndürüyor)
            if (ciroData.bakimlar) {
                setBakimlar(ciroData.bakimlar);
            }
        } catch (error) {
            console.error('Ciro yükleme hatası:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const formatNumber = (num: number) => {
        return num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#1a73e8" />
            </View>
        );
    }

    const toplamGelir = data?.toplamCiro || 0;
    const toplamGider = data?.toplamGider || 0;
    const netKar = toplamGelir - toplamGider;

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={fetchData} />
            }
        >
            {/* 3 Özet Kart */}
            <View style={styles.summaryCards}>
                {/* Toplam Gelir */}
                <View style={[styles.summaryCard, { backgroundColor: '#34a853' }]}>
                    <View style={styles.cardIconRow}>
                        <Ionicons name="trending-up" size={24} color="#fff" />
                    </View>
                    <Text style={styles.cardLabel}>TOPLAM GELİR</Text>
                    <Text style={styles.cardValue}>₺ {formatNumber(toplamGelir)}</Text>
                </View>

                {/* Toplam Gider */}
                <View style={[styles.summaryCard, { backgroundColor: '#ea4335' }]}>
                    <View style={styles.cardIconRow}>
                        <Ionicons name="trending-down" size={24} color="#fff" />
                    </View>
                    <Text style={styles.cardLabel}>TOPLAM GİDER</Text>
                    <Text style={styles.cardValue}>₺ {formatNumber(toplamGider)}</Text>
                </View>

                {/* Net Kar */}
                <View style={[styles.summaryCard, { backgroundColor: '#00bcd4' }]}>
                    <View style={styles.cardIconRow}>
                        <Ionicons name="wallet" size={24} color="#fff" />
                    </View>
                    <Text style={styles.cardLabel}>NET KAR</Text>
                    <Text style={styles.cardValue}>₺ {formatNumber(netKar)}</Text>
                </View>
            </View>

            {/* Gelir Listesi */}
            <View style={styles.section}>
                <View style={[styles.sectionHeader, { backgroundColor: '#34a853' }]}>
                    <Ionicons name="cash" size={18} color="#fff" />
                    <Text style={styles.sectionTitle}>Gelir Listesi (Tamamlanmış Kiralamalar)</Text>
                </View>

                <View style={styles.tableContainer}>
                    {/* Tablo Başlığı */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>#</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Müşteri</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Araç</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Toplam</Text>
                    </View>

                    {kiralamalar.length > 0 ? (
                        kiralamalar.map((kiralama, index) => (
                            <View key={kiralama.id} style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
                                <Text style={[styles.tableCell, { flex: 0.5 }]}>{index + 1}</Text>
                                <Text style={[styles.tableCell, { flex: 1.5, color: '#1a73e8' }]}>
                                    {kiralama.kullanici?.ad || 'Müşteri'}
                                </Text>
                                <Text style={[styles.tableCell, { flex: 1.5 }]}>
                                    {kiralama.arac?.marka} {kiralama.arac?.model}
                                </Text>
                                <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>
                                    {formatNumber((kiralama.toplamFiyat || 0) + (kiralama.ekUcret || 0))} TL
                                </Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyRow}>
                            <Text style={styles.emptyText}>Tamamlanmış kiralama bulunamadı</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Gider Listesi */}
            <View style={styles.section}>
                <View style={[styles.sectionHeader, { backgroundColor: '#ea4335' }]}>
                    <Ionicons name="construct" size={18} color="#fff" />
                    <Text style={styles.sectionTitle}>Gider Listesi (Bakım Masrafları)</Text>
                </View>

                <View style={styles.tableContainer}>
                    {/* Tablo Başlığı */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>#</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Araç</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Açıklama</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Masraf</Text>
                    </View>

                    {bakimlar.length > 0 ? (
                        bakimlar.map((bakim, index) => (
                            <View key={bakim.id} style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
                                <Text style={[styles.tableCell, { flex: 0.5 }]}>{index + 1}</Text>
                                <Text style={[styles.tableCell, { flex: 1.5, color: '#1a73e8' }]}>
                                    {bakim.arac?.marka} {bakim.arac?.model}
                                </Text>
                                <Text style={[styles.tableCell, { flex: 1.5 }]} numberOfLines={1}>
                                    {bakim.aciklama}
                                </Text>
                                <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold', color: '#ea4335' }]}>
                                    {formatNumber(bakim.masraf || 0)} TL
                                </Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyRow}>
                            <Text style={styles.emptyText}>Bakım kaydı bulunamadı</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={{ height: 40 }} />
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
    summaryCards: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingTop: 16,
        gap: 8,
    },
    summaryCard: {
        flex: 1,
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    cardIconRow: {
        marginBottom: 4,
    },
    cardLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
        letterSpacing: 0.5,
    },
    cardValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 4,
    },
    section: {
        marginTop: 16,
        marginHorizontal: 12,
        backgroundColor: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#fff',
    },
    tableContainer: {
        padding: 0,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tableHeaderCell: {
        fontSize: 11,
        fontWeight: '600',
        color: '#666',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    tableRowAlt: {
        backgroundColor: '#fafafa',
    },
    tableCell: {
        fontSize: 12,
        color: '#333',
    },
    emptyRow: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 13,
        color: '#999',
    },
});
