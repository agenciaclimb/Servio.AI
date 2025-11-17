import React from 'react';
import { MaintainedItem } from '../types';

interface ItemCardProps {
  item: MaintainedItem;
  onClick: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onClick }) => {
  return (
    <button 
        onClick={onClick}
        className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 flex flex-col h-full transform hover:-translate-y-1 transition-transform duration-300 text-left w-full"
    >
      <div className="h-40 w-full bg-gray-200">
        {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" width="320" height="160" />
        ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
                <svg className="w-10 h-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
            </div>
        )}
      </div>
      <div className="p-4 flex-grow">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{item.category}</p>
        <h3 className="font-bold text-gray-800 mt-1 line-clamp-2">{item.name}</h3>
      </div>
      <div className="px-4 pb-3 pt-1">
        <p className="text-xs text-right text-gray-500">Ver detalhes →</p>
      </div>
    </button>
  );
};

export default ItemCard;