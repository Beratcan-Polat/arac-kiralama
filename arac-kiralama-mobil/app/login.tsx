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
    Platform,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [sifre, setSifre] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login, user } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !sifre) {
            Alert.alert('Hata', 'E-posta ve şifre gerekli');
            return;
        }

        setIsLoading(true);
        try {
            await login(email, sifre);
            // Rol bazlı yönlendirme _layout.tsx'de yapılıyor
        } catch (error: any) {
            Alert.alert('Giriş Hatası', error.message || 'Giriş yapılamadı');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.innerContainer}>
                {/* Logo/Başlık */}
                {/* Form Card with Logo */}
                <View style={styles.form}>
                    <View style={styles.header}>
                        <FontAwesome5 name="road" size={60} color="#0d6efd" style={{ marginBottom: 10 }} />
                        <Text style={styles.title}>RotaCar</Text>
                        <Text style={styles.subtitle}>Yolculuğunuz burada başlar</Text>
                    </View>

                    <Text style={styles.formTitle}>Giriş Yap</Text>

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

                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>Giriş Yap</Text>
                                <Ionicons name="log-in-outline" size={24} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Register Link */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Hesabınız yok mu? </Text>
                    <Link href={"/register" as any} asChild>
                        <TouchableOpacity>
                            <Text style={styles.linkText}>Kayıt Ol</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1e3c72', // Web gradient start color
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
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // Slightly transparent white
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
        backgroundColor: '#0d6efd', // Bootstrap Primary Blue
        borderRadius: 12,
        height: 54,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        shadowColor: '#0d6efd',
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
