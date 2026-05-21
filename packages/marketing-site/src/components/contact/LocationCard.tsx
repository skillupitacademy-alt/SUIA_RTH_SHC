
import React from 'react';

interface LocationCardProps {
  onMapClick: () => void;
}

const LocationCard: React.FC<LocationCardProps> = ({ onMapClick }) => {
  return (
    <div 
      className="mt-6 rounded-xl p-5 border border-blue-100"
      style={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        boxShadow: '2px 2px 20px 0.6px #00000025'
      }}
    >
      <h3 className="font-semibold text-gray-800 mb-2">Our Location</h3>

      <p className="text-gray-600 text-sm mb-4">
        Neelyog Square 205, 2nd Floor <br />
        R. B. Mehta Road, Ghatkopar East, Mumbai
      </p>

      <button
        onClick={onMapClick}
        className="text-blue-600 font-medium hover:underline"
      >
        View on Google Maps →
      </button>
    </div>
  );
};

export default LocationCard;