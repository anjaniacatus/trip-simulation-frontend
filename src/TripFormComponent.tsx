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
      {/* Input for Current Location */}
      <input
        type="text"
        placeholder="Current Location (lat,lon)"
        value={inputs.current}
        onChange={(e) => setInputs({ ...inputs, current: e.target.value })}
        className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
      />
      {/* Input for Pickup Location */}
      <input
        type="text"
        placeholder="Pickup Location (lat,lon)"
        value={inputs.pickup}
        onChange={(e) => setInputs({ ...inputs, pickup: e.target.value })}
        className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
      />
      {/* Input for Drop-off Location */}
      <input
        type="text"
        placeholder="Drop-off Location (lat,lon)"
        value={inputs.dropoff}
        onChange={(e) => setInputs({ ...inputs, dropoff: e.target.value })}
        className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
      />
      {/* Input for Current Cycle Used */}
      <input
        type="number"
        placeholder="Current Cycle Used (hrs)"
        value={inputs.cycle}
        onChange={(e) => setInputs({ ...inputs, cycle: e.target.value })}
        className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-32"
      />
      {/* Submit Button */}
      <button
        type="submit"
        className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
      >
        Plan Trip
      </button>
    </form>
  );
}

export default TripForm;