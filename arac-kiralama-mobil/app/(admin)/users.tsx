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
import { adminAPI } from '@/services/api';
import { Kullanici, Rol } from '@/types/types';

export default function UsersScreen() {
    const [kullanicilar, setKullanicilar] = useState<Kullanici[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

    useEffect(() => {
        fetchKullanicilar();
    }, []);

    const fetchKullanicilar = async () => {
        try {
            const response = await adminAPI.kullanicilar();
            setKullanicilar(response.data);
        } catch (error) {
            console.error('Kullanıcı yükleme hatası:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const toggleDropdown = (id: number) => {
        setOpenDropdownId(openDropdownId === id ? null : id);
    };

    const handleRoleSelect = async (kullanici: Kullanici, rol: Rol) => {
        try {
            setOpenDropdownId(null);
            await adminAPI.rolGuncelle(kullanici.id, rol);
            Alert.alert('Başarılı', 'Rol güncellendi');
            fetchKullanicilar();
        } catch (error: any) {
            Alert.alert('Hata', error.response?.data?.hata || 'İşlem başarısız');
        }
    };

    const getRoleBadgeStyle = (rol: Rol) => {
        const styles: { [key: string]: { bg: string; text: string; label: string } } = {
            ADMIN: { bg: '#ffebee', text: '#d32f2f', label: 'Admin' },
            PERSONEL: { bg: '#e8f5e9', text: '#388e3c', label: 'Personel' },
            MUSTERI: { bg: '#e3f2fd', text: '#1976d2', label: 'Müşteri' },
        };
        return styles[rol] || styles.MUSTERI;
    };

    const renderItem = ({ item }: { item: Kullanici }) => {
        const badge = getRoleBadgeStyle(item.rol);
        const isOpen = openDropdownId === item.id;

        return (
            <View style={styles.cardContainer}>
                <TouchableOpacity
                    style={styles.cardHeader}
                    onPress={() => toggleDropdown(item.id)}
                    activeOpacity={0.7}
                >
                    <View style={styles.avatarContainer}>
                        <Ionicons name="person-circle" size={48} color="#ccc" />
                    </View>
                    <View style={styles.info}>
                        <Text style={styles.name}>{item.ad}</Text>
                        <Text style={styles.email}>{item.email}</Text>
                    </View>
                    {/* Combobox Trigger */}
                    <View style={[styles.comboboxTrigger, isOpen && styles.comboboxTriggerOpen]}>
                        <Text style={styles.comboboxText}>{badge.label}</Text>
                        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color="#666" />
                    </View>
                </TouchableOpacity>

                {/* Inline Dropdown Options */}
                {
                    isOpen && (
                        <View style={styles.dropdownOptions}>
                            {(['MUSTERI', 'PERSONEL', 'ADMIN'] as Rol[]).map((rol) => {
                                const roleBadge = getRoleBadgeStyle(rol);
                                const isSelected = item.rol === rol;
                                return (
                                    <TouchableOpacity
                                        key={rol}
                                        style={[styles.dropdownItem, isSelected && styles.dropdownSelectedItem]}
                                        onPress={() => handleRoleSelect(item, rol)}
                                    >
                                        <View style={[styles.badge, { backgroundColor: roleBadge.bg, transform: [{ scale: 0.9 }] }]}>
                                            <Text style={[styles.badgeText, { color: roleBadge.text }]}>{roleBadge.label}</Text>
                                        </View>
                                        {isSelected && <Ionicons name="checkmark" size={18} color="#1a73e8" />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )
                }
            </View >
        );
    };

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
                data={kullanicilar}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchKullanicilar} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={60} color="#ccc" />
                        <Text style={styles.emptyText}>Kullanıcı bulunamadı</Text>
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
    cardContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    avatarContainer: {
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    email: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
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
    comboboxTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#f9f9f9',
        minWidth: 110,
        justifyContent: 'space-between',
    },
    comboboxTriggerOpen: {
        borderColor: '#1a73e8',
        backgroundColor: '#e3f2fd',
    },
    comboboxText: {
        fontSize: 13,
        color: '#333',
        marginRight: 6,
    },
    dropdownOptions: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: '#fafafa',
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    dropdownSelectedItem: {
        backgroundColor: '#f0f7ff',
    },
});
