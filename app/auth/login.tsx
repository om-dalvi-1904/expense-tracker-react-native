import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import type { AuthResponse, LoginCredentials, RegisterCredentials } from '@/types/auth';
import apiClient from '@/utils/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

type AuthMode = 'login' | 'register';

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleSubmit = async () => {
    try {
      console.log('Starting auth process:', mode);
      console.log('Form data:', { ...formData, password: '****' });

      // Validate form data
      if (mode === 'register') {
        if (!formData.username || !formData.email || !formData.password) {
          console.log('Registration validation failed: Missing fields');
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Please fill in all fields',
          });
          return;
        }

        // Register request
        const registerData: RegisterCredentials = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
        };

        console.log('Sending registration request...');
        
        try {
          const response = await apiClient.post<AuthResponse>(
            '/users/register',
            registerData
          );
          
          console.log('Registration response:', {
            status: response.status,
            data: response.data,
          });

          if (response.data.message) {
            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: response.data.message,
            });
            // After successful registration, switch to login mode
            setMode('login');
            setFormData(prev => ({ ...prev, password: '' }));
          }
        } catch (registerError: any) {
          console.error('Registration failed:', {
            status: registerError.response?.status,
            data: registerError.response?.data,
            error: registerError.message,
          });
          throw registerError;
        }
      } else {
        // Login validation
        if (!formData.email || !formData.password) {
          console.log('Login validation failed: Missing email or password');
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Please enter email and password',
          });
          return;
        }

        // Login request
        const loginData: LoginCredentials = {
          email: formData.email,
          password: formData.password,
        };

        console.log('Sending login request...');
        
        try {
          const response = await apiClient.post<AuthResponse>(
            '/users/login',
            loginData
          );

          console.log('Login response:', {
            status: response.status,
            hasToken: !!response.data.token,
            data: { ...response.data, token: response.data.token ? '[HIDDEN]' : undefined },
          });

          const { token, username, email } = response.data;

          if (token) {
            // Store the token
            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userEmail', email || '');
            await AsyncStorage.setItem('username', username || '');

            // Configure API client defaults for future requests
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: 'Login successful',
            });

            // Navigate to home
            router.replace('/(tabs)');
          } else {
            console.error('Login response missing token:', response.data);
            throw new Error('Login response missing token');
          }
        } catch (loginError: any) {
          console.error('Login failed:', {
            status: loginError.response?.status,
            data: loginError.response?.data,
            error: loginError.message,
          });
          throw loginError;
        }
      }
    } catch (error: any) {
      // Log detailed error information
      console.error('Auth error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        }
      });

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || error.message || 'Something went wrong',
      });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>Expense Tracker</ThemedText>
            <ThemedText style={styles.subtitle}>
              {mode === 'login' ? 'Welcome back!' : 'Create your account'}
            </ThemedText>
          </View>

          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, mode === 'login' && styles.activeToggle]}
              onPress={() => setMode('login')}
            >
              <ThemedText style={styles.toggleText}>Login</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, mode === 'register' && styles.activeToggle]}
              onPress={() => setMode('register')}
            >
              <ThemedText style={styles.toggleText}>Register</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {mode === 'register' && (
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#666"
                value={formData.username}
                onChangeText={(text) => setFormData({ ...formData, username: text })}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666"
              secureTextEntry
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>
                {mode === 'login' ? 'Login' : 'Register'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    opacity: 0.8,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 30,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: Colors.light.tint,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
