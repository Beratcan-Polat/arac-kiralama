import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { adminAPI, aracAPI, personelAPI } from '@/services/api';
import { CiroRaporu, Bakim } from '@/types/types';

interface Istatistikler {
    toplamArac: number;
    aktifKiralama: number;
    bakimBekleyen: number;
    toplamGelir: number;
}

export default function AdminDashboardScreen() {
    const [ciro, setCiro] = useState<CiroRaporu | null>(null);
    const [stats, setStats] = useState<Istatistikler>({
        toplamArac: 0,
        aktifKiralama: 0,
        bakimBekleyen: 0,
        toplamGelir: 0,
    });
    const [maintenanceList, setMaintenanceList] = useState<Bakim[]>([]);
    const [pendingVehicles, setPendingVehicles] = useState<any[]>([]); // Onay bekleyenler
    const [selectedBakim, setSelectedBakim] = useState<Bakim | null>(null);
    const [cost, setCost] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const fetchData = async () => {
        try {
            // Paralel veri çekimi
            const [ciroResponse, araclarResponse, bakimlarResponse, pendingResponse] = await Promise.all([
                adminAPI.ciro(),
                aracAPI.tumAraclar(),
                personelAPI.bakimlar(),
                adminAPI.onayBekleyenAraclar()
            ]);

            setCiro(ciroResponse.data);
            const araclar = Array.isArray(araclarResponse.data) ? araclarResponse.data : [];
            setMaintenanceList(Array.isArray(bakimlarResponse.data) ? bakimlarResponse.data : []);
            setPendingVehicles(Array.isArray(pendingResponse.data) ? pendingResponse.data : []);

            // İstatistikleri hesapla
            const toplamArac = araclar.length;
            const bakimBekleyen = araclar.filter((a: any) => a.durum === 'BAKIMDA').length;
            const aktifKiralama = araclar.filter((a: any) => a.durum === 'KIRADA').length;

            setStats({
                toplamArac,
                aktifKiralama,
                bakimBekleyen,
                toplamGelir: ciroResponse.data?.toplamCiro || 0,
            });
        } catch (error) {
            console.error('Dashboard veri yükleme hatası:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const handleCompleteMaintenance = async () => {
        if (!selectedBakim || !cost) {
            Alert.alert('Hata', 'Lütfen masraf tutarını giriniz');
            return;
        }

        setIsSubmitting(true);
        try {
            await personelAPI.bakimTamamla(selectedBakim.id, parseFloat(cost));
            Alert.alert('Başarılı', 'Araç bakımı tamamlandı ve hizmete sunuldu');
            setModalVisible(false);
            setCost('');
            setSelectedBakim(null);
            fetchData(); // Listeyi yenile
        } catch (error: any) {
            Alert.alert('Hata', error.message || 'Bakım tamamlanamadı');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApprove = async (id: number) => {
        try {
            await adminAPI.aracOnayla(id);
            Alert.alert('Başarılı', 'Araç onaylandı ve hizmete alındı.');
            fetchData();
        } catch (error: any) {
            Alert.alert('Hata', 'Onaylama işlemi başarısız');
        }
    };

    const handleReject = async (id: number) => {
        Alert.alert(
            'Araç Reddet',
            'Bu aracı reddetmek (silmek) istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Reddet',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await adminAPI.aracReddet(id);
                            fetchData();
                        } catch (error: any) {
                            Alert.alert('Hata', 'Reddetme işlemi başarısız');
                        }
                    },
                },
            ]
        );
    };

    const openCompleteModal = (bakim: Bakim) => {
        setSelectedBakim(bakim);
        setCost('');
        setModalVisible(true);
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const formatNumber = (num: number) => {
        return num.toLocaleString('tr-TR');
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
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <Text style={styles.welcomeText}>Hoşgeldiniz, Yönetici 👋</Text>

            {/* İstatistik Kartları - Web benzeri */}
            <View style={styles.statsGrid}>
                {/* Toplam Araç */}
                <View style={[styles.statCard, { backgroundColor: '#1a73e8' }]}>
                    <View style={styles.statIconContainer}>
                        <Ionicons name="car" size={24} color="#fff" />
                    </View>
                    <View style={styles.statContent}>
                        <Text style={styles.statLabel}>TOPLAM ARAÇ</Text>
                        <Text style={styles.statValue}>{stats.toplamArac}</Text>
                    </View>
                </View>

                {/* Aktif Kiralama */}
                <View style={[styles.statCard, { backgroundColor: '#34a853' }]}>
                    <View style={styles.statIconContainer}>
                        <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    </View>
                    <View style={styles.statContent}>
                        <Text style={styles.statLabel}>AKTİF KİRALAMA</Text>
                        <Text style={styles.statValue}>{stats.aktifKiralama}</Text>
                    </View>
                </View>

                {/* Bakım Bekleyen */}
                <View style={[styles.statCard, { backgroundColor: '#fbbc04' }]}>
                    <View style={styles.statIconContainer}>
                        <Ionicons name="construct" size={24} color="#333" />
                    </View>
                    <View style={styles.statContent}>
                        <Text style={[styles.statLabel, { color: '#333' }]}>BAKIM BEKLEYEN</Text>
                        <Text style={[styles.statValue, { color: '#333' }]}>{stats.bakimBekleyen}</Text>
                    </View>
                </View>

                {/* Toplam Gelir - Tıklanabilir */}
                <TouchableOpacity
                    style={[styles.statCard, { backgroundColor: '#ea4335' }]}
                    onPress={() => router.push('/(admin)/revenue' as any)}
                >
                    <View style={styles.statIconContainer}>
                        <Ionicons name="cash" size={24} color="#fff" />
                    </View>
                    <View style={styles.statContent}>
                        <Text style={styles.statLabel}>TOPLAM GELİR</Text>
                        <Text style={styles.statValue}>₺{formatNumber(stats.toplamGelir)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" style={styles.chevron} />
                </TouchableOpacity>
            </View>

            {/* Onay Bekleyen Araçlar */}
            {pendingVehicles.length > 0 && (
                <View style={styles.section}>
                    <View style={[styles.sectionHeader, { backgroundColor: '#f9a825' }]}>
                        <Ionicons name="time" size={18} color="#fff" />
                        <Text style={styles.sectionTitleSmall}>Onay Bekleyen Araçlar</Text>
                    </View>
                    <View style={styles.tableContainer}>
                        {/* Tablo Başlığı */}
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Araç</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Plaka</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center' }]}>İşlemler</Text>
                        </View>
                        {pendingVehicles.map((arac, index) => (
                            <View key={arac.id} style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
                                <Text style={[styles.tableCell, { flex: 1.5, color: '#333' }]}>
                                    {arac.marka} {arac.model}
                                </Text>
                                <Text style={[styles.tableCell, { flex: 0.8 }]}>{arac.plaka}</Text>
                                <View style={{ flex: 1.2, flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.approveButton]}
                                        onPress={() => handleApprove(arac.id)}
                                    >
                                        <Ionicons name="checkmark" size={16} color="#fff" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.rejectButton]}
                                        onPress={() => handleReject(arac.id)}
                                    >
                                        <Ionicons name="close" size={16} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Bakım Bekleyen Araçlar Listesi */}
            {maintenanceList.length > 0 && (
                <View style={styles.section}>
                    <View style={[styles.sectionHeader, { backgroundColor: '#dc3545' }]}>
                        <Ionicons name="construct" size={18} color="#fff" />
                        <Text style={styles.sectionTitleSmall}>Bakım/Hasar Gören Araçlar</Text>
                    </View>
                    <View style={styles.tableContainer}>
                        {/* Tablo Başlığı */}
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Araç</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Plaka</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Açıklama</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>İşlem</Text>
                        </View>
                        {maintenanceList.map((bakim, index) => (
                            <View key={bakim.id} style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
                                <Text style={[styles.tableCell, { flex: 1.5, color: '#1a73e8' }]}>
                                    {bakim.arac?.marka} {bakim.arac?.model}
                                </Text>
                                <Text style={[styles.tableCell, { flex: 0.8 }]}>{bakim.arac?.plaka}</Text>
                                <Text style={[styles.tableCell, { flex: 1.5 }]} numberOfLines={1}>
                                    {bakim.aciklama}
                                </Text>
                                <TouchableOpacity
                                    style={styles.completeButton}
                                    onPress={() => openCompleteModal(bakim)}
                                >
                                    <Text style={styles.completeButtonText}>Tamamla</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Bu Ay Özeti - Kaldırıldı */}
            {/* <View style={styles.section}>
                <Text style={styles.sectionTitle}>📊 Bu Ay</Text>
                <View style={styles.monthlyCard}>
                    <View style={styles.monthlyItem}>
                        <Text style={styles.monthlyLabel}>Aylık Ciro</Text>
                        <Text style={styles.monthlyValue}>₺{formatNumber(ciro?.aylikCiro || 0)}</Text>
                    </View>
                </View>
            </View> */}

            {/* Hızlı Erişim */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚡ Hızlı İşlemler</Text>
                <View style={styles.quickAccess}>
                    <TouchableOpacity
                        style={styles.quickItem}
                        onPress={() => router.push('/(admin)/vehicles' as any)}
                    >
                        <View style={[styles.quickIcon, { backgroundColor: '#1a73e8' }]}>
                            <Ionicons name="add-circle" size={24} color="#fff" />
                        </View>
                        <Text style={styles.quickLabel}>Araç Ekle</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickItem}
                        onPress={() => router.push('/(admin)/users' as any)}
                    >
                        <View style={[styles.quickIcon, { backgroundColor: '#5856d6' }]}>
                            <Ionicons name="people" size={24} color="#fff" />
                        </View>
                        <Text style={styles.quickLabel}>Kullanıcılar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickItem}
                        onPress={() => router.push('/(admin)/announcements' as any)}
                    >
                        <View style={[styles.quickIcon, { backgroundColor: '#ff9500' }]}>
                            <Ionicons name="megaphone" size={24} color="#fff" />
                        </View>
                        <Text style={styles.quickLabel}>Duyurular</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickItem}
                        onPress={() => router.push('/(admin)/pricing' as any)}
                    >
                        <View style={[styles.quickIcon, { backgroundColor: '#34c759' }]}>
                            <Ionicons name="pricetags" size={24} color="#fff" />
                        </View>
                        <Text style={styles.quickLabel}>Fiyatlar</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ height: 40 }} />

            {/* Bakım Tamamlama Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Bakım Tamamlama</Text>
                        <Text style={styles.modalSubtitle}>
                            {selectedBakim?.arac?.marka} {selectedBakim?.arac?.model} ({selectedBakim?.arac?.plaka})
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Servis/Tamir Masrafı (TL)"
                            keyboardType="numeric"
                            value={cost}
                            onChangeText={setCost}
                            autoFocus
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>İptal</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleCompleteMaintenance}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.modalButtonText}>Kaydet</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    chevron: {
        marginLeft: 8,
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
    monthlyCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    monthlyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    monthlyLabel: {
        fontSize: 16,
        color: '#666',
    },
    monthlyValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#34a853',
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
        padding: 12,
        gap: 8,
    },
    sectionTitleSmall: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#fff',
    },
    tableContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee',
        overflow: 'hidden',
        marginTop: 8,
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
        alignItems: 'center',
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
    completeButton: {
        backgroundColor: '#28a745',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 4,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    completeButtonText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        width: '85%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        marginBottom: 20,
        color: '#333',
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#6c757d',
    },
    saveButton: {
        backgroundColor: '#28a745',
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    actionButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    approveButton: {
        backgroundColor: '#28a745',
    },
    rejectButton: {
        backgroundColor: '#dc3545',
    },
});
