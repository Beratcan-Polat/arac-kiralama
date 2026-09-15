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
    ScrollView,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { aracAPI, adminAPI } from '@/services/api';
import { Arac } from '@/types/types';

export default function VehiclesScreen() {
    const [araclar, setAraclar] = useState<Arac[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedAracId, setSelectedAracId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        marka: '',
        model: '',
        plaka: '',
        gunlukFiyat: '',
        yakitTipi: '',
        vitesTipi: '',
        aracSinifi: '',
        kasaTipi: '',
        minYas: '',
        minGencYas: '',
        minEhliyetYili: '',
        minGencEhliyetYili: '',
        gunlukKmLimiti: '',
        teminatTutari: '',
        resimUrl: '',
        alisNoktasi: [] as string[],
    });

    const [activeCity, setActiveCity] = useState('İstanbul');
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    // Delete Modal State
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const [aracToDelete, setAracToDelete] = useState<Arac | null>(null);

    const LOCATIONS = [
        'İstanbul Havalimanı',
        'İstanbul Sabiha Gökçen Havalimanı',
        'İstanbul Ataşehir Watergarden AVM',
        'İstanbul Maltepe Park AVM',
        'İstanbul Kadıköy',
        'Ankara Esenboğa Havalimanı',
        'Ankara YHT Gar',
        'Ankara Atlantis AVM',
        'Ankara Kızılay',
        'İzmir Adnan Menderes Havalimanı',
        'İzmir Mavibahçe AVM',
        'İzmir Otogar',
        'Adana Şakirpaşa Havalimanı',
        'Adana Optimum AVM',
        'Adana Otogar',
        'Adıyaman Havalimanı',
        'Adıyaman Merkez',
        'Afyonkarahisar Zafer Havalimanı',
        'Afyonkarahisar Otogar',
        'Ağrı Havalimanı',
        'Ağrı Merkez',
        'Aksaray Otogar',
        'Amasya Merzifon Havalimanı',
        'Amasya Merkez',
        'Antalya Havalimanı',
        'Antalya Terra City AVM',
        'Antalya Otogar',
        'Ardahan Merkez',
        'Artvin Merkez',
        'Aydın Çıldır Havalimanı',
        'Aydın Otogar',
        'Balıkesir Koca Seyit Havalimanı',
        'Balıkesir Otogar',
        'Bartın Merkez',
        'Batman Havalimanı',
        'Batman Park AVM',
        'Bayburt Merkez',
        'Bilecik Otogar',
        'Bingöl Havalimanı',
        'Bingöl Merkez',
    ];

    const CLASSES = ['EKONOMI', 'KONFOR', 'LUKS', 'PRESTIJ'];
    const CASE_TYPES = ['SEDAN', 'HATCHBACK', 'SUV', 'CROSSOVER', 'MPV', 'CABRIO'];

    useEffect(() => {
        fetchAraclar();
    }, []);

    const fetchAraclar = async () => {
        try {
            const response = await aracAPI.tumAraclar();
            setAraclar(response.data);
        } catch (error) {
            console.error('Araç yükleme hatası:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const toggleLocation = (loc: string) => {
        const current = [...formData.alisNoktasi];
        if (current.includes(loc)) {
            setFormData({ ...formData, alisNoktasi: current.filter(c => c !== loc) });
        } else {
            setFormData({ ...formData, alisNoktasi: [...current, loc] });
        }
    };

    const handleSubmit = async () => {
        if (!formData.marka || !formData.model || !formData.plaka || !formData.gunlukFiyat) {
            Alert.alert('Hata', 'Lütfen tüm zorunlu alanları (Marka, Model, Plaka, Fiyat) doldurun.');
            return;
        }

        if (!formData.yakitTipi || !formData.vitesTipi || !formData.aracSinifi || !formData.kasaTipi) {
            Alert.alert('Hata', 'Lütfen araç özelliklerini (Yakıt, Vites, Sınıf, Kasa) seçiniz.');
            return;
        }

        try {
            const aracData: any = {
                ...formData,
                gunlukFiyat: parseFloat(formData.gunlukFiyat),
                minYas: parseInt(formData.minYas) || 0,
                minGencYas: parseInt(formData.minGencYas) || 0,
                minEhliyetYili: parseInt(formData.minEhliyetYili) || 0,
                minGencEhliyetYili: parseInt(formData.minGencEhliyetYili) || 0,
                gunlukKmLimiti: parseInt(formData.gunlukKmLimiti) || 0,
                teminatTutari: parseFloat(formData.teminatTutari) || 0,
                alisNoktasi: formData.alisNoktasi.join(','),
                aracSinifi: formData.aracSinifi || 'EKONOMI', // fallback safe
                kasaTipi: formData.kasaTipi || 'SEDAN',
                ...(isEditing ? {} : { durum: 'MUSAIT' }),
            };

            if (isEditing && selectedAracId) {
                // Güncelleme işlemi (API desteği varsa)
                // Şimdilik silip ekleme veya benzeri bir logic gerekebilir ama 
                // ideali adminAPI.aracGuncelle olmalı. 
                // Eğer güncelleme yoksa uyaralım.
                // Kontrol ettiğimde adminAPI'de update yok gibi, ama emin olalım.
                // Kullanıcı "Düzenle" istediğine göre update endpoint'i olmalı ya da eklemeliyiz.
                // Şimdilik Alert verelim veya API'yi kontrol edelim.
                // PanelKontrol.java'da update yoktu. 
                // O yüzden şimdilik sadece "Düzenleme özelliği yakında" diyebiliriz ya da backend'e ekleyip buraya eklemeliyiz.
                // Kullanıcı isteği: "Düzenle ve koşulları görme mobilde de olmalı".
                // Ben backend kodunu kontrol ettim, update endpoint yoktu.
                // Sadece silme ve ekleme var.
                // Ancak "Koşulları Gör" yapılabilir.
                // Düzenle için backend update gerekir.
                // Şimdilik sadece formu doldurup "Ekle" gibi çalışırsa duplicate olur.
                // En iyisi kullanıcıya "Düzenleme henüz aktif değil" demek yerine
                // Backend'e ekleyip yapmak. Ama şu an backend taskım yok.
                // Sadece UI eklemesi istendi.
                // "Düzenle" butonuna basınca formu doldurup modalı açacağım.
                // Kaydet deyince eğer isEditing ise hata verebiliriz "Backend desteği yok" diye.
                // Veya şimdilik sessizce geçebiliriz.

                Alert.alert('Bilgi', 'Düzenleme işlemi şu an backend tarafında desteklenmiyor.');
                return;

            } else {
                await adminAPI.aracEkle(aracData);
                Alert.alert('Başarılı', 'Araç eklendi');
            }

            setModalVisible(false);
            resetForm();
            fetchAraclar();
        } catch (error: any) {
            Alert.alert('Hata', error.response?.data || 'İşlem başarısız');
        }
    };

    const handleEdit = (arac: Arac) => {
        setIsEditing(true);
        setSelectedAracId(arac.id);
        const alisNoktasiArray = arac.alisNoktasi ? arac.alisNoktasi.split(',') : [];
        setFormData({
            marka: arac.marka,
            model: arac.model,
            plaka: arac.plaka,
            gunlukFiyat: arac.gunlukFiyat.toString(),
            yakitTipi: arac.yakitTipi,
            vitesTipi: arac.vitesTipi,
            aracSinifi: arac.aracSinifi || 'EKONOMI',
            kasaTipi: arac.kasaTipi || 'SEDAN',
            minYas: (arac.minYas || 21).toString(),
            minGencYas: (arac.minGencYas || 19).toString(),
            minEhliyetYili: (arac.minEhliyetYili || 2).toString(),
            minGencEhliyetYili: (arac.minGencEhliyetYili || 1).toString(),
            gunlukKmLimiti: (arac.gunlukKmLimiti || 500).toString(),
            teminatTutari: (arac.teminatTutari || 2000).toString(),
            resimUrl: arac.resimUrl || '',
            alisNoktasi: alisNoktasiArray,
        });
        setModalVisible(true);
    };

    const handleConditions = (arac: Arac) => {
        Alert.alert(
            'Kiralama Koşulları',
            `Min. Yaş: ${arac.minYas || 'Belirtilmemiş'}\n` +
            `Min. Ehliyet Yılı: ${arac.minEhliyetYili || 'Belirtilmemiş'}\n` +
            `Min. Genç Yaş: ${arac.minGencYas || '-'}\n` +
            `Min. Genç Ehliyet Yılı: ${arac.minGencEhliyetYili || '-'}\n` +
            `Teminat Tutarı: ${arac.teminatTutari ? arac.teminatTutari + ' TL' : 'Belirtilmemiş'}\n` +
            `Günlük KM Limiti: ${arac.gunlukKmLimiti || 'Sınırsız'}`,
            [{ text: 'Tamam' }]
        );
    };

    const handleDelete = (arac: Arac) => {
        setAracToDelete(arac);
        setDeleteReason('');
        setDeleteModalVisible(true);
    };

    const confirmDelete = async () => {
        if (!aracToDelete) return;

        try {
            // Silme sebebi ile birlikte gönder
            // Eğer sebep boşsa "Belirtilmedi" olarak gidecek (Backend hallediyor ama biz de gönderebiliriz)
            const reason = deleteReason.trim() || 'Mobil Admin Silme İşlemi';

            await adminAPI.aracSil(aracToDelete.id, true, reason);
            fetchAraclar();
            setDeleteModalVisible(false);
            setAracToDelete(null);
        } catch (error: any) {
            Alert.alert('Hata', error.response?.data || 'Silme işlemi başarısız');
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setSelectedAracId(null);
        setFormData({
            marka: '',
            model: '',
            plaka: '',
            gunlukFiyat: '',
            yakitTipi: '',
            vitesTipi: '',
            aracSinifi: '',
            kasaTipi: '',
            minYas: '',
            minGencYas: '',
            minEhliyetYili: '',
            minGencEhliyetYili: '',
            gunlukKmLimiti: '',
            teminatTutari: '',
            resimUrl: '',
            alisNoktasi: [],
        });
    };

    const getDurumBadge = (durum: string) => {
        const styles: { [key: string]: { bg: string; text: string; label: string } } = {
            'MUSAIT': { bg: '#e8f5e9', text: '#388e3c', label: 'Müsait' },
            'KIRADA': { bg: '#fff3e0', text: '#f57c00', label: 'Kirada' },
            'BAKIMDA': { bg: '#ffebee', text: '#d32f2f', label: 'Bakımda' },
            'ONAY_BEKLIYOR': { bg: '#fff9c4', text: '#fbc02d', label: 'Onay Bekliyor' },
        };
        return styles[durum] || { bg: '#f5f5f5', text: '#666', label: durum };
    };

    const renderItem = ({ item }: { item: Arac }) => {
        const badge = getDurumBadge(item.durum);

        let imageSource = require('../../assets/images/default-car.jpg');
        if (item.resimUrl) {
            if (item.resimUrl.startsWith('http')) {
                imageSource = { uri: item.resimUrl };
            } else {
                imageSource = { uri: `http://10.0.2.2:8080/api/dosya/${item.resimUrl}` };
            }
        }

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.headerContent}>
                        <Image
                            source={imageSource}
                            style={styles.cardImage}
                            resizeMode="cover"
                        />
                        <View style={styles.headerText}>
                            <Text style={styles.cardTitle}>{item.marka} {item.model}</Text>
                            <Text style={styles.cardPlaka}>{item.plaka}</Text>
                        </View>
                    </View>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <Ionicons name="cash-outline" size={16} color="#666" />
                        <Text style={styles.infoText}>₺{item.gunlukFiyat}/gün</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="flame-outline" size={16} color="#666" />
                        <Text style={styles.infoText}>{item.yakitTipi}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="cog-outline" size={16} color="#666" />
                        <Text style={styles.infoText}>{item.vitesTipi}</Text>
                    </View>
                </View>

                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.conditionsButton]}
                        onPress={() => handleConditions(item)}
                    >
                        <Ionicons name="information-circle-outline" size={18} color="#1a73e8" />
                        <Text style={styles.conditionsButtonText}>Koşullar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => handleEdit(item)}
                    >
                        <Ionicons name="create-outline" size={18} color="#f0a500" />
                        <Text style={styles.editButtonText}>Düzenle</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDelete(item)}
                    >
                        <Ionicons name="trash-outline" size={18} color="#ff3b30" />
                        <Text style={styles.deleteButtonText}>Sil</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

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
                data={araclar}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchAraclar} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="car-outline" size={60} color="#ccc" />
                        <Text style={styles.emptyText}>Araç bulunamadı</Text>
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
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>
                                {isEditing ? 'Araç Düzenle' : 'Yeni Araç Ekle'}
                            </Text>

                            {/* Row 1: Marka - Model - Plaka */}
                            <View style={styles.formRow}>
                                <View style={styles.formCol}>
                                    <Text style={styles.inputLabel}>Marka *</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Örn: Toyota"
                                        value={formData.marka}
                                        onChangeText={(text) => setFormData({ ...formData, marka: text })}
                                    />
                                </View>
                                <View style={styles.formCol}>
                                    <Text style={styles.inputLabel}>Model *</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Örn: Corolla"
                                        value={formData.model}
                                        onChangeText={(text) => setFormData({ ...formData, model: text })}
                                    />
                                </View>
                                <View style={styles.formCol}>
                                    <Text style={styles.inputLabel}>Plaka *</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="34 ABC 123"
                                        value={formData.plaka}
                                        onChangeText={(text) => setFormData({ ...formData, plaka: text })}
                                        autoCapitalize="characters"
                                    />
                                </View>
                            </View>

                            {/* Alış Noktaları */}
                            {/* Alış Noktaları - City Tabs */}
                            <Text style={styles.inputLabel}>Alış Noktaları (Seçiniz)</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={{ marginBottom: 12 }}
                            >
                                <View style={styles.buttonGroup}>
                                    {Array.from(new Set(LOCATIONS.map(l => l.split(' ')[0]))).map((city) => {
                                        const hasSelection = LOCATIONS.filter(l => l.startsWith(city)).some(l => formData.alisNoktasi.includes(l));
                                        return (
                                            <TouchableOpacity
                                                key={city}
                                                style={[
                                                    styles.groupButton,
                                                    activeCity === city && styles.groupButtonActive,
                                                    !activeCity && hasSelection && { borderColor: '#1a73e8', borderWidth: 1 }
                                                ]}
                                                onPress={() => setActiveCity(city)}
                                            >
                                                <Text style={[
                                                    styles.groupButtonText,
                                                    activeCity === city && styles.groupButtonTextActive,
                                                    activeCity !== city && hasSelection && { color: '#1a73e8', fontWeight: 'bold' }
                                                ]}>
                                                    {city} {hasSelection ? '•' : ''}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </ScrollView>

                            {/* Active City Locations */}
                            <View style={[styles.locationsContainer, { minHeight: 120 }]}>
                                {LOCATIONS.filter(l => l.startsWith(activeCity)).map((loc) => (
                                    <TouchableOpacity
                                        key={loc}
                                        style={[
                                            styles.locationChip,
                                            formData.alisNoktasi.includes(loc) && styles.locationChipActive
                                        ]}
                                        onPress={() => toggleLocation(loc)}
                                    >
                                        <Text style={[
                                            styles.locationChipText,
                                            formData.alisNoktasi.includes(loc) && styles.locationChipTextActive
                                        ]}>{loc.substring(activeCity.length + 1) || loc}</Text>
                                    </TouchableOpacity>
                                ))}
                                {LOCATIONS.filter(l => l.startsWith(activeCity)).length === 0 && (
                                    <Text style={{ color: '#999', fontStyle: 'italic' }}>Bu şehir için lokasyon bulunamadı.</Text>
                                )}
                            </View>

                            {/* Fiyat */}
                            <Text style={styles.inputLabel}>Günlük Kiralama Ücreti (₺) *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Örn: 1500"
                                value={formData.gunlukFiyat}
                                onChangeText={(text) => setFormData({ ...formData, gunlukFiyat: text })}
                                keyboardType="decimal-pad"
                            />

                            {/* Combobox Helper */}
                            {(() => {
                                const renderCombobox = (label: string, value: string, options: string[], field: keyof typeof formData) => {
                                    // Local state for dropdown visibility (managed by parent state ideally, but here we can use a simple map if needed, 
                                    // or just separate state. Since this is inside a render function, we can't use hooks.
                                    // So I will convert this part to use the main component's state or a new approach.
                                    // Better approach: Add 'openDropdown' state to the main component.
                                    return (
                                        <View style={styles.comboboxContainer}>
                                            <Text style={styles.inputLabel}>{label}</Text>
                                            <TouchableOpacity
                                                style={styles.comboboxTrigger}
                                                onPress={() => setOpenDropdown(openDropdown === field ? null : field)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[styles.comboboxValue, !value && { color: '#999' }]}>
                                                    {value || 'Seçiniz...'}
                                                </Text>
                                                <Ionicons name={openDropdown === field ? "chevron-up" : "chevron-down"} size={20} color="#666" />
                                            </TouchableOpacity>

                                            {openDropdown === field && (
                                                <View style={styles.comboboxDropdown}>
                                                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
                                                        {options.map((opt) => (
                                                            <TouchableOpacity
                                                                key={opt}
                                                                style={[styles.comboboxItem, value === opt && styles.comboboxItemActive]}
                                                                onPress={() => {
                                                                    setFormData({ ...formData, [field]: opt });
                                                                    setOpenDropdown(null);
                                                                }}
                                                            >
                                                                <Text style={[styles.comboboxItemText, value === opt && styles.comboboxItemTextActive]}>
                                                                    {opt}
                                                                </Text>
                                                                {value === opt && <Ionicons name="checkmark" size={18} color="#1a73e8" />}
                                                            </TouchableOpacity>
                                                        ))}
                                                    </ScrollView>
                                                </View>
                                            )}
                                        </View>
                                    );
                                };

                                return (
                                    <View>
                                        {renderCombobox('Yakıt Tipi', formData.yakitTipi, ['BENZIN', 'DIZEL', 'ELEKTRIK', 'HIBRIT'], 'yakitTipi')}
                                        {renderCombobox('Vites Tipi', formData.vitesTipi, ['MANUEL', 'OTOMATIK'], 'vitesTipi')}
                                        {renderCombobox('Araç Sınıfı', formData.aracSinifi, CLASSES, 'aracSinifi')}
                                        {renderCombobox('Kasa Tipi', formData.kasaTipi, CASE_TYPES, 'kasaTipi')}
                                    </View>
                                );
                            })()}

                            {/* Koşullar Header */}
                            <View style={styles.divider} />
                            <Text style={styles.sectionTitle}>Kiralama Koşulları & Limitler</Text>

                            {/* Koşullar Grid - Row 1 */}
                            <View style={styles.formRow}>
                                <View style={styles.formCol}>
                                    <Text style={styles.inputLabelSmall}>Min. Sürücü Yaşı</Text>
                                    <TextInput
                                        style={styles.inputSmall}
                                        value={formData.minYas}
                                        onChangeText={(text) => setFormData({ ...formData, minYas: text })}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={styles.formCol}>
                                    <Text style={styles.inputLabelSmall}>Min. Genç Yaş</Text>
                                    <TextInput
                                        style={styles.inputSmall}
                                        value={formData.minGencYas}
                                        onChangeText={(text) => setFormData({ ...formData, minGencYas: text })}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            {/* Koşullar Grid - Row 2 */}
                            <View style={styles.formRow}>
                                <View style={styles.formCol}>
                                    <Text style={styles.inputLabelSmall}>Min. Ehliyet Yılı</Text>
                                    <TextInput
                                        style={styles.inputSmall}
                                        value={formData.minEhliyetYili}
                                        onChangeText={(text) => setFormData({ ...formData, minEhliyetYili: text })}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={styles.formCol}>
                                    <Text style={styles.inputLabelSmall}>Min. Genç Ehliyet Yılı</Text>
                                    <TextInput
                                        style={styles.inputSmall}
                                        value={formData.minGencEhliyetYili}
                                        onChangeText={(text) => setFormData({ ...formData, minGencEhliyetYili: text })}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={styles.formRow}>
                                <View style={styles.formCol2}>
                                    <Text style={styles.inputLabel}>Günlük KM Limiti</Text>
                                    <View style={styles.inputWithUnit}>
                                        <TextInput
                                            style={styles.inputFlex}
                                            value={formData.gunlukKmLimiti}
                                            onChangeText={(text) => setFormData({ ...formData, gunlukKmLimiti: text })}
                                            keyboardType="numeric"
                                        />
                                        <Text style={styles.inputUnit}>KM</Text>
                                    </View>
                                </View>
                                <View style={styles.formCol2}>
                                    <Text style={styles.inputLabel}>Teminat Tutarı</Text>
                                    <View style={styles.inputWithUnit}>
                                        <TextInput
                                            style={styles.inputFlex}
                                            value={formData.teminatTutari}
                                            onChangeText={(text) => setFormData({ ...formData, teminatTutari: text })}
                                            keyboardType="numeric"
                                        />
                                        <Text style={styles.inputUnit}>TL</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Resim URL */}
                            <View style={styles.divider} />
                            <Text style={styles.inputLabel}>Resim URL (İsteğe Bağlı)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="https://..."
                                value={formData.resimUrl}
                                onChangeText={(text) => setFormData({ ...formData, resimUrl: text })}
                                autoCapitalize="none"
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => {
                                        setModalVisible(false);
                                        resetForm();
                                    }}
                                >
                                    <Text style={styles.cancelButtonText}>İptal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.confirmButton]}
                                    onPress={handleSubmit}
                                >
                                    <Text style={styles.confirmButtonText}>
                                        {isEditing ? 'Aracı Güncelle' : 'Aracı Kaydet'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                visible={deleteModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Araç Silme</Text>
                        <Text style={styles.modalSubtitle}>
                            {aracToDelete?.marka} {aracToDelete?.model} aracını silmek üzeresiniz.
                            Lütfen silme sebebini belirtiniz.
                        </Text>

                        <Text style={styles.inputLabel}>Silme Sebebi</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Örn: Satıldı, Hurdaya ayrıldı, Yanlış kayıt..."
                            value={deleteReason}
                            onChangeText={setDeleteReason}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setDeleteModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.deleteButton]}
                                onPress={confirmDelete}
                            >
                                <Text style={styles.deleteButtonText}>Sil</Text>
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
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    cardPlaka: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },

    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    cardBody: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    infoText: {
        fontSize: 13,
        color: '#666',
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
        backgroundColor: '#1a73e8',
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
        maxHeight: '85%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        lineHeight: 20,
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
    buttonGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    groupButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
    },
    groupButtonActive: {
        backgroundColor: '#1a73e8',
    },
    groupButtonText: {
        fontSize: 13,
        color: '#666',
    },
    groupButtonTextActive: {
        color: '#fff',
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
        backgroundColor: '#1a73e8',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    // Yeni eklenen stiller
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    cardImage: {
        width: 60,
        height: 40,
        borderRadius: 4,
        backgroundColor: '#f0f0f0',
    },
    placeholderImage: {
        width: 60,
        height: 40,
        borderRadius: 4,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        flex: 1,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    conditionsButton: {
        borderColor: '#1a73e8',
        backgroundColor: '#e8f0fe',
    },
    conditionsButtonText: {
        color: '#1a73e8',
        fontSize: 12,
        fontWeight: '600',
    },
    editButton: {
        borderColor: '#f0a500',
        backgroundColor: '#fff8e1',
    },
    editButtonText: {
        color: '#f0a500',
        fontSize: 12,
        fontWeight: '600',
    },
    deleteButton: {
        borderColor: '#ff3b30',
        backgroundColor: '#fee2e2',
        marginTop: 0, // Override previous marginTop
        borderTopWidth: 1, // Override previous borderTopWidth
        borderTopColor: 'transparent', // Override
    },
    deleteButtonText: {
        color: '#ff3b30',
        fontSize: 12,
        fontWeight: '600',
    },
    // Form Layout Styles
    formRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 8,
    },
    formCol: {
        flex: 1,
    },
    formCol2: {
        width: '48%',
    },
    locationsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    locationChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#eee',
    },
    locationChipActive: {
        backgroundColor: '#e8f0fe',
        borderColor: '#1a73e8',
    },
    locationChipText: {
        fontSize: 12,
        color: '#666',
    },
    locationChipTextActive: {
        color: '#1a73e8',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a73e8',
        marginBottom: 12,
    },
    inputLabelSmall: {
        fontSize: 11,
        color: '#666',
        marginBottom: 4,
    },
    inputSmall: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 8,
        fontSize: 14,
        marginBottom: 8,
    },
    inputWithUnit: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        marginBottom: 16,
    },
    inputFlex: {
        flex: 1,
        padding: 14,
        fontSize: 16,
    },
    inputUnit: {
        paddingRight: 14,
        color: '#999',
        fontSize: 14,
    },
    groupBox: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 16,
        paddingTop: 20, // Extra space for label
        marginBottom: 16,
        marginTop: 8,
        position: 'relative',
    },
    groupBoxLabel: {
        position: 'absolute',
        top: -10,
        left: 12,
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        fontSize: 12,
        color: '#1a73e8',
        fontWeight: '600',
    },
    // Combobox Styles
    comboboxContainer: {
        marginBottom: 16,
        zIndex: 10,
    },
    comboboxTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    comboboxValue: {
        fontSize: 16,
        color: '#333',
    },
    comboboxDropdown: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    comboboxItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    comboboxItemActive: {
        backgroundColor: '#f0f7ff',
    },
    comboboxItemText: {
        fontSize: 15,
        color: '#666',
    },
    comboboxItemTextActive: {
        color: '#1a73e8',
        fontWeight: '600',
    },
});
