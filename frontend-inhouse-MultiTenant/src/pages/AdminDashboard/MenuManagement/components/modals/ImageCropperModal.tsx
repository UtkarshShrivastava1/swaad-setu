import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "./cropUtils"; // We will create this utility
import { X, Crop as CropIcon } from "lucide-react";

interface ImageCropperModalProps {
  imageSrc: string;
  onCropComplete: (croppedImageFile: File) => void;
  onClose: () => void;
  aspectRatio?: number; // Optional aspect ratio, e.g., 1 / 1 for square
}

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  imageSrc,
  onCropComplete,
  onClose,
  aspectRatio = 1 / 1, // Default to square
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropChange = useCallback((crop: any) => {
    setCrop(crop);
  }, []);

  const onCropCompleteHandler = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const onZoomChange = useCallback((zoom: any) => {
    setZoom(zoom);
  }, []);

  const onRotationChange = useCallback((rotation: any) => {
    setRotation(rotation);
  }, []);

  const handleCrop = useCallback(async () => {
    if (!croppedAreaPixels || !imageSrc) return;

    setLoading(true);
    setError(null);
    try {
      const croppedImageBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );

      // Convert Blob to File
      const filename = `cropped-${Date.now()}.jpeg`;
      const croppedImageFile = new File([croppedImageBlob], filename, {
        type: "image/jpeg",
      });

      onCropComplete(croppedImageFile);
    } catch (err) {
      console.error("Error cropping image:", err);
      setError("Failed to crop image. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [croppedAreaPixels, imageSrc, rotation, onCropComplete]);

  return (
    <div className="fixed inset-0 z-[52] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b border-white/10 shrink-0">
          <h2 className="text-xl font-bold bg-gradient-to-r from-yellow-300 to-orange-400 text-transparent bg-clip-text">
            Crop Image
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative flex-grow min-h-[300px] max-h-[calc(90vh-180px)] bg-gray-800">
          <Cropper
            image={imageSrc}
            crop={crop}
            rotation={rotation}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onRotationChange={onRotationChange}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={onZoomChange}
            minZoom={0.1} // Allow zooming out further
            restrictPosition={false} // Allows moving image outside crop area if needed
            objectFit="horizontal-cover" // or "vertical-cover" or "contain" or "auto"
          />
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-white/10 space-y-3 shrink-0">
          <div className="flex items-center gap-4">
            <label className="text-sm">Zoom:</label>
            <input
              type="range"
              value={zoom}
              min={0.1} // Allow zooming out further
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => onZoomChange(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-700 accent-yellow-400"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-sm">Rotation:</label>
            <input
              type="range"
              value={rotation}
              min={0}
              max={360}
              step={1}
              aria-labelledby="Rotation"
              onChange={(e) => onRotationChange(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-700 accent-yellow-400"
            />
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCrop}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CropIcon size={16} />
              {loading ? "Cropping..." : "Crop & Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;
