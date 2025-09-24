import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  Dimensions,
  Platform,
  Image 
} from 'react-native';
import { storage } from '../../lib/storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { type OfficeInfo, type ReportForm, type WitnessInfo } from '../../src/features/reports/models/report';
import { WitnessInput } from '../../src/features/reports/components/WitnessInput';
import { WitnessReviewCard } from '../../src/features/reports/components/WitnessReviewCard';
import LocationSection from '../../src/features/reports/components/LocationSection';
import { useReportForm } from '../../src/features/reports/hooks/useReportForm';
import { config } from '../../lib/config';
import { incidentAnalysisAPI, type AnalyzeRequest, type SimilarIncident } from '../../src/features/incidents/api/incident_analysis_api';
import BlockedContentModal from '../../components/BlockedContentModal';
import ProcessingReportModal from '../../components/ProcessingReportModal';
import SimilarIncidentsModal from '../../components/SimilarIncidentsModal';
import TopSpacing from '../../components/TopSpacing';

// Uses centralized API base URL from config

interface ProgressStepProps {
  number: number;
  title: string;
  isActive: boolean;
  isCompleted: boolean;
}

const ProgressStep: React.FC<ProgressStepProps> = ({ number, title, isActive, isCompleted }) => {
  const isSmallIPhone = Dimensions.get('window').height < 700;
  const isIPhone15Pro = Dimensions.get('window').height >= 800 && Dimensions.get('window').height < 900;
  const isIPhone15ProMax = Dimensions.get('window').height >= 900;

  const getSpacing = () => {
    if (isSmallIPhone) return { stepSize: 28, fontSize: 10, titleSize: 10 };
    if (isIPhone15Pro) return { stepSize: 32, fontSize: 11, titleSize: 11 };
    if (isIPhone15ProMax) return { stepSize: 36, fontSize: 12, titleSize: 12 };
    return { stepSize: 30, fontSize: 10, titleSize: 10 };
  };

  const { stepSize, fontSize, titleSize } = getSpacing();

  return (
    <View style={{ alignItems: 'center', minWidth: 80 }}>
      <View
        style={{
          width: stepSize,
          height: stepSize,
          borderRadius: stepSize / 2,
          backgroundColor: isCompleted ? '#8B0000' : isActive ? '#8B0000' : '#E5E7EB',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
          borderWidth: isCompleted ? 0 : isActive ? 2 : 1,
          borderColor: isActive ? '#8B0000' : '#D1D5DB',
          shadowColor: isCompleted || isActive ? '#8B0000' : 'transparent',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isCompleted || isActive ? 0.3 : 0,
          shadowRadius: 4,
          elevation: isCompleted || isActive ? 4 : 0,
        }}
      >
        <Text
          style={{
            color: isCompleted || isActive ? '#FFFFFF' : '#9CA3AF',
            fontSize: fontSize,
            fontWeight: 'bold',
          }}
        >
          {isCompleted ? '✓' : number}
        </Text>
      </View>
      <Text
        style={{
          fontSize: titleSize,
          fontWeight: isActive || isCompleted ? '700' : '500',
          color: isActive ? '#8B0000' : isCompleted ? '#8B0000' : '#9CA3AF',
          textAlign: 'center',
          lineHeight: titleSize + 2,
        }}
      >
        {title}
      </Text>
    </View>
  );
};

interface SectionHeaderProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, icon, color }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
    <Ionicons name={icon} size={24} color={color} style={{ marginRight: 12 }} />
    <Text style={{ fontSize: 18, fontWeight: 'bold', color: color }}>
      {title}
    </Text>
  </View>
);

interface FormNavigationButtonsProps {
  onBackClick: () => void;
  onNextClick: () => void;
  backText: string;
  nextText: string;
  darkRed: string;
  disabled?: boolean;
}

