import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

export default function RegisterScreen() {
    const [ad, setAd] = useState('');
    const [email, setEmail] = useState('');
    const [sifre, setSifre] = useState('');
    const [sifreTekrar, setSifreTekrar] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { register } = useAuth();
    const router = useRouter();

    const handleRegister = async () => {
        if (!ad || !email || !sifre) {
            Alert.alert('Hata', 'Tüm alanları doldurun');
            return;
        }

        if (sifre !== sifreTekrar) {
            Alert.alert('Hata', 'Şifreler eşleşmiyor');
            return;
        }

        if (sifre.length < 6) {
            Alert.alert('Hata', 'Şifre en az 6 karakter olmalı');
            return;
        }

        setIsLoading(true);
        try {
            await register(ad, email, sifre);
            // Başarılı kayıt sonrası otomatik giriş yapılır, yönlendirme _layout.tsx'de
        } catch (error: any) {
            Alert.alert('Kayıt Hatası', error.message || 'Kayıt yapılamadı');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.innerContainer}>
                    {/* Form Card with Logo */}
                    <View style={styles.form}>
                        <View style={styles.header}>
                            <FontAwesome5 name="road" size={60} color="#198754" style={{ marginBottom: 10 }} />
                            <Text style={styles.title}>RotaCar</Text>
                            <Text style={styles.subtitle}>Aramıza katılın!</Text>
                        </View>

                        <Text style={styles.formTitle}>Kayıt Ol</Text>

                        <View style={styles.inputContainer}>
                            <View style={styles.inputIconContainer}>
                                <Ionicons name="person-outline" size={20} color="#6c757d" />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Ad Soyad"
                                placeholderTextColor="#adb5bd"
                                value={ad}
                                onChangeText={setAd}
                                autoCapitalize="words"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <View style={styles.inputIconContainer}>
                                <Ionicons name="mail-outline" size={20} color="#6c757d" />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="E-posta"
                                placeholderTextColor="#adb5bd"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <View style={styles.inputIconContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#6c757d" />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Şifre"
                                placeholderTextColor="#adb5bd"
                                value={sifre}
                                onChangeText={setSifre}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 10 }}>
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color="#6c757d"
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <View style={styles.inputIconContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#6c757d" />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Şifre Tekrar"
                                placeholderTextColor="#adb5bd"
                                value={sifreTekrar}
                                onChangeText={setSifreTekrar}
                                secureTextEntry={!showPassword}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.buttonText}>Kayıt Ol</Text>
                                    <Ionicons name="person-add-outline" size={24} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Login Link */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Zaten hesabınız var mı? </Text>
                        <Link href={"/login" as any} asChild>
                            <TouchableOpacity>
                                <Text style={styles.linkText}>Giriş Yap</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1e3c72', // Web gradient start color
    },
    scrollContent: {
        flexGrow: 1,
    },
    innerContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#333',
        marginTop: 5,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    formTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    form: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e9ecef',
        paddingHorizontal: 4,
    },
    inputIconContainer: {
        paddingHorizontal: 12,
        borderRightWidth: 1,
        borderRightColor: '#e9ecef',
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        paddingLeft: 12,
        color: '#333',
    },
    button: {
        backgroundColor: '#198754', // Bootstrap Success Green
        borderRadius: 12,
        height: 54,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        shadowColor: '#198754',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 15,
    },
    linkText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});
