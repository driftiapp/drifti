import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage'
import { storage } from './firebase'

interface ImageDimensions {
  width: number
  height: number
}

const MAX_DIMENSIONS: ImageDimensions = {
  width: 1024,
  height: 1024
}

async function optimizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width
      let height = img.height

      if (width > MAX_DIMENSIONS.width) {
        height = Math.round((height * MAX_DIMENSIONS.width) / width)
        width = MAX_DIMENSIONS.width
      }

      if (height > MAX_DIMENSIONS.height) {
        width = Math.round((width * MAX_DIMENSIONS.height) / height)
        height = MAX_DIMENSIONS.height
      }

      // Resize image
      canvas.width = width
      canvas.height = height
      ctx?.drawImage(img, 0, 0, width, height)

      // Convert to blob with quality compression
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to optimize image'))
          }
        },
        'image/jpeg',
        0.8
      )
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = URL.createObjectURL(file)
  })
}

export async function uploadProfileImage(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // Optimize image before upload
    const optimizedBlob = await optimizeImage(file)
    
    // Create a reference to the storage location
    const storageRef = ref(storage, `profile-images/${userId}/${Date.now()}-${file.name}`)
    
    // Create upload task with progress tracking
    const uploadTask = uploadBytesResumable(storageRef, optimizedBlob)
    
    // Track upload progress if callback provided
    if (onProgress) {
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          onProgress(progress)
        },
        (error) => {
          console.error('Upload error:', error)
          throw error
        }
      )
    }
    
    // Wait for upload to complete
    await uploadTask
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef)
    
    return downloadURL
  } catch (error) {
    console.error('Error uploading image:', error)
    throw new Error('Failed to upload image. Please try again.')
  }
}

export async function uploadFile(file: File, path: string) {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    
    return {
      url,
      path: snapshot.ref.fullPath,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
} 