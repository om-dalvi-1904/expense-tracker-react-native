import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import apiClient from '@/utils/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

interface UserProfile {
  username: string;
  email: string;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No auth token found');
      }

      const response = await apiClient.get<UserProfile>('/users/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProfile(response.data);
    } catch (error: any) {
      console.error('Failed to fetch profile:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load profile',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    try {
      // Clear all stored data
      await AsyncStorage.multiRemove(['userToken', 'userEmail', 'username']);
      
      // Clear API client auth header
      delete apiClient.defaults.headers.common['Authorization'];
      
      // Show success message
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Signed out successfully',
      });

      // Navigate back to login
      router.replace('/auth/login');
    } catch (error) {
      console.error('Sign out error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to sign out',
      });
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.loading]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ 
              uri: `https://api.dicebear.com/7.x/initials/png?seed=${profile?.username || 'Guest'}`,
            }}
            style={styles.avatar}
          />
        </View>

        <View style={styles.infoContainer}>
          <ThemedText style={styles.username}>{profile?.username || 'Guest'}</ThemedText>
          <ThemedText style={styles.email}>{profile?.email || 'No email'}</ThemedText>
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f5f5f5',
    marginTop: 40,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    opacity: 0.7,
  },
  signOutButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    position: 'absolute',
    bottom: 40,
    width: '90%',
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
