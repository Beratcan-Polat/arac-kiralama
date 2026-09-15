import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { aracAPI } from '@/services/api';
import { Arac } from '@/types/types';

export default function CarDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [arac, setArac] = useState<Arac | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchArac();
    }, [id]);

    const fetchArac = async () => {
        try {
            const response = await aracAPI.tumAraclar();
            const found = response.data.find((a: Arac) => a.id === parseInt(id));
            setArac(found || null);
        } catch (error) {
            console.error('Araç yükleme hatası:', error);
        } finally {
            setIsLoading(false);
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
                <Ionicons name="car-outline" size={60} color="#ccc" />
                <Text style={styles.errorText}>Araç bulunamadı</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Resim */}
                <Image
                    source={{ uri: arac.resimUrl || 'https://via.placeholder.com/400x250?text=Araç' }}
                    style={styles.image}
                    resizeMode="cover"
                />

                {/* İçerik */}
                <View style={styles.content}>
                    <Text style={styles.title}>{arac.marka} {arac.model}</Text>

                    <View style={styles.priceContainer}>
                        <Text style={styles.price}>₺{arac.gunlukFiyat}</Text>
                        <Text style={styles.priceLabel}>/gün</Text>
                    </View>

                    {/* Özellikler Grid */}
                    <View style={styles.featuresGrid}>
                        <View style={styles.featureItem}>
                            <Ionicons name="location" size={20} color="#007AFF" />
                            <Text style={styles.featureLabel}>Konum</Text>
                            <Text style={styles.featureValue}>{arac.il || '-'}</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="cog" size={20} color="#007AFF" />
                            <Text style={styles.featureLabel}>Vites</Text>
                            <Text style={styles.featureValue}>{arac.vitesTipi}</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="flame" size={20} color="#007AFF" />
                            <Text style={styles.featureLabel}>Yakıt</Text>
                            <Text style={styles.featureValue}>{arac.yakitTipi}</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="car" size={20} color="#007AFF" />
                            <Text style={styles.featureLabel}>Kasa</Text>
                            <Text style={styles.featureValue}>{arac.kasaTipi || '-'}</Text>
                        </View>
                    </View>

                    {/* Detay Bilgiler */}
                    <View style={styles.detailsSection}>
                        <Text style={styles.sectionTitle}>Kiralama Koşulları</Text>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Minimum Yaş</Text>
                            <Text style={styles.detailValue}>{arac.minYas || 21} yaş</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Minimum Ehliyet</Text>
                            <Text style={styles.detailValue}>{arac.minEhliyetYili || 2} yıl</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Günlük KM Limiti</Text>
                            <Text style={styles.detailValue}>{arac.gunlukKmLimiti || 400} km</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Teminat</Text>
                            <Text style={styles.detailValue}>₺{arac.teminatTutari || 0}</Text>
                        </View>
                    </View>

                    {arac.aciklama && (
                        <View style={styles.descriptionSection}>
                            <Text style={styles.sectionTitle}>Açıklama</Text>
                            <Text style={styles.description}>{arac.aciklama}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Kirala Butonu */}
            {arac.durum === 'MUSAIT' && (
                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={styles.rentButton}
                        onPress={() => router.push({ pathname: '/rent' as any, params: { aracId: arac.id } })}
                    >
                        <Text style={styles.rentButtonText}>Kirala</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        marginTop: 12,
        fontSize: 16,
        color: '#999',
    },
    image: {
        width: '100%',
        height: 250,
        backgroundColor: '#e0e0e0',
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 8,
    },
    price: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    priceLabel: {
        fontSize: 16,
        color: '#666',
        marginLeft: 4,
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 20,
        gap: 12,
    },
    featureItem: {
        width: '47%',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    featureLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 8,
    },
    featureValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginTop: 2,
    },
    detailsSection: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    descriptionSection: {
        marginTop: 24,
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
    },
    bottomBar: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    rentButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        height: 54,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rentButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});
