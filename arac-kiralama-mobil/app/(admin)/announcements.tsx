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
import { Duyuru } from '@/types/types';

export default function AnnouncementsScreen() {
    const [duyurular, setDuyurular] = useState<Duyuru[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [baslik, setBaslik] = useState('');
    const [icerik, setIcerik] = useState('');

    useEffect(() => {
        fetchDuyurular();
    }, []);

    const fetchDuyurular = async () => {
        try {
            const response = await adminAPI.duyurular();
            setDuyurular(response.data);
        } catch (error) {
            console.error('Duyuru yükleme hatası:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const handleAdd = async () => {
        if (!baslik.trim() || !icerik.trim()) {
            Alert.alert('Hata', 'Başlık ve içerik gerekli');
            return;
        }

        try {
            await adminAPI.duyuruEkle(baslik, icerik);
            Alert.alert('Başarılı', 'Duyuru eklendi');
            setModalVisible(false);
            setBaslik('');
            setIcerik('');
            fetchDuyurular();
        } catch (error: any) {
            Alert.alert('Hata', error.response?.data?.hata || 'İşlem başarısız');
        }
    };

    const handleDelete = (id: number) => {
        Alert.alert(
            'Duyuru Sil',
            'Bu duyuruyu silmek istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await adminAPI.duyuruSil(id);
                            fetchDuyurular();
                        } catch (error: any) {
                            Alert.alert('Hata', error.response?.data?.hata || 'İşlem başarısız');
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: Duyuru }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.baslik}</Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                </TouchableOpacity>
            </View>
            <Text style={styles.cardContent}>{item.icerik}</Text>
            <Text style={styles.cardDate}>
                {new Date(item.tarih).toLocaleDateString('tr-TR')}
            </Text>
        </View>
    );

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#ff3b30" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={duyurular}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchDuyurular} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="megaphone-outline" size={60} color="#ccc" />
                        <Text style={styles.emptyText}>Henüz duyuru yok</Text>
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
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Yeni Duyuru</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Başlık"
                            value={baslik}
                            onChangeText={setBaslik}
                        />

                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="İçerik"
                            value={icerik}
                            onChangeText={setIcerik}
                            multiline
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleAdd}
                            >
                                <Text style={styles.confirmButtonText}>Ekle</Text>
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
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    cardContent: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    cardDate: {
        fontSize: 12,
        color: '#999',
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
        backgroundColor: '#ff3b30',
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
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 12,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
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
        backgroundColor: '#ff3b30',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
