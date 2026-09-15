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
import { adminAPI } from '@/services/api';
import { FiyatPolitikasi } from '@/types/types';

export default function PricingScreen() {
    const [politikalar, setPolitikalar] = useState<FiyatPolitikasi[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        aracSinifi: '',
        minFiyat: '',
        maxFiyat: '',
    });

    useEffect(() => {
        fetchPolitikalar();
    }, []);

    const fetchPolitikalar = async () => {
        try {
            const response = await adminAPI.fiyatPolitikalari();
            setPolitikalar(response.data);
        } catch (error) {
            console.error('Fiyat politikası yükleme hatası:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const handleSave = async () => {
        if (!formData.aracSinifi || !formData.minFiyat || !formData.maxFiyat) {
            Alert.alert('Hata', 'Tüm alanları doldurun');
            return;
        }

        const minFiyat = parseFloat(formData.minFiyat);
        const maxFiyat = parseFloat(formData.maxFiyat);

        if (minFiyat >= maxFiyat) {
            Alert.alert('Hata', 'Minimum fiyat, maksimum fiyattan küçük olmalı');
            return;
        }

        try {
            if (editMode && selectedId) {
                await adminAPI.fiyatPolitikasiGuncelle(selectedId, minFiyat, maxFiyat);
                Alert.alert('Başarılı', 'Fiyat politikası güncellendi');
            } else {
                await adminAPI.fiyatPolitikasiEkle(formData.aracSinifi, minFiyat, maxFiyat);
                Alert.alert('Başarılı', 'Fiyat politikası eklendi');
            }
            closeModal();
            fetchPolitikalar();
        } catch (error: any) {
            Alert.alert('Hata', error.response?.data?.hata || 'İşlem başarısız');
        }
    };

    const handleEdit = (item: FiyatPolitikasi) => {
        setEditMode(true);
        setSelectedId(item.id);
        setFormData({
            aracSinifi: item.aracSinifi,
            minFiyat: item.minFiyat.toString(),
            maxFiyat: item.maxFiyat.toString(),
        });
        setModalVisible(true);
    };

    const handleDelete = (id: number) => {
        Alert.alert(
            'Sil',
            'Bu fiyat politikasını silmek istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await adminAPI.fiyatPolitikasiSil(id);
                            fetchPolitikalar();
                        } catch (error: any) {
                            Alert.alert('Hata', error.response?.data?.hata || 'Silme başarısız');
                        }
                    },
                },
            ]
        );
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditMode(false);
        setSelectedId(null);
        setFormData({ aracSinifi: '', minFiyat: '', maxFiyat: '' });
    };

    const renderItem = ({ item }: { item: FiyatPolitikasi }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.sinifBadge}>
                    <Ionicons name="car" size={16} color="#1a73e8" />
                    <Text style={styles.sinifText}>{item.aracSinifi}</Text>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
                        <Ionicons name="pencil" size={18} color="#1a73e8" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
                        <Ionicons name="trash-outline" size={18} color="#ff3b30" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.priceRow}>
                <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>Min Fiyat</Text>
                    <Text style={styles.priceValue}>₺{item.minFiyat.toLocaleString('tr-TR')}</Text>
                </View>
                <View style={styles.priceDivider} />
                <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>Max Fiyat</Text>
                    <Text style={styles.priceValue}>₺{item.maxFiyat.toLocaleString('tr-TR')}</Text>
                </View>
            </View>
        </View>
    );

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#1a73e8" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={politikalar}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchPolitikalar} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="pricetags-outline" size={60} color="#ccc" />
                        <Text style={styles.emptyText}>Fiyat politikası bulunamadı</Text>
                    </View>
                }
            />

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setModalVisible(true)}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>

            {/* Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editMode ? 'Fiyat Politikası Düzenle' : 'Yeni Fiyat Politikası'}
                        </Text>

                        <Text style={styles.inputLabel}>Araç Sınıfı *</Text>
                        <TextInput
                            style={[styles.input, editMode && styles.inputDisabled]}
                            placeholder="Örn: EKONOMI, ORTA, LUKS"
                            value={formData.aracSinifi}
                            onChangeText={(text) => setFormData({ ...formData, aracSinifi: text.toUpperCase() })}
                            editable={!editMode}
                            autoCapitalize="characters"
                        />

                        <Text style={styles.inputLabel}>Minimum Fiyat (₺) *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Örn: 300"
                            value={formData.minFiyat}
                            onChangeText={(text) => setFormData({ ...formData, minFiyat: text })}
                            keyboardType="decimal-pad"
                        />

                        <Text style={styles.inputLabel}>Maksimum Fiyat (₺) *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Örn: 800"
                            value={formData.maxFiyat}
                            onChangeText={(text) => setFormData({ ...formData, maxFiyat: text })}
                            keyboardType="decimal-pad"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={closeModal}
                            >
                                <Text style={styles.cancelButtonText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleSave}
                            >
                                <Text style={styles.confirmButtonText}>{editMode ? 'Güncelle' : 'Ekle'}</Text>
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
        paddingBottom: 80,
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
    sinifBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    sinifText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a73e8',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        padding: 8,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priceItem: {
        flex: 1,
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    priceValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    priceDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#e0e0e0',
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
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#34c759',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
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
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        marginBottom: 16,
    },
    inputDisabled: {
        opacity: 0.6,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
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
        backgroundColor: '#34c759',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
