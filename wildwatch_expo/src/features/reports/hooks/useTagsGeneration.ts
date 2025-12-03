import { useCallback, useState } from 'react';

export const useTagsGeneration = (apiBaseUrl: string, token: string | null) => {
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);
  const [isGeneratingTags, setIsGeneratingTags] = useState<boolean>(false);
  const [tagsError, setTagsError] = useState<string | null>(null);

  const generateTags = useCallback(async (
    description: string, 
    incidentType: string, 
    location: string,
    formattedAddress?: string,
    buildingName?: string,
    buildingCode?: string,
    latitude?: number,
    longitude?: number
  ): Promise<void> => {
    if (!token) throw new Error('Not authenticated');
    if (!description.trim() || !location.trim()) throw new Error('Missing fields');
    setIsGeneratingTags(true);
    setTagsError(null);
    setGeneratedTags([]);
    try {
      const res = await fetch(`${apiBaseUrl}/tags/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          description: description.trim(), 
          incidentType: incidentType,
          location: location.trim(),
          formattedAddress: formattedAddress,
          buildingName: buildingName,
          buildingCode: buildingCode,
          latitude: latitude,
          longitude: longitude,
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to generate tags: ${res.status} - ${errorText}`);
      }
      const data = await res.json();
      setGeneratedTags(data.tags || []);
    } catch (e: any) {
      setTagsError(e?.message || 'Failed to generate tags');
      throw e;
    } finally {
      setIsGeneratingTags(false);
    }
  }, [apiBaseUrl, token]);

  return { generatedTags, isGeneratingTags, tagsError, generateTags, setGeneratedTags };
};



