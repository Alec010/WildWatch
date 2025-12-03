import { Ionicons } from '@expo/vector-icons';

export const getStatusColor = (status?: string | null): string => {
  const s = (status || '').toLowerCase();
  if (s === 'in progress') return '#2196F3';
  if (s === 'resolved') return '#4CAF50';
  if (s === 'urgent') return '#F44336';
  return '#FFA000'; // default: pending / unknown
};

export const getStatusIcon = (
  status?: string | null
): keyof typeof Ionicons.glyphMap => {
  const s = (status || '').toLowerCase();
  if (s === 'resolved') return 'checkmark-circle';
  return 'time';
};

export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

