import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import apiClient from '@/utils/apiClient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

interface MongoDBId {
  $oid: string;
}

interface MongoDBDate {
  $date: string;
}

interface Category {
  _id: MongoDBId;
  user: MongoDBId;
  name: string;
  type: 'expense' | 'income';
  createdAt: MongoDBDate;
  updatedAt: MongoDBDate;
  __v: number;
}

interface CategoryForm {
  name: string;
  type: 'expense' | 'income';
}

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState<CategoryForm>({
    name: '',
    type: 'expense'
  });

  const fetchCategories = async () => {
    try {
      console.log('Fetching categories...');
      const token = await AsyncStorage.getItem('userToken');
      console.log('Token found:', token ? 'Yes' : 'No');
      
      if (!token) {
        throw new Error('No auth token found');
      }

      // Set the default headers for all future requests
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      console.log('Making API request with token...');
      const response = await apiClient.get<Category[]>('/category/lists', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Categories response:', response.data);
      
      if (!Array.isArray(response.data)) {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response format from server');
      }
      
      setCategories(response.data);
    } catch (error: any) {
      console.error('Failed to fetch categories:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.config?.headers,
        stack: error.stack
      });

      // If token is invalid or expired, redirect to login
      if (error.response?.status === 401) {
        Toast.show({
          type: 'error',
          text1: 'Session Expired',
          text2: 'Please login again',
        });
        // Clear token and redirect to login
        await AsyncStorage.removeItem('userToken');
        router.replace('/auth/login');
        return;
      }

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || error.message || 'Failed to load categories',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    try {
      if (!formData.name.trim()) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please enter a category name',
        });
        return;
      }

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No auth token found');
      }

      await apiClient.post('/category/add', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Reset form and close modal
      setFormData({ name: '', type: 'expense' });
      setModalVisible(false);
      
      // Show success message
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Category added successfully',
      });

      // Refresh categories list
      fetchCategories();
    } catch (error: any) {
      console.error('Failed to add category:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to add category',
      });
    }
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <View style={styles.categoryItem}>
      <ThemedText style={styles.categoryName}>{item.name}</ThemedText>
      <View style={styles.rightContent}>
        <ThemedText
          style={[
            styles.categoryType,
            { color: item.type === 'expense' ? '#FF4646' : '#4CAF50' },
          ]}
        >
          {item.type}
        </ThemedText>
        <TouchableOpacity style={styles.editButton}>
          <MaterialCommunityIcons
            name="pencil-outline"
            size={20}
            color={Colors.light.tint}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.loading]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        {/* <ThemedText style={styles.title}>Categories</ThemedText> */}
      </View>

      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item._id.$oid}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onRefresh={fetchCategories}
        refreshing={loading}
      />

      <TouchableOpacity 
        style={styles.addButton} 
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
      >
        <MaterialCommunityIcons name="plus" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Add New Category</ThemedText>
            
            <TextInput
              style={styles.input}
              placeholder="Category Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholderTextColor="#666"
            />

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.type === 'expense' && styles.activeType
                ]}
                onPress={() => setFormData({ ...formData, type: 'expense' })}
              >
                <ThemedText style={styles.typeButtonText}>Expense</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.type === 'income' && styles.activeType
                ]}
                onPress={() => setFormData({ ...formData, type: 'income' })}
              >
                <ThemedText style={styles.typeButtonText}>Income</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={[styles.typeSelector, styles.actionButtons]}>
              <TouchableOpacity
                style={[styles.typeButton]}
                onPress={() => {
                  setModalVisible(false);
                  setFormData({ name: '', type: 'expense' });
                }}
              >
                <ThemedText style={styles.typeButtonText}>Cancel</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeButton, { backgroundColor: Colors.light.tint, borderRadius: 8 }]}
                onPress={handleAddCategory}
              >
                <ThemedText style={[styles.typeButtonText, { color: '#fff' }]}>
                  Add
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    width: '48%', // Make buttons take equal width
  },
  actionButtons: {
    gap: 10, // Add space between action buttons
  },
  activeType: {
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryType: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  editButton: {
    padding: 4,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
