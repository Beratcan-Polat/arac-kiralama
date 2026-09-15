import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Linking,
    Platform,
    TextInput,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

// Ofis Verileri (Web'den alındı - Tam Liste 39 Ofis)
const offices = [
    // İstanbul (5)
    { id: 1, name: 'İstanbul Havalimanı', city: 'İstanbul', lat: 41.2619, lng: 28.7419, phone: '+90 212 555 01 01', address: 'Tayakadın, İstanbul Havalimanı, 34283 Arnavutköy/İstanbul' },
    { id: 2, name: 'İstanbul Sabiha Gökçen Havalimanı', city: 'İstanbul', lat: 40.8986, lng: 29.3092, phone: '+90 216 555 01 02', address: 'Sanayi, 34906 Pendik/İstanbul' },
    { id: 3, name: 'İstanbul Ataşehir Watergarden AVM', city: 'İstanbul', lat: 40.9871, lng: 29.1264, phone: '+90 216 555 01 03', address: 'Barbaros, 34746 Ataşehir/İstanbul' },
    { id: 4, name: 'İstanbul Maltepe Park AVM', city: 'İstanbul', lat: 40.9337, lng: 29.1435, phone: '+90 216 555 01 04', address: 'Cevizli, Tugay Yolu Cd. No:67, 34846 Maltepe/İstanbul' },
    { id: 5, name: 'İstanbul Kadıköy', city: 'İstanbul', lat: 40.9833, lng: 29.0333, phone: '+90 216 555 01 05', address: 'Caferağa, 34710 Kadıköy/İstanbul' },

    // Ankara (4)
    { id: 6, name: 'Ankara Esenboğa Havalimanı', city: 'Ankara', lat: 40.1281, lng: 32.9951, phone: '+90 312 555 02 01', address: 'Balıkhisar, Esenboğa Havalimanı, 06780 Çubuk/Ankara' },
    { id: 7, name: 'Ankara YHT Gar', city: 'Ankara', lat: 39.9334, lng: 32.8597, phone: '+90 312 555 02 02', address: 'Eti, Celal Bayar Blv. No:78, 06570 Çankaya/Ankara' },
    { id: 8, name: 'Ankara Atlantis AVM', city: 'Ankara', lat: 39.9042, lng: 32.8289, phone: '+90 312 555 02 03', address: 'Batıkent, Başkent Blv. No: 224, 06370 Yenimahalle/Ankara' },
    { id: 9, name: 'Ankara Kızılay', city: 'Ankara', lat: 39.9199, lng: 32.8543, phone: '+90 312 555 02 04', address: 'Kızılay Meydanı, Çankaya/Ankara' },

    // İzmir (3)
    { id: 10, name: 'İzmir Adnan Menderes Havalimanı', city: 'İzmir', lat: 38.2924, lng: 27.1569, phone: '+90 232 555 03 01', address: 'Dokuz Eylül, 35425 Gaziemir/İzmir' },
    { id: 11, name: 'İzmir Mavibahçe AVM', city: 'İzmir', lat: 38.4189, lng: 27.1287, phone: '+90 232 555 03 02', address: 'Mavişehir, Caher Dudayev Blv, 35590 Karşıyaka/İzmir' },
    { id: 12, name: 'İzmir Otogar', city: 'İzmir', lat: 38.4039, lng: 27.1349, phone: '+90 232 555 03 03', address: 'Karacaoğlan, 35070 Bornova/İzmir' },

    // Adana (3)
    { id: 13, name: 'Adana Şakirpaşa Havalimanı', city: 'Adana', lat: 36.9822, lng: 35.2804, phone: '+90 322 555 06 01', address: 'Şakirpaşa, Adana' },
    { id: 14, name: 'Adana Optimum AVM', city: 'Adana', lat: 37.0000, lng: 35.3213, phone: '+90 322 555 06 02', address: 'Sinanpaşa, Hacı Sabancı Blv. No: 28, 01220 Yüreğir/Adana' },
    { id: 15, name: 'Adana Otogar', city: 'Adana', lat: 36.9914, lng: 35.3251, phone: '+90 322 555 06 03', address: 'Fevzipaşa, Turhan Cemal Beriker Blv., 01190 Seyhan/Adana' },

    // Antalya (3)
    { id: 16, name: 'Antalya Havalimanı', city: 'Antalya', lat: 36.8987, lng: 30.8005, phone: '+90 242 555 04 01', address: 'Antalya Havalimanı, 07230 Muratpaşa/Antalya' },
    { id: 17, name: 'Antalya Terra City AVM', city: 'Antalya', lat: 36.8850, lng: 30.7069, phone: '+90 242 555 04 02', address: 'Fener, Tekelioğlu Cd. No: 55, 07160 Muratpaşa/Antalya' },
    { id: 18, name: 'Antalya Otogar', city: 'Antalya', lat: 36.8992, lng: 30.6954, phone: '+90 242 555 04 03', address: 'Yeni Doğan, Dumlupınar Blv., 07090 Kepez/Antalya' },

    // Bursa (1)
    { id: 19, name: 'Bursa Yenişehir Havalimanı', city: 'Bursa', lat: 40.2331, lng: 29.5625, phone: '+90 224 555 05 01', address: 'Yenişehir, Bursa' },

    // Adıyaman (2)
    { id: 20, name: 'Adıyaman Havalimanı', city: 'Adıyaman', lat: 37.7314, lng: 38.4689, phone: '+90 416 555 07 01', address: 'Adıyaman Havalimanı' },
    { id: 21, name: 'Adıyaman Merkez', city: 'Adıyaman', lat: 37.7648, lng: 38.2763, phone: '+90 416 555 07 02', address: 'Adıyaman Merkez' },

    // Afyonkarahisar (2)
    { id: 22, name: 'Afyonkarahisar Zafer Havalimanı', city: 'Afyonkarahisar', lat: 38.7269, lng: 30.5833, phone: '+90 272 555 08 01', address: 'Zafer Havalimanı' },
    { id: 23, name: 'Afyonkarahisar Otogar', city: 'Afyonkarahisar', lat: 38.7574, lng: 30.5387, phone: '+90 272 555 08 02', address: 'Afyonkarahisar Otogar' },

    // Ağrı (2)
    { id: 24, name: 'Ağrı Havalimanı', city: 'Ağrı', lat: 39.6545, lng: 43.0260, phone: '+90 472 555 09 01', address: 'Ağrı Ahmed-i Hani Havalimanı' },
    { id: 25, name: 'Ağrı Merkez', city: 'Ağrı', lat: 39.7191, lng: 43.0503, phone: '+90 472 555 09 02', address: 'Ağrı Merkez' },

    // Aksaray (1)
    { id: 26, name: 'Aksaray Otogar', city: 'Aksaray', lat: 38.3687, lng: 34.0370, phone: '+90 382 555 10 01', address: 'Aksaray Şehirlerarası Otobüs Terminali' },

    // Amasya (2)
    { id: 27, name: 'Amasya Merzifon Havalimanı', city: 'Amasya', lat: 40.8294, lng: 35.5219, phone: '+90 358 555 11 01', address: 'Merzifon Havalimanı' },
    { id: 28, name: 'Amasya Merkez', city: 'Amasya', lat: 40.6499, lng: 35.8353, phone: '+90 358 555 11 02', address: 'Amasya Merkez' },

    // Ardahan (1)
    { id: 29, name: 'Ardahan Merkez', city: 'Ardahan', lat: 41.1105, lng: 42.7022, phone: '+90 478 555 12 01', address: 'Ardahan Merkez' },

    // Artvin (1)
    { id: 30, name: 'Artvin Merkez', city: 'Artvin', lat: 41.1828, lng: 41.8183, phone: '+90 466 555 13 01', address: 'Artvin Merkez' },

    // Aydın (2)
    { id: 31, name: 'Aydın Çıldır Havalimanı', city: 'Aydın', lat: 37.8560, lng: 27.8416, phone: '+90 256 555 14 01', address: 'Çıldır Havalimanı' },
    { id: 32, name: 'Aydın Otogar', city: 'Aydın', lat: 37.8444, lng: 27.8458, phone: '+90 256 555 14 02', address: 'Aydın Şehirlerarası Otobüs Terminali' },

    // Balıkesir (2)
    { id: 33, name: 'Balıkesir Koca Seyit Havalimanı', city: 'Balıkesir', lat: 39.6191, lng: 27.0138, phone: '+90 266 555 15 01', address: 'Koca Seyit Havalimanı' },
    { id: 34, name: 'Balıkesir Otogar', city: 'Balıkesir', lat: 39.6484, lng: 27.8826, phone: '+90 266 555 15 02', address: 'Balıkesir Toplu Taşıma Merkezi' },

    // Bartın (1)
    { id: 35, name: 'Bartın Merkez', city: 'Bartın', lat: 41.6344, lng: 32.3375, phone: '+90 378 555 16 01', address: 'Bartın Merkez' },

    // Batman (2)
    { id: 36, name: 'Batman Havalimanı', city: 'Batman', lat: 37.9290, lng: 41.1166, phone: '+90 488 555 17 01', address: 'Batman Havalimanı' },
    { id: 37, name: 'Batman Park AVM', city: 'Batman', lat: 37.8812, lng: 41.1350, phone: '+90 488 555 17 02', address: 'Batman Park AVM' },

    // Bayburt (1)
    { id: 38, name: 'Bayburt Merkez', city: 'Bayburt', lat: 40.2552, lng: 40.2249, phone: '+90 458 555 18 01', address: 'Bayburt Merkez' },

    // Bilecik (1)
    { id: 39, name: 'Bilecik Otogar', city: 'Bilecik', lat: 40.1500, lng: 29.9833, phone: '+90 228 555 19 01', address: 'Bilecik Otogar' }
];

