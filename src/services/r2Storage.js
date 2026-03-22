/**
 * R2 Storage Service
 * Handles uploading files to Cloudflare R2 via pre-signed URLs.
 */

/**
 * Gets a pre-signed upload URL from the Netlify backend.
 * @param {string} fileName - The name of the file to upload.
 * @param {string} fileType - The MIME type of the file.
 * @returns {Promise<{uploadUrl: string, key: string, publicUrl: string}>}
 */
export async function getUploadUrl(fileName, fileType) {
  const response = await fetch('/.netlify/functions/get-upload-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileName, fileType }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get upload URL');
  }

  return response.json();
}

/**
 * Uploads a file directly to R2 using a pre-signed URL.
 * @param {File} file - The file object from an input or dropzone.
 * @param {Function} onProgress - Callback for upload progress (0-100).
 * @returns {Promise<{name: string, url: string, key: string}>}
 */
export async function uploadToR2(file, onProgress) {
  try {
    // 1. Get the pre-signed URL
    const { uploadUrl, key, publicUrl } = await getUploadUrl(file.name, file.type);

    // 2. Upload the file using XHR to track progress
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          if (onProgress) onProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            name: file.name,
            url: publicUrl,
            key: key,
          });
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  } catch (error) {
    console.error('R2 Upload Error:', error);
    throw error;
  }
}
