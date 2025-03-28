import React, { useState } from 'react';
import axios from 'axios';
import TripForm from './components/TripFormComponent';
import MapComponent from './components/MapComponent';

// Define types for the API response

// Define type for the form inputs (used by TripForm)
interface Stop {
  time: number;
  location: [number, number]; // [lon, lat]
  reason: string;
}

interface Inputs {
  current: string;
  pickup: string;
  dropoff: string;
  cycle: string;
}

interface TripResult {
  route: [number, number][]; // Array of [lon, lat]
  distance: number;
  stops: Stop[];
  current_location: [number, number]; // [lat, lon]
  pickup_location: [number, number]; // [lat, lon]
  dropoff_location: [number, number];
}

function App() {

  const [result, setResult] = useState<TripResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const urlBase = process.env.REACT_APP_ENDPOINT_URL;

  const handleFormSubmit = async (data: Inputs) => {
    try {
      // Send the form data to the backend
      const response = await axios.post(urlBase+"/api/plan_trip/", {
        current_location: data.current,
        pickup_location: data.pickup,
        dropoff_location: data.dropoff,
        current_cycle_used: data.cycle,
      });
      // Update the result state with the API response
      setResult(response.data as TripResult);
    } catch (error: any) {
      setError(error.response?.data?.error || "An error ocurred while planning the trip");
    }
  };
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Trip Planner</h1>

        {/* Form Component */}
        <TripForm onSubmit={handleFormSubmit} />
        {/* Display error message if there is one */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {result && (
          <div className="mt-6 p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Trip Result</h2>
            <MapComponent result={result} />
          </div>)}

      </div>
    </div>
  );
}
export default App;
