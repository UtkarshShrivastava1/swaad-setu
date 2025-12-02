import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { createMenu } from '../../../../api/admin/menu.api'; // Assuming this function will be created
import ModalWrapper from '../../components/modals/ModalWrapper';

const CreateMenuModal = ({ isOpen, onClose, onMenuCreated }: { isOpen: boolean; onClose: () => void; onMenuCreated: () => void }) => {
  const { rid } = useParams<{ rid: string }>();
  const [title, setTitle] = useState('Dine-in Menu');
  const [taxName, setTaxName] = useState('GST');
  const [taxPercent, setTaxPercent] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rid) return;

    setLoading(true);
    setError(null);

    try {
      await createMenu(rid, {
        title,
        taxes: [{ name: taxName, percent: taxPercent }],
        items: [],
        categories: [],
      });
      onMenuCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create menu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper title="Create New Menu" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-red-500">{error}</div>}
        <div>
          <label htmlFor="menu-title" className="block text-sm font-medium text-gray-700">
            Menu Title
          </label>
          <input
            type="text"
            id="menu-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
            required
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="tax-name" className="block text-sm font-medium text-gray-700">
              Tax Name
            </label>
            <input
              type="text"
              id="tax-name"
              value={taxName}
              onChange={(e) => setTaxName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
              required
            />
          </div>
          <div className="flex-1">
            <label htmlFor="tax-percent" className="block text-sm font-medium text-gray-700">
              Tax Percentage (%)
            </label>
            <input
              type="number"
              id="tax-percent"
              value={taxPercent}
              onChange={(e) => setTaxPercent(Number(e.target.value))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
              required
            />
          </div>
        </div>
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-black bg-yellow-400 border border-transparent rounded-md shadow-sm hover:bg-yellow-500 focus:outline-none"
          >
            {loading ? 'Creating...' : 'Create Menu'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default CreateMenuModal;
