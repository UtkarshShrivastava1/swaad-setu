import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { X, Upload, Trash2 } from 'lucide-react';
import { bulkUpdateMenu } from '../../../../api/admin/menu.api';
import ConfirmModal from './ConfirmModal';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  branding: any;
  taxes: any[];
  serviceCharge: number;
  onSettingsUpdate: (settings: any) => void;
}

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose, branding, taxes, serviceCharge, onSettingsUpdate }) => {
  const { rid } = useParams<{ rid: string }>();
  const [themeColor, setThemeColor] = useState('#FFFFFF');
  const [logoUrl, setLogoUrl] = useState('');
  const [currentTaxes, setCurrentTaxes] = useState<{ name: string; percent: number }[]>([]);
  const [currentServiceCharge, setCurrentServiceCharge] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [taxChange, setTaxChange] = useState<{ index: number; field: 'name' | 'percent'; value: string | number } | null>(null);

  useEffect(() => {
    if (branding) {
      setThemeColor(branding.themeColor || '#FFFFFF');
      setLogoUrl(branding.logoUrl || '');
    }
    if (taxes) {
      setCurrentTaxes(taxes);
    }
    if (serviceCharge) {
      setCurrentServiceCharge(serviceCharge);
    }
  }, [branding, taxes, serviceCharge]);

  const handleTaxChange = (index: number, field: 'name' | 'percent', value: string | number) => {
    setTaxChange({ index, field, value });
    setIsConfirmModalOpen(true);
  };

  const confirmTaxChange = () => {
    if (!taxChange) return;
    const newTaxes = [...currentTaxes];
    // @ts-ignore
    newTaxes[taxChange.index][taxChange.field] = taxChange.value;
    setCurrentTaxes(newTaxes);
    setTaxChange(null);
    setIsConfirmModalOpen(false);
  };

  const addTaxRow = () => {
    setCurrentTaxes([...currentTaxes, { name: '', percent: 0 }]);
  };

  const removeTaxRow = (index: number) => {
    const newTaxes = [...currentTaxes];
    newTaxes.splice(index, 1);
    setCurrentTaxes(newTaxes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rid) return;

    setLoading(true);
    setError(null);

    try {
      const updatedSettings = {
        branding: {
          themeColor,
          logoUrl,
        },
        taxes: currentTaxes,
        serviceCharge: currentServiceCharge,
      };
      await bulkUpdateMenu(rid, updatedSettings);
      onSettingsUpdate(updatedSettings);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update settings.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[52]">
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-gray-900 shadow-xl text-white">
          <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-yellow-400">Global Configuration</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 text-gray-200">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
              <div className="flex-grow overflow-y-auto pr-4">
                {/* Branding */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2 text-yellow-400">Branding</h3>
                  <div className="flex items-center gap-4">
                    <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} />
                    <span>Theme Color</span>
                  </div>
                  <div className="mt-4">
                    <div className="w-full h-32 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center bg-gray-800">
                      <Upload />
                    </div>
                  </div>
                </div>

                {/* Taxes */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2 text-yellow-400">Taxes</h3>
                  {currentTaxes.map((tax, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Tax Name"
                        value={tax.name}
                        onChange={(e) => handleTaxChange(index, 'name', e.target.value)}
                        className="p-2 border border-gray-600 rounded w-1/2 bg-gray-800 text-white focus:border-yellow-500 focus:ring-yellow-500"
                      />
                      <input
                        type="number"
                        placeholder="%"
                        value={tax.percent}
                        onChange={(e) => handleTaxChange(index, 'percent', Number(e.target.value))}
                        className="p-2 border border-gray-600 rounded w-1/4 bg-gray-800 text-white focus:border-yellow-500 focus:ring-yellow-500"
                      />
                      <button type="button" onClick={() => removeTaxRow(index)}>
                        <Trash2 size={20} className="text-red-500" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addTaxRow} className="text-sm text-yellow-400 hover:text-yellow-500">
                    + Add Tax
                  </button>
                </div>

                {/* Service Charge */}
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-yellow-400">Service Charge</h3>
                  <input
                    type="number"
                    placeholder="%"
                    value={currentServiceCharge}
                    onChange={(e) => setCurrentServiceCharge(Number(e.target.value))}
                    className="p-2 border border-gray-600 rounded w-1/4 bg-gray-800 text-white focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>

                {error && <div className="text-red-500 mt-4">{error}</div>}
              </div>
              <div className="mt-6 flex justify-end gap-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-gray-700 border border-gray-600 rounded-md shadow-sm hover:bg-gray-600 focus:outline-none">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-black bg-yellow-400 border border-transparent rounded-md shadow-sm hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800">
                  {loading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmTaxChange}
        title="Confirm Tax Change"
        message="This will apply to all new orders. Are you sure?"
      />
    </>
  );
};

export default SettingsDrawer;