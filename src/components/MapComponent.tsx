import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';

// Define types for the props (the data we get from the parent component)
interface Stop {
  time: number;
  location: [number, number]; // [lon, lat]
  reason: string;
}

interface TripResult {
  route: [number, number][]; // Array of [lon, lat]
  distance: number;
  stops: Stop[];
  current_location: [number, number];
  pickup_location: [number, number];
  dropoff_location: [number, number];
}

interface MapComponentProps {
  result: TripResult | null; // The trip data (route and stops) or null if no data yet
}

function MapComponent({ result }: MapComponentProps) {
  // Create refs to store the map and the map container
  const mapContainer = useRef<HTMLDivElement | null>(null); // Ref for the div that holds the map
  const map = useRef<maplibregl.Map | null>(null); // Ref for the MapLibre map instance
  const markers = useRef<maplibregl.Marker[]>([]);

  // State to track if the map's style has loaded
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);

  // Initialize the map when the component mounts
  useEffect(() => {
    // Only create the map if it doesn't already exist and the container is ready
    if (!map.current && mapContainer.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current, // The HTML element to render the map in
        style: 'https://openmaptiles.geo.data.gouv.fr/styles/osm-bright/style.json', // Free MapLibre style
        center: [-74.0060, 40.7128] as [number, number], // Default center (Boston)
        zoom: 8, // Default zoom level
      });

      // Wait for the style to load before allowing sources/layers to be added
      map.current.on('style.load', () => {
        setIsStyleLoaded(true); // Set the state to true when the style is loaded
      });

      // Handle errors if the style fails to load
      map.current.on('error', (e) => {
        console.error('MapLibre GL JS Error:', e);
      });
    }

    // Cleanup: Remove the map when the component unmounts
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setIsStyleLoaded(false);
      }
    };
  }, []); // Empty dependency array means this runs only once when the component mounts

  // Update the map whenever the result changes AND the style is loaded
  useEffect(() => {
    // Check if we have a result, the map is ready, and the style has loaded
    if (result && map.current && isStyleLoaded) {
      // Step 1: Clear any existing layers and sources (to avoid duplicates)
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


      // Step 2: Add the route to the map
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: result.route, // The route coordinates from the API
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
          'line-color': '#3b82f6', // Blue line for the route
          'line-width': 4,
        },
      });

      // Step 3: Add the stops to the map
      map.current.addSource('stops', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: result.stops.map(stop => ({
            type: 'Feature',
            properties: { reason: stop.reason },
            geometry: {
              type: 'Point',
              coordinates: stop.location, // The stop location (lon, lat)
            },
          })),
        },
      });
      map.current.addLayer({
        id: 'stops',
        type: 'circle',
        source: 'stops',
        paint: {
          'circle-radius': 8, // Size of the stop markers
          'circle-color': '#ef4444', // Red color for stop markers
        },
      });

      // Step 4: Add popups for each stop
      result.stops.forEach(stop => {
        new maplibregl.Popup({ offset: 25 })
          .setLngLat(stop.location)
          .setHTML(`<strong>${stop.reason}</strong><br>Time: ${stop.time.toFixed(2)} hrs`)
          .addTo(map.current!);
      });

      // Add markers for current, pickup, and drop-off locations
      // Current Location Marker (Green)
      const currentMarker = new maplibregl.Marker({ color: '#22c55e' }) // Green marker
        .setLngLat([result.current_location[0], result.current_location[1]]) // [lon, lat]
        .setPopup(new maplibregl.Popup().setHTML('<strong>Current Location</strong>'))
        .addTo(map.current!);
      markers.current.push(currentMarker);

      // Pickup Location Marker (Blue)
      const pickupMarker = new maplibregl.Marker({ color: '#3b82f6' }) // Blue marker
        .setLngLat([result.pickup_location[0], result.pickup_location[1]]) // [lon, lat]
        .setPopup(new maplibregl.Popup().setHTML('<strong>Pickup Location</strong>'))
        .addTo(map.current!);
      markers.current.push(pickupMarker);

      // Drop-off Location Marker (Red)
      const dropoffMarker = new maplibregl.Marker({ color: '#ef4444' }) // Red marker
        .setLngLat([result.dropoff_location[0], result.dropoff_location[1]]) // [lon, lat]
        .setPopup(new maplibregl.Popup().setHTML('<strong>Drop-off Location</strong>'))
        .addTo(map.current!);
      markers.current.push(dropoffMarker);

      // Step 5: Fit the map to the route bounds (so the whole route is visible)
      const coordinates = result.route;
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord);
      }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [result, isStyleLoaded]); // This effect runs when result OR isStyleLoaded changes

  // Render the map container
  return (
    <div
      ref={mapContainer}
      className="w-full h-[400px] rounded-lg shadow-lg"
    />
  );
}

export default MapComponent;