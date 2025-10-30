import React from 'react';

interface MapLocation {
  id: string;
  name: string;
  type: 'provider' | 'job';
}

interface LocationMapProps {
  locations: MapLocation[];
}

// In a real app, this would come from a geocoding service.
// For this simulation, we'll use fixed percentages for major cities.
const MOCK_COORDS: { [key: string]: { top: string; left: string } } = {
  'São Paulo, SP': { top: '73%', left: '53%' },
  'Rio de Janeiro, RJ': { top: '71%', left: '58%' },
  'Belo Horizonte, MG': { top: '65%', left: '56%' },
  'Curitiba, PR': { top: '75%', left: '49%' },
  'Florianópolis, SC': { top: '78%', left: '51%' },
  // Default fallback
  'default': { top: '50%', left: '50%' }
};

const LocationMap: React.FC<LocationMapProps> = ({ locations }) => {
  return (
    <div className="relative w-full h-64 md:h-80 bg-gray-200 rounded-xl overflow-hidden border-2 border-white shadow-inner">
      <img
        src="https://i.imgur.com/eB4s12o.png"
        alt="Mapa estilizado do Brasil"
        className="w-full h-full object-cover"
      />
      {locations.map(location => {
        const coords = MOCK_COORDS[location.name] || MOCK_COORDS['default'];
        const isProvider = location.type === 'provider';

        return (
          <div
            key={location.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
            style={{ top: coords.top, left: coords.left }}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 border-white shadow-lg cursor-pointer transition-transform group-hover:scale-125
                ${isProvider ? 'bg-blue-600' : 'bg-green-500'}
              `}
            />
            {/* Tooltip */}
            <div
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                         opacity-0 group-hover:opacity-100 transition-opacity duration-300
                         bg-gray-800 text-white text-xs rounded-md py-1 px-3 whitespace-nowrap"
            >
              {isProvider ? 'Prestador' : 'Cliente'}: {location.name}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LocationMap;
