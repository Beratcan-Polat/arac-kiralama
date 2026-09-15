import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    TextInput,
    ActivityIndicator,
    ScrollView,
    Platform,
    Modal,
    SectionList,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { aracAPI } from '@/services/api';
import { Arac } from '@/types/types';

interface LocationSection {
    title: string;
    data: { sehir: string, ofisAdi: string }[];
}

export default function CustomerDashboard() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [araclar, setAraclar] = useState<Arac[]>([]);
    const [filteredAraclar, setFilteredAraclar] = useState<Arac[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    // Search Params
    const [alisYeri, setAlisYeri] = useState('');

    // Filter State
    const [activeFilters, setActiveFilters] = useState({
        segment: 'Tümü',
        kasa: 'Tümü',
        vites: 'Tümü',
        yakit: 'Tümü',
        sirala: 'Önerilen'
    });

    const [activeModalType, setActiveModalType] = useState<'filter' | 'sort' | null>(null);

    // Filter Options
    const filterOptions = {
        segment: ['Tümü', 'Ekonomik', 'Konfor', 'Lüks', 'Prestij'],
        kasa: ['Tümü', 'Sedan', 'Hatchback', 'SUV', 'Station Wagon'],
        vites: ['Tümü', 'Manuel', 'Otomatik'],
        yakit: ['Tümü', 'Benzin', 'Dizel', 'Hibrit', 'Elektrik'],
        sirala: ['Önerilen', 'Fiyat: Artan', 'Fiyat: Azalan']
    };

    // Dates
    const [alisTarihi, setAlisTarihi] = useState(new Date());
    const [iadeTarihi, setIadeTarihi] = useState(new Date(Date.now() + 86400000)); // +1 day

    // Picker Visibility
    const [showAlisPicker, setShowAlisPicker] = useState(false);
    const [showIadePicker, setShowIadePicker] = useState(false);
    const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

    const [lokasyonlar, setLokasyonlar] = useState<{ sehir: string, ofisAdi: string }[]>([]);
    const [sections, setSections] = useState<LocationSection[]>([]);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [locationSearch, setLocationSearch] = useState('');

    useEffect(() => {
        fetchLokasyonlar();
    }, []);

    // Apply Filters and Sort
    useEffect(() => {
        let result = [...araclar];

        // Filtering
        if (activeFilters.segment !== 'Tümü') {
            result = result.filter(a => a.aracSinifi === activeFilters.segment);
        }
        if (activeFilters.kasa !== 'Tümü') {
            result = result.filter(a => a.kasaTipi === activeFilters.kasa);
        }
        if (activeFilters.vites !== 'Tümü') {
            result = result.filter(a => a.vitesTipi === activeFilters.vites);
        }
        if (activeFilters.yakit !== 'Tümü') {
            result = result.filter(a => a.yakitTipi === activeFilters.yakit);
        }

        // Sorting
        if (activeFilters.sirala === 'Fiyat: Artan') {
            result.sort((a, b) => a.gunlukFiyat - b.gunlukFiyat);
        } else if (activeFilters.sirala === 'Fiyat: Azalan') {
            result.sort((a, b) => b.gunlukFiyat - a.gunlukFiyat);
        }

        setFilteredAraclar(result);
    }, [araclar, activeFilters]);

    const fetchLokasyonlar = async () => {
        try {
            const response = await aracAPI.lokasyonlar();
            setLokasyonlar(response.data);
            setSections(groupLocations(response.data));
        } catch (error) {
            console.error('Lokasyon yükleme hatası:', error);
        }
    };

    const groupLocations = (locations: { sehir: string, ofisAdi: string }[]) => {
        const groups: { [key: string]: { sehir: string, ofisAdi: string }[] } = {};

        locations.forEach(loc => {
            if (!groups[loc.sehir]) {
                groups[loc.sehir] = [];
            }
            groups[loc.sehir].push(loc);
        });

        // Convert to SectionList format and sort by city name
        return Object.keys(groups).sort().map(city => ({
            title: city,
            data: groups[city]
        }));
    };

    const filterLocations = (text: string) => {
        setLocationSearch(text);

        // Filter flat list first
        const filtered = lokasyonlar.filter(
            l => l.ofisAdi.toLowerCase().includes(text.toLowerCase()) ||
                l.sehir.toLowerCase().includes(text.toLowerCase())
        );

        // Then regroup
        setSections(groupLocations(filtered));
    };

    const handleLocationSelect = (loc: { sehir: string, ofisAdi: string }) => {
        setAlisYeri(loc.ofisAdi);
        setShowLocationModal(false);
        setLocationSearch('');
        // Reset list to full sections when closed/cleared
        setSections(groupLocations(lokasyonlar));
    };

    const handleSearch = async () => {
        // Validation
        if (!alisYeri) {
            Alert.alert('Dikkat', 'Lütfen bir alış noktası seçiniz.');
            return;
        }

        if (iadeTarihi <= alisTarihi) {
            Alert.alert('Dikkat', 'İade tarihi alış tarihinden sonra olmalıdır.');
            return;
        }

        setIsLoading(true);
        setHasSearched(true);
        try {
            // Format dates for API (YYYY-MM-DD usually required by backend, adjusted if needed)
            const alisStr = alisTarihi.toISOString().split('T')[0];
            const iadeStr = iadeTarihi.toISOString().split('T')[0];

            // Backend expects parameters: alisYeri, alisTarihi, iadeTarihi
            const response = await aracAPI.aracAra({
                alisYeri: alisYeri || undefined,
                alisTarihi: alisStr,
                iadeTarihi: iadeStr
            });
            setAraclar(response.data);
        } catch (error) {
            console.error('Araç arama hatası:', error);
            // Handle error (maybe show alert)
        } finally {
            setIsLoading(false);
        }
    };

    const onChangeAlis = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || alisTarihi;
        if (Platform.OS === 'android') {
            setShowAlisPicker(false);
        }
        setAlisTarihi(currentDate);
    };

    const onChangeIade = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || iadeTarihi;
        if (Platform.OS === 'android') {
            setShowIadePicker(false);
        }
        setIadeTarihi(currentDate);
    };

    const showDatepicker = (type: 'alis' | 'iade', mode: 'date' | 'time') => {
        setPickerMode(mode);
        if (type === 'alis') setShowAlisPicker(true);
        else setShowIadePicker(true);
    };

    const [flippedCards, setFlippedCards] = useState<number[]>([]);

    const toggleFlip = (id: number) => {
        if (flippedCards.includes(id)) {
            setFlippedCards(flippedCards.filter(cardId => cardId !== id));
        } else {
            setFlippedCards([...flippedCards, id]);
        }
    };

    const renderAracCard = (item: Arac) => {
        const isFlipped = flippedCards.includes(item.id);
        let imageSource = require('../../assets/images/default-car.jpg');

        if (item.resimUrl) {
            if (item.resimUrl.startsWith('http')) {
                imageSource = { uri: item.resimUrl };
            } else {
                const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
                imageSource = { uri: `${baseUrl}/api/dosya/${item.resimUrl}` };
            }
        }

        return (
            <View key={item.id} style={styles.card}>
                {/* Image Section or Conditions Section */}
                {isFlipped ? (
                    <View style={styles.conditionsContainer}>
                        <Text style={styles.conditionsTitle}>Kiralama Koşulları</Text>

                        <View style={styles.conditionsGrid}>
                            <View style={styles.conditionItem}>
                                <Text style={styles.conditionLabel}>Min. Sürücü Yaşı</Text>
                                <View style={styles.conditionValueRow}>
                                    <Ionicons name="person" size={14} color="#555" />
                                    <Text style={styles.conditionValue}>{item.minYas || 21}</Text>
                                </View>
                            </View>
                            <View style={styles.conditionItem}>
                                <Text style={styles.conditionLabel}>Min. Genç Yaş</Text>
                                <Text style={styles.conditionValue}>{item.minGencYas || 18}</Text>
                            </View>
                            <View style={styles.conditionItem}>
                                <Text style={styles.conditionLabel}>Min. Ehliyet Yılı</Text>
                                <View style={styles.conditionValueRow}>
                                    <Ionicons name="card" size={14} color="#555" />
                                    <Text style={styles.conditionValue}>{item.minEhliyetYili || 2} Yıl</Text>
                                </View>
                            </View>
                            <View style={styles.conditionItem}>
                                <Text style={styles.conditionLabel}>Min. Genç Ehliyet</Text>
                                <Text style={styles.conditionValue}>{item.minGencEhliyetYili || 1} Yıl</Text>
                            </View>
                        </View>

                        <View style={styles.limitsRow}>
                            <View style={styles.limitItem}>
                                <Text style={styles.limitLabel}>Limit:</Text>
                                <Text style={styles.limitValueRed}>{item.gunlukKmLimiti || 500} KM</Text>
                            </View>
                            <View style={styles.limitItem}>
                                <Text style={styles.limitLabel}>Teminat:</Text>
                                <Text style={styles.limitValueGreen}>{item.teminatTutari || 2000} TL</Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View>
                        <Image
                            source={imageSource}
                            style={styles.cardImage}
                            resizeMode="contain"
                        />
                        {/* Top Right Badges */}
                        <View style={styles.cardBadges}>
                            <View style={styles.badgeWarning}>
                                <Text style={styles.badgeWarningText}>{item.aracSinifi || 'Ekonomik'}</Text>
                            </View>
                            <View style={styles.badgeDark}>
                                <Text style={styles.badgeDarkText}>{item.kasaTipi || 'Sedan'}</Text>
                            </View>
                        </View>
                    </View>
                )}

                <View style={styles.cardContent}>
                    {/* Title */}
                    <Text style={styles.cardTitle}>{item.marka} {item.model}</Text>

                    {/* Features (Fuel & Gear) */}
                    <View style={styles.featuresRow}>
                        <View style={styles.featureChip}>
                            <Ionicons name="flame" size={14} color="#555" />
                            <Text style={styles.featureText}>{item.yakitTipi}</Text>
                        </View>
                        <View style={styles.featureChip}>
                            <Ionicons name="cog" size={14} color="#555" />
                            <Text style={styles.featureText}>{item.vitesTipi}</Text>
                        </View>


                    </View>

                    {/* Price */}
                    <View style={styles.priceContainer}>
                        <Text style={styles.priceAmount}>₺{Number(item.gunlukFiyat).toFixed(2)}</Text>
                        <Text style={styles.pricePeriod}>/ Gün</Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                            style={[styles.outlineButton, isFlipped && { backgroundColor: '#1a73e8', borderColor: '#1a73e8' }]}
                            onPress={() => toggleFlip(item.id)}
                        >
                            <Ionicons name={isFlipped ? "image" : "information-circle-outline"} size={18} color={isFlipped ? "#fff" : "#1a73e8"} />
                            <Text style={[styles.outlineButtonText, isFlipped && { color: '#fff' }]}>
                                {isFlipped ? 'Aracı Gör' : 'Koşulları Gör'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => router.push({
                                pathname: '/rent',
                                params: {
                                    aracId: item.id,
                                    alisTarihi: alisTarihi ? alisTarihi.toISOString() : undefined,
                                    iadeTarihi: iadeTarihi ? iadeTarihi.toISOString() : undefined
                                }
                            } as any)}
                        >
                            <Ionicons name="checkmark-circle" size={18} color="#fff" />
                            <Text style={styles.primaryButtonText}>Hemen Kirala</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
            {/* Header Area */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Araç Kiralama</Text>
                <Text style={styles.headerSubtitle}>İstediğiniz aracı hemen kiralayın</Text>
            </View>

            {/* Search Form Card */}
            <View style={styles.searchCard}>
                {/* Location Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Alış Noktası</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="location-sharp" size={20} color="#1a73e8" style={styles.inputIcon} />
                        <TouchableOpacity style={{ flex: 1, justifyContent: 'center' }} onPress={() => setShowLocationModal(true)}>
                            <Text style={[styles.inputText, !alisYeri && { color: '#999' }]}>
                                {alisYeri || 'Şehir veya havalimanı seçin'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Date Inputs Check-in */}
                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.label}>Alış Tarihi</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={() => showDatepicker('alis', 'date')}>
                            <Ionicons name="calendar-outline" size={18} color="#555" />
                            <Text style={styles.dateText}>{alisTarihi.toLocaleDateString('tr-TR')}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.label}>Saat</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={() => showDatepicker('alis', 'time')}>
                            <Ionicons name="time-outline" size={18} color="#555" />
                            <Text style={styles.dateText}>{alisTarihi.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Date Inputs Check-out */}
                <View style={[styles.row, { marginTop: 12 }]}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.label}>İade Tarihi</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={() => showDatepicker('iade', 'date')}>
                            <Ionicons name="calendar-outline" size={18} color="#555" />
                            <Text style={styles.dateText}>{iadeTarihi.toLocaleDateString('tr-TR')}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.label}>Saat</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={() => showDatepicker('iade', 'time')}>
                            <Ionicons name="time-outline" size={18} color="#555" />
                            <Text style={styles.dateText}>{iadeTarihi.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Button */}
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                    <Text style={styles.searchButtonText}>Araçları Keşfet</Text>
                    {isLoading && <ActivityIndicator size="small" color="#000" style={{ marginLeft: 8 }} />}
                </TouchableOpacity>
            </View>

            {/* Date Pickers (Android/iOS handling needed usually, simplifying for now) */}
            {showAlisPicker && (
                <DateTimePicker
                    value={alisTarihi}
                    mode={pickerMode}
                    is24Hour={true}
                    display="default"
                    onChange={onChangeAlis}
                />
            )}
            {showIadePicker && (
                <DateTimePicker
                    value={iadeTarihi}
                    mode={pickerMode}
                    is24Hour={true}
                    display="default"
                    onChange={onChangeIade}
                />
            )}

            {/* Content Area */}
            <View style={styles.contentArea}>
                {!hasSearched ? (
                    /* Initial Hero State */
                    <View style={styles.heroContainer}>
                        <View style={styles.heroIconContainer}>
                            <Ionicons name="search" size={60} color="#1a73e8" />
                        </View>
                        <Text style={styles.heroTitle}>Yolculuğunuz Burada Başlıyor!</Text>
                        <Text style={styles.heroSubtitle}>
                        </Text>
                    </View>
                ) : (
                    /* Search Results */
                    <View>
                        {/* Filter Buttons Row */}
                        <View style={styles.filterActionRow}>
                            <TouchableOpacity style={styles.filterActionButton} onPress={() => setActiveModalType('filter')}>
                                <Ionicons name="options-outline" size={20} color="#333" />
                                <Text style={styles.filterActionText}>Filtrele</Text>
                            </TouchableOpacity>
                            <View style={styles.filterActionDivider} />
                            <TouchableOpacity style={styles.filterActionButton} onPress={() => setActiveModalType('sort')}>
                                <Ionicons name="swap-vertical-outline" size={20} color="#333" />
                                <Text style={styles.filterActionText}>Sırala</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.resultsTitle}>
                            {filteredAraclar.length > 0 ? `${filteredAraclar.length} araç bulundu` : 'Araç bulunamadı'}
                        </Text>
                        {filteredAraclar.map(renderAracCard)}
                    </View>
                )}
            </View>

            {/* Location Selection Modal */}
            <Modal
                visible={showLocationModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowLocationModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Alış Noktası Seçin</Text>
                        <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalSearch}>
                        <Ionicons name="search" size={20} color="#666" />
                        <TextInput
                            style={styles.modalSearchInput}
                            placeholder="Şehir veya ofis ara..."
                            value={locationSearch}
                            onChangeText={filterLocations}
                            autoFocus={false}
                        />
                    </View>

                    <SectionList
                        sections={sections}
                        keyExtractor={(item) => item.ofisAdi}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.locationItem} onPress={() => handleLocationSelect(item)}>
                                <View style={styles.locationIcon}>
                                    <Ionicons name="business" size={24} color="#1a73e8" />
                                </View>
                                <View>
                                    <Text style={styles.locationName}>{item.ofisAdi}</Text>
                                    <Text style={styles.locationCity}>{item.sehir}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        renderSectionHeader={({ section: { title } }) => (
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionHeaderText}>{title}</Text>
                            </View>
                        )}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        stickySectionHeadersEnabled={true}
                    />
                </View>
            </Modal>

            {/* General Filter/Sort Modal */}
            <Modal
                visible={activeModalType !== null}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setActiveModalType(null)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {activeModalType === 'sort' ? 'Sıralama' : 'Filtreleme'}
                        </Text>
                        <TouchableOpacity onPress={() => setActiveModalType(null)}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                        {activeModalType === 'sort' ? (
                            // Sort Options
                            filterOptions.sirala.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.filterOptionItem,
                                        activeFilters.sirala === option && styles.filterOptionItemSelected
                                    ]}
                                    onPress={() => {
                                        setActiveFilters(prev => ({ ...prev, sirala: option }));
                                        setActiveModalType(null);
                                    }}
                                >
                                    <Text style={[
                                        styles.filterOptionText,
                                        activeFilters.sirala === option && styles.filterOptionTextSelected
                                    ]}>
                                        {option}
                                    </Text>
                                    {activeFilters.sirala === option && (
                                        <Ionicons name="checkmark" size={20} color="#1a73e8" />
                                    )}
                                </TouchableOpacity>
                            ))
                        ) : (
                            // Filter Options (Consolidated)
                            <View style={{ gap: 24 }}>
                                {/* Segment */}
                                <View>
                                    <Text style={styles.filterSectionTitle}>Segment</Text>
                                    <View style={styles.wrapContainer}>
                                        {filterOptions.segment.map(opt => (
                                            <TouchableOpacity
                                                key={opt}
                                                style={[styles.chipItem, activeFilters.segment === opt && styles.chipItemSelected]}
                                                onPress={() => setActiveFilters(prev => ({ ...prev, segment: opt }))}
                                            >
                                                <Text style={[styles.chipText, activeFilters.segment === opt && styles.chipTextSelected]}>{opt}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Kasa */}
                                <View>
                                    <Text style={styles.filterSectionTitle}>Kasa Tipi</Text>
                                    <View style={styles.wrapContainer}>
                                        {filterOptions.kasa.map(opt => (
                                            <TouchableOpacity
                                                key={opt}
                                                style={[styles.chipItem, activeFilters.kasa === opt && styles.chipItemSelected]}
                                                onPress={() => setActiveFilters(prev => ({ ...prev, kasa: opt }))}
                                            >
                                                <Text style={[styles.chipText, activeFilters.kasa === opt && styles.chipTextSelected]}>{opt}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Vites */}
                                <View>
                                    <Text style={styles.filterSectionTitle}>Vites</Text>
                                    <View style={styles.wrapContainer}>
                                        {filterOptions.vites.map(opt => (
                                            <TouchableOpacity
                                                key={opt}
                                                style={[styles.chipItem, activeFilters.vites === opt && styles.chipItemSelected]}
                                                onPress={() => setActiveFilters(prev => ({ ...prev, vites: opt }))}
                                            >
                                                <Text style={[styles.chipText, activeFilters.vites === opt && styles.chipTextSelected]}>{opt}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Yakıt */}
                                <View>
                                    <Text style={styles.filterSectionTitle}>Yakıt</Text>
                                    <View style={styles.wrapContainer}>
                                        {filterOptions.yakit.map(opt => (
                                            <TouchableOpacity
                                                key={opt}
                                                style={[styles.chipItem, activeFilters.yakit === opt && styles.chipItemSelected]}
                                                onPress={() => setActiveFilters(prev => ({ ...prev, yakit: opt }))}
                                            >
                                                <Text style={[styles.chipText, activeFilters.yakit === opt && styles.chipTextSelected]}>{opt}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <TouchableOpacity style={styles.applyButton} onPress={() => setActiveModalType(null)}>
                                    <Text style={styles.applyButtonText}>Uygula</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </Modal>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#1a73e8',
        padding: 24,
        paddingBottom: 60,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    searchCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: -40,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: 44,
        fontSize: 15,
        color: '#333',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        padding: 10,
        height: 44,
    },
    dateText: {
        marginLeft: 8,
        color: '#333',
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 12,
    },
    searchButton: {
        backgroundColor: '#ffc107',
        borderRadius: 8,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        flexDirection: 'row',
    },
    searchButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    contentArea: {
        padding: 16,
    },
    heroContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        opacity: 0.8,
    },
    heroIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(26, 115, 232, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    heroTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    resultsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        elevation: 3,
    },
    cardImage: {
        width: '100%',
        height: 180,
        backgroundColor: '#f9f9f9',
    },
    cardBadges: {
        position: 'absolute',
        top: 10,
        right: 10,
        flexDirection: 'row',
        gap: 6,
    },
    badgeWarning: {
        backgroundColor: '#ffc107',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeWarningText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000',
        textTransform: 'capitalize',
    },
    badgeDark: {
        backgroundColor: '#5a6268',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeDarkText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
        textTransform: 'capitalize',
    },
    cardContent: {
        padding: 16,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    featuresRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    featureChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#eee',
        gap: 6,
    },
    featureText: {
        fontSize: 13,
        color: '#333',
        fontWeight: '600',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'flex-end',
        marginBottom: 16,
    },
    priceAmount: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1a73e8',
    },
    pricePeriod: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
        fontWeight: '500',
    },
    actionButtonsContainer: {
        gap: 12,
    },
    outlineButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#1a73e8',
        backgroundColor: '#fff',
        gap: 8,
    },
    outlineButtonText: {
        color: '#1a73e8',
        fontSize: 15,
        fontWeight: 'bold',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 8,
        backgroundColor: '#198754', // Green from screenshot
        gap: 8,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Keep Filter Styles logic...
    filterModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    filterActionRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 16,
        padding: 4,
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    filterActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    filterActionDivider: {
        width: 1,
        backgroundColor: '#eee',
        marginVertical: 8,
    },
    filterActionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    filterSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    wrapContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chipItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#eee',
    },
    chipItemSelected: {
        backgroundColor: '#e3f2fd',
        borderColor: '#1a73e8',
    },
    chipText: {
        fontSize: 14,
        color: '#666',
    },
    chipTextSelected: {
        color: '#1a73e8',
        fontWeight: '600',
    },
    applyButton: {
        backgroundColor: '#1a73e8',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 16,
    },
    applyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    filterOptionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f9f9f9',
    },
    filterOptionItemSelected: {
        backgroundColor: '#f5fcf9',
    },
    filterOptionText: {
        fontSize: 16,
        color: '#333',
    },
    filterOptionTextSelected: {
        color: '#1a73e8',
        fontWeight: 'bold',
    },
    inputText: {
        fontSize: 15,
        color: '#333',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalSearch: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        margin: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        height: 48,
    },
    modalSearchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    locationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    locationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e3f2fd',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    locationName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    locationCity: {
        fontSize: 13,
        color: '#666',
    },
    separator: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginLeft: 68,
    },
    sectionHeader: {
        backgroundColor: '#e0e0e0',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    sectionHeaderText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#555',
    },
    // Conditions View Styles
    conditionsContainer: {
        height: 180,
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        justifyContent: 'space-between',
    },
    conditionsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1a73e8',
        textAlign: 'center',
        marginBottom: 8,
    },
    conditionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 8,
    },
    conditionItem: {
        width: '48%',
    },
    conditionLabel: {
        fontSize: 10,
        color: '#666',
        marginBottom: 2,
    },
    conditionValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    conditionValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    limitsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    limitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    limitLabel: {
        fontSize: 11,
        color: '#666',
    },
    limitValueRed: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#dc3545',
    },
    limitValueGreen: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#198754',
    },
    mlAuto: {
        marginLeft: 'auto',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeAvailable: {
        backgroundColor: '#e8f5e9',
    },
    badgeUnavailable: {
        backgroundColor: '#ffebee',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#2e7d32',
    },
});
