import React, { useState } from 'react';
import { handleKeyDown } from './utils/a11yHelpers';
import { PortfolioItem } from '../types';

const PortfolioLightbox: React.FC<{ item: PortfolioItem; onClose: () => void }> = ({ item, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4" onClick={onClose} onKeyDown={handleKeyDown(() => onClose())} tabIndex={0} role="dialog" aria-modal="true">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl m-4 transform transition-all max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <img src={item.imageUrl} alt={item.title} className="w-full h-auto object-contain rounded-t-lg flex-grow" style={{ maxHeight: '70vh' }} loading="lazy" />
            <div className="p-4 bg-gray-50 rounded-b-lg flex-shrink-0">
                <h3 className="font-bold text-gray-800">{item.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
            </div>
        </div>
    </div>
);


const PortfolioGallery: React.FC<{ items: PortfolioItem[] }> = ({ items }) => {
    const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

    return (
        <>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {items.map(item => (
                    <div key={item.id} className="group relative cursor-pointer aspect-w-4 aspect-h-3" onClick={() => setSelectedItem(item)} onKeyDown={handleKeyDown(() => setSelectedItem(item))} tabIndex={0} role="button" aria-label={`Abrir ${item.title}`}>
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover rounded-lg" loading="lazy" width="200" height="200" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 rounded-lg flex items-end p-4">
                            <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:translate-y-0 translate-y-4">
                                <h4 className="font-bold">{item.title}</h4>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {selectedItem && <PortfolioLightbox item={selectedItem} onClose={() => setSelectedItem(null)} />}
        </>
    );
};

export default PortfolioGallery;