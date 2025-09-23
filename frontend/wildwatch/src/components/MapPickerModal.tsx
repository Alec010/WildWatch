"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Loader2,
  AlertCircle,
  Building,
  Navigation,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { locationService, LocationData, BuildingInfo } from '@/utils/locationService';
import { GOOGLE_MAPS_API_KEY, CAMPUS_CENTER, CAMPUS_ZOOM } from '@/config';

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (locationData: LocationData) => void;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function MapPickerModal({
  isOpen,
  onClose,
  onLocationSelect,
}: MapPickerModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [buildings, setBuildings] = useState<BuildingInfo[]>([]);
  const [isProcessingLocation, setIsProcessingLocation] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const buildingOverlaysRef = useRef<any[]>([]);

  // Load Google Maps script
  useEffect(() => {
    if (!isOpen) return;

    const loadGoogleMaps = () => {
      if (window.google) {
        initializeMap();
        return;
      }

      // Check if script is already loading
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        // Wait for it to load
        const checkLoaded = setInterval(() => {
          if (window.google) {
            clearInterval(checkLoaded);
            initializeMap();
          }
        }, 100);
        return;
      }

      // Load the script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      script.onerror = () => {
        setIsLoading(false);
        toast.error('Failed to load Google Maps', {
          description: 'Please check your internet connection and try again.',
        });
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, [isOpen]);

  // Load buildings data
  useEffect(() => {
    if (!isOpen) return;

    const loadBuildings = async () => {
      try {
        const buildingsData = await locationService.getBuildings();
        setBuildings(buildingsData);
      } catch (error) {
        console.error('Error loading buildings:', error);
        toast.error('Failed to load campus buildings');
      }
    };

    loadBuildings();
  }, [isOpen]);

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    // Define campus boundary coordinates (same as backend)
    const campusPolygon = [
      {lat: 10.297153610508257, lng: 123.87918444217755},
      {lat: 10.296456911339208, lng: 123.87927563728236},
      {lat: 10.294170119974705, lng: 123.87994394768552},
      {lat: 10.294352090572659, lng: 123.88092281728376},
      {lat: 10.294005902515728, lng: 123.88106265579779},
      {lat: 10.294409788545215, lng: 123.88163103169356},
      {lat: 10.29469827824969, lng: 123.88147766042012},
      {lat: 10.295665826408769, lng: 123.8817528265405},
      {lat: 10.296078586876392, lng: 123.88089575177703},
      {lat: 10.296504661645105, lng: 123.88083259889503},
      {lat: 10.296642248161724, lng: 123.88048525806984},
      {lat: 10.297476642525188, lng: 123.88037699599445},
      {lat: 10.29752546340363, lng: 123.88003416608909},
      {lat: 10.29725472934614, lng: 123.87993943677313}
    ];

    // Campus polygon is defined above for visual boundary

    const map = new window.google.maps.Map(mapRef.current, {
      center: CAMPUS_CENTER,
      zoom: CAMPUS_ZOOM,
      mapTypeId: 'hybrid', // Satellite view with labels
      gestureHandling: 'greedy',
      zoomControl: true,
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: window.google.maps.MapTypeControlStyle.COMPACT,
        mapTypeIds: ['roadmap', 'satellite', 'hybrid'],
      },
      minZoom: 15, // Prevent zooming out too far
      maxZoom: 21, // Allow detailed zoom in
    });

    mapInstanceRef.current = map;

    // Add click listener to map
    map.addListener('click', (event: any) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      handleLocationClick(lat, lng);
    });

    // Draw campus boundary overlay
    drawCampusBoundary(map, campusPolygon);
    
    // Draw building overlays
    drawBuildingOverlays(map);

    setIsLoading(false);
  }, []);

  const drawCampusBoundary = useCallback((map: any, campusPolygon: any[]) => {
    // Draw campus boundary polygon with red outline
    const campusBoundaryPolygon = new window.google.maps.Polygon({
      paths: campusPolygon,
      strokeColor: '#dc2626', // Red stroke
      strokeOpacity: 0.8,
      strokeWeight: 3,
      fillColor: 'transparent', // No fill, just the outline
      fillOpacity: 0,
      clickable: false, // Disable click events so map clicks work inside
    });

    campusBoundaryPolygon.setMap(map);
  }, []);

  const drawBuildingOverlays = useCallback((map: any) => {
    // Clear existing overlays
    buildingOverlaysRef.current.forEach(overlay => overlay.setMap(null));
    buildingOverlaysRef.current = [];

    buildings.forEach((building) => {
      const bounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(building.bounds.southWestLat, building.bounds.southWestLng),
        new window.google.maps.LatLng(building.bounds.northEastLat, building.bounds.northEastLng)
      );

      // Create rectangle overlay
      const rectangle = new window.google.maps.Rectangle({
        bounds: bounds,
        editable: false,
        draggable: false,
        fillColor: '#800000',
        fillOpacity: 0.1,
        strokeColor: '#800000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
      });

      rectangle.setMap(map);
      buildingOverlaysRef.current.push(rectangle);

      // Add building label
      const label = new window.google.maps.InfoWindow({
        content: `<div class="text-sm font-medium text-[#800000]">${building.name}</div>`,
        position: new window.google.maps.LatLng(building.centerLatitude, building.centerLongitude),
      });

      // Show label on hover
      rectangle.addListener('mouseover', () => {
        label.open(map);
      });

      rectangle.addListener('mouseout', () => {
        label.close();
      });

      // Handle building click
      rectangle.addListener('click', () => {
        handleLocationClick(building.centerLatitude, building.centerLongitude);
      });
    });
  }, [buildings]);

  const handleLocationClick = useCallback(async (lat: number, lng: number) => {
    if (isProcessingLocation) return;

    setIsProcessingLocation(true);
    
    try {
      // Place marker
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        title: 'Selected Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#800000"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(24, 24),
        },
      });

      markerRef.current = marker;

      // Get location data from backend
      const geoResponse = await locationService.reverseGeocode(lat, lng);
      
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
        
        // Show warning if location is outside campus
        if (!geoResponse.withinCampus) {
          toast.warning('Location outside campus bounds', {
            description: 'The selected location is outside the campus area. Please select a location within campus boundaries.',
            duration: 6000,
          });
        }
      } else {
        throw new Error(geoResponse.message || 'Failed to process location');
      }
    } catch (error: any) {
      console.error('Error processing location:', error);
      toast.error('Failed to process location', {
        description: error.message || 'Please try selecting a different location.',
      });
    } finally {
      setIsProcessingLocation(false);
    }
  }, [isProcessingLocation]);

  const handleCurrentLocationOnMap = useCallback(async () => {
    try {
      setIsProcessingLocation(true);
      const coords = await locationService.getCurrentLocation();
      
      // Center map on current location
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter({ lat: coords.latitude, lng: coords.longitude });
        mapInstanceRef.current.setZoom(19); // Zoom in closer for current location
      }
      
      await handleLocationClick(coords.latitude, coords.longitude);
    } catch (error: any) {
      toast.error('Failed to get current location', {
        description: error.message,
      });
    } finally {
      setIsProcessingLocation(false);
    }
  }, [handleLocationClick]);

  const handleConfirmSelection = useCallback(() => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
    }
  }, [selectedLocation, onLocationSelect]);

  const handleClose = useCallback(() => {
    setSelectedLocation(null);
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#800000]" />
            Select Location from Map
          </DialogTitle>
          <DialogDescription>
            Click anywhere on the map to select a location. Building boundaries are highlighted in red.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Map Container */}
          <div className="relative">
            <div 
              ref={mapRef} 
              className="w-full h-96 rounded-lg border border-gray-200 bg-gray-100"
            />
            
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-[#800000]" />
                  <p className="text-sm text-gray-600">Loading map...</p>
                </div>
              </div>
            )}

            {/* Current Location Button */}
            <Button
              onClick={handleCurrentLocationOnMap}
              disabled={isProcessingLocation || isLoading}
              className="absolute top-4 right-4 bg-white hover:bg-gray-50 text-[#800000] border border-gray-300 shadow-md"
              size="sm"
            >
              {isProcessingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Selected Location Display */}
          {selectedLocation && (() => {
            const isOutsideCampus = selectedLocation.withinCampus === false;
            return (
              <div className={`${isOutsideCampus ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} border rounded-lg p-4`}>
                <div className="flex items-start gap-3">
                  <MapPin className={`h-5 w-5 ${isOutsideCampus ? 'text-red-600' : 'text-green-600'} mt-0.5`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`font-medium ${isOutsideCampus ? 'text-red-800' : 'text-green-800'}`}>Selected Location</span>
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
                      <p className={`text-sm ${isOutsideCampus ? 'text-red-700' : 'text-green-700'}`}>
                        {selectedLocation.formattedAddress}
                      </p>
                    )}

                    <p className={`text-xs ${isOutsideCampus ? 'text-red-600' : 'text-green-600'} mt-2`}>
                      Coordinates: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Instructions */}
          {!selectedLocation && !isLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium mb-1">How to select a location:</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Click anywhere within the <span className="text-red-600 font-medium">red campus boundary</span> to place a marker</li>
                    <li>• The <span className="text-red-600 font-medium">red outline</span> shows the campus area where you can select locations</li>
                    <li>• Red building outlines show individual campus buildings</li>
                    <li>• Use zoom controls to get a closer view of specific areas</li>
                    <li>• Use the navigation button to center on your current location</li>
                    <li>• Zoom and pan to find the exact spot</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            onClick={handleClose}
            variant="outline"
            className="border-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSelection}
            disabled={!selectedLocation || isProcessingLocation}
            className="bg-[#800000] hover:bg-[#600000] text-white"
          >
            {isProcessingLocation ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Confirm Location'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
