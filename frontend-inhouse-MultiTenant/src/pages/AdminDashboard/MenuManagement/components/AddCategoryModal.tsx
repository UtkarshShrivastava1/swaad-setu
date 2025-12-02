import React, { useState } from "react";
import { useParams } from "react-router-dom";
import ModalWrapper from "../../components/modals/ModalWrapper";
import { getMenu, bulkUpdateMenu } from "../../../../api/admin/menu.api";

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryAdded: (category: any) => void;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryAdded,
}) => {
  const { rid } = useParams<{ rid: string }>();
  const [name, setName] = useState("");
  const [isMenuCombo, setIsMenuCombo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rid) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch the current menu data
      const currentMenu = await getMenu(rid);

      const newCategory = {
        name,
        isMenuCombo,
        itemIds: [],
      };

      // @ts-ignore
      const updatedCategories = [...currentMenu.categories, newCategory];
      // @ts-ignore
      await bulkUpdateMenu(rid, {
        ...currentMenu,
        categories: updatedCategories,
      });

      onCategoryAdded(newCategory);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add category.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper title="Add New Category1" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-red-500">{error}</div>}
        <div>
          <label
            htmlFor="category-name"
            className="block text-sm font-medium text-gray-200"
          >
            Category Name
          </label>
          <input
            type="text"
            id="category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm bg-gray-800 text-white"
            required
          />
        </div>
        <div className="flex items-center">
          <input
            id="is-combo"
            type="checkbox"
            checked={isMenuCombo}
            onChange={(e) => setIsMenuCombo(e.target.checked)}
            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
          />
          <label
            htmlFor="is-combo"
            className="ml-2 block text-sm text-gray-200"
          >
            Is this a Combo Deal category?
          </label>
        </div>
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-700 border border-gray-600 rounded-md shadow-sm hover:bg-gray-600 focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-black bg-yellow-400 border border-transparent rounded-md shadow-sm hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            {loading ? "Adding..." : "Add Category"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default AddCategoryModal;
