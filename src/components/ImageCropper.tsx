'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

interface ImageCropperProps {
  image: string
  onCropCompleteAction: (croppedImage: string) => void
  onCloseAction: () => void
  aspectRatio?: number
}

interface Crop {
  x: number
  y: number
}

interface PixelCrop {
  x: number
  y: number
  width: number
  height: number
}

interface AspectRatio {
  value: number
  label: string
}

const ASPECT_RATIOS: AspectRatio[] = [
  { value: 1, label: '1:1 (Square)' },
  { value: 4/3, label: '4:3' },
  { value: 16/9, label: '16:9' },
]

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.src = url
  })

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: PixelCrop,
  rotation: number = 0
): Promise<string> => {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  // Set canvas size to match the crop area
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // Apply rotation if needed
  if (rotation) {
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-canvas.width / 2, -canvas.height / 2)
  }

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Canvas is empty')
      }
      resolve(URL.createObjectURL(blob))
    }, 'image/jpeg')
  })
}

export default function ImageCropper({ 
  image, 
  onCropCompleteAction, 
  onCloseAction,
  aspectRatio = 1 
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null)
  const [loading, setLoading] = useState(false)
  const [cropShape, setCropShape] = useState<'round' | 'rect'>('round')

  const onCropChange = (crop: Crop) => {
    setCrop(crop)
  }

  const onCropAreaChange = useCallback((_: any, croppedAreaPixels: PixelCrop) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleCropComplete = useCallback(async () => {
    if (!croppedAreaPixels) return;
    
    try {
      setLoading(true);
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropCompleteAction(croppedImage);
      onCloseAction();
    } catch (error) {
      console.error('Error cropping image:', error);
      toast.error('Failed to crop image');
    } finally {
      setLoading(false);
    }
  }, [croppedAreaPixels, image, onCropCompleteAction, onCloseAction]);

  const resetZoom = () => {
    setZoom(1);
  };

  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRotation(Number(e.target.value));
  };

  const handleCropShapeChange = (shape: 'round' | 'rect') => {
    setCropShape(shape);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      >
        <div className="relative w-full max-w-2xl p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800">
          <button
            onClick={onCloseAction}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="relative h-[400px] w-full">
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspectRatio}
              cropShape={cropShape}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropAreaChange={setCroppedAreaPixels}
              minZoom={1}
              maxZoom={3}
              zoomSpeed={0.1}
              restrictPosition={true}
              style={{
                containerStyle: {
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#f3f4f6',
                },
              }}
              classes={{
                containerClassName: 'rounded-lg',
                mediaClassName: 'object-contain',
              }}
              mediaProps={{
                style: {
                  maxHeight: '100%',
                  maxWidth: '100%',
                },
              }}
              cropperProps={{}}
              keyboardStep={1}
            />
          </div>

          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleCropShapeChange('round')}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    cropShape === 'round'
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  Round
                </button>
                <button
                  onClick={() => handleCropShapeChange('rect')}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    cropShape === 'rect'
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  Square
                </button>
              </div>
              <button
                onClick={resetZoom}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Reset Zoom
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Zoom
              </label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Rotation
              </label>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={rotation}
                onChange={handleRotationChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={onCloseAction}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              onClick={handleCropComplete}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Apply'}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 