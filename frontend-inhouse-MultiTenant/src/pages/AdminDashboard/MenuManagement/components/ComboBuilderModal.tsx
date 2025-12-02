import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import ModalWrapper from '../../components/modals/ModalWrapper';
import { bulkUpdateMenu, updateCategory } from '../../../../api/admin/menu.api';

interface MenuItem {
  _id: string;
  name: string;
  price: number;
}

interface Category {
  _id: string;
  name: string;
  isMenuCombo: boolean;
  itemIds: string[];
  comboMeta?: {
    originalPrice: number;
    discountedPrice: number;
    description: string;
  };
}

interface ComboBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  items: MenuItem[];
  onCategoryUpdate: (category: Category) => void;
}

const ComboBuilderModal: React.FC<ComboBuilderModalProps> = ({ isOpen, onClose, category, items, onCategoryUpdate }) => {
  const { rid } = useParams<{ rid: string }>();
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(category?.itemIds || []);
  const [comboPrice, setComboPrice] = useState<number>(category?.comboMeta?.discountedPrice || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalValue = useMemo(() => {
    return selectedItemIds.reduce((total, itemId) => {
      const item = items.find((i) => i._id === itemId);
      return total + (item?.price || 0);
    }, 0);
  }, [selectedItemIds, items]);

  const savings = useMemo(() => totalValue - comboPrice, [totalValue, comboPrice]);

  const handleItemToggle = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rid || !category) return;

    setLoading(true);
    setError(null);

    try {
      const updatedCategory = {
        ...category,
        itemIds: selectedItemIds,
        comboMeta: {
          originalPrice: totalValue,
          discountedPrice: comboPrice,
          description: selectedItemIds.map((id) => items.find((i) => i._id === id)?.name).join(' + '),
          image: category.comboMeta?.image || null, // Ensure image is passed, even if null
        },
      };
      console.log("Payload sent to updateCategory:", {
        itemIds: updatedCategory.itemIds,
        comboMeta: updatedCategory.comboMeta,
        name: updatedCategory.name,
        isMenuCombo: updatedCategory.isMenuCombo,
      });
      await updateCategory(rid, updatedCategory._id, {
        itemIds: updatedCategory.itemIds,
        comboMeta: updatedCategory.comboMeta,
        name: updatedCategory.name, // Ensure name is also passed if it could change
        isMenuCombo: updatedCategory.isMenuCombo, // Ensure isMenuCombo is also passed if it could change
      });
      onCategoryUpdate(updatedCategory);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update combo.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !category) return null;

  return (
    <ModalWrapper title={`Combo Builder: ${category.name}`} isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex gap-6">
        <div className="w-1/2">
          <h3 className="text-lg font-semibold mb-2 text-yellow-400">Available Items</h3>
          <div className="h-64 overflow-y-auto border border-gray-600 rounded-md p-2 bg-gray-800 text-white">
            {items.map((item) => (
              <div key={item._id} className="flex items-center gap-2 p-1 hover:bg-gray-700 rounded-md">
                  <input
                    type="checkbox"
                    checked={selectedItemIds.includes(item._id)}
                    onChange={() => handleItemToggle(item._id)}
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-600 rounded"
                  />
                <span>{item.name} - ₹{item.price}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="w-1/2 space-y-4">
          <h3 className="text-lg font-semibold text-yellow-400">Bundle</h3>
          <div>
            <p className="text-gray-300">Total Value: <span className="font-bold">₹{totalValue}</span></p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200">Combo Price</label>
            <input
              type="number"
              value={comboPrice}
              onChange={(e) => setComboPrice(Number(e.target.value))}
              className="mt-1 block w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:border-yellow-500 focus:ring-yellow-500"
            />
          </div>
          <div>
            <p className="text-green-600">Customer Saves: <span className="font-bold">₹{savings}</span></p>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-gray-700 border border-gray-600 rounded-md shadow-sm hover:bg-gray-600 focus:outline-none">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-black bg-yellow-400 border border-transparent rounded-md shadow-sm hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800">
              {loading ? 'Saving...' : 'Save Combo'}
            </button>
          </div>
          {error && <div className="text-red-500 mt-2">{error}</div>}
        </div>
      </form>
    </ModalWrapper>
  );
};

export default ComboBuilderModal;
