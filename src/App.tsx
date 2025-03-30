import React, { useState, useRef } from 'react';
import axios, { AxiosError, isCancel } from 'axios';
import debounce from 'lodash/debounce';
import TripForm from './components/TripFormComponent';
import MapComponent from './components/MapComponent';

interface Stop {
  time: number;
  location: [number, number];
  reason: string;
}

interface Inputs {
  current: string;
  pickup: string;
  dropoff: string;
  cycle: string;
}

interface TripResult {
  route: [number, number][];
  distance: number;
  stops: Stop[];
  current_location: [number, number];
  pickup_location: [number, number];
  dropoff_location: [number, number];
}

function App() {
  const [result, setResult] = useState<TripResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const urlBase = process.env.REACT_APP_ENDPOINT_URL;
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelPreviousRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const planTrip = async (data: Inputs) => {
    setIsLoading(true);
    setError(null);

    cancelPreviousRequest();
    abortControllerRef.current = new AbortController();

    try {
      const response = await axios.post<TripResult>(
        `${urlBase}/api/plan_trip/`,
        {
          current_location: data.current,
          pickup_location: data.pickup,
          dropoff_location: data.dropoff,
          current_cycle_used: data.cycle,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
          signal: abortControllerRef.current.signal,
        }
      );
      setResult(response.data);
    } catch (error: any) {
      if (isCancel(error)) {
        console.log('Request canceled:', error.message);
      } else {
        const axiosError = error as AxiosError<{ error?: string }>;
        setError(axiosError.response?.data?.error || "An error occurred while planning the trip");
        console.error('API Error:', error);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Move debounce inline to satisfy exhaustive-deps
  const handleFormSubmit = (data: Inputs) => {
    const debouncedPlanTrip = debounce(() => {
      planTrip(data);
    }, 500);
    debouncedPlanTrip();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Trip Planner</h1>

        <TripForm onSubmit={handleFormSubmit} />

        {isLoading && (
          <div className="mb-6 p-4 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Planning your trip...
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {result && !isLoading && (
          <div className="mt-6 p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Trip Result</h2>
            <MapComponent result={result} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
