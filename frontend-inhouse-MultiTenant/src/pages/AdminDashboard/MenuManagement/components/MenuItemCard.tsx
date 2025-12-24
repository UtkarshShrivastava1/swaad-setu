import { Clock, Egg, IndianRupee, LeafyGreen, Pencil, Star, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import React, { useState } from "react";

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
  metadata?: Record<string, unknown> | string;
}

interface MenuItemCardProps {
  item: MenuItem;
  onClick: () => void;
  onDeleteItem: () => void;
  onToggleStatus: () => void;
  // New prop for drag handle
  dragHandleProps?: any; 
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onClick,
  onDeleteItem,
  onToggleStatus,
  dragHandleProps // Destructure new prop
}) => {
  const [isExpanded, setIsExpanded] = useState(false); // State for expansion

  const handleActionClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
  };

  let parsedMeta: Record<string, unknown> | null = null;
  if (item.metadata) {
    if (typeof item.metadata === 'string') {
      try {
        parsedMeta = JSON.parse(item.metadata);
      } catch {
        // console.error("Failed to parse metadata:", e);
        parsedMeta = null;
      }
    } else {
      parsedMeta = item.metadata;
    }
  }

  /** 🔥 VERY STRONG VISUAL DISTINCTION */
  const auraWrapper =
    item.isVegetarian === true
      ? "bg-gradient-to-br from-emerald-400 via-emerald-500 to-green-600 p-[2px] shadow-[0_0_35px_rgba(16,185,129,0.6)]"
      : item.isVegetation === false
      ? "bg-gradient-to-br from-red-400 via-red-500 to-rose-600 p-[2px] shadow-[0_0_35px_rgba(239,68,68,0.6)]"
      : "bg-gray-200 dark:bg-gray-700 p-[1px]";

  const topStrip =
    item.isVegetarian === true
      ? "bg-gradient-to-r from-emerald-400 to-green-500"
      : item.isVegetarian === false
      ? "bg-gradient-to-r from-red-400 to-rose-500"
      : "bg-gray-300 dark:bg-gray-700";

  return (
    <div className={`rounded-2xl ${auraWrapper}`}>
      <div
        className={`relative flex flex-col w-full rounded-2xl 
        bg-white/90 dark:bg-gray-900/90 
        border border-white/20 dark:border-gray-800
        hover:-translate-y-1 transition-all duration-300
        min-h-[240px] md:min-h-[380px]`}
      >
        {/* TOP COLOR STRIP */}
        <div className={`h-[5px] w-full rounded-t-2xl ${topStrip}`} />

        {/* IMAGE */}
        <div
          onClick={() => item.isActive && onClick()}
          className={`relative h-24 md:h-40 lg:h-48 w-full overflow-hidden 
          ${item.isActive ? "cursor-pointer" : "opacity-60"}`}
        >
          {item.image ? (
            <>
              <img
                src={item.image}
                alt={item.name}
                className={`w-full h-full object-cover transition-transform duration-500 
                ${!item.isActive ? "grayscale" : "hover:scale-110"}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-200 dark:bg-gray-800">
              <span className="text-gray-400 text-sm">No Image</span>
            </div>
          )}

          {/* CHEF'S SPECIAL BADGE */}
          {parsedMeta?.chefSpecial && (
            <div
              className="absolute top-3 left-3 flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white 
              px-2.5 py-1.5 rounded-full text-xs font-bold shadow-lg ring-2 ring-white/50"
            >
              <Star size={14} className="fill-white" />
              <span>Chef's Special</span>
            </div>
          )}

          {/* STRONG VEG/NONVEG BADGE */}
          {item.isVegetarian !== undefined && (
            <span
              className={`absolute top-3 right-3 p-2.5 rounded-full shadow-xl ring-2 ring-white/80 ${
                item.isVegetarian
                  ? "bg-emerald-500 text-white shadow-emerald-400/70"
                  : "bg-red-500 text-white shadow-red-400/70"
              }`}
            >
              {item.isVegetarian ? <LeafyGreen size={14} /> : <Egg size={14} />}
            </span>
          )}
        </div>

        {/* CONTENT */}
        <div
          onClick={() => item.isActive && onClick()}
          className={`flex flex-col flex-grow p-4 ${
            item.isActive ? "cursor-pointer" : "opacity-60"
          }`}
        >
          {/* TITLE */}
          <div className="flex items-center justify-between">
            <h3
              className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 
              leading-tight line-clamp-2 min-h-[44px] flex-grow"
            >
              {item.name}
            </h3>
            {dragHandleProps && (
              <span {...dragHandleProps} className="ml-2 p-1 cursor-grab text-gray-400 hover:text-gray-200 transition-colors">
                <GripVertical size={20} />
              </span>
            )}
          </div>

          {/* DESCRIPTION */}
          {item.description && (isExpanded || window.innerWidth >= 768) && (
            <p
              className="mt-1 text-sm text-gray-600 dark:text-gray-400 
              line-clamp-2 min-h-[40px]"
            >
              {item.description || " "}
            </p>
          )}

          {/* PRICE + TIME */}
          {(isExpanded || window.innerWidth >= 768) && (
            <div className="mt-auto flex items-center justify-between pt-4">
              <span
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full
                bg-emerald-100 text-emerald-700 
                dark:bg-emerald-900/50 dark:text-emerald-300
                text-sm font-semibold min-w-[80px] justify-center"
              >
                <IndianRupee size={14} />
                {item.price}
              </span>

              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 min-w-[70px] justify-end">
                <Clock size={14} />
                {item.preparationTime || 0} min
              </span>
            </div>
          )}
        </div>

        {/* EXPAND BUTTON FOR MOBILE */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 md:hidden 
          p-2 bg-gray-700/80 hover:bg-gray-600/80 text-white rounded-full shadow-lg"
          aria-label={isExpanded ? "View less" : "View more"}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* FOOTER */}
        <div
          className="h-[56px] flex items-center justify-between px-4 
          bg-gray-50 dark:bg-gray-950/50 
          border-t border-gray-200 dark:border-gray-800 
          rounded-b-2xl"
        >
          {/* STATUS TOGGLE */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                handleActionClick(e);
                onToggleStatus();
              }}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200
              ${
                item.isActive
                  ? "bg-emerald-500"
                  : "bg-gray-400 dark:bg-gray-600"
              }`}
              aria-label="Toggle Status"
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full 
                transition-transform duration-200
                ${item.isActive ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>

            <span
              className={`md:block px-2 py-0.5 rounded-full text-xs font-semibold
              ${
                item.isActive
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                  : "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              {item.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center rounded-md bg-gray-200 dark:bg-gray-800 shadow-sm">
            {/* EDIT */}
            <button
              onClick={(e) => {
                handleActionClick(e);
                onClick();
              }}
              disabled={!item.isActive}
              className="p-2 rounded-l-md text-gray-500 hover:bg-blue-100 hover:text-blue-500
              dark:hover:bg-blue-500/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Edit Item"
            >
              <Pencil size={18} />
            </button>
            <div className="w-px h-5 bg-gray-300 dark:bg-gray-700"></div>
            {/* DELETE */}
            <button
              onClick={(e) => {
                handleActionClick(e);
                onDeleteItem();
              }}
              className="p-2 rounded-r-md text-gray-500 hover:bg-red-100 hover:text-red-500
              dark:hover:bg-red-500/10 transition-all duration-200"
              aria-label="Delete Item"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
