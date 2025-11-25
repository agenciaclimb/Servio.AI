import React from 'react';

interface Location {
  id: string;
  name: string; // e.g., "São Paulo, SP"
  type: 'provider' | 'job';
}

interface LocationMapProps {
  locations: Location[];
}

// Pre-defined coordinates for major Brazilian cities (approximated for a fictional map)
const cityCoordinates: { [key: string]: { top: string; left: string } } = {
  'São Paulo, SP': { top: '75%', left: '48%' },
  'Rio de Janeiro, RJ': { top: '74%', left: '55%' },
  'Belo Horizonte, MG': { top: '68%', left: '53%' },
  'Curitiba, PR': { top: '80%', left: '45%' },
  'Florianópolis, SC': { top: '84%', left: '46%' },
  'Salvador, BA': { top: '52%', left: '65%' },
  'Brasília, DF': { top: '58%', left: '48%' },
  'Fortaleza, CE': { top: '35%', left: '65%' },
  'Manaus, AM': { top: '30%', left: '25%' },
};

const Pin: React.FC<{ location: Location; coords: { top: string; left: string } }> = ({ location, coords }) => {
  const isProvider = location.type === 'provider';
  const pinColor = isProvider ? 'bg-blue-600' : 'bg-red-600';
  const ringColor = isProvider ? 'ring-blue-300' : 'ring-red-300';

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
      style={{ top: coords.top, left: coords.left }}
    >
      <div className={`w-3 h-3 rounded-full ${pinColor} ring-4 ${ringColor} dark:ring-opacity-50`}></div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {location.name.split(',')[0]}
        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
      </div>
    </div>
  );
};

const LocationMap: React.FC<LocationMapProps> = ({ locations }) => {
  return (
    <div className="relative w-full aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
      <img src="https://i.imgur.com/2n58y2p.png" alt="Mapa do Brasil" className="w-full h-full object-cover opacity-50 dark:opacity-30" />
      {locations.map(loc => {
        const coords = cityCoordinates[loc.name];
        return coords ? <Pin key={loc.id} location={loc} coords={coords} /> : null;
      })}
    </div>
  );
};

export default LocationMap;