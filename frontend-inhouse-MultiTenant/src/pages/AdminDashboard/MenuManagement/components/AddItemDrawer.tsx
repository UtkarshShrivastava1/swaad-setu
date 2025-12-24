import {
  AlertCircle,
  Clock,
  Flame,
  ImageIcon,
  Leaf,
  Loader2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  addMenuItem,
  deleteMenuItem,
  updateMenuItem,
} from "../../../../api/admin/menu.api";
import { generateMenuItemDescription } from "../../../../api/gemini.api";
import { searchPexelsImages } from "../../../../api/pexels.api"; // Import Pexels API
import { handleGeminiError } from "../../../../utils/geminiErrorHandler";
import useDebounce from "../../hooks/useDebounce"; // Import useDebounce hook

import ImageCropperModal from "./modals/ImageCropperModal"; // Import the cropper modal

interface AddItemDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  category: { _id: string; name: string } | null;
  item: any | null;
  onItemSuccessfullyAddedAndMenuNeedsRefresh: () => void; // New prop
}

const AddItemDrawer: React.FC<AddItemDrawerProps> = ({
  isOpen,
  onClose,
  category,
  item,
  onItemSuccessfullyAddedAndMenuNeedsRefresh, // Destructured new prop
}) => {
  const { rid } = useParams<{ rid: string }>();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [isVeg, setIsVeg] = useState(true); // ✅ single source of truth
  const [isActive, setIsActive] = useState(true);
  const [spiceLevel, setSpiceLevel] = useState(0);
  const [prepTime, setPrepTime] = useState("");
  const [serves, setServes] = useState(""); // New state
  const [isChefSpecial, setIsChefSpecial] = useState(false); // New state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMetadataCollapsed, setIsMetadataCollapsed] = useState(true);

  // State for Pexels images
  const [pexelsImages, setPexelsImages] = useState<any[]>([]);
  const [loadingPexelsImages, setLoadingPexelsImages] = useState(false);
  const [pexelsSearchQuery, setPexelsSearchQuery] = useState(""); // New state for Pexels search
  const debouncedPexelsSearchQuery = useDebounce(pexelsSearchQuery, 700); // Debounce Pexels search input

  // States for Image Cropper
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);

  // States for Gemini Description
  const [loadingDescription, setLoadingDescription] = useState(false);
  const [descriptionGenerationError, setDescriptionGenerationError] = useState<
    string | null
  >(null);
  const [descriptionRetryCountdown, setDescriptionRetryCountdown] = useState<
    number | null
  >(null);
  const [isDescriptionQueued, setIsDescriptionQueued] = useState(false);
  const [descriptionQueuePosition, setDescriptionQueuePosition] = useState<
    number | null
  >(null);
  const [descriptionFromCache, setDescriptionFromCache] = useState(false);
  const debouncedItemName = useDebounce(name, 1000); // Debounce item name for description generation

  // Helper to map numeric spice level to string
  const getSpiceLevelString = (level: number) => {
    switch (level) {
      case 0:
        return "none";
      case 1:
        return "mild";
      case 2:
        return "medium";
      case 3:
        return "spicy";
      case 4:
        return "hot";
      case 5:
        return "extreme";
      default:
        return "medium"; // Default for unexpected values
    }
  };

  /* ================= PREFILL & RESET ================= */

  useEffect(() => {
    // This effect runs when the drawer opens to ensure the form is either
    // correctly pre-filled for editing or completely reset for adding.
    if (!isOpen) {
      return;
    }

    // Reset common status fields for both modes on open
    setError(null);
    setLoading(false);

    if (item) {
      // Pre-fill form for editing an existing item
      setName(item.name);
      setPrice(String(item.price));
      setDescription(item.description || "");
      setIsVeg(item.isVegetarian);
      setIsActive(item.isActive);
      setSpiceLevel(Number(item.metadata?.spiceLevel) || 0);
      setPrepTime(String(item.metadata?.prepTime || ""));
      setServes(String(item.metadata?.serves || ""));
      setIsChefSpecial(item.metadata?.chefSpecial || false);
      setImagePreview(item.image || null);
      setCroppedImageUrl(item.image || null); // Use existing image
      setPexelsSearchQuery(item.name || ""); // Pre-fill search
      setImageFile(null); // Clear any selected file
    } else {
      // Reset form to default values for adding a new item
      setName("");
      setPrice("");
      setDescription("");
      setIsVeg(true);
      setIsActive(true);
      setSpiceLevel(0);
      setPrepTime("");
      setServes("");
      setIsChefSpecial(false);
      setImageFile(null);
      setImagePreview(null);
      setCroppedImageUrl(null);
      setPexelsSearchQuery("");
      setPexelsImages([]);
    }

    // Reset async-related states for both modes
    setLoadingDescription(false);
    setDescriptionGenerationError(null);
    setIsDescriptionQueued(false);
    setDescriptionQueuePosition(null);
    setDescriptionFromCache(false);
    setLoadingPexelsImages(false);
  }, [isOpen, item]);

  // Sync item name to Pexels search query automatically
  useEffect(() => {
    setPexelsSearchQuery(name);
  }, [name]);

  /* ================= IMAGE ================= */

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handlePexelsImageSelect = useCallback(async (imageUrl: string) => {
    setImageToCrop(imageUrl);
    setShowCropper(true);
  }, []);

  const handleCropComplete = useCallback((croppedFile: File) => {
    setImageFile(croppedFile);
    setImagePreview(URL.createObjectURL(croppedFile));
    setCroppedImageUrl(URL.createObjectURL(croppedFile)); // Update croppedImageUrl for display
    setShowCropper(false);
    setImageToCrop(null);
  }, []);

  const handleCloseCropper = useCallback(() => {
    setShowCropper(false);
    setImageToCrop(null);
  }, []);

  // Effect to search Pexels images when debouncedPexelsSearchQuery changes
  useEffect(() => {
    const fetchImages = async () => {
      if (debouncedPexelsSearchQuery.trim()) {
        // Only search if query is not empty
        setLoadingPexelsImages(true);
        setError(null);
        try {
          const response = await searchPexelsImages(debouncedPexelsSearchQuery);
          setPexelsImages(response.photos);
        } catch (err) {
          console.error("Failed to fetch Pexels images:", err);
          setError("Failed to fetch image suggestions.");
        } finally {
          setLoadingPexelsImages(false);
        }
      } else {
        setPexelsImages([]); // Clear suggestions if query is empty
      }
    };
    fetchImages();
  }, [debouncedPexelsSearchQuery]);

  // Effect to generate description when debouncedItemName changes
  useEffect(() => {
    const generateDescription = async () => {
      // Only generate if in "add item" mode, name is not empty, and description is not manually entered
      if (!item && debouncedItemName.trim() && !description.trim()) {
        setLoadingDescription(true);
        setDescriptionGenerationError(null);
        setIsDescriptionQueued(false);
        setDescriptionQueuePosition(null);
        setDescriptionFromCache(false);

        try {
          // Use rate-limited version with tenant awareness
          const response = await generateMenuItemDescription(
            rid || "unknown",
            debouncedItemName
          );

          if (response.success && response.content) {
            setDescription(response.content);
            setDescriptionFromCache(response.fromCache || false);
          } else {
            // Handle error gracefully
            const feedback = handleGeminiError(response);
            setDescriptionGenerationError(feedback.userMessage);
            setIsDescriptionQueued(response.isQueued || false);
            setDescriptionQueuePosition(response.queuePosition || null);

            // If queued, don't show as error
            if (response.isQueued) {
              console.log("[AddItemDrawer] Description generation queued");
            }
          }
        } catch (err) {
          console.error("Failed to generate description:", err);
          setDescriptionGenerationError(
            "Failed to auto-generate description. You can describe manually."
          );
        } finally {
          setLoadingDescription(false);
        }
      }
    };
    generateDescription();
  }, [debouncedItemName, item, rid, description]);

  const handleGenerateDescription = async () => {
    if (!name.trim()) {
      setDescriptionGenerationError(
        "Please enter an item name to generate a description."
      );
      return;
    }
    setLoadingDescription(true);
    setDescriptionGenerationError(null);
    setIsDescriptionQueued(false);
    setDescriptionQueuePosition(null);
    setDescriptionFromCache(false);

    try {
      // Use rate-limited version with tenant awareness
      const response = await generateMenuItemDescription(
        rid || "unknown",
        name
      );

      if (response.success && response.content) {
        setDescription(response.content);
        setDescriptionFromCache(response.fromCache || false);
      } else {
        // Handle error gracefully
        const feedback = handleGeminiError(response);
        setDescriptionGenerationError(feedback.userMessage);
        setIsDescriptionQueued(response.isQueued || false);
        setDescriptionQueuePosition(response.queuePosition || null);
      }
    } catch (err) {
      console.error("Failed to generate description:", err);
      setDescriptionGenerationError("Failed to auto-generate description.");
    } finally {
      setLoadingDescription(false);
    }
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rid || !category) {
      setError("Restaurant ID or Category is missing.");
      return;
    }

    // Client-side validation
    if (!name.trim()) {
      setError("Item name is required.");
      return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError("Valid price (greater than 0) is required.");
      return;
    }

    setLoading(true);
    setError(null);
    const itemData = {
      name,
      price: parsedPrice,
      description,
      isVegetarian: isVeg,
      isActive,
      isChefSpecial,
      categoryId: category._id,
      category: category.name, // Also include category name as per backend error hint

      preparationTime: parseInt(prepTime || "0", 10), // ✅ ALWAYS PRESENT

      metadata: {
        spiceLevel: getSpiceLevelString(spiceLevel),
        ...(serves && parseInt(serves, 10) > 0
          ? { serves: parseInt(serves, 10) }
          : {}),
        chefSpecial: isChefSpecial, // Include isChefSpecial in metadata
      },
    };

    // Handle explicit image removal for existing items
    if (item && imageFile === null && croppedImageUrl === null) {
      itemData.image = null; // Signal to backend to clear image
    }

    console.log("AddItemDrawer: Payload being sent:", itemData); // Log payload
    console.log(
      "AddItemDrawer: Full payload string:",
      JSON.stringify(itemData, null, 2)
    );

    try {
      if (item) {
        const res = await updateMenuItem(
          rid,
          item.itemId,
          itemData,
          imageFile || undefined
        );

        console.log("AddItemDrawer: updateMenuItem API response:", res); // Log the API response
        onItemSuccessfullyAddedAndMenuNeedsRefresh(); // Call the new prop
        console.log(
          "AddItemDrawer: onItemSuccessfullyAddedAndMenuNeedsRefresh called after update."
        ); // Log after update
      } else {
        const res = await addMenuItem(rid, itemData, imageFile || undefined);
        console.log("AddItemDrawer: addMenuItem API response:", res); // Log the API response for add
        onItemSuccessfullyAddedAndMenuNeedsRefresh(); // Call the new prop
        console.log(
          "AddItemDrawer: onItemSuccessfullyAddedAndMenuNeedsRefresh called after add."
        ); // Log after add
      }
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          `Failed to ${item ? "update" : "add"} item`
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */

  const handleDelete = async () => {
    if (!rid || !item) return;
    if (!window.confirm("Delete this item?")) return;

    try {
      await deleteMenuItem(rid, item.itemId);

      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to delete item");
    }
  };

  if (!isOpen) return null;

  /* ================= PREMIUM UI ================= */

  return (
    <div className="fixed inset-0 z-[51] flex justify-end">
      {/* GLASS OVERLAY */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />

      {/* DRAWER */}
      <div className="relative h-full w-full max-w-xl bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white shadow-2xl border-l border-white/10 flex flex-col">
        {/* ✅ HEADER (FIXED) */}
        <div className="p-6 flex justify-between items-center border-b border-white/10 shrink-0">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-orange-400 text-transparent bg-clip-text">
            {item ? "Edit Item" : "Add Item"} — {category?.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* ✅ SCROLLABLE BODY */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-grow overflow-hidden"
        >
          <div className="flex-grow overflow-y-auto px-6 py-5 space-y-5">
            {/* NAME */}
            <input
              type="text"
              placeholder="Item Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 outline-none"
              required
            />

            {/* PRICE */}
            <input
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 outline-none"
              required
            />

            {/* DESCRIPTION */}
            <div className="flex items-center gap-2">
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (descriptionFromCache) setDescriptionFromCache(false);
                }}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 outline-none min-h-[80px]"
              />
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={
                  loadingDescription || !name.trim() || isDescriptionQueued
                }
                className="p-3 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200"
                title={
                  isDescriptionQueued
                    ? "Description is queued..."
                    : "Generate description with AI"
                }
              >
                <Sparkles size={20} />
              </button>
            </div>

            {/* Loading state */}
            {loadingDescription && (
              <div className="flex items-center text-yellow-300">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Generating description...</span>
              </div>
            )}

            {/* Queued state with position */}
            {isDescriptionQueued && descriptionQueuePosition && (
              <div className="flex items-center gap-2 text-blue-300 bg-blue-500/10 px-3 py-2 rounded-lg">
                <Clock size={16} />
                <span>
                  Queued for generation (position: {descriptionQueuePosition})
                </span>
              </div>
            )}

            {/* Cache feedback */}
            {descriptionFromCache && !loadingDescription && (
              <div className="text-xs text-green-400">
                ⚡ Description loaded from cache
              </div>
            )}

            {/* Error state */}
            {descriptionGenerationError && !isDescriptionQueued && (
              <div className="flex items-start gap-2 text-red-300 bg-red-500/10 px-3 py-2 rounded-lg">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <div className="text-sm">{descriptionGenerationError}</div>
              </div>
            )}

            {/* PEXELS IMAGE SEARCH BAR AND SUGGESTIONS */}
            <div className="pt-4 space-y-3">
              <input
                type="text"
                placeholder="Search stock images (e.g., 'Pizza')"
                value={pexelsSearchQuery}
                onChange={(e) => setPexelsSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 outline-none"
              />

              {loadingPexelsImages && (
                <p className="text-sm text-gray-400 mt-2">
                  Loading suggestions...
                </p>
              )}
              {pexelsImages.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold mb-2 text-gray-300">
                    Image Suggestions:
                  </h3>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {pexelsImages.map((img) => (
                      <img
                        key={img.id}
                        src={img.src.small}
                        alt={img.alt}
                        className="w-20 h-20 object-cover rounded-md cursor-pointer border border-transparent hover:border-yellow-400 transition-colors"
                        onClick={() => handlePexelsImageSelect(img.src.large)}
                      />
                    ))}
                  </div>
                </>
              )}
              {!loadingPexelsImages &&
                pexelsImages.length === 0 &&
                pexelsSearchQuery.trim() && (
                  <p className="text-sm text-gray-400">
                    No image suggestions found for "{pexelsSearchQuery}".
                  </p>
                )}
            </div>

            {/* IMAGE PICKER */}
            <div className="relative w-full h-52 rounded-xl overflow-hidden border border-dashed border-white/20 bg-white/5">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />

              {croppedImageUrl ? (
                <img
                  src={croppedImageUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 gap-2">
                  <ImageIcon />
                  <span className="text-sm">Click to upload image</span>
                </div>
              )}
            </div>

            {/* ✅ MUTUAL EXCLUSIVE VEG / NON-VEG */}
            <div className="flex items-center justify-between gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <Leaf className="text-emerald-400" />
                <span>Veg</span>
                <input
                  type="checkbox"
                  checked={isVeg === true}
                  onChange={() => setIsVeg(true)}
                  className="h-5 w-5 accent-emerald-400"
                />
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <Flame className="text-red-400" />
                <span>Non-Veg</span>
                <input
                  type="checkbox"
                  checked={isVeg === false}
                  onChange={() => setIsVeg(false)}
                  className="h-5 w-5 accent-red-400"
                />
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <span>Active</span>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-5 w-5 accent-yellow-400"
                />
              </label>
            </div>

            {/* METADATA */}
            <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
              <button
                type="button"
                onClick={() => setIsMetadataCollapsed(!isMetadataCollapsed)}
                className="w-full px-4 py-3 flex justify-between items-center text-sm font-semibold text-yellow-300 hover:bg-white/5"
              >
                Advanced Metadata
                <span className="text-xs opacity-70">
                  {isMetadataCollapsed ? "Expand" : "Collapse"}
                </span>
              </button>

              {!isMetadataCollapsed && (
                <div className="p-4 grid gap-4">
                  {/* Spice Level */}
                  <div className="flex items-center gap-3">
                    <Flame className="text-orange-400" />
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={spiceLevel}
                      onChange={(e) => setSpiceLevel(Number(e.target.value))}
                      className="w-full"
                    />
                    <span>{getSpiceLevelString(spiceLevel)}</span>
                  </div>

                  {/* Prep Time */}
                  <input
                    type="number"
                    placeholder="Prep Time (min)"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-yellow-400 outline-none"
                  />

                  {/* Serves */}
                  <input
                    type="number"
                    placeholder="Serves (e.g., 1, 2)"
                    value={serves}
                    onChange={(e) => setServes(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-yellow-400 outline-none"
                  />

                  {/* Chef Special */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Sparkles className="text-yellow-400" />
                    <span>Chef Special</span>
                    <input
                      type="checkbox"
                      checked={isChefSpecial}
                      onChange={(e) => setIsChefSpecial(e.target.checked)}
                      className="h-5 w-5 accent-yellow-400"
                    />
                  </label>
                </div>
              )}
            </div>

            {error && <div className="text-red-400">{error}</div>}
          </div>

          {/* ✅ FOOTER (FIXED, NO SCROLL) */}
          <div className="px-6 py-4 border-t border-white/10 flex justify-between items-center shrink-0">
            {item && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/90 hover:bg-red-500 text-white"
              >
                <Trash2 size={16} />
                Delete
              </button>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  loading ||
                  loadingPexelsImages ||
                  showCropper ||
                  loadingDescription
                }
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold hover:opacity-90"
              >
                {loading
                  ? item
                    ? "Updating..."
                    : "Adding..."
                  : item
                  ? "Update Item"
                  : "Add Item"}
              </button>
            </div>
          </div>
        </form>
        {showCropper && imageToCrop && (
          <ImageCropperModal
            imageSrc={imageToCrop}
            onCropComplete={handleCropComplete}
            onClose={handleCloseCropper}
            aspectRatio={4 / 3} // Example aspect ratio, adjust as needed
          />
        )}
      </div>
    </div>
  );
};

export default AddItemDrawer;
