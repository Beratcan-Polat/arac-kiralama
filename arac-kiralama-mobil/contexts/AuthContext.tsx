import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '@/services/api';
import { Kullanici, Rol, GirisYaniti } from '@/types/types';

interface AuthContextType {
    user: Kullanici | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, sifre: string) => Promise<void>;
    register: (ad: string, email: string, sifre: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<Kullanici | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Uygulama başladığında kayıtlı oturumu yükle
    useEffect(() => {
        const loadUser = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('user');
                const storedToken = await AsyncStorage.getItem('token');
                if (storedUser && storedToken) {
                    setUser(JSON.parse(storedUser));
                    setToken(storedToken);
                }
            } catch (error) {
                console.error('Session loading failed', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadUser();
    }, []);

    const login = async (email: string, sifre: string) => {
        try {
            console.log('Login attempt:', email);
            const response = await authAPI.giris(email, sifre);
            console.log('Login response:', response.data);
            const data: GirisYaniti = response.data;

            const userData: Kullanici = {
                id: data.kullaniciId,
                ad: data.ad,
                email: email,
                rol: data.rol,
            };
            console.log('User data:', userData);

            // Token ve kullanıcıyı kaydet
            await AsyncStorage.setItem('token', data.token);
            await AsyncStorage.setItem('user', JSON.stringify(userData));

            setToken(data.token);
            setUser(userData);
            console.log('Login successful, role:', userData.rol);
        } catch (error: any) {
            console.error('Login error:', error);
            console.error('Error response:', error.response?.data);
            throw new Error(error.response?.data?.message || error.response?.data || 'Giriş başarısız');
        }
    };

    const register = async (ad: string, email: string, sifre: string) => {
        try {
            const response = await authAPI.kayit(ad, email, sifre);
            const data: GirisYaniti = response.data;

            const userData: Kullanici = {
                id: data.kullaniciId,
                ad: data.ad,
                email: email,
                rol: data.rol,
            };

            // Token ve kullanıcıyı kaydet (Register sonrası otomatik login)
            await AsyncStorage.setItem('token', data.token);
            await AsyncStorage.setItem('user', JSON.stringify(userData));

            setToken(data.token);
            setUser(userData);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Kayıt başarısız');
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            setToken(null);
            setUser(null);
        } catch (error) {
            console.error('Çıkış hatası:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isAuthenticated: !!token && !!user,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
