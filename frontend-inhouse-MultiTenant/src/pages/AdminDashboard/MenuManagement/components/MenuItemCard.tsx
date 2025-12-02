import React from 'react';
import { Utensils, Clock, IndianRupee, LeafyGreen, Soup } from 'lucide-react';

export interface MenuItem {
  _id: string;
  itemId: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  image?: string;
  isActive?: boolean;
  isVegetarian?: boolean;
  preparationTime?: number;
}

interface MenuItemCardProps {
  item: MenuItem;
  onClick: () => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 ease-in-out hover:shadow-lg ${!item.isActive ? 'opacity-60 grayscale' : ''}`}
    >
      {!item.isActive && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-10">
          <span className="text-white text-lg font-bold">Deactivated</span>
        </div>
      )}
      {item.image && (
        <div className="h-40 w-full overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">{item.name}</h3>
          {item.isVegetarian !== undefined && (
            <span className={`p-1 rounded-full ${item.isVegetarian ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
              {item.isVegetarian ? <LeafyGreen size={16} /> : <Soup size={16} />}
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-gray-700 text-sm mb-2 line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center justify-between text-gray-800 text-base">
          <span className="flex items-center gap-1">
            <IndianRupee size={16} />
            {item.price} {item.currency || ''}
          </span>
          {item.preparationTime && (
            <span className="flex items-center gap-1 text-sm">
              <Clock size={14} />
              {item.preparationTime} min
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default MenuItemCard;
