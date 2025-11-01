import React from 'react';
import { MaintainedItem } from '../../types';

interface ItemCardProps {
  item: MaintainedItem;
  onClick: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onClick }) => {
  return (
    <div onClick={onClick} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer group">
      <div className="w-full h-32 bg-gray-200 dark:bg-gray-700">
        {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600">{item.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{item.category}</p>
      </div>
    </div>
  );
};

export default ItemCard;