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
    TextInput,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { personelAPI } from '@/services/api';
import { Bakim } from '@/types/types';

export default function BakimlarScreen() {
    const [bakimlar, setBakimlar] = useState<Bakim[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedBakim, setSelectedBakim] = useState<Bakim | null>(null);
    const [masraf, setMasraf] = useState('');

    useEffect(() => {
        fetchBakimlar();
    }, []);

    const fetchBakimlar = async () => {
        try {
            const response = await personelAPI.bakimlar();
            setBakimlar(response.data);
        } catch (error) {
            console.error('Bakım yükleme hatası:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const openModal = (bakim: Bakim) => {
        setSelectedBakim(bakim);
        setMasraf('');
        setModalVisible(true);
    };

    const handleTamamla = async () => {
        if (!selectedBakim) return;
        if (!masraf || isNaN(parseFloat(masraf))) {
            Alert.alert('Hata', 'Geçerli bir masraf tutarı girin');
            return;
        }

        try {
            await personelAPI.bakimTamamla(selectedBakim.id, parseFloat(masraf));
            Alert.alert('Başarılı', 'Bakım tamamlandı');
            setModalVisible(false);
            fetchBakimlar();
        } catch (error: any) {
            Alert.alert('Hata', error.response?.data?.hata || 'İşlem başarısız');
        }
    };

    const renderItem = ({ item }: { item: Bakim }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                    {item.arac?.marka} {item.arac?.model}
                </Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>Bakımda</Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <Ionicons name="car-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>{item.arac?.plaka}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="document-text-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>{item.aciklama}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>Başlangıç: {item.baslangicTarihi}</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openModal(item)}
            >
                <Ionicons name="checkmark-done" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Tamamla</Text>
            </TouchableOpacity>
        </View>
    );

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#34c759" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={bakimlar}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchBakimlar} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="construct-outline" size={60} color="#ccc" />
                        <Text style={styles.emptyText}>Bakımda araç yok</Text>
                    </View>
                }
            />

            {/* Masraf Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Bakım Tamamla</Text>
                        <Text style={styles.modalSubtitle}>
                            {selectedBakim?.arac?.marka} {selectedBakim?.arac?.model}
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Bakım Masrafı (₺)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0.00"
                                value={masraf}
                                onChangeText={setMasraf}
                                keyboardType="decimal-pad"
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleTamamla}
                            >
                                <Text style={styles.confirmButtonText}>Tamamla</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        backgroundColor: '#ffebee',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#d32f2f',
    },
    cardBody: {
        gap: 8,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#5856d6',
        borderRadius: 8,
        paddingVertical: 12,
        gap: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
        fontSize: 18,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#666',
    },
    confirmButton: {
        backgroundColor: '#5856d6',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
