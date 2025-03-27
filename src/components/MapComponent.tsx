import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';

// Define types for the props
interface Stop {
  time: number;
  location: [number, number]; // [lon, lat]
  reason: string;
}

interface TripResult {
  route: [number, number][]; // Array of [lon, lat]
  distance: number;
  stops: Stop[];
  current_location: [number, number] | null; // [lat, lon], can be null
  pickup_location: [number, number]; // [lat, lon]
  dropoff_location: [number, number]; // [lat, lon]
}

interface MapComponentProps {
  result: TripResult | null; // The trip data (route, stops, and locations) or null if no data yet
}

function MapComponent({ result }: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapUrl = process.env.REACT_APP_MAP_URL;
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null); // [lon, lat]

  // Get the user's location using the Geolocation API
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setUserLocation([longitude, latitude]);
          console.info('User Location:', [longitude, latitude]);
        },
        (error) => {
          console.error('Geolocation Error:', error);
          // Fallback to a default location (Boston) if geolocation fails
          setUserLocation([-71.0589, 42.3601]);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      // Fallback to a default location (Boston)
      setUserLocation([-71.0589, 42.3601]);
    }
  }, []);

  // Initialize the map when the component mounts
  useEffect(() => {
    if (!map.current && mapContainer.current) {
      // Determine the initial center based on result.current_location or userLocation
      let initialCenter: [number, number] = [-71.0589, 42.3601]; // Default to Boston
      if (result && result.current_location) {
        // If current_location is provided, use it (swap to [lon, lat])
        initialCenter = [result.current_location[1], result.current_location[0]];
      } else if (userLocation) {
        // If current_location is not provided, use the user's location
        initialCenter = userLocation;
      }

      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: mapUrl, // Replace with your MapTiler key
        center: initialCenter,
        zoom: 8, // Default zoom level (regional view)
      });

      // Wait for the style to load before adding markers and layers
      map.current.on('style.load', () => {
        setIsStyleLoaded(true);
        console.log('Style loaded successfully');
      });

      map.current.on('error', (e) => {
        console.error('MapLibre GL JS Error:', e);
      });

      // Add a click event to debug map coordinates
      map.current.on('click', (e) => {
        console.log('Map clicked at:', e.lngLat);
      });
    }

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setIsStyleLoaded(false);
      }
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
    };
  }, []); // Empty dependency array ensures the map is only initialized once

  // Update the map only when the three locations change
  useEffect(() => {
    if (!map.current || !isStyleLoaded) return;

    // Extract the three locations to use as dependencies
    const currentLocationRaw = result?.current_location || null;
    const pickupLocationRaw = result?.pickup_location || null;
    const dropoffLocationRaw = result?.dropoff_location || null;

    // If no result or locations are provided, clear the map and return
    if (!result || !currentLocationRaw || !pickupLocationRaw || !dropoffLocationRaw) {
      // Clear existing layers and sources
      if (map.current.getLayer('route') && map.current.getSource('route')) {
        map.current.removeLayer('route');
        map.current.removeSource('route');
      }
      if (map.current.getLayer('stops') && map.current.getSource('stops')) {
        map.current.removeLayer('stops');
        map.current.removeSource('stops');
      }

      // Remove existing markers
      markers.current.forEach(marker => marker.remove());
      markers.current = [];

      // Center the map on the user's location if available
      if (userLocation) {
        map.current.setCenter(userLocation);
        map.current.setZoom(8);
      }
      return;
    }

    // Clear existing layers and sources
    if (map.current.getLayer('route') && map.current.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }
    if (map.current.getLayer('stops') && map.current.getSource('stops')) {
      map.current.removeLayer('stops');
      map.current.removeSource('stops');
    }

    // Remove existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Swap coordinates from [lat, lon] to [lon, lat] for MapLibre
    const currentLocation: [number, number] = [currentLocationRaw[1], currentLocationRaw[0]]; // [lon, lat]
    const pickUpLocation: [number, number] = [pickupLocationRaw[1], pickupLocationRaw[0]]; // [lon, lat]
    const dropOffLocation: [number, number] = [dropoffLocationRaw[1], dropoffLocationRaw[0]]; // [lon, lat]

    console.log('Marker Coordinates (after swap):', currentLocation, pickUpLocation, dropOffLocation);

    // Add markers for current, pickup, and drop-off locations
    const currentMarker = new maplibregl.Marker({ color: '#22c55e' }) // Green
      .setLngLat(currentLocation)
      .setPopup(new maplibregl.Popup().setHTML('<strong>Current Location</strong>'))
      .addTo(map.current);
    markers.current.push(currentMarker);

    const pickupMarker = new maplibregl.Marker({ color: '#3b82f6' }) // Blue
      .setLngLat(pickUpLocation)
      .setPopup(new maplibregl.Popup().setHTML('<strong>Pickup Location</strong>'))
      .addTo(map.current);
    markers.current.push(pickupMarker);

    const dropoffMarker = new maplibregl.Marker({ color: '#ef4444' }) // Red
      .setLngLat(dropOffLocation)
      .setPopup(new maplibregl.Popup().setHTML('<strong>Drop-off Location</strong>'))
      .addTo(map.current);
    markers.current.push(dropoffMarker);

    // Add the route to the map
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: result.route, // Already in [lon, lat] format from OSRM
        },
      },
    });
    map.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#3b82f6',
        'line-width': 4,
      },
    });

    // Add stops to the map
    map.current.addSource('stops', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: result.stops.map(stop => ({
          type: 'Feature',
          properties: { reason: stop.reason },
          geometry: {
            type: 'Point',
            coordinates: stop.location, // Already in [lon, lat] format from backend
          },
        })),
      },
    });
    map.current.addLayer({
      id: 'stops',
      type: 'circle',
      source: 'stops',
      paint: {
        'circle-radius': 8,
        'circle-color': '#ef4444',
      },
    });

    // Add popups for stops
    result.stops.forEach(stop => {
      if (map.current) {
        new maplibregl.Popup({ offset: 25 })
          .setLngLat(stop.location)
          .setHTML(`<strong>${stop.reason}</strong><br>Time: ${stop.time.toFixed(2)} hrs`)
          .addTo(map.current);
        }
    });
    // Fit the map to include the route and all markers
    const bounds = new maplibregl.LngLatBounds();

    // Add route coordinates to bounds
    result.route.forEach(coord => {
      bounds.extend(coord);
    });

    // Add marker coordinates to bounds
    bounds.extend(currentLocation);
    bounds.extend(pickUpLocation);
    bounds.extend(dropOffLocation);


    // Fit the map to the bounds with padding and zoom constraints
    map.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15,
      minZoom: 8,
    });

    // Log the final center and zoom after fitBounds
    setTimeout(() => {
      console.info('Map Center (after fitBounds):', map.current!.getCenter());
      console.info('Map Zoom (after fitBounds):', map.current!.getZoom());
    }, 1000); // Wait 1 second for the map to settle
  }, [
    isStyleLoaded,
    result?.current_location?.[0], // Depend on lat of current_location
    result?.current_location?.[1], // Depend on lon of current_location
    result?.pickup_location?.[0],  // Depend on lat of pickup_location
    result?.pickup_location?.[1],  // Depend on lon of pickup_location
    result?.dropoff_location?.[0], // Depend on lat of dropoff_location
    result?.dropoff_location?.[1], // Depend on lon of dropoff_location
  ]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-[600px] rounded-lg shadow-lg"
      style={{ position: 'relative' }}
    />
  );
}
export default MapComponent;