const FormNavigationButtons: React.FC<FormNavigationButtonsProps> = ({
  onBackClick,
  onNextClick,
  backText,
  nextText,
  darkRed,
  disabled = false,
}) => (
  <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
    <TouchableOpacity
      onPress={onBackClick}
      style={{
        flex: 1,
        height: 48,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
      }}
    >
      <Text style={{ color: '#374151', fontSize: 16, fontWeight: '600' }}>
        {backText}
      </Text>
    </TouchableOpacity>
    
    <TouchableOpacity
      onPress={onNextClick}
      disabled={disabled}
      style={{
        flex: 1,
        height: 48,
        borderRadius: 8,
        backgroundColor: disabled ? '#D1D5DB' : darkRed,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
        {nextText}
      </Text>
    </TouchableOpacity>
  </View>
);

interface HelpPanelProps {
  modifier?: any;
  darkRed: string;
}

const HelpPanel: React.FC<HelpPanelProps> = ({ modifier, darkRed }) => (
  <View
    style={[
      {
        backgroundColor: '#8B0000',
        borderColor: '#8B0000',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
      },
      modifier,
    ]}
  >
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      <Ionicons name="warning" size={24} color="#FFFFFF" style={{ marginTop: 2, marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
          Evidence Guidelines
        </Text>
        <Text style={{ color: '#FFFFFF', fontSize: 14, lineHeight: 20, marginBottom: 8 }}>
          Tips for submitting evidence:
        </Text>
        <Text style={{ color: '#FFFFFF', fontSize: 14, lineHeight: 20 }}>
          • Upload clear, high-quality images{'\n'}
          • Include relevant timestamps in photos if possible{'\n'}
          • Ensure witness additional notes are detailed and accurate{'\n'}
          • Provide contact information for follow-up
        </Text>
      </View>
    </View>
  </View>
);

export default function ReportScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offices, setOffices] = useState<OfficeInfo[]>([]);
  const [loadingOffices, setLoadingOffices] = useState(false);
  const [showOfficeDescription, setShowOfficeDescription] = useState(false);
  const [selectedOfficeDetails, setSelectedOfficeDetails] = useState<OfficeInfo | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(() => {
    const now = new Date();
    const hour = now.getHours();
    return hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  });
  const [selectedMinute, setSelectedMinute] = useState(() => {
    const now = new Date();
    return now.getMinutes();
  });
  const [selectedAmPm, setSelectedAmPm] = useState<'AM' | 'PM'>(() => {
    const now = new Date();
    return now.getHours() >= 12 ? 'PM' : 'AM';
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Refs for the time picker ScrollViews
  const hourPickerRef = useRef<ScrollView>(null);
  const minutePickerRef = useRef<ScrollView>(null);

  // Use the centralized form hook
  const {
    form,
    updateForm,
    resetForm,
    witnesses,
    addWitness,
    removeWitness,
    updateWitness,
    evidenceFiles,
    addEvidenceFiles,
    removeEvidenceFile,
    clearAllEvidence,
    toggleTag,
    handleLocationSelect,
  } = useReportForm();

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);


  // Tag generation state
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [tagsError, setTagsError] = useState<string | null>(null);

  // Image picker state
  const [isUploading, setIsUploading] = useState(false);

  // Confirmation state
  const [confirmAccurate, setConfirmAccurate] = useState(false);
  const [confirmContact, setConfirmContact] = useState(false);

  // AI Analysis state
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [blockedReasons, setBlockedReasons] = useState<string[]>([]);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [similarIncidents, setSimilarIncidents] = useState<SimilarIncident[]>([]);
  const [analysisWhy, setAnalysisWhy] = useState<{ tags: string[]; location?: string } | null>(null);

  // Responsive design constants
  const isSmallIPhone = Dimensions.get('window').height < 700;
  const isIPhone15Pro = Dimensions.get('window').height >= 800 && Dimensions.get('window').height < 900;
  const isIPhone15ProMax = Dimensions.get('window').height >= 900;

  const getSpacing = () => {
    if (isSmallIPhone) return { padding: 16, margin: 12, fontSize: 14 };
    if (isIPhone15Pro) return { padding: 18, margin: 14, fontSize: 15 };
    if (isIPhone15ProMax) return { padding: 20, margin: 16, fontSize: 16 };
    return { padding: 16, margin: 12, fontSize: 14 };
  };

  const { padding, margin, fontSize } = getSpacing();

  // Fetch token and offices on component mount
  useEffect(() => {
    storage.getToken().then(setToken).catch(() => setToken(null));
    fetchOffices();
  }, []);

  // Ensure time picker is properly positioned when opened
  useEffect(() => {
    if (showTimePicker) {
      // Small delay to ensure the picker is rendered before positioning
      const timer = setTimeout(() => {
        // Scroll hour picker to selected hour
        if (hourPickerRef.current) {
          const hourIndex = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].indexOf(selectedHour);
          hourPickerRef.current.scrollTo({ y: hourIndex * 40, animated: false });
        }
        
        // Scroll minute picker to selected minute
        if (minutePickerRef.current) {
          minutePickerRef.current.scrollTo({ y: selectedMinute * 40, animated: false });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showTimePicker, selectedHour, selectedMinute]);

  const fetchOffices = async () => {
    if (!token) return;
    
    setLoadingOffices(true);
    try {
      const response = await fetch(`${config.API.BASE_URL}/offices`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const officesData = await response.json();
        setOffices(officesData);
      } else {
        console.error('Failed to fetch offices:', response.status);
      }
    } catch (error) {
      console.error('Error fetching offices:', error);
      } finally {
      setLoadingOffices(false);
    }
  };

  const showOfficeInfo = (office: OfficeInfo) => {
    setSelectedOfficeDetails(office);
    setShowOfficeDescription(true);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add empty days for padding
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    // Group into weeks
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    
    return weeks;
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const handleTimeSelection = () => {
    const timeString = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')} ${selectedAmPm}`;
    updateForm('timeOfIncident', timeString);
    setShowTimePicker(false);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formatter = new Intl.DateTimeFormat('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
      updateForm('dateOfIncident', formatter.format(selectedDate));
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes();
      const amPm = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const timeString = `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${amPm}`;
      updateForm('timeOfIncident', timeString);
    }
  };

  // AI Analysis function
  const analyzeIncidentContent = async (incidentData: any): Promise<boolean> => {
    try {
      const analysisRequest: AnalyzeRequest = {
        incidentType: incidentData.incidentType,
        description: incidentData.description,
        location: incidentData.location,
        formattedAddress: incidentData.formattedAddress,
        buildingName: incidentData.buildingName,
        buildingCode: incidentData.buildingCode,
        latitude: incidentData.latitude,
        longitude: incidentData.longitude,
      };

      console.log('Starting AI analysis...');
      const analysis = await incidentAnalysisAPI.analyzeIncident(analysisRequest);
      console.log('AI analysis completed:', analysis);
      
      if (analysis.decision === 'BLOCK') {
        setShowProcessingModal(false);
        setBlockedReasons(analysis.reasons || ['Inappropriate content detected']);
        setShowBlockedModal(true);
        return false;
      }

      // Store context for "Why this suggestion?"
      setAnalysisWhy({
        tags: Array.isArray(analysis.suggestedTags) ? analysis.suggestedTags.slice(0, 8) : (incidentData.tags || []).slice(0, 8),
        location: analysis.normalizedLocation || incidentData.formattedAddress || incidentData.location,
      });

      // If similar incidents exist, show modal and pause submission
      if (Array.isArray(analysis.similarIncidents) && analysis.similarIncidents.length > 0) {
        setSimilarIncidents(analysis.similarIncidents);
        setShowProcessingModal(false);
        setShowSimilarModal(true);
        return false; // Pause submission to show similar incidents
      }
      
      return true;
    } catch (error: any) {
      console.error('AI Analysis Error:', error);
      
      // Hide processing modal first
      setShowProcessingModal(false);
      
      // Show user-friendly error message
      Alert.alert(
        'Analysis Unavailable', 
        error.message || 'Content analysis is temporarily unavailable. Your report will be submitted for manual review.',
        [
          {
            text: 'Continue Anyway',
            onPress: async () => {
              // Continue with submission after analysis failure
              try {
                setShowProcessingModal(true);
                await doSubmit();
              } catch (submitError) {
                console.error('Error submitting report after analysis failure:', submitError);
                Alert.alert('Error', 'Failed to submit report. Please try again.');
                setIsSubmitting(false);
                setShowProcessingModal(false);
              }
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setIsSubmitting(false);
              setShowProcessingModal(false);
            }
          }
        ]
      );
      
      // Return false to pause submission and wait for user choice
      return false;
    }
  };

  // Prepare incident data for submission
  const prepareIncidentData = () => {
      // Parse date and time for backend
      let dateObj = new Date();
      let timeObj = new Date();
      
      // Parse date (mm/dd/yyyy format)
      if (form.dateOfIncident) {
        const [month, day, year] = form.dateOfIncident.split('/');
        if (month && day && year) {
          dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
      }
      
      // Parse time (HH:MM AM/PM format)
      if (form.timeOfIncident) {
        const timeMatch = form.timeOfIncident.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          const amPm = timeMatch[3].toUpperCase();
          
          if (amPm === 'PM' && hours !== 12) hours += 12;
          if (amPm === 'AM' && hours === 12) hours = 0;
          
          timeObj.setHours(hours, minutes, 0, 0);
        }
      }

    return {
        incidentType: form.incidentType.trim(),
        dateOfIncident: dateObj.toISOString().split('T')[0],
        timeOfIncident: timeObj.toTimeString().split(' ')[0],
        location: form.formattedAddress || form.location || `${form.latitude}, ${form.longitude}`,
        formattedAddress: form.formattedAddress,
        latitude: form.latitude,
        longitude: form.longitude,
        building: form.building,
        buildingName: form.buildingName,
        buildingCode: form.buildingCode,
        withinCampus: form.withinCampus,
        distanceFromCampusCenter: form.distanceFromCampusCenter,
        description: form.description.trim(),
        preferAnonymous: form.preferAnonymous,
        tags: form.tags,
        witnesses: witnesses.filter(w => {
          // Include witnesses that have either:
          // 1. A registered user (userId exists)
          // 2. Manual entry with both name and contact
          return w.userId || (w.name.trim() && w.contact.trim());
        }).map(w => ({
          userId: w.userId || undefined,
          name: w.isRegisteredUser ? undefined : w.name.trim() || undefined,
          contactInformation: w.isRegisteredUser ? undefined : w.contact.trim() || undefined,
          additionalNotes: w.additionalNotes?.trim() || undefined,
        })),
        evidenceFiles: evidenceFiles
    };
  };

  // Actual submission function
  const doSubmit = async () => {
    if (!token) {
      Alert.alert('Error', 'You must be logged in to report an incident');
      return;
    }

    const incidentData = prepareIncidentData();

      // Create FormData for multipart request
      const formData = new FormData();
      formData.append('incidentData', JSON.stringify(incidentData));

      // Add evidence files if any
      evidenceFiles.forEach((file, index) => {
        if (file.uri) {
          // Create a file object from the URI
          const fileInfo = {
            uri: file.uri,
            type: file.type || 'image/jpeg',
            name: file.name || `evidence_${index}.jpg`
          };
          
          formData.append('files', fileInfo as any);
        }
      });

      const response = await fetch(`${config.API.BASE_URL}/incidents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to submit report: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
    // Hide processing modal and show success message
    setShowProcessingModal(false);
      Alert.alert(
        'Success', 
        'Your incident report has been submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              resetForm();
              setCurrentStep(1);
              setConfirmAccurate(false);
              setConfirmContact(false);
              
            // Navigate back to the dashboard
            router.replace('/(tabs)/dashboard' as never);
            }
          }
        ]
      );
  };

  const handleSubmit = async () => {
    if (!token) {
      Alert.alert('Error', 'You must be logged in to report an incident');
      return;
    }

    // Validation for all steps
    if (!form.incidentType.trim() || !form.dateOfIncident || !form.timeOfIncident || !form.latitude || !form.longitude || !form.description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields including location before continuing.');
      return;
    }

    setIsSubmitting(true);
    setShowProcessingModal(true);
    
    try {
      const incidentData = prepareIncidentData();

      // AI Content Analysis - Check for inappropriate content
      const isContentApproved = await analyzeIncidentContent(incidentData);
      if (!isContentApproved) {
        setIsSubmitting(false);
        return; // Stop submission if content is blocked or similar incidents found
      }

      // If we reach here, proceed with submission
      await doSubmit();
    } catch (error: any) {
      console.error('Error submitting report:', error);
      setShowProcessingModal(false);
      Alert.alert('Error', error.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };


  const nextStep = () => {
    if (currentStep === 1) {
      // Validate Step 1
      if (!form.incidentType.trim() || !form.dateOfIncident || !form.timeOfIncident || !form.latitude || !form.longitude || !form.description.trim()) {
        Alert.alert('Error', 'Please fill in all required fields including location before continuing.');
      return;
    }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };


  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (cameraStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera permissions are required to upload evidence.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = `photo_${Date.now()}.jpg`;
        
        addEvidenceFiles([{
          uri: asset.uri,
          name: fileName,
          type: 'image/jpeg',
          size: asset.fileSize || 0,
        }]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickImages = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
          size: asset.fileSize || 0,
        }));

        addEvidenceFiles(newFiles);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    }
  };

  const handleClearAllEvidence = () => {
    Alert.alert(
      'Clear All Evidence',
      'Are you sure you want to remove all evidence files?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => clearAllEvidence()
        }
      ]
    );
  };

  const generateTags = async () => {
    if (!token) {
      Alert.alert('Error', 'You must be logged in to generate tags');
      return;
    }

    if (!form.description.trim() || !form.latitude || !form.longitude) {
      Alert.alert('Error', 'Please provide both description and location to generate tags');
      return;
    }

    setIsGeneratingTags(true);
    setTagsError(null);
    setGeneratedTags([]);

    try {
      const response = await fetch(`${config.API.BASE_URL}/tags/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: form.description.trim(),
          location: form.formattedAddress || form.location || `${form.latitude}, ${form.longitude}`,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate tags: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setGeneratedTags(data.tags || []);
      Alert.alert('Success', 'Tags generated successfully! AI has analyzed your description and suggested relevant tags.');
    } catch (error: any) {
      console.error('Error generating tags:', error);
      setTagsError(error.message || 'Failed to generate tags');
      Alert.alert('Error', error.message || 'Failed to generate tags. Please try again.');
    } finally {
      setIsGeneratingTags(false);
    }
  };


  return (
    <View className="flex-1" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Top spacing for notch */}
      <TopSpacing />
      
      {/* Top App Bar */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View>
          <Text className="text-2xl font-bold text-[#8B0000]">Report an Incident</Text>
          <Text className="text-gray-600 mt-1">Submit details about a security incident or concern</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* Progress Steps */}
        <View style={{ 
          paddingHorizontal: padding, 
          marginBottom: margin,
          paddingVertical: 4
        }}>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <ProgressStep number={1} title="Incident Details" isActive={currentStep === 1} isCompleted={currentStep > 1} />
            
            <View style={{ 
              flex: 1, 
              height: 1, 
              backgroundColor: currentStep > 1 ? '#8B0000' : '#D1D5DB', 
              marginHorizontal: margin / 2,
              borderRadius: 0.5,
            }} />
            
            <ProgressStep number={2} title="Evidence & Witnesses" isActive={currentStep === 2} isCompleted={currentStep > 2} />
            
            <View style={{ 
              flex: 1, 
              height: 1, 
              backgroundColor: currentStep > 2 ? '#8B0000' : '#D1D5DB', 
              marginHorizontal: margin / 2,
              borderRadius: 0.5,
            }} />
            
            <ProgressStep number={3} title="Review & Submit" isActive={currentStep === 3} isCompleted={currentStep === 3} />
          </View>
        </View>

        {/* Main Content */}
        <View style={{ paddingHorizontal: padding }}>
          {currentStep === 1 && (
            <>
              {/* Main Form Card */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: padding + 4,
                marginBottom: margin,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}>
                <SectionHeader title="Incident Details" icon="warning" color="#8B0000" />
                
                <Text style={{
                  color: '#6B7280',
                  fontSize: fontSize - 2,
                  marginBottom: margin + 4,
                }}>
                  Provide essential information about the incident
                </Text>

                {/* Incident Type */}
                <View style={{ marginBottom: margin }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: fontSize - 1 }}>Incident Type</Text>
                    <Text style={{ color: '#8B0000', fontWeight: 'bold', marginLeft: 4 }}> *</Text>
                  </View>
                  <TextInput
                style={{
                      borderWidth: 1,
                      borderColor: form.incidentType ? '#8B0000' : '#D1D5DB',
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: fontSize - 1,
                      backgroundColor: '#FFFFFF',
                    }}
                    placeholder="Incident type"
                    placeholderTextColor="#9CA3AF"
                    value={form.incidentType}
                    onChangeText={(text) => updateForm('incidentType', text)}
                  />
                </View>

                {/* Date and Time Row */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: margin }}>
                  {/* Date of Incident */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ fontWeight: 'bold', fontSize: fontSize - 1 }}>Date of Incident</Text>
                      <Text style={{ color: '#8B0000', fontWeight: 'bold', marginLeft: 4 }}> *</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(true)}
                      style={{
                        borderWidth: 1,
                        borderColor: form.dateOfIncident ? '#8B0000' : '#D1D5DB',
                        borderRadius: 8,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        backgroundColor: '#FFFFFF',
                        flexDirection: 'row',
                  alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Text style={{
                        color: form.dateOfIncident ? '#000000' : '#9CA3AF',
                        fontSize: fontSize - 1
                      }}>
                        {form.dateOfIncident || 'mm/dd/yyyy'}
                      </Text>
                      <Ionicons name="calendar" size={20} color="#6B7280" />
                    </TouchableOpacity>
              </View>

                  {/* Time of Incident */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ fontWeight: 'bold', fontSize: fontSize - 1 }}>Time of Incident</Text>
                      <Text style={{ color: '#8B0000', fontWeight: 'bold', marginLeft: 4 }}> *</Text>
            </View>
                    <TouchableOpacity
                      onPress={() => setShowTimePicker(true)}
                      style={{
                        borderWidth: 1,
                        borderColor: form.timeOfIncident ? '#8B0000' : '#D1D5DB',
                        borderRadius: 8,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        backgroundColor: '#FFFFFF',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Text style={{
                        color: form.timeOfIncident ? '#000000' : '#9CA3AF',
                        fontSize: fontSize - 1
                      }}>
                        {form.timeOfIncident || '--:--'}
                      </Text>
                      <Ionicons name="time" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
        </View>

                {/* Date/Time Helper Text */}
                <Text style={{
                  fontSize: fontSize - 3,
                  color: '#6B7280',
                  marginBottom: margin,
                  textAlign: 'center',
                  fontStyle: 'italic'
                }}>
                  Tap the fields above to select date and time
                </Text>

                {/* Location Section */}
                <LocationSection
                  onLocationSelect={handleLocationSelect}
                  selectedLocation={form.latitude && form.longitude ? {
                    latitude: form.latitude,
                    longitude: form.longitude,
                    formattedAddress: form.formattedAddress,
                    building: form.building,
                    buildingName: form.buildingName,
                    buildingCode: form.buildingCode,
                    withinCampus: form.withinCampus,
                    distanceFromCampusCenter: form.distanceFromCampusCenter,
                  } : null}
                  disabled={false}
                  required={true}
                />



                {/* Description */}
                <View style={{ marginBottom: margin }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: fontSize - 1 }}>Description</Text>
                    <Text style={{ color: '#8B0000', fontWeight: 'bold', marginLeft: 4 }}> *</Text>
                  </View>
              <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: form.description ? '#8B0000' : '#D1D5DB',
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      height: 120,
                      fontSize: fontSize - 1,
                      backgroundColor: '#FFFFFF',
                      textAlignVertical: 'top',
                    }}
                    placeholder="Describe what happened in detail"
                placeholderTextColor="#9CA3AF"
                value={form.description}
                    onChangeText={(text) => {
                      if (text.length <= 1000) {
                        updateForm('description', text);
                      }
                    }}
                multiline
                    numberOfLines={6}
                  />
                  
                  {/* Character counter */}
                  <Text style={{
                    fontSize: fontSize - 3,
                    color: '#6B7280',
                    textAlign: 'right',
                    marginTop: 4,
                  }}>
                    {form.description.length}/1000 characters
                  </Text>
            </View>

                {/* Tag Generation */}
                <View style={{ marginBottom: margin }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: fontSize - 1 }}>Tags</Text>
                    <Text style={{ color: '#6B7280', fontSize: fontSize - 2, marginLeft: 8 }}>
                      (Optional - AI-generated based on your description)
                    </Text>
                  </View>
                  
                  {/* Generate Tags Button */}
                  <TouchableOpacity
                    onPress={generateTags}
                    disabled={isGeneratingTags || !form.description.trim() || !form.latitude || !form.longitude}
                    style={{
                      backgroundColor: isGeneratingTags || !form.description.trim() || !form.latitude || !form.longitude ? '#D1D5DB' : '#8B0000',
                      borderRadius: 8,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}
                  >
                    {isGeneratingTags ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={{ color: '#FFFFFF', fontSize: fontSize - 1, marginLeft: 8 }}>
                          Generating Tags...
                        </Text>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                        <Text style={{ color: '#FFFFFF', fontSize: fontSize - 1, marginLeft: 8 }}>
                          Generate Tags
                        </Text>
                      </View>
                    )}
                </TouchableOpacity>

                  {/* Error Message */}
                  {tagsError && (
                    <Text style={{
                      color: '#DC2626',
                      fontSize: fontSize - 2,
                      marginBottom: 12,
                      textAlign: 'center',
                    }}>
                      {tagsError}
                    </Text>
                  )}

                  {/* Generated Tags */}
                  {generatedTags.length > 0 && (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={{
                        fontWeight: '600',
                        fontSize: fontSize - 2,
                        color: '#374151',
                        marginBottom: 8,
                      }}>
                        Generated Tags:
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {generatedTags.map((tag, index) => (
                          <TouchableOpacity
                            key={index}
                            onPress={() => toggleTag(tag)}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 16,
                              backgroundColor: form.tags.includes(tag) ? '#8B0000' : '#F3F4F6',
                              borderWidth: 1,
                              borderColor: form.tags.includes(tag) ? '#8B0000' : '#D1D5DB',
                            }}
                          >
                            <Text style={{
                              color: form.tags.includes(tag) ? '#FFFFFF' : '#374151',
                              fontSize: fontSize - 2,
                              fontWeight: '500',
                            }}>
                              {tag}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Selected Tags */}
                  {form.tags.length > 0 && (
                    <View>
                      <Text style={{
                        fontWeight: '600',
                        fontSize: fontSize - 2,
                        color: '#374151',
                        marginBottom: 8,
                      }}>
                        Selected Tags:
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {form.tags.map((tag, index) => (
                          <View
                            key={index}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 16,
                              backgroundColor: '#8B0000',
                              flexDirection: 'row',
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{
                              color: '#FFFFFF',
                              fontSize: fontSize - 2,
                              fontWeight: '500',
                              marginRight: 6,
                            }}>
                              {tag}
                            </Text>
                            <TouchableOpacity onPress={() => toggleTag(tag)}>
                              <Ionicons name="close" size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                          </View>
                      ))}
                  </View>
                    </View>
                )}
              </View>

                {/* Continue Button */}
                <FormNavigationButtons
                  onBackClick={() => router.push('/(tabs)/dashboard' as never)}
                  onNextClick={nextStep}
                  backText="Cancel"
                  nextText="Continue"
                  darkRed="#8B0000"
                  disabled={!form.incidentType.trim() || !form.dateOfIncident || !form.timeOfIncident || !form.latitude || !form.longitude || !form.description.trim()}
                />
            </View>

              {/* Help Panel */}
              <HelpPanel darkRed="#8B0000" />
            </>
          )}

          {currentStep === 2 && (
            <>
              {/* Main Form Card */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: padding + 4,
                marginBottom: margin,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}>
                <SectionHeader title="Evidence & Witnesses" icon="document-text" color="#8B0000" />
                
                <Text style={{
                  color: '#6B7280',
                  fontSize: fontSize - 2,
                  marginBottom: margin + 4,
                }}>
                  Provide evidence and witness details
                </Text>

                {/* Evidence Files */}
                <View style={{ marginBottom: margin }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: fontSize - 1 }}>Evidence Files (Optional)</Text>
              </View>
                  
                  {/* Upload Options */}
                  <View style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                      {/* Camera Button */}
                      <TouchableOpacity
                        onPress={takePhoto}
                        style={{
                          flex: 1,
                          backgroundColor: '#8B0000',
                          borderRadius: 8,
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'row',
                        }}
                      >
                        <Ionicons name="camera" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#FFFFFF', fontSize: fontSize - 1, fontWeight: '600' }}>
                          Take Photo
                        </Text>
                      </TouchableOpacity>

                      {/* Gallery Button */}
                      <TouchableOpacity
                        onPress={pickImages}
                        style={{
                          flex: 1,
                          backgroundColor: '#374151',
                          borderRadius: 8,
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'row',
                        }}
                      >
                        <Ionicons name="images" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#FFFFFF', fontSize: fontSize - 1, fontWeight: '600' }}>
                          Choose Images
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Clear All Button */}
                    {evidenceFiles.length > 0 && (
                      <TouchableOpacity
                        onPress={handleClearAllEvidence}
                        style={{
                          alignSelf: 'flex-end',
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                        }}
                      >
                        <Text style={{ color: '#DC2626', fontSize: fontSize - 2, fontWeight: '600' }}>
                          Clear All
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Evidence Files Display */}
                  {evidenceFiles.length > 0 && (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={{
                        fontWeight: '600',
                        fontSize: fontSize - 2,
                        color: '#374151',
                        marginBottom: 8,
                      }}>
                        Evidence Files ({evidenceFiles.length}):
                      </Text>
                      <View style={{ gap: 8 }}>
                        {evidenceFiles.map((file, index) => (
                          <View key={index} style={{
                            backgroundColor: '#F9FAFB',
                            borderRadius: 8,
                            padding: 12,
                            borderWidth: 1,
                            borderColor: '#E5E7EB',
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}>
                            {/* File Preview */}
                            <Image
                              source={{ uri: file.uri }}
                              style={{
                                width: 50,
                                height: 50,
                                borderRadius: 6,
                                marginRight: 12,
                              }}
                              resizeMode="cover"
                            />
                            
                            {/* File Info */}
                            <View style={{ flex: 1 }}>
                              <Text style={{
                                fontWeight: '600',
                                fontSize: fontSize - 2,
                                color: '#374151',
                                marginBottom: 2,
                              }}>
                                {file.name}
                              </Text>
                              <Text style={{
                                fontSize: fontSize - 3,
                                color: '#6B7280',
                              }}>
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </Text>
                            </View>

                            {/* Remove Button */}
                            <TouchableOpacity
                              onPress={() => removeEvidenceFile(index)}
                              style={{
                                padding: 8,
                                backgroundColor: '#FEF2F2',
                                borderRadius: 6,
                              }}
                            >
                              <Ionicons name="close" size={16} color="#DC2626" />
                            </TouchableOpacity>
                          </View>
                        ))}
            </View>
          </View>
        )}

                  {/* No Files Message */}
                  {evidenceFiles.length === 0 && (
                    <View style={{
                      backgroundColor: '#F9FAFB',
                      borderRadius: 8,
                      padding: 24,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      borderStyle: 'dashed',
                    }}>
                      <Ionicons name="cloud-upload" size={32} color="#9CA3AF" style={{ marginBottom: 8 }} />
                      <Text style={{
                        color: '#6B7280',
                        fontSize: fontSize - 1,
                        textAlign: 'center',
                        marginBottom: 4,
                      }}>
                        No evidence files added yet
                      </Text>
                      <Text style={{
                        color: '#9CA3AF',
                        fontSize: fontSize - 2,
                        textAlign: 'center',
                      }}>
                        Use the buttons above to add photos or images
                      </Text>
                    </View>
                  )}
                </View>
            {/* Witnesses */}
                <View style={{ marginBottom: margin }}>
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: 16,
                    paddingHorizontal: 4
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{
                        backgroundColor: '#FEE2E2',
                        borderRadius: 20,
                        padding: 8,
                        marginRight: 12,
                      }}>
                        <Ionicons name="people" size={20} color="#800000" />
                      </View>
                      <View>
                        <Text style={{ fontWeight: 'bold', fontSize: fontSize, color: '#374151' }}>Witness Information</Text>
                        {witnesses.length > 0 && (
                          <Text style={{ 
                            fontSize: fontSize - 3, 
                            color: '#6B7280', 
                            marginTop: 2,
                            fontWeight: '500'
                          }}>
                            {witnesses.length} witness{witnesses.length !== 1 ? 'es' : ''} added
                          </Text>
                        )}
                      </View>
                    </View>
                     {witnesses.length > 0 && (
                       <TouchableOpacity
                         onPress={addWitness}
                         style={{
                           alignItems: 'center',
                           justifyContent: 'center',
                           backgroundColor: '#800000',
                           width: 40,
                           height: 40,
                           borderRadius: 20,
                           shadowColor: '#800000',
                           shadowOffset: { width: 0, height: 2 },
                           shadowOpacity: 0.3,
                           shadowRadius: 4,
                           elevation: 6,
                           borderWidth: 1,
                           borderColor: 'rgba(128, 0, 0, 0.1)',
                         }}
                         activeOpacity={0.8}
                       >
                         <Ionicons name="add" size={20} color="white" />
                       </TouchableOpacity>
                     )}
                  </View>
                  
                  {witnesses.length > 0 ? (
                    <View style={{
                      gap: 16,
                      backgroundColor: '#FAFBFC',
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                    }}>
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}>
                        <View style={{
                          width: 4,
                          height: 20,
                          backgroundColor: '#800000',
                          borderRadius: 2,
                          marginRight: 12,
                        }} />
                        <Text style={{
                          fontSize: fontSize - 2,
                          fontWeight: '600',
                          color: '#374151',
                        }}>
                          Witness List ({witnesses.length})
                        </Text>
                      </View>
                      {witnesses.map((witness, index) => (
                        <WitnessInput
                          key={index}
                          witness={witness}
                          index={index}
                          onUpdate={updateWitness}
                          onRemove={removeWitness}
                        />
                      ))}
                    </View>
                  ) : (
                    <View style={{
                      alignItems: 'center',
                      paddingVertical: 32,
                      paddingHorizontal: 24,
                      borderWidth: 1,
                      borderColor: '#D1D5DB',
                      borderStyle: 'dashed',
                      borderRadius: 12,
                      backgroundColor: '#F9FAFB'
                    }}>
                      <View style={{
                        backgroundColor: '#FEE2E2',
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 12
                      }}>
                        <Ionicons name="people" size={32} color="#800000" />
                      </View>
                      <Text style={{ 
                        fontSize: fontSize, 
                        fontWeight: '600', 
                        color: '#374151',
                        marginBottom: 8,
                        textAlign: 'center'
                      }}>
                        No Witnesses Added
                      </Text>
                      <Text style={{
                        fontSize: fontSize - 2,
                        color: '#6B7280',
                        textAlign: 'center',
                        marginBottom: 16,
                        maxWidth: 280,
                        lineHeight: 20
                      }}>
                        If anyone witnessed the incident, add their information to help with the investigation.
                      </Text>
                      <TouchableOpacity
                        onPress={addWitness}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#800000',
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 20,
                        }}
                      >
                        <Ionicons name="add" size={16} color="white" style={{ marginRight: 6 }} />
                        <Text style={{ color: 'white', fontSize: fontSize - 1, fontWeight: '500' }}>
                          Add a Witness
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
            </View>



                {/* Continue Button */}
                <FormNavigationButtons
                  onBackClick={() => setCurrentStep(1)}
                  onNextClick={nextStep}
                  backText="Back"
                  nextText="Continue"
                  darkRed="#8B0000"
                  disabled={!form.incidentType.trim() || !form.dateOfIncident || !form.timeOfIncident || !form.latitude || !form.longitude || !form.description.trim()}
                />
              </View>

              {/* Help Panel */}
              <HelpPanel darkRed="#8B0000" />
            </>
          )}

          {currentStep === 3 && (
            <>
              {/* Main Form Card */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: padding + 4,
                marginBottom: margin,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}>
                <SectionHeader title="Review & Submit" icon="checkmark-circle" color="#8B0000" />
                
                <Text style={{
                  color: '#6B7280',
                  fontSize: fontSize - 2,
                  marginBottom: margin + 4,
                }}>
                  Review your report before submitting
                </Text>

                {/* Incident Details Review */}
                <View style={{ marginBottom: margin }}>
                  <Text style={{ fontWeight: 'bold', fontSize: fontSize - 1, marginBottom: 8 }}>Incident Details</Text>
                  <View style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 12,
                  }}>
                    <Text style={{ fontWeight: '600', fontSize: fontSize - 2 }}>Incident Type:</Text>
                    <Text style={{ fontSize: fontSize - 1, marginTop: 4 }}>{form.incidentType}</Text>
                  </View>
                  <View style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 12,
                  }}>
                    <Text style={{ fontWeight: '600', fontSize: fontSize - 2 }}>Date of Incident:</Text>
                    <Text style={{ fontSize: fontSize - 1, marginTop: 4 }}>{form.dateOfIncident}</Text>
                  </View>
                  <View style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 12,
                  }}>
                    <Text style={{ fontWeight: '600', fontSize: fontSize - 2 }}>Time of Incident:</Text>
                    <Text style={{ fontSize: fontSize - 1, marginTop: 4 }}>{form.timeOfIncident}</Text>
                  </View>
                  <View style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 12,
                  }}>
                    <Text style={{ fontWeight: '600', fontSize: fontSize - 2 }}>Location:</Text>
                    <Text style={{ fontSize: fontSize - 1, marginTop: 4 }}>
                      {form.formattedAddress || form.location || `${form.latitude}, ${form.longitude}`}
                    </Text>
                    {form.buildingName && (
                      <Text style={{ fontSize: fontSize - 2, marginTop: 2, color: '#6B7280' }}>
                        Building: {form.buildingName} {form.buildingCode && `(${form.buildingCode})`}
                      </Text>
                    )}
                    {form.withinCampus !== undefined && (
                      <Text style={{ 
                        fontSize: fontSize - 2, 
                        marginTop: 2, 
                        color: form.withinCampus ? '#16a34a' : '#dc2626',
                        fontWeight: '500'
                      }}>
                        {form.withinCampus ? '✓ On Campus' : '⚠ Outside Campus'}
                      </Text>
                    )}
                  </View>
                  <View style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 12,
                  }}>
                    <Text style={{ fontWeight: '600', fontSize: fontSize - 2 }}>Description:</Text>
                    <Text style={{ fontSize: fontSize - 1, marginTop: 4 }}>{form.description}</Text>
                  </View>
                  <View style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 12,
                  }}>
                    <Text style={{ fontWeight: '600', fontSize: fontSize - 2 }}>Anonymous:</Text>
                    <Text style={{ fontSize: fontSize - 1, marginTop: 4 }}>{form.preferAnonymous ? 'Yes' : 'No'}</Text>
                  </View>
                  
                </View>

                {/* Evidence Files Review */}
                <View style={{ marginBottom: margin }}>
                  <Text style={{ fontWeight: 'bold', fontSize: fontSize - 1, marginBottom: 8 }}>Evidence Files</Text>
                  {evidenceFiles.length === 0 ? (
                    <View style={{
                      backgroundColor: '#F9FAFB',
                      borderRadius: 8,
                      padding: 16,
                      marginBottom: 12,
                    }}>
                      <Text style={{ fontSize: fontSize - 1, color: '#6B7280' }}>No evidence files added.</Text>
                </View>
              ) : (
                    <View style={{
                      backgroundColor: '#F9FAFB',
                      borderRadius: 8,
                      padding: 16,
                      marginBottom: 12,
                    }}>
                      <Text style={{
                        fontWeight: '600',
                        fontSize: fontSize - 2,
                        color: '#374151',
                        marginBottom: 12,
                      }}>
                        {evidenceFiles.length} file(s) ready for upload:
                      </Text>
                <View style={{ gap: 8 }}>
                        {evidenceFiles.map((file, index) => (
                          <View key={index} style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: 6,
                            padding: 8,
                            borderWidth: 1,
                            borderColor: '#E5E7EB',
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}>
                            {/* File Preview */}
                            <Image
                              source={{ uri: file.uri }}
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 4,
                                marginRight: 8,
                              }}
                              resizeMode="cover"
                            />
                            
                            {/* File Info */}
                      <View style={{ flex: 1 }}>
                              <Text style={{
                                fontWeight: '600',
                                fontSize: fontSize - 2,
                                color: '#374151',
                              }}>
                                {file.name}
                              </Text>
                              <Text style={{
                                fontSize: fontSize - 3,
                                color: '#6B7280',
                              }}>
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </Text>
                      </View>
                    </View>
                  ))}
                      </View>
                </View>
              )}
            </View>

                {/* Witnesses Review */}
                <View style={{ marginBottom: margin }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                    <View style={{
                      backgroundColor: '#FEE2E2',
                      borderRadius: 20,
                      padding: 8,
                      marginRight: 8,
                    }}>
                      <Ionicons name="people" size={16} color="#800000" />
                    </View>
                    <Text style={{ fontWeight: 'bold', fontSize: fontSize - 1, color: '#374151' }}>
                      Witnesses ({witnesses.length})
                    </Text>
                  </View>
                  
                  {witnesses.length === 0 ? (
                    <View style={{
                      backgroundColor: '#F9FAFB',
                      borderRadius: 8,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      alignItems: 'center',
                    }}>
                      <Text style={{ fontSize: fontSize - 1, color: '#6B7280' }}>No witnesses provided</Text>
                    </View>
                  ) : (
                    <View style={{ gap: 12 }}>
                      {witnesses.map((witness, index) => (
                        <WitnessReviewCard
                          key={index}
                          witness={witness}
                          index={index}
                        />
                      ))}
                    </View>
                  )}
                </View>



                {/* Tags Review */}
                <View style={{ marginBottom: margin }}>
                  <Text style={{ fontWeight: 'bold', fontSize: fontSize - 1, marginBottom: 8 }}>Tags</Text>
                  {form.tags.length === 0 ? (
                    <View style={{
                      backgroundColor: '#F9FAFB',
                      borderRadius: 8,
                      padding: 16,
                      marginBottom: 12,
                    }}>
                      <Text style={{ fontSize: fontSize - 1, color: '#6B7280' }}>No tags selected.</Text>
                    </View>
                  ) : (
                    <View style={{
                      backgroundColor: '#F9FAFB',
                      borderRadius: 8,
                      padding: 16,
                      marginBottom: 12,
                    }}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {form.tags.map((tag, index) => (
                          <View key={index} style={{
                            backgroundColor: '#8B0000',
                            borderRadius: 16,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                          }}>
                            <Text style={{
                              color: '#FFFFFF',
                              fontSize: fontSize - 2,
                              fontWeight: '500',
                            }}>
                              {tag}
                            </Text>
              </View>
            ))}
                      </View>
                    </View>
                  )}
            </View>

                {/* Confirmation Section */}
                <View style={{ marginBottom: margin }}>
                  <Text style={{ fontWeight: 'bold', fontSize: fontSize - 1, marginBottom: 8 }}>Confirmation</Text>
                  
                  {/* Notification Message */}
                  <View style={{
                    backgroundColor: '#E6F7FF',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: '#0070F3',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="information-circle" size={20} color="#0070F3" style={{ marginRight: 12 }} />
                      <Text style={{
                        fontSize: fontSize - 1,
                        color: '#374151',
                        lineHeight: 20,
                        flex: 1,
                      }}>
                        Your report will be reviewed by campus security personnel. You will receive a confirmation email with a tracking number once your report is submitted.
                      </Text>
                  </View>
                  </View>
                  
                  {/* Confirmation Checkboxes */}
                  <View style={{ marginBottom: 16 }}>
                    <TouchableOpacity
                      onPress={() => setConfirmAccurate(!confirmAccurate)}
                      style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}
                    >
                      <View style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        borderWidth: 2,
                        borderColor: confirmAccurate ? '#8B0000' : '#D1D5DB',
                        backgroundColor: confirmAccurate ? '#8B0000' : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                        marginTop: 2,
                      }}>
                        {confirmAccurate && (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              )}
            </View>
                      <Text style={{ 
                        color: '#374151', 
                        fontSize: fontSize - 1,
                        flex: 1,
                        lineHeight: 20,
                      }}>
                        I confirm that all information provided is accurate to the best of my knowledge.
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setConfirmContact(!confirmContact)}
                      style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}
                    >
                      <View style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        borderWidth: 2,
                        borderColor: confirmContact ? '#8B0000' : '#D1D5DB',
                        backgroundColor: confirmContact ? '#8B0000' : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                        marginTop: 2,
                      }}>
                        {confirmContact && (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              )}
            </View>
                      <Text style={{ 
                        color: '#374151', 
                        fontSize: fontSize - 1,
                        flex: 1,
                        lineHeight: 20,
                      }}>
                        I understand that campus security may contact me for additional information.
                      </Text>
                    </TouchableOpacity>
          </View>

                  {/* Anonymous Option */}
                  <View style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: 8,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="eye" size={20} color="#8B0000" style={{ marginRight: 8 }} />
                        <Text style={{ 
                          fontWeight: 'bold', 
                          fontSize: fontSize - 1, 
                          color: '#8B0000' 
                        }}>
                          Anonymity
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => updateForm('preferAnonymous', !form.preferAnonymous)}
                        style={{
                          width: 44,
                          height: 24,
                          backgroundColor: form.preferAnonymous ? '#8B0000' : '#D1D5DB',
                          borderRadius: 12,
                          padding: 2,
                          justifyContent: 'center',
                        }}
                      >
                        <View style={{
                          width: 20,
                          height: 20,
                          backgroundColor: '#FFFFFF',
                          borderRadius: 10,
                          alignSelf: form.preferAnonymous ? 'flex-end' : 'flex-start',
                        }} />
                      </TouchableOpacity>
                    </View>
                    <Text style={{
                      color: '#6B7280',
                      fontSize: fontSize - 2,
                      lineHeight: 18,
                    }}>
                      If enabled, your identity and incident will be hidden to the public. This is just a preference and may be reviewed by the admin.
                    </Text>
                  </View>
                </View>

                {/* Submit Button */}
                <FormNavigationButtons
                  onBackClick={() => setCurrentStep(2)}
                  onNextClick={() => {
                    if (!confirmAccurate || !confirmContact) {
                      Alert.alert('Confirmation Required', 'Please confirm both statements before submitting your report.');
                      return;
                    }
                    handleSubmit();
                  }}
                  backText="Back"
                  nextText="Submit Report"
                  darkRed="#8B0000"
                  disabled={!confirmAccurate || !confirmContact || isSubmitting}
                />
              </View>

              {/* Help Panel */}
              <HelpPanel darkRed="#8B0000" />
            </>
          )}
        </View>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: padding,
        }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: padding + 4,
            width: '100%',
            maxWidth: 400,
          }}>
            <Text style={{
              fontSize: fontSize + 2,
              fontWeight: 'bold',
              color: '#8B0000',
              marginBottom: 16,
              textAlign: 'center',
            }}>
              Select Date
            </Text>
            
            {/* Calendar Grid */}
            <View style={{ marginBottom: 16 }}>
              {/* Month/Year Header */}
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: 16,
                paddingHorizontal: 16
              }}>
                <TouchableOpacity onPress={() => handleMonthChange('prev')}>
                  <Ionicons name="chevron-back" size={24} color="#8B0000" />
          </TouchableOpacity>
                <Text style={{ 
                  fontSize: fontSize + 1, 
                  fontWeight: '600', 
                  color: '#374151' 
                }}>
                  {formatMonthYear(currentMonth)}
                </Text>
                <TouchableOpacity onPress={() => handleMonthChange('next')}>
                  <Ionicons name="chevron-forward" size={24} color="#8B0000" />
            </TouchableOpacity>
              </View>
              
              {/* Day Headers */}
              <View style={{ 
                flexDirection: 'row', 
                marginBottom: 8,
                paddingHorizontal: 16
              }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <View key={day} style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ 
                      fontSize: fontSize - 2, 
                      fontWeight: '600', 
                      color: '#6B7280' 
                    }}>
                      {day}
                    </Text>
                  </View>
                ))}
              </View>
              
              {/* Calendar Days Grid */}
              <View style={{ paddingHorizontal: 16 }}>
                {getDaysInMonth(currentMonth).map((week, weekIndex) => (
                  <View key={weekIndex} style={{ 
                    flexDirection: 'row', 
                    marginBottom: 8 
                  }}>
                    {week.map((day, dayIndex) => (
                      <TouchableOpacity
                        key={dayIndex}
                        style={{
                          flex: 1,
                          height: 36,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 18,
                          backgroundColor: day === new Date().getDate() && currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear() ? '#8B0000' : 'transparent',
                        }}
                        onPress={() => {
                          if (day) {
                            const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                            const formatter = new Intl.DateTimeFormat('en-US', {
                              month: '2-digit',
                              day: '2-digit',
                              year: 'numeric'
                            });
                            updateForm('dateOfIncident', formatter.format(selectedDate));
                            setShowDatePicker(false);
                          }
                        }}
                        disabled={!day}
                      >
                        <Text style={{
                          fontSize: fontSize - 1,
                          fontWeight: '500',
                          color: day === new Date().getDate() && currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear() ? '#FFFFFF' : day ? '#374151' : 'transparent',
                        }}>
                          {day || ''}
                        </Text>
            </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#374151', fontSize: fontSize - 1, fontWeight: '600' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: '#8B0000',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: fontSize - 1, fontWeight: '600' }}>
                  OK
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: padding,
        }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: padding + 4,
            width: '100%',
            maxWidth: 400,
          }}>
            <Text style={{
              fontSize: fontSize + 2,
              fontWeight: 'bold',
              color: '#8B0000',
              marginBottom: 16,
              textAlign: 'center',
            }}>
              Select Time
            </Text>
            
            {/* Sliding Time Picker */}
            <View style={{ marginBottom: 16, alignItems: 'center' }}>
              {/* Digital Time Display */}
              <View style={{
                backgroundColor: '#F8FAFC',
                borderRadius: 20,
                paddingHorizontal: 32,
                paddingVertical: 20,
                marginBottom: 24,
                borderWidth: 2,
                borderColor: '#E2E8F0',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 8,
              }}>
                <Text style={{
                  fontSize: fontSize + 8,
                  fontWeight: '800',
                  color: '#1E293B',
                  textAlign: 'center',
                  letterSpacing: 1,
                }}>
                  {`${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`}
                </Text>
                <Text style={{
                  fontSize: fontSize - 1,
                  fontWeight: '600',
                  color: '#64748B',
                  textAlign: 'center',
                  marginTop: 4,
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                }}>
                  {selectedAmPm}
                </Text>
        </View>
              
               {/* Time Picker Container */}
               <View style={{
                 flexDirection: 'row',
                 alignItems: 'center',
                 backgroundColor: '#FFFFFF',
                 borderRadius: 24,
                 paddingHorizontal: 24,
                 paddingVertical: 20,
                 marginBottom: 24,
                 shadowColor: '#000',
                 shadowOffset: { width: 0, height: 8 },
                 shadowOpacity: 0.15,
                 shadowRadius: 16,
                 elevation: 12,
                 borderWidth: 1,
                 borderColor: '#F1F5F9',
               }}>
                 {/* Hour Picker */}
                 <View style={{ alignItems: 'center', marginRight: 24 }}>
                   <Text style={{
                     fontSize: fontSize,
                     fontWeight: '700',
                     color: '#475569',
                     marginBottom: 12,
                     textTransform: 'uppercase',
                     letterSpacing: 1.5,
                   }}>
                     Hour
                   </Text>
                   <View style={{
                     height: 140,
                     width: 70,
                     backgroundColor: '#F8FAFC',
                     borderRadius: 16,
                     borderWidth: 2,
                     borderColor: '#E2E8F0',
                     overflow: 'hidden',
                     position: 'relative',
                     shadowColor: '#000',
                     shadowOffset: { width: 0, height: 2 },
                     shadowOpacity: 0.08,
                     shadowRadius: 8,
                     elevation: 4,
                   }}>
                     {/* Selection Indicator */}
                     <View style={{
                       position: 'absolute',
                       top: 50,
                       left: 0,
                       right: 0,
                       height: 40,
                       backgroundColor: 'rgba(254, 242, 242, 0.8)',
                       borderWidth: 3,
                       borderColor: '#8B0000',
                       borderRadius: 12,
                       zIndex: 0,
                       shadowColor: '#8B0000',
                       shadowOffset: { width: 0, height: 4 },
                       shadowOpacity: 0.3,
                       shadowRadius: 8,
                     }} />
                     
                     {/* Gradient Overlay for Selection */}
                     <View style={{
                       position: 'absolute',
                       top: 0,
                       left: 0,
                       right: 0,
                       height: 50,
                       backgroundColor: 'rgba(139, 0, 0, 0.03)',
                       zIndex: 0,
                     }} />
                     <View style={{
                       position: 'absolute',
                       bottom: 0,
                       left: 0,
                       right: 0,
                       height: 50,
                       backgroundColor: 'rgba(139, 0, 0, 0.03)',
                       zIndex: 0,
                     }} />
                     
                     <ScrollView
                       ref={hourPickerRef}
                       showsVerticalScrollIndicator={false}
                       snapToInterval={40}
                       decelerationRate="fast"
                       onMomentumScrollEnd={(event) => {
                         const y = event.nativeEvent.contentOffset.y;
                         const index = Math.round(y / 40);
                         const hour = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11][index] || 12;
                         setSelectedHour(hour);
                       }}
                     >
                       {/* Padding top */}
                       <View style={{ height: 50 }} />
                       {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hour, index) => (
                         <View key={hour} style={{
                           height: 40,
                           alignItems: 'center',
                           justifyContent: 'center',
                         }}>
                           <Text style={{
                             fontSize: fontSize + 4,
                             fontWeight: hour === selectedHour ? '900' : '700',
                             color: hour === selectedHour ? '#DC2626' : '#94A3B8',
                             zIndex: 2,
                           }}>
                             {hour.toString().padStart(2, '0')}
                           </Text>
                         </View>
                       ))}
                       {/* Padding bottom */}
                       <View style={{ height: 50 }} />
      </ScrollView>
                   </View>
                 </View>
                 
                 {/* Separator */}
                 <View style={{
                   width: 4,
                   height: 4,
                   borderRadius: 2,
                   backgroundColor: '#8B0000',
                   marginHorizontal: 16,
                 }} />
                 <View style={{
                   width: 4,
                   height: 4,
                   borderRadius: 2,
                   backgroundColor: '#8B0000',
                   marginHorizontal: 16,
                 }} />
                 
                 {/* Minute Picker */}
                 <View style={{ alignItems: 'center', marginLeft: 24 }}>
                   <Text style={{
                     fontSize: fontSize,
                     fontWeight: '700',
                     color: '#475569',
                     marginBottom: 12,
                     textTransform: 'uppercase',
                     letterSpacing: 1.5,
                   }}>
                     Minute
                   </Text>
                   <View style={{
                     height: 140,
                     width: 70,
                     backgroundColor: '#F8FAFC',
                     borderRadius: 16,
                     borderWidth: 2,
                     borderColor: '#E2E8F0',
                     overflow: 'hidden',
                     position: 'relative',
                     shadowColor: '#000',
                     shadowOffset: { width: 0, height: 2 },
                     shadowOpacity: 0.08,
                     shadowRadius: 8,
                     elevation: 4,
                   }}>
                     {/* Selection Indicator */}
                     <View style={{
                       position: 'absolute',
                       top: 50,
                       left: 0,
                       right: 0,
                       height: 40,
                       backgroundColor: 'rgba(254, 242, 242, 0.8)',
                       borderWidth: 3,
                       borderColor: '#8B0000',
                       borderRadius: 12,
                       zIndex: 0,
                       shadowColor: '#8B0000',
                       shadowOffset: { width: 0, height: 4 },
                       shadowOpacity: 0.3,
                       shadowRadius: 8,
                     }} />
                     
                     {/* Gradient Overlay for Selection */}
                     <View style={{
                       position: 'absolute',
                       top: 0,
                       left: 0,
                       right: 0,
                       height: 50,
                       backgroundColor: 'rgba(139, 0, 0, 0.03)',
                       zIndex: 0,
                     }} />
                     <View style={{
                       position: 'absolute',
                       bottom: 0,
                       left: 0,
                       right: 0,
                       height: 50,
                       backgroundColor: 'rgba(139, 0, 0, 0.03)',
                       zIndex: 0,
                     }} />
                     
                     <ScrollView
                       ref={minutePickerRef}
                       showsVerticalScrollIndicator={false}
                       snapToInterval={40}
                       decelerationRate="fast"
                       onMomentumScrollEnd={(event) => {
                         const y = event.nativeEvent.contentOffset.y;
                         const index = Math.round(y / 40);
                         const minute = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59][index] || 0;
                         setSelectedMinute(minute);
                       }}
                     >
                       {/* Padding top */}
                       <View style={{ height: 50 }} />
                       {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59].map((minute, index) => (
                         <View key={minute} style={{
                           height: 40,
                           alignItems: 'center',
                           justifyContent: 'center',
                         }}>
                           <Text style={{
                             fontSize: fontSize + 4,
                             fontWeight: minute === selectedMinute ? '900' : '700',
                             color: minute === selectedMinute ? '#DC2626' : '#94A3B8',
                             zIndex: 2,
                           }}>
                             {minute.toString().padStart(2, '0')}
                           </Text>
                         </View>
                       ))}
                       {/* Padding bottom */}
                       <View style={{ height: 50 }} />
                     </ScrollView>
                   </View>
                 </View>
               </View>
              
              {/* AM/PM Selection */}
              <View style={{
                flexDirection: 'row',
                gap: 16,
                marginBottom: 24,
              }}>
                <TouchableOpacity
                  onPress={() => setSelectedAmPm('AM')}
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: selectedAmPm === 'AM' ? '#8B0000' : '#FFFFFF',
                    borderWidth: 2,
                    borderColor: selectedAmPm === 'AM' ? '#8B0000' : '#E2E8F0',
                    shadowColor: selectedAmPm === 'AM' ? '#8B0000' : '#000',
                    shadowOffset: { width: 0, height: selectedAmPm === 'AM' ? 4 : 2 },
                    shadowOpacity: selectedAmPm === 'AM' ? 0.3 : 0.1,
                    shadowRadius: selectedAmPm === 'AM' ? 8 : 4,
                    elevation: selectedAmPm === 'AM' ? 8 : 2,
                  }}
                >
                  <Text style={{
                    fontSize: fontSize,
                    fontWeight: '700',
                    color: selectedAmPm === 'AM' ? '#FFFFFF' : '#475569',
                    letterSpacing: 1,
                  }}>
                    AM
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedAmPm('PM')}
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: selectedAmPm === 'PM' ? '#8B0000' : '#FFFFFF',
                    borderWidth: 2,
                    borderColor: selectedAmPm === 'PM' ? '#8B0000' : '#E2E8F0',
                    shadowColor: selectedAmPm === 'PM' ? '#8B0000' : '#000',
                    shadowOffset: { width: 0, height: selectedAmPm === 'PM' ? 4 : 2 },
                    shadowOpacity: selectedAmPm === 'PM' ? 0.3 : 0.1,
                    shadowRadius: selectedAmPm === 'PM' ? 8 : 4,
                    elevation: selectedAmPm === 'PM' ? 8 : 2,
                  }}
                >
                  <Text style={{
                    fontSize: fontSize,
                    fontWeight: '700',
                    color: selectedAmPm === 'PM' ? '#FFFFFF' : '#475569',
                    letterSpacing: 1,
                  }}>
                    PM
                  </Text>
            </TouchableOpacity>
          </View>
        </View>
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowTimePicker(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#374151', fontSize: fontSize - 1, fontWeight: '600' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleTimeSelection}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: '#8B0000',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: fontSize - 1, fontWeight: '600' }}>
                  OK
                </Text>
              </TouchableOpacity>
    </View>
          </View>
        </View>
      )}

      {/* Office Description Dialog */}
      {showOfficeDescription && selectedOfficeDetails && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: padding,
        }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: padding + 4,
            width: '100%',
            maxWidth: 400,
          }}>
            <Text style={{
              fontSize: fontSize + 2,
              fontWeight: 'bold',
              color: '#8B0000',
              marginBottom: 8,
            }}>
              {selectedOfficeDetails.fullName}
            </Text>
            <Text style={{
              fontSize: fontSize - 1,
              color: '#4B5563',
              lineHeight: 20,
              marginBottom: 16,
            }}>
              {selectedOfficeDetails.description}
            </Text>
            <TouchableOpacity
              onPress={() => setShowOfficeDescription(false)}
              style={{
                backgroundColor: '#8B0000',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
                alignSelf: 'flex-end',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: fontSize - 1, fontWeight: '600' }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* AI Content Moderation Modal */}
      <BlockedContentModal
        visible={showBlockedModal}
        onClose={() => setShowBlockedModal(false)}
        onEditReport={() => {
          setShowBlockedModal(false);
          // Optionally navigate back to edit the description
          setCurrentStep(1);
        }}
        reasons={blockedReasons}
      />

      {/* Processing Report Modal */}
      <ProcessingReportModal visible={showProcessingModal} />

      {/* Similar Incidents Modal */}
      <SimilarIncidentsModal
        visible={showSimilarModal}
        onClose={() => {
          setShowSimilarModal(false);
          setIsSubmitting(false);
        }}
        onCancelReport={() => {
          setShowSimilarModal(false);
          setIsSubmitting(false);
          Alert.alert(
            'Report Canceled',
            'You chose to cancel based on similar resolutions.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Reset form and navigate back to dashboard
                  resetForm();
                  setCurrentStep(1);
                  setConfirmAccurate(false);
                  setConfirmContact(false);
                  router.replace('/(tabs)/dashboard' as never);
                }
              }
            ]
          );
        }}
        onProceedAnyway={async () => {
          setShowSimilarModal(false);
          // Continue with submission
          try {
            setShowProcessingModal(true);
            await doSubmit();
          } catch (error) {
            console.error('Error proceeding with submission:', error);
            Alert.alert('Error', 'Failed to submit report. Please try again.');
            setIsSubmitting(false);
            setShowProcessingModal(false);
          }
        }}
        similarIncidents={similarIncidents}
        analysisWhy={analysisWhy || undefined}
      />
    </View>
  );
}

