import React, { useState } from 'react';
import axios from 'axios';
import TripForm from './TripFormComponent';

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
}

function App() {

  const [result, setResult] = useState<TripResult | null>(null);
  const handleFormSubmit = async (data: Inputs) => {
    try {
      // Send the form data to the backend
      const response = await axios.post('http://localhost:8000/plan_trip/', {
        current_location: data.current,
        pickup_location: data.pickup,
        dropoff_location: data.dropoff,
        current_cycle_used: data.cycle,
      });
      // Update the result state with the API response
      setResult(response.data as TripResult);
    } catch (error) {
      console.error('Error planning trip:', error);
    }
  };
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Trip Planner</h1>

        {/* Form Component */}
        <TripForm onSubmit={handleFormSubmit} />

             </div>
    </div>
  );
}
export default App;
