import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { aracAPI, kiralamaAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Arac } from '@/types/types';

export default function RentScreen() {
    const { aracId, alisTarihi: paramAlis, iadeTarihi: paramIade } = useLocalSearchParams<{ aracId: string, alisTarihi: string, iadeTarihi: string }>();
    const router = useRouter();
    const { user } = useAuth();

    const [arac, setArac] = useState<Arac | null>(null);
    const [alisTarihi, setAlisTarihi] = useState(paramAlis ? new Date(paramAlis) : new Date());
    const [iadeTarihi, setIadeTarihi] = useState(paramIade ? new Date(paramIade) : new Date(Date.now() + 86400000)); // +1 gün
    const [paymentMethod, setPaymentMethod] = useState<'OFISTE' | 'ONLINE'>('OFISTE');
    const [showAlisPicker, setShowAlisPicker] = useState(false);
    const [showIadePicker, setShowIadePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchArac();
    }, [aracId]);

    const fetchArac = async () => {
        try {
            const response = await aracAPI.tumAraclar();
            const found = response.data.find((a: Arac) => a.id === parseInt(aracId));
            setArac(found || null);
        } catch (error) {
            console.error('Araç yükleme hatası:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const calculatePrice = () => {
        if (!arac) return 0;
        const days = Math.ceil((iadeTarihi.getTime() - alisTarihi.getTime()) / 86400000);
        return Math.max(1, days) * arac.gunlukFiyat;
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const handleRent = async () => {
        if (!arac || !user) return;

        if (iadeTarihi <= alisTarihi) {
            Alert.alert('Hata', 'İade tarihi alış tarihinden sonra olmalıdır');
            return;
        }

        setIsSubmitting(true);
        try {
            await kiralamaAPI.kiralamaOlustur({
                aracId: arac.id,
                kullaniciId: user.id,
                alisTarihi: alisTarihi.toISOString().split('T')[0],
                iadeTarihi: iadeTarihi.toISOString().split('T')[0],
                odemeTipi: paymentMethod === 'ONLINE' ? 'ONLINE (Kredi Kartı)' : 'OFISTE',
            });

            Alert.alert(
                'Başarılı',
                'Kiralama talebiniz alındı!',
                [{ text: 'Tamam', onPress: () => router.back() }]
            );
        } catch (error: any) {
            Alert.alert('Hata', error.response?.data || 'Kiralama yapılamadı');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    if (!arac) {
        return (
            <View style={styles.centered}>
                <Text>Araç bulunamadı</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {/* Araç Özeti */}
            <View style={styles.carSummary}>
                <Ionicons name="car-sport" size={48} color="#007AFF" />
                <View style={styles.carInfo}>
                    <Text style={styles.carName}>{arac.marka} {arac.model}</Text>
                    <Text style={styles.carPrice}>₺{arac.gunlukFiyat}/gün</Text>
                </View>
            </View>

            {/* Tarih Seçimi */}
            <View style={styles.dateSection}>
                <Text style={styles.sectionTitle}>Tarih Seçimi</Text>

                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowAlisPicker(true)}
                >
                    <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                    <View style={styles.dateInfo}>
                        <Text style={styles.dateLabel}>Alış Tarihi</Text>
                        <Text style={styles.dateValue}>{formatDate(alisTarihi)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowIadePicker(true)}
                >
                    <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                    <View style={styles.dateInfo}>
                        <Text style={styles.dateLabel}>İade Tarihi</Text>
                        <Text style={styles.dateValue}>{formatDate(iadeTarihi)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
            </View>

            {/* Date Pickers */}
            {showAlisPicker && (
                <DateTimePicker
                    value={alisTarihi}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, date) => {
                        setShowAlisPicker(Platform.OS === 'ios');
                        if (date) setAlisTarihi(date);
                    }}
                />
            )}

            {showIadePicker && (
                <DateTimePicker
                    value={iadeTarihi}
                    mode="date"
                    display="default"
                    minimumDate={new Date(alisTarihi.getTime() + 86400000)}
                    onChange={(event, date) => {
                        setShowIadePicker(Platform.OS === 'ios');
                        if (date) setIadeTarihi(date);
                    }}
                />
            )}


            {/* Ödeme Yöntemi */}
            <View style={styles.paymentSection}>
                <Text style={styles.sectionTitle}>Ödeme Yöntemi</Text>
                <View style={styles.paymentOptions}>
                    <TouchableOpacity
                        style={[styles.paymentOption, paymentMethod === 'OFISTE' && styles.paymentOptionSelected]}
                        onPress={() => setPaymentMethod('OFISTE')}
                    >
                        <Ionicons name="business" size={24} color={paymentMethod === 'OFISTE' ? '#007AFF' : '#666'} />
                        <Text style={[styles.paymentOptionText, paymentMethod === 'OFISTE' && styles.paymentOptionTextSelected]}>
                            Ofiste Öde
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.paymentOption, paymentMethod === 'ONLINE' && styles.paymentOptionSelected]}
                        onPress={() => setPaymentMethod('ONLINE')}
                    >
                        <Ionicons name="card" size={24} color={paymentMethod === 'ONLINE' ? '#007AFF' : '#666'} />
                        <Text style={[styles.paymentOptionText, paymentMethod === 'ONLINE' && styles.paymentOptionTextSelected]}>
                            Hemen Öde
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Kredi Kartı Formu - Sadece ONLINE seçiliyse */}
                {paymentMethod === 'ONLINE' && (
                    <View style={styles.cardForm}>
                        <Text style={styles.formTitle}>Kart Bilgileri</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Kart Numarası (0000 0000 0000 0000)"
                            keyboardType="numeric"
                            maxLength={19}
                        />
                        <View style={styles.expiryRow}>
                            <TextInput
                                style={[styles.input, { flex: 1, marginRight: 8 }]}
                                placeholder="AA/YY"
                                keyboardType="numeric"
                                maxLength={5}
                            />
                            <TextInput
                                style={[styles.input, { flex: 0.5 }]}
                                placeholder="CVC"
                                keyboardType="numeric"
                                maxLength={3}
                            />
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Kart Üzerindeki İsim"
                        />
                    </View>
                )}
            </View>

            {/* Fiyat Özeti */}
            <View style={styles.priceSummary}>
                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>
                        {Math.ceil((iadeTarihi.getTime() - alisTarihi.getTime()) / 86400000)} gün × ₺{arac.gunlukFiyat}
                    </Text>
                    <Text style={styles.priceValue}>₺{calculatePrice().toFixed(2)}</Text>
                </View>

                {paymentMethod === 'ONLINE' ? (
                    <>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Liste Fiyatı</Text>
                            <Text style={[styles.priceValue, { textDecorationLine: 'line-through', color: '#999' }]}>
                                ₺{calculatePrice().toFixed(2)}
                            </Text>
                        </View>
                        <View style={styles.priceRow}>
                            <Text style={[styles.priceLabel, { color: '#2e7d32', fontWeight: 'bold' }]}>
                                %30 Online İndirimi
                            </Text>
                            <Text style={[styles.priceValue, { color: '#2e7d32' }]}>
                                -₺{(calculatePrice() * 0.30).toFixed(2)}
                            </Text>
                        </View>
                        <View style={[styles.priceRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Toplam Tutar</Text>
                            <Text style={styles.totalValue}>₺{(calculatePrice() * 0.70).toFixed(2)}</Text>
                        </View>
                    </>
                ) : (
                    <View style={[styles.priceRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Toplam</Text>
                        <Text style={styles.totalValue}>₺{calculatePrice().toFixed(2)}</Text>
                    </View>
                )}
            </View>

            {/* Onayla Butonu */}
            <TouchableOpacity
                style={[styles.confirmButton, isSubmitting && styles.buttonDisabled]}
                onPress={handleRent}
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.confirmButtonText}>Kiralama Talebini Gönder</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    carSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    carInfo: {
        flex: 1,
    },
    carName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    carPrice: {
        fontSize: 16,
        color: '#007AFF',
        marginTop: 4,
    },
    dateSection: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        gap: 12,
    },
    dateInfo: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 12,
        color: '#666',
    },
    dateValue: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginTop: 2,
    },
    priceSummary: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginTop: 24,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    priceLabel: {
        fontSize: 14,
        color: '#666',
    },
    priceValue: {
        fontSize: 14,
        color: '#333',
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        marginTop: 8,
        paddingTop: 16,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    confirmButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        height: 54,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    paymentSection: {
        marginTop: 24,
    },
    paymentOptions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    paymentOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        gap: 8,
    },
    paymentOptionSelected: {
        borderColor: '#007AFF',
        backgroundColor: '#f0f9ff',
    },
    paymentOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    paymentOptionTextSelected: {
        color: '#007AFF',
    },
    cardForm: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginTop: 12,
    },
    formTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontSize: 14,
    },
    expiryRow: {
        flexDirection: 'row',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});
