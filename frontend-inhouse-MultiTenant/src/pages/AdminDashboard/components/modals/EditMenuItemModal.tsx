import { useState, useEffect } from "react";

export default function EditMenuItemModal({ isOpen, item, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    currency: "INR",
    isVegetarian: false,
    preparationTime: "",
  });

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState<boolean>(false);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || "",
        description: item.description || "",
        price: item.price || 0,
        currency: item.currency || "INR",
        isVegetarian: item.isVegetarian || false,
        preparationTime: item.preparationTime || "",
      });
      setCurrentImageUrl(item.image || null);
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
      setRemoveExistingImage(false);
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setRemoveExistingImage(false); // If new image selected, don't remove existing
    } else {
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
    }
  };

  const handleRemoveImage = () => {
    setRemoveExistingImage(true);
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
  };

  const handleSubmit = async () => {
    const updatedItemData = { ...formData };

    if (removeExistingImage) {
      updatedItemData.image = null; // Explicitly set image to null for removal
    } else if (selectedImageFile) {
      // New image will be handled by the imageFile parameter of onSave
      // Do not add image to updatedItemData here.
    } else if (currentImageUrl) {
      // If no new image and not removing, preserve existing image by not touching the 'image' property in itemData
      // Backend handles absence of 'image' field in FormData as preservation.
    }

    await onSave(item.itemId, updatedItemData, selectedImageFile);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
      tabIndex={-1}
    >
      <div
        className="bg-white rounded-xl p-8 max-w-lg w-full shadow-lg relative"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-menu-item-title"
      >
        <h2
          id="edit-menu-item-title"
          className="text-2xl font-bold text-gray-800 mb-6"
        >
          Edit Menu Item
        </h2>

        <label htmlFor="name" className="block font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter item name"
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />

        <label
          htmlFor="description"
          className="block font-medium text-gray-700 mb-1"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter description"
          rows={4}
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />

        <label
          htmlFor="price"
          className="block font-medium text-gray-700 mb-1"
        >
          Price (₹)
        </label>
        <input
          id="price"
          name="price"
          type="number"
          min="0"
          step="0.01"
          value={formData.price}
          onChange={handleChange}
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />

        {/* Preparation Time */}
        <label
          htmlFor="preparationTime"
          className="block font-medium text-gray-700 mb-1"
        >
          Preparation Time (mins)
        </label>
        <input
          id="preparationTime"
          name="preparationTime"
          type="number"
          min="0"
          value={formData.preparationTime}
          onChange={handleChange}
          placeholder="e.g., 20"
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />

        {/* Image Upload */}
        <div className="mb-4">
          <label className="block font-medium text-gray-700 mb-1">
            Item Image
          </label>
          <input
            type="file"
            accept="image/*"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            onChange={handleImageChange}
          />
          {(imagePreviewUrl || (currentImageUrl && !removeExistingImage)) && (
            <div className="mt-4 flex items-center space-x-4">
              <img
                src={imagePreviewUrl || currentImageUrl || ""}
                alt="Image Preview"
                className="max-h-32 rounded-md object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Remove Image
              </button>
            </div>
          )}
        </div>

        <label className="inline-flex items-center mb-6">
          <input
            type="checkbox"
            name="isVegetarian"
            checked={formData.isVegetarian}
            onChange={handleChange}
            className="form-checkbox h-5 w-5 text-yellow-400"
          />
          <span className="ml-2 text-gray-700 font-medium">Vegetarian</span>
        </label>

        <div className="flex justify-end gap-4">
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-yellow-400 text-black font-bold rounded-lg hover:bg-yellow-500 transition"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
