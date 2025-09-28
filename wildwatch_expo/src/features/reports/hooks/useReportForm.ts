import { useCallback, useState } from 'react';
import { type ReportForm, type WitnessInfo, type EvidenceFileInfo } from '../models/report';
import { type LocationData } from '../../location/models/LocationModels';

export const useReportForm = () => {
  const [form, setForm] = useState<ReportForm>(() => {
    const now: Date = new Date();
    const formatter: Intl.DateTimeFormat = new Intl.DateTimeFormat('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    const timeFormatter: Intl.DateTimeFormat = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return {
      incidentType: '',
      dateOfIncident: formatter.format(now),
      timeOfIncident: timeFormatter.format(now),
      location: '',
      formattedAddress: '',
      latitude: null,
      longitude: null,
      building: '',
      buildingName: '',
      buildingCode: '',
      withinCampus: undefined,
      distanceFromCampusCenter: undefined,
      description: '',
      assignedOffice: null,
      preferAnonymous: false,
      tags: []
    };
  });

  const updateForm = useCallback((field: keyof ReportForm, value: unknown): void => {
    setForm(prev => ({ ...prev, [field]: value } as ReportForm));
  }, []);

  const resetForm = useCallback((): void => {
    setForm({
      incidentType: '',
      dateOfIncident: '',
      timeOfIncident: '',
      location: '',
      formattedAddress: '',
      latitude: null,
      longitude: null,
      building: '',
      buildingName: '',
      buildingCode: '',
      withinCampus: undefined,
      distanceFromCampusCenter: undefined,
      description: '',
      assignedOffice: null,
      preferAnonymous: false,
      tags: []
    });
  }, []);

  const [witnesses, setWitnesses] = useState<WitnessInfo[]>([]);
  const addWitness = useCallback((): void => {
    setWitnesses(prev => [...prev, { name: '', contact: '', additionalNotes: '', isRegisteredUser: false }]);
  }, []);
  const removeWitness = useCallback((index: number): void => {
    setWitnesses(prev => prev.filter((_, i) => i !== index));
  }, []);
  const updateWitness = useCallback((index: number, field: keyof WitnessInfo, value: string | number | boolean): void => {
    setWitnesses(prev => prev.map((w, i) => (i === index ? { ...w, [field]: value } : w)));
  }, []);

  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFileInfo[]>([]);
  const addEvidenceFiles = useCallback((files: EvidenceFileInfo[]): void => {
    setEvidenceFiles(prev => [...prev, ...files]);
  }, []);
  const removeEvidenceFile = useCallback((index: number): void => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  }, []);
  const clearAllEvidence = useCallback((): void => {
    setEvidenceFiles([]);
  }, []);

  const toggleTag = useCallback((tag: string): void => {
    setForm(prev => {
      if (prev.tags.includes(tag)) {
        // Allow deletion only if we have more than 3 tags (minimum 3)
        if (prev.tags.length > 3) {
          return {
            ...prev,
            tags: prev.tags.filter(t => t !== tag)
          };
        } else {
          // Don't allow deletion if we're at minimum
          return prev;
        }
      } else {
        // This shouldn't happen in the new flow, but keeping for safety
        if (prev.tags.length >= 5) {
          return prev; // Don't add if we're at maximum
        }
        return {
          ...prev,
          tags: [...prev.tags, tag]
        };
      }
    });
  }, []);

  const handleLocationSelect = useCallback((locationData: LocationData): void => {
    // Check if this is a "cleared" location (coordinates are 0,0)
    const isClearing = locationData.latitude === 0 && locationData.longitude === 0;
    
    if (isClearing) {
      // User is starting to select a new location
      console.log('Location selection started - validation disabled');
    } else {
      // User has completed location selection
      console.log('Location selection completed - validation enabled');
    }

    setForm(prev => ({
      ...prev,
      location: locationData.formattedAddress || `${locationData.latitude}, ${locationData.longitude}`,
      formattedAddress: locationData.formattedAddress || '',
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      building: locationData.building || '',
      buildingName: locationData.buildingName || '',
      buildingCode: locationData.buildingCode || '',
      withinCampus: locationData.withinCampus,
      distanceFromCampusCenter: locationData.distanceFromCampusCenter,
    }));
  }, []);

  return {
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
  };
};



