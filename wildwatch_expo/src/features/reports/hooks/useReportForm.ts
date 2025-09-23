import { useCallback, useState } from 'react';
import { type ReportForm, type WitnessInfo, type EvidenceFileInfo } from '../models/report';

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
  const updateWitness = useCallback((index: number, field: keyof WitnessInfo, value: string): void => {
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
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
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
  };
};



