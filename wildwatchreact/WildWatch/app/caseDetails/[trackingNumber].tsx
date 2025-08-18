import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface IncidentDetails {
  id: string;
  trackingNumber: string;
  incidentType: string;
  dateOfIncident: string;
  timeOfIncident: string;
  location: string;
  description: string;
  status: string;
  priorityLevel: string;
  submittedAt: string;
  finishedDate?: string;
  assignedOffice?: string;
  officeAdminName?: string;
  preferAnonymous: boolean;
  tags: string[];
  evidence?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
  }>;
  witnesses?: Array<{
    id: string;
    name: string;
    contact: string;
    statement: string;
  }>;
  submittedByEmail: string;
  submittedByFullName?: string;
  submittedByPhone?: string;
  upvoteCount: number;
}

interface ProgressStep {
  title: string;
  icon: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export default function CaseDetailsScreen() {
  const { trackingNumber } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  
  console.log('Case Details Screen - Tracking Number:', trackingNumber);
  
  const API_BASE_URL = 'http://192.168.1.11:8080/api';
  
  const [incident, setIncident] = useState<IncidentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

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

  const fetchIncidentDetails = async () => {
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to fetch by tracking number first (for public incidents) - matches Android Studio logic
      let response = await fetch(`${API_BASE_URL}/incidents/track/${trackingNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // If that fails, try to fetch by ID (for user incidents) - matches Android Studio fallback
        response = await fetch(`${API_BASE_URL}/incidents/${trackingNumber}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch incident: ${response.status}`);
      }

      const incidentData = await response.json();
      setIncident(incidentData);
    } catch (error: any) {
      console.error('Error fetching incident details:', error);
      setError(error.message || 'Failed to fetch incident details');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchIncidentDetails();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchIncidentDetails();
  }, [trackingNumber, token]);

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'IN_PROGRESS':
        return '#F59E0B';
      case 'RESOLVED':
        return '#10B981';
      case 'URGENT':
        return '#EF4444';
      case 'PENDING':
        return '#FFA000';
      default:
        return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
        return '#DC2626';
      case 'MEDIUM':
        return '#F59E0B';
      case 'LOW':
        return '#10B981';
      default:
        return '#10B981';
    }
  };

  const getProgressSteps = (status: string): ProgressStep[] => {
    const steps = [
      { title: 'Submitted', icon: 'time-outline', isCompleted: false, isCurrent: false },
      { title: 'Reviewed', icon: 'eye-outline', isCompleted: false, isCurrent: false },
      { title: 'In Progress', icon: 'ellipsis-horizontal', isCompleted: false, isCurrent: false },
      { title: 'Resolved', icon: 'checkmark-outline', isCompleted: false, isCurrent: false },
    ];

    const isDismissed = status?.toUpperCase() === 'DISMISSED';
    if (isDismissed) {
      steps.push({ title: 'Dismissed', icon: 'close-outline', isCompleted: false, isCurrent: false });
    }

    switch (status?.toUpperCase()) {
      case 'SUBMITTED':
        steps[0].isCurrent = true;
        break;
      case 'REVIEWED':
        steps[0].isCompleted = true;
        steps[1].isCurrent = true;
        break;
      case 'IN_PROGRESS':
        steps[0].isCompleted = true;
        steps[1].isCompleted = true;
        steps[2].isCurrent = true;
        break;
      case 'RESOLVED':
        steps[0].isCompleted = true;
        steps[1].isCompleted = true;
        steps[2].isCompleted = true;
        steps[3].isCompleted = true;
        break;
      case 'DISMISSED':
        steps[0].isCompleted = true;
        steps[4].isCurrent = true;
        break;
    }

    return steps;
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString || dateString === '') return '-';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      return dateString || '-';
    }
  };

  const formatDateTime = (dateString: string, timeString: string) => {
    try {
      const date = new Date(dateString);
      const time = timeString ? new Date(`2000-01-01T${timeString}`) : null;
      
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      if (time) {
        const timeStr = time.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        return `${dateStr} ${timeStr}`;
      }

      return dateStr;
    } catch (error) {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={{ marginTop: 16, color: '#8B0000', fontSize: fontSize }}>Loading incident details...</Text>
      </View>
    );
  }

  if (error || !incident) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={{ marginTop: 16, color: '#EF4444', fontSize: fontSize, textAlign: 'center' }}>
          {error || 'Failed to load incident details'}
        </Text>
        <TouchableOpacity
          style={{
            marginTop: 16,
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: '#8B0000',
            borderRadius: 8,
          }}
          onPress={fetchIncidentDetails}
        >
          <Text style={{ color: '#FFFFFF', fontSize: fontSize - 1 }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progressSteps = getProgressSteps(incident.status);
  const isDismissed = incident.status?.toUpperCase() === 'DISMISSED';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      {/* Top App Bar - Android Studio Style */}
      <View style={{
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 16 }}
        >
          <Ionicons name="arrow-back" size={24} color="#8B0000" />
        </TouchableOpacity>
        
        <Text style={{
          fontSize: fontSize + 2,
          fontWeight: 'bold',
          color: '#8B0000',
          flex: 1,
        }}>
          Case Details
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Case Header - Android Studio Style */}
        <View style={{
          backgroundColor: '#FFFFFF',
          margin: margin,
          borderRadius: 12,
          padding: padding,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <Text style={{
            fontSize: fontSize + 2,
            fontWeight: 'bold',
            color: '#8B0000',
            marginBottom: 8,
          }}>
            Case: {incident.trackingNumber}
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              backgroundColor: getPriorityColor(incident.priorityLevel),
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 4,
              marginRight: 8,
            }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: fontSize - 2,
                fontWeight: '500',
                textTransform: 'uppercase',
              }}>
                {incident.priorityLevel}
              </Text>
            </View>
            
            {isDismissed && (
              <View style={{
                backgroundColor: '#6B7280',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
              }}>
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: fontSize - 2,
                  fontWeight: '500',
                }}>
                  Dismissed
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Progress Tracker - Android Studio Style */}
        <View style={{
          backgroundColor: '#FFFFFF',
          marginHorizontal: margin,
          marginBottom: margin,
          borderRadius: 12,
          padding: padding,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <Text style={{
            fontSize: fontSize + 1,
            fontWeight: 'bold',
            color: '#8B0000',
            marginBottom: 16,
          }}>
            Case Status
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            {progressSteps.map((step, index) => (
              <React.Fragment key={index}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: step.isCompleted || step.isCurrent ? '#8B0000' : '#FFFFFF',
                  borderWidth: step.isCompleted || step.isCurrent ? 0 : 2,
                  borderColor: '#8B0000',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Ionicons 
                    name={step.icon as any} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                </View>
                
                {index < progressSteps.length - 1 && (
                  <View style={{
                    flex: 1,
                    height: 2,
                    backgroundColor: step.isCompleted ? '#8B0000' : '#E5E7EB',
                    marginHorizontal: 8,
                  }} />
                )}
              </React.Fragment>
            ))}
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {progressSteps.map((step, index) => (
              <Text key={index} style={{
                fontSize: fontSize - 2,
                color: '#8B0000',
                fontWeight: '500',
                textAlign: 'center',
                flex: 1,
              }}>
                {step.title}
              </Text>
            ))}
          </View>
        </View>

        {/* Timeline - Android Studio Style */}
        <View style={{
          backgroundColor: '#FFFFFF',
          margin: margin,
          borderRadius: 12,
          padding: padding,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <Text style={{
            fontSize: fontSize + 1,
            fontWeight: 'bold',
            color: '#8B0000',
            marginBottom: 16,
          }}>
            Timeline
          </Text>
          
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="calendar" size={20} color="#8B0000" style={{ marginRight: 8 }} />
              <View>
                <Text style={{ fontSize: fontSize - 1, color: '#6B7280' }}>Submitted</Text>
                <Text style={{ fontSize: fontSize, fontWeight: '600', color: '#111827' }}>
                  {formatDate(incident.submittedAt)}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="refresh" size={20} color="#8B0000" style={{ marginRight: 8 }} />
              <View>
                <Text style={{ fontSize: fontSize - 1, color: '#6B7280' }}>Last Updated</Text>
                <Text style={{ fontSize: fontSize, fontWeight: '600', color: '#111827' }}>
                  {formatDate(incident.submittedAt)}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="calendar" size={20} color="#8B0000" style={{ marginRight: 8 }} />
              <View>
                <Text style={{ fontSize: fontSize - 1, color: '#6B7280' }}>Estimated Resolution</Text>
                <Text style={{ fontSize: fontSize, fontWeight: '600', color: '#111827' }}>
                  {incident.finishedDate ? formatDate(incident.finishedDate) : 'Pending'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Incident Details - Android Studio Style */}
        <View style={{
          backgroundColor: '#FFFFFF',
          marginHorizontal: margin,
          marginBottom: margin,
          borderRadius: 12,
          padding: padding,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="information-circle" size={24} color="#8B0000" style={{ marginRight: 8 }} />
            <Text style={{
              fontSize: fontSize + 1,
              fontWeight: 'bold',
              color: '#8B0000',
            }}>
              Incident Details
            </Text>
          </View>
          
          <View style={{
            height: 1,
            backgroundColor: '#E5E7EB',
            marginBottom: 16,
          }} />
          
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
              <Ionicons name="warning" size={20} color="#6B7280" style={{ marginRight: 8, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize - 1, color: '#6B7280' }}>Incident Type</Text>
                <Text style={{ fontSize: fontSize, color: '#111827' }}>{incident.incidentType}</Text>
              </View>
            </View>
          </View>
          
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
              <Ionicons name="location" size={20} color="#6B7280" style={{ marginRight: 8, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize - 1, color: '#6B7280' }}>Location</Text>
                <Text style={{ fontSize: fontSize, color: '#111827' }}>{incident.location}</Text>
              </View>
            </View>
          </View>
          
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
              <Ionicons name="time" size={20} color="#6B7280" style={{ marginRight: 8, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize - 1, color: '#6B7280' }}>Date & Time</Text>
                <Text style={{ fontSize: fontSize, color: '#111827' }}>
                  {formatDateTime(incident.dateOfIncident, incident.timeOfIncident)}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
              <Ionicons name="document-text" size={20} color="#6B7280" style={{ marginRight: 8, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize - 1, color: '#6B7280' }}>Description</Text>
                <Text style={{ fontSize: fontSize, color: '#111827' }}>{incident.description}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Case Information - Android Studio Style */}
        <View style={{
          backgroundColor: '#FFFFFF',
          marginHorizontal: margin,
          marginBottom: margin,
          borderRadius: 12,
          padding: padding,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="business" size={24} color="#8B0000" style={{ marginRight: 8 }} />
            <Text style={{
              fontSize: fontSize + 1,
              fontWeight: 'bold',
              color: '#8B0000',
            }}>
              Case Information
            </Text>
          </View>
          
          <View style={{
            height: 1,
            backgroundColor: '#E5E7EB',
            marginBottom: 16,
          }} />
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#E0E0E0',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons name="person" size={24} color="#6B7280" />
            </View>
            
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={{ fontSize: fontSize, fontWeight: '500', color: '#111827' }}>
                {incident.officeAdminName || 'Not Assigned'}
              </Text>
              <Text style={{ fontSize: fontSize - 1, color: '#6B7280' }}>
                Assigned on {incident.assignedOffice || 'Unknown'}
              </Text>
            </View>
          </View>
          
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
              <Ionicons name="business" size={20} color="#6B7280" style={{ marginRight: 8, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize - 1, color: '#6B7280' }}>Office</Text>
                <Text style={{ fontSize: fontSize, color: '#111827' }}>{incident.assignedOffice || 'Unknown'}</Text>
              </View>
            </View>
          </View>
          
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
              <Ionicons name="mail" size={20} color="#6B7280" style={{ marginRight: 8, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize - 1, color: '#6B7280' }}>Contact Email</Text>
                <Text style={{ fontSize: fontSize, color: '#111827' }}>tsg@wildwatch.org</Text>
              </View>
            </View>
          </View>
          
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
              <Ionicons name="call" size={20} color="#6B7280" style={{ marginRight: 8, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize - 1, color: '#6B7280' }}>Contact Phone</Text>
                <Text style={{ fontSize: fontSize, color: '#111827' }}>+1234567890</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Evidence Section - Android Studio Style */}
        {incident.evidence && incident.evidence.length > 0 && (
          <View style={{
            backgroundColor: '#FFFFFF',
            marginHorizontal: margin,
            marginBottom: margin,
            borderRadius: 12,
            padding: padding,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="images" size={24} color="#8B0000" style={{ marginRight: 8 }} />
              <Text style={{
                fontSize: fontSize + 1,
                fontWeight: 'bold',
                color: '#8B0000',
              }}>
                Submitted Evidence
              </Text>
            </View>
            
            <View style={{
              height: 1,
              backgroundColor: '#E5E7EB',
              marginBottom: 16,
            }} />
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {incident.evidence.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    width: '48%',
                    height: 120,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    overflow: 'hidden',
                  }}
                  onPress={() => {
                    setSelectedImage(item.fileUrl);
                    setShowImageModal(true);
                  }}
                >
                  <Image
                    source={{ uri: item.fileUrl }}
                    style={{ flex: 1, width: '100%' }}
                    resizeMode="cover"
                  />
                  <View style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    padding: 8,
                  }}>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: fontSize - 2 }}>
                      {formatDate(item.uploadedAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Enhanced Image Modal - Android Studio Style */}
        {showImageModal && selectedImage && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
            zIndex: 9999, // Higher than everything including top nav bar
          }}>
            {/* Top Bar with Close Button Only */}
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 80,
              backgroundColor: 'rgba(0,0,0,0.9)',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingHorizontal: 20,
              paddingTop: 20,
              zIndex: 10000, // Even higher than modal background
            }}>
              {/* Close Button (X) in Top Right */}
              <TouchableOpacity
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                }}
                onPress={() => setShowImageModal(false)}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {/* Main Content Area */}
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingTop: 80, // Account for top bar
            }}>
              {/* Image Container */}
              <View style={{
                width: '95%',
                height: '100%',
                borderRadius: 12,
                overflow: 'hidden',
                backgroundColor: 'rgba(255,255,255,0.05)',
              }}>
                <Image
                  source={{ uri: selectedImage }}
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>
        )}

        {/* Witnesses Section - Android Studio Style */}
        {incident.witnesses && incident.witnesses.length > 0 && (
          <View style={{
            backgroundColor: '#FFFFFF',
            marginHorizontal: margin,
            marginBottom: margin,
            borderRadius: 12,
            padding: padding,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="people" size={24} color="#8B0000" style={{ marginRight: 8 }} />
              <Text style={{
                fontSize: fontSize + 1,
                fontWeight: 'bold',
                color: '#8B0000',
              }}>
                Witnesses
              </Text>
            </View>
            
            <View style={{
              height: 1,
              backgroundColor: '#E5E7EB',
              marginBottom: 16,
            }} />
            
            {incident.witnesses.map((witness, index) => (
              <View key={index} style={{
                backgroundColor: '#F9FAFB',
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
              }}>
                <Text style={{
                  fontSize: fontSize,
                  color: '#111827',
                  fontWeight: '600',
                  marginBottom: 4,
                }}>
                  {witness.name}
                </Text>
                <Text style={{
                  fontSize: fontSize - 2,
                  color: '#6B7280',
                  marginBottom: 4,
                }}>
                  Contact: {witness.contact}
                </Text>
                <Text style={{
                  fontSize: fontSize - 1,
                  color: '#111827',
                  lineHeight: 20,
                }}>
                  {witness.statement}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Reporter Information - Android Studio Style */}
        <View style={{
          backgroundColor: '#FFFFFF',
          marginHorizontal: margin,
          marginBottom: margin,
          borderRadius: 12,
          padding: padding,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="person" size={24} color="#8B0000" style={{ marginRight: 8 }} />
            <Text style={{
              fontSize: fontSize + 1,
              fontWeight: 'bold',
              color: '#8B0000',
            }}>
              Reporter Information
            </Text>
          </View>
          
          <View style={{
            height: 1,
            backgroundColor: '#E5E7EB',
            marginBottom: 16,
          }} />
          
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
              <Ionicons name="person" size={20} color="#6B7280" style={{ marginRight: 8, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize - 1, color: '#6B7280' }}>Name</Text>
                <Text style={{ fontSize: fontSize, color: '#111827' }}>
                  {incident.submittedByFullName || 'Anonymous'}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
              <Ionicons name="mail" size={20} color="#6B7280" style={{ marginRight: 8, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize - 1, color: '#6B7280' }}>Email</Text>
                <Text style={{ fontSize: fontSize, color: '#111827' }}>
                  {incident.submittedByEmail || 'Not provided'}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
              <Ionicons name="call" size={20} color="#6B7280" style={{ marginRight: 8, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize - 1, color: '#6B7280' }}>Phone</Text>
                <Text style={{ fontSize: fontSize, color: '#111827' }}>
                  {incident.submittedByPhone || 'Not provided'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Next Steps - Android Studio Style */}
        <View style={{
          backgroundColor: '#FFFFFF',
          marginHorizontal: margin,
          marginBottom: margin,
          borderRadius: 12,
          padding: padding,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="list" size={24} color="#8B0000" style={{ marginRight: 8 }} />
            <Text style={{
              fontSize: fontSize + 1,
              fontWeight: 'bold',
              color: '#8B0000',
            }}>
              Next Steps
            </Text>
          </View>
          
          <View style={{
            height: 1,
            backgroundColor: '#E5E7EB',
            marginBottom: 16,
          }} />
          
          {isDismissed ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="warning" size={20} color="#6B7280" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: fontSize, color: '#6B7280' }}>
                This case has been dismissed. No further action will be taken.
              </Text>
            </View>
          ) : (
            <>
              {[
                { label: 'Initial Review', description: 'Case reviewed by security team', timeline: 'Jan 2, 2024' },
                { label: 'Incident Updates', description: 'Gathering security footage and witness statements', timeline: 'Jan 3-4, 2024' },
                { label: 'In Progress', description: 'Implementing security measures based on findings', timeline: 'Jan 5-6, 2024' },
                { label: 'Case Resolution', description: 'Final report and case closure', timeline: 'Jan 7, 2024' },
              ].map((step, index) => {
                const isCompleted = ['SUBMITTED', 'REVIEWED', 'IN_PROGRESS', 'RESOLVED'].indexOf(incident.status?.toUpperCase() || '') >= index;
                const isCurrent = ['SUBMITTED', 'REVIEWED', 'IN_PROGRESS', 'RESOLVED'].indexOf(incident.status?.toUpperCase() || '') === index;
                
                return (
                  <React.Fragment key={index}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                      <View style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: isCompleted ? '#8B0000' : isCurrent ? 'rgba(139, 0, 0, 0.7)' : 'rgba(107, 114, 128, 0.3)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}>
                        {isCompleted && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                        {isCurrent && <Ionicons name="time" size={16} color="#FFFFFF" />}
                      </View>
                      
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <Text style={{
                            fontSize: fontSize,
                            fontWeight: '500',
                            color: isCompleted || isCurrent ? '#8B0000' : '#6B7280',
                          }}>
                            {step.label}
                          </Text>
                          <Text style={{
                            fontSize: fontSize - 2,
                            color: '#6B7280',
                          }}>
                            {step.timeline}
                          </Text>
                        </View>
                        <Text style={{
                          fontSize: fontSize - 2,
                          color: '#6B7280',
                        }}>
                          {step.description}
                        </Text>
                      </View>
                    </View>
                    
                    {index < 3 && (
                      <View style={{
                        height: 1,
                        backgroundColor: '#E5E7EB',
                        marginLeft: 28,
                        marginBottom: 8,
                      }} />
                    )}
                  </React.Fragment>
                );
              })}
            </>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
