import React, { useState } from 'react';

// Define the type for the form inputs
interface Inputs {
  current: string;
  pickup: string;
  dropoff: string;
  cycle: string;
}

// Define the props for the TripForm component
interface TripFormProps {
  onSubmit: (data: Inputs) => void; // Callback function to pass form data to the parent (App.tsx)
}

function TripForm({ onSubmit }: TripFormProps) {
  // State to store the form inputs
  const [inputs, setInputs] = useState<Inputs>({
    current: '',
    pickup: '',
    dropoff: '',
    cycle: '',
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent the page from refreshing
    // Pass the form data to the parent component (App.tsx) via the onSubmit callback
    onSubmit(inputs);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Current Location */}
      <div className="flex-1">
        <label htmlFor="current-location" className="block text-sm font-medium text-gray-700 mb-1">
          Current Location
        </label>
        <input
          id="current-location"
          type="text"
          name="Current Location"
          placeholder="(lat,lon)"
          value={inputs.current}
          onChange={(e) => setInputs({ ...inputs, current: e.target.value })}
          className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        />
      </div>

      {/* Pickup Location */}
      <div className="flex-1">
        <label htmlFor="pickup-location" className="block text-sm font-medium text-gray-700 mb-1">
          Pickup Location
        </label>
        <input
          id="pickup-location"
          type="text"
          placeholder="(lat,lon)"
          value={inputs.pickup}
          onChange={(e) => setInputs({ ...inputs, pickup: e.target.value })}
          className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        />
      </div>

      {/* Drop-off Location */}
      <div className="flex-1">
        <label htmlFor="dropoff-location" className="block text-sm font-medium text-gray-700 mb-1">
          Drop-off Location
        </label>
        <input
          id="dropoff-location"
          type="text"
          placeholder="(lat,lon)"
          value={inputs.dropoff}
          onChange={(e) => setInputs({ ...inputs, dropoff: e.target.value })}
          className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        />
      </div>

      {/* Current Cycle Used */}
      <div className="w-full sm:w-32">
        <label htmlFor="cycle-used" className="block text-sm font-medium text-gray-700 mb-1">
          Cycle Used
        </label>
        <input
          id="cycle-used"
          type="number"
          placeholder="(hours)"
          value={inputs.cycle}
          onChange={(e) => setInputs({ ...inputs, cycle: e.target.value })}
          className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        />
      </div>

      {/* Submit Button */}
      <div className="self-end">
        <button
          type="submit"
          className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition mt-6 w-full sm:w-auto"
        >
          Plan Trip
        </button>
      </div>
    </form>
  );
}

export default TripForm;