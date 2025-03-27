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
  current_location: [number, number]; // [lat, lon]
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
  console.log(mapUrl);
  // Initialize the map when the component mounts
  useEffect(() => {
    if (!map.current && mapContainer.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: mapUrl,
        center: [-71.0589, 42.3601] as [number, number], // Default center (Boston)
        zoom: 8, // Default zoom level (regional view)
      });


      // Wait for the style to load before adding markers and layers
      map.current.on('style.load', () => {
        setIsStyleLoaded(true);
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
  }, []);

  // Update the map whenever the result changes AND the style is loaded
  useEffect(() => {
    if (result && map.current && isStyleLoaded) {
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
      const currentLocation: [number, number] = [result.current_location[1], result.current_location[0]]; // [lon, lat]
      const pickUpLocation: [number, number] = [result.pickup_location[1], result.pickup_location[0]]; // [lon, lat]
      const dropOffLocation: [number, number] = [result.dropoff_location[1], result.dropoff_location[0]]; // [lon, lat]


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
    }
  }, [result, isStyleLoaded]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-[600px] rounded-lg shadow-lg"
      style={{ position: 'relative' }}
    />
  );
}

export default MapComponent;