export default function OfficesScreen() {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredOffices = offices.filter(office =>
        office.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        office.city.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Leaflet Map HTML
    const mapHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <style>
                body { margin: 0; padding: 0; }
                #map { width: 100%; height: 100vh; }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                var map = L.map('map').setView([39.0, 35.0], 5);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap'
                }).addTo(map);

                var offices = ${JSON.stringify(filteredOffices)};
                
                var bounds = [];
                offices.forEach(function(office) {
                    var marker = L.marker([office.lat, office.lng]).addTo(map);
                    marker.bindPopup('<b>' + office.name + '</b><br>' + office.phone);
                    bounds.push([office.lat, office.lng]);
                });

                if (bounds.length > 0) {
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
            </script>
        </body>
        </html>
    `;

    const openMaps = (lat: number, lng: number, label: string) => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${lat},${lng}`;
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });
        if (url) Linking.openURL(url);
    };

    const renderOfficeCard = ({ item }: { item: typeof offices[0] }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardCity}>{item.city}</Text>
                </View>
                <TouchableOpacity
                    style={styles.mapButton}
                    onPress={() => openMaps(item.lat, item.lng, item.name)}
                >
                    <Ionicons name="navigate-circle" size={32} color="#007AFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>{item.address}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>{item.phone}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Harita Bölümü */}
            <View style={styles.mapContainer}>
                <WebView
                    originWhitelist={['*']}
                    source={{ html: mapHtml }}
                    style={styles.map}
                />
            </View>

            {/* Arama ve Liste */}
            <View style={styles.listContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#999" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Şehir veya ofis ara..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <FlatList
                    data={filteredOffices}
                    renderItem={renderOfficeCard}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    mapContainer: {
        height: 250,
        width: '100%',
    },
    map: {
        flex: 1,
    },
    listContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginTop: -20,
        paddingTop: 20,
        overflow: 'hidden',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 12,
        paddingHorizontal: 12,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    listContent: {
        padding: 16,
        paddingTop: 4,
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
    cardCity: {
        fontSize: 14,
        color: '#007AFF',
        marginTop: 2,
    },
    mapButton: {
        padding: 4,
    },
    cardBody: {
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
});
