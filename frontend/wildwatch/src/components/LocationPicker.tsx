"use client"

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MapPin,
  Navigation,
  Map,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building,
  X,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { locationService, LocationData } from '@/utils/locationService';
import MapPickerModal from './MapPickerModal';

interface LocationPickerProps {
  onLocationSelect: (locationData: LocationData) => void;
  initialLocation?: LocationData;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export default function LocationPicker({
  onLocationSelect,
  initialLocation,
  disabled = false,
  required = false,
  className = '',
}: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(initialLocation || null);
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [locationMode, setLocationMode] = useState<'none' | 'current' | 'map'>('none');

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
      setLocationMode('current'); // Assume it was from current location
    }
  }, [initialLocation]);

  const handleCurrentLocation = useCallback(async () => {
    if (disabled) return;

    setIsGettingCurrentLocation(true);
    try {
      console.log('Starting location detection...');
      
      // Get current coordinates
      const coords = await locationService.getCurrentLocation();
      console.log('Got coordinates:', coords);
      
      // Get address and building info from backend
      const geoResponse = await locationService.reverseGeocode(coords.latitude, coords.longitude);
      console.log('Backend response:', geoResponse);
      
      if (geoResponse.status === 'SUCCESS') {
        const locationData: LocationData = {
          latitude: geoResponse.latitude,
          longitude: geoResponse.longitude,
          formattedAddress: geoResponse.formattedAddress,
          building: geoResponse.building,
          buildingName: geoResponse.buildingName,
          buildingCode: geoResponse.buildingCode,
          withinCampus: geoResponse.withinCampus,
          distanceFromCampusCenter: geoResponse.distanceFromCampusCenter,
        };

        setSelectedLocation(locationData);
        setLocationMode('current');
        onLocationSelect(locationData);

        if (!geoResponse.withinCampus) {
          toast.error('Location outside campus bounds', {
            description: 'Your current location is outside the campus area. Please move to campus or use map selection to pick a location within campus bounds.',
            duration: 8000,
            icon: <AlertCircle className="h-4 w-4" />,
          });
          // Still set the location but show it as outside campus
        } else {
          toast.success('Current location detected', {
            description: `Location: ${geoResponse.buildingName || 'Campus area'}`,
            icon: <Navigation className="h-4 w-4" />,
          });
        }
      } else {
        throw new Error(geoResponse.message || 'Failed to process location');
      }
    } catch (error: any) {
      console.error('Error getting current location:', error);
      
      // More specific error messages
      let errorMessage = 'Unable to access your current location.';
      let description = 'Please try map selection instead.';
      
      if (error.message.includes('denied')) {
        errorMessage = 'Location permission denied';
        description = 'Please enable location access in your browser settings and try again.';
      } else if (error.message.includes('unavailable')) {
        errorMessage = 'Location unavailable';
        description = 'Your device location is not available. Please try map selection.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Location request timed out';
        description = 'Location detection took too long. Please try again or use map selection.';
      } else if (error.message.includes('No authentication token')) {
        errorMessage = 'Authentication required';
        description = 'Please log in again to use location services.';
      }
      
      toast.error(errorMessage, {
        description,
        icon: <AlertCircle className="h-4 w-4" />,
        duration: 6000,
      });
    } finally {
      setIsGettingCurrentLocation(false);
    }
  }, [disabled, onLocationSelect]);

  const handleMapSelection = useCallback((locationData: LocationData) => {
    setSelectedLocation(locationData);
    setLocationMode('map');
    setShowMapModal(false);
    onLocationSelect(locationData);

    toast.success('Location selected from map', {
      description: `Location: ${locationData.buildingName || 'Campus area'}`,
      icon: <Map className="h-4 w-4" />,
    });
  }, [onLocationSelect]);


  const handleClearLocation = useCallback(() => {
    setSelectedLocation(null);
    setLocationMode('none');
    // Notify parent that location was cleared
    onLocationSelect({
      latitude: 0,
      longitude: 0,
      formattedAddress: '',
      building: '',
      buildingName: '',
      buildingCode: '',
    });
  }, [onLocationSelect]);

  const renderLocationDisplay = () => {
    if (!selectedLocation) return null;

    const isOutsideCampus = selectedLocation.withinCampus === false;
    
    return (
      <Card className={`p-4 ${isOutsideCampus ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className={`h-5 w-5 ${isOutsideCampus ? 'text-red-600' : 'text-green-600'}`} />
              <span className={`font-medium ${isOutsideCampus ? 'text-red-800' : 'text-green-800'}`}>Location Selected</span>
              {selectedLocation.withinCampus !== undefined && (
                <Badge 
                  variant={selectedLocation.withinCampus ? "default" : "destructive"} 
                  className={`text-xs ${selectedLocation.withinCampus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {selectedLocation.withinCampus ? "✓ On Campus" : "⚠ Outside Campus"}
                </Badge>
              )}
            </div>

            {/* Show building info for on-campus locations, or "OUTSIDE CAMPUS GROUNDS" for off-campus */}
            {isOutsideCampus ? (
              <div className="flex items-center gap-2 mb-1">
                <Building className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-700">
                  OUTSIDE CAMPUS GROUNDS
                </span>
              </div>
            ) : selectedLocation.buildingName && (
              <div className="flex items-center gap-2 mb-1">
                <Building className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  {selectedLocation.buildingName}
                </span>
                {selectedLocation.buildingCode && (
                  <Badge variant="outline" className="text-xs">
                    {selectedLocation.buildingCode}
                  </Badge>
                )}
              </div>
            )}

            {selectedLocation.formattedAddress && (
              <div className="flex items-start gap-2">
                <MapPin className={`h-4 w-4 ${isOutsideCampus ? 'text-red-600' : 'text-green-600'} mt-0.5`} />
                <span className={`text-sm ${isOutsideCampus ? 'text-red-700' : 'text-green-700'}`}>
                  {selectedLocation.formattedAddress}
                </span>
              </div>
            )}

            {selectedLocation.latitude && selectedLocation.longitude && (
              <div className={`text-xs ${isOutsideCampus ? 'text-red-600' : 'text-green-600'} mt-2`}>
                Coordinates: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearLocation}
            className={isOutsideCampus 
              ? "text-red-700 hover:text-red-900 hover:bg-red-100" 
              : "text-green-700 hover:text-green-900 hover:bg-green-100"
            }
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-1">
          Location {required && <span className="text-red-500">*</span>}
        </Label>
        <p className="text-xs text-gray-500">
          Use your current location or pick a location from the campus map
        </p>
      </div>

      {!selectedLocation ? (
        <div className="space-y-3">
          {/* Current Location Button */}
          <Button
            type="button"
            onClick={handleCurrentLocation}
            disabled={disabled || isGettingCurrentLocation}
            className="w-full bg-[#800000] hover:bg-[#600000] text-white flex items-center gap-2"
          >
            {isGettingCurrentLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            {isGettingCurrentLocation ? 'Getting Current Location...' : 'Use Current Location'}
          </Button>

          {/* Map Selection Button */}
          <Button
            type="button"
            onClick={() => setShowMapModal(true)}
            disabled={disabled}
            variant="outline"
            className="w-full border-[#800000] text-[#800000] hover:bg-[#800000] hover:text-white flex items-center gap-2"
          >
            <Map className="h-4 w-4" />
            Pick from Map
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {renderLocationDisplay()}
          
          <Button
            type="button"
            onClick={handleClearLocation}
            disabled={disabled}
            variant="outline"
            size="sm"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Choose Different Location
          </Button>
        </div>
      )}

      {/* Map Picker Modal */}
      <MapPickerModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        onLocationSelect={handleMapSelection}
      />
    </div>
  );
}
