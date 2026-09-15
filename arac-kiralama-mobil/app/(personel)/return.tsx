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
import { Kiralama } from '@/types/types';

export default function TeslimAlScreen() {
    const [kiralamalar, setKiralamalar] = useState<Kiralama[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedKiralama, setSelectedKiralama] = useState<Kiralama | null>(null);
    const [hasarli, setHasarli] = useState(false);
    const [hasarAciklamasi, setHasarAciklamasi] = useState('');

    useEffect(() => {
        fetchKiralamalar();
    }, []);

    const fetchKiralamalar = async () => {
        try {
            const response = await personelAPI.aktifKiralamalar();
            setKiralamalar(response.data);
        } catch (error) {
            console.error('Kiralama yükleme hatası:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const openIadeModal = (kiralama: Kiralama) => {
        setSelectedKiralama(kiralama);
        setHasarli(false);
        setHasarAciklamasi('');
        setModalVisible(true);
    };

    const handleIadeAl = async () => {
        if (!selectedKiralama) return;
        if (hasarli && !hasarAciklamasi.trim()) {
            Alert.alert('Hata', 'Hasar açıklaması gerekli');
            return;
        }

        try {
            await personelAPI.iadeAl(selectedKiralama.id, hasarli, hasarAciklamasi);
            Alert.alert('Başarılı', 'Araç iade alındı');
            setModalVisible(false);
            fetchKiralamalar();
        } catch (error: any) {
            Alert.alert('Hata', error.response?.data?.hata || 'İşlem başarısız');
        }
    };

    const renderItem = ({ item }: { item: Kiralama }) => (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                    {item.arac?.marka} {item.arac?.model}
                </Text>
                <View style={styles.plateBadge}>
                    <Text style={styles.plateText}>{item.arac?.plaka}</Text>
                </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Body */}
            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Müşteri:</Text>
                    <Text style={styles.infoValue}> {item.kullanici?.ad}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Alış Tarihi:</Text>
                    <Text style={styles.infoValue}> {item.alisTarihi}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>İade Tarihi:</Text>
                    <Text style={styles.infoValue}> {item.iadeTarihi}</Text>
                </View>
            </View>

            {/* Button */}
            <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openIadeModal(item)}
            >
                <Ionicons name="checkbox-outline" size={20} color="#000" />
                <Text style={styles.actionButtonText}>Aracı Teslim Al</Text>
            </TouchableOpacity>
        </View>
    );

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#ffc107" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={kiralamalar}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchKiralamalar} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="car-outline" size={60} color="#ccc" />
                        <Text style={styles.emptyText}>Aktif kiralama yok</Text>
                    </View>
                }
            />

            {/* İade Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Araç İade</Text>
                        <Text style={styles.modalSubtitle}>
                            {selectedKiralama?.arac?.marka} {selectedKiralama?.arac?.model}
                        </Text>

                        <TouchableOpacity
                            style={styles.checkboxRow}
                            onPress={() => setHasarli(!hasarli)}
                        >
                            <Ionicons
                                name={hasarli ? 'checkbox' : 'square-outline'}
                                size={24}
                                color={hasarli ? '#ff3b30' : '#666'}
                            />
                            <Text style={styles.checkboxLabel}>Araçta hasar var</Text>
                        </TouchableOpacity>

                        {hasarli && (
                            <TextInput
                                style={styles.hasarInput}
                                placeholder="Hasar açıklaması..."
                                value={hasarAciklamasi}
                                onChangeText={setHasarAciklamasi}
                                multiline
                            />
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleIadeAl}
                            >
                                <Text style={styles.confirmButtonText}>İade Al</Text>
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
        marginBottom: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#eee',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    plateBadge: {
        backgroundColor: '#0d6efd', // Blue Badge
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    plateText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginBottom: 12,
    },
    cardBody: {
        marginBottom: 16,
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
    },
    infoValue: {
        fontSize: 15,
        color: '#555',
    },
    actionButton: {
        backgroundColor: '#ffc107', // Yellow Button
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
    },
    actionButtonText: {
        color: '#000',
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
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    checkboxLabel: {
        fontSize: 16,
        color: '#333',
    },
    hasarInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 20,
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
        backgroundColor: '#ffc107',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
});
