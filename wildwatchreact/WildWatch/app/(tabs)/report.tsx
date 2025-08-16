import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// API Base URL - same as AuthContext
const API_BASE_URL = 'http://192.168.1.11:8080/api';

interface ReportForm {
  incidentType: string;
  dateOfIncident: string;
  timeOfIncident: string;
  location: string;
  description: string;
  priorityLevel: string;
}

export default function ReportScreen() {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<ReportForm>({
    incidentType: '',
    dateOfIncident: '',
    timeOfIncident: '',
    location: '',
    description: '',
    priorityLevel: 'medium'
  });

  const priorityLevels = [
    { value: 'low', label: 'Low', color: '#4CAF50' },
    { value: 'medium', label: 'Medium', color: '#FFA000' },
    { value: 'high', label: 'High', color: '#F44336' },
    { value: 'urgent', label: 'Urgent', color: '#9C27B0' }
  ];

  const handleSubmit = async () => {
    if (!token) {
      Alert.alert('Error', 'You must be logged in to report an incident');
      return;
    }

    // Basic validation
    if (!form.incidentType.trim() || !form.location.trim() || !form.description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/incidents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          dateOfIncident: form.dateOfIncident || new Date().toISOString().split('T')[0],
          timeOfIncident: form.timeOfIncident || new Date().toLocaleTimeString()
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit report: ${response.status}`);
      }

      const result = await response.json();
      Alert.alert(
        'Success', 
        'Your incident report has been submitted successfully!',
        [
          {
            text: 'View Details',
            onPress: () => router.push(`/tracking/${result.trackingNumber}` as any)
          },
          {
            text: 'OK',
            style: 'default'
          }
        ]
      );
      
      // Reset form
      setForm({
        incidentType: '',
        dateOfIncident: '',
        timeOfIncident: '',
        location: '',
        description: '',
        priorityLevel: 'medium'
      });
    } catch (error: any) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', error.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateForm = (field: keyof ReportForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-[#8B0000]">Report Incident</Text>
        <Text className="text-gray-600 mt-1">Report a new incident here</Text>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="mt-4">
          {/* Incident Type */}
          <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Incident Details</Text>
            
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Incident Type *</Text>
              <TextInput
                className="w-full h-12 border border-gray-300 rounded-lg px-3 text-base"
                placeholder="e.g., Theft, Vandalism, Harassment"
                value={form.incidentType}
                onChangeText={(text) => updateForm('incidentType', text)}
                style={{ borderColor: form.incidentType ? '#8B0000' : '#D1D5DB' }}
              />
            </View>

            {/* Date and Time */}
            <View className="flex-row space-x-3 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">Date of Incident</Text>
                <TextInput
                  className="w-full h-12 border border-gray-300 rounded-lg px-3 text-base"
                  placeholder="YYYY-MM-DD"
                  value={form.dateOfIncident}
                  onChangeText={(text) => updateForm('dateOfIncident', text)}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">Time of Incident</Text>
                <TextInput
                  className="w-full h-12 border border-gray-300 rounded-lg px-3 text-base"
                  placeholder="HH:MM"
                  value={form.timeOfIncident}
                  onChangeText={(text) => updateForm('timeOfIncident', text)}
                />
              </View>
            </View>

            {/* Location */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Location *</Text>
              <TextInput
                className="w-full h-12 border border-gray-300 rounded-lg px-3 text-base"
                placeholder="e.g., Building A, Room 101"
                value={form.location}
                onChangeText={(text) => updateForm('location', text)}
                style={{ borderColor: form.location ? '#8B0000' : '#D1D5DB' }}
              />
            </View>

            {/* Priority Level */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Priority Level</Text>
              <View className="flex-row flex-wrap gap-2">
                {priorityLevels.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    className={`px-4 py-2 rounded-full border ${
                      form.priorityLevel === level.value 
                        ? 'border-[#8B0000] bg-[#8B0000]' 
                        : 'border-gray-300 bg-white'
                    }`}
                    onPress={() => updateForm('priorityLevel', level.value)}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        form.priorityLevel === level.value ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Description *</Text>
              <TextInput
                className="w-full h-32 border border-gray-300 rounded-lg px-3 py-3 text-base"
                placeholder="Provide a detailed description of what happened..."
                value={form.description}
                onChangeText={(text) => updateForm('description', text)}
                multiline
                textAlignVertical="top"
                style={{ borderColor: form.description ? '#8B0000' : '#D1D5DB' }}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            className={`w-full h-14 rounded-lg justify-center items-center mb-6 ${
              isSubmitting ? 'opacity-70' : ''
            }`}
            style={{ backgroundColor: '#8B0000' }}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="send" size={20} color="white" />
                <Text className="text-white text-lg font-bold ml-2">Submit Report</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Help Text */}
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#1976D2" style={{ marginTop: 2 }} />
              <View className="ml-3 flex-1">
                <Text className="text-blue-800 font-medium mb-1">Important Notes:</Text>
                <Text className="text-blue-700 text-sm">
                  • All reports are confidential and will be reviewed by authorized personnel{'\n'}
                  • Provide as much detail as possible to help with investigation{'\n'}
                  • You can track your report status in the Cases tab{'\n'}
                  • Emergency situations should be reported to campus security immediately
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
