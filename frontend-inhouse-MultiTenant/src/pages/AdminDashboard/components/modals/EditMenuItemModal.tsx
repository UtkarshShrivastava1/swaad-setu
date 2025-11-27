import { useState, useEffect } from "react";
import ModalWrapper from "./ModalWrapper";

export default function EditMenuItemModal({
  isOpen,
  item,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  item: any;
  onClose: () => void;
  onSave: (itemId: string, itemData: any, imageFile?: File) => void;
}) {
  const [editedItem, setEditedItem] = useState(item);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    setEditedItem(item);
  }, [item]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setEditedItem({
      ...editedItem,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(item.itemId, editedItem, imageFile || undefined);
    onClose();
  };

  if (!isOpen || !editedItem) return null;

  return (
    <ModalWrapper title="Edit Menu Item" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={editedItem.name}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label>Description</label>
          <textarea
            name="description"
            value={editedItem.description}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label>Price</label>
          <input
            type="number"
            name="price"
            value={editedItem.price}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label>Image</label>
          <input
            type="file"
            name="image"
            onChange={handleImageChange}
            className="w-full"
          />
          {editedItem.image && typeof editedItem.image === 'string' && (
            <img src={editedItem.image} alt="item" className="w-20 h-20 mt-2" />
          )}
        </div>
        <div className="flex justify-end gap-3 pt-3">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-yellow-400 rounded">
            Save
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}