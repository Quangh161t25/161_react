/**
 * Catbox Upload Service
 * Provides helper functions to upload images and files directly to Catbox.moe
 * using the backend proxy endpoint /api/upload with userhash: 457cab18a14302fef9eba0e24
 */

export interface CatboxUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const catboxService = {
  /**
   * Upload a File object (from <input type="file"> or clipboard) to Catbox
   * @param file File to upload
   * @returns Promise<string> Direct Catbox file URL (e.g. https://files.catbox.moe/xxxxxx.png)
   */
  async uploadFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string;
          if (!base64) {
            throw new Error('Không thể đọc dữ liệu tệp');
          }
          const url = await this.uploadBase64(base64, file.name, file.type);
          resolve(url);
        } catch (err: any) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Lỗi khi đọc file'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Upload a base64 string to Catbox via backend API
   * @param base64 Base64 string or Data URL
   * @param filename Optional file name
   * @param mimeType Optional MIME type
   * @returns Promise<string> Direct Catbox file URL
   */
  async uploadBase64(
    base64: string,
    filename: string = 'image.png',
    mimeType: string = 'image/png'
  ): Promise<string> {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64,
          filename: filename || 'image.png',
          mimeType: mimeType || 'image/png',
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Upload failed (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      if (!data.success || !data.url) {
        throw new Error(data.error || 'Upload lên Catbox không thành công');
      }

      return data.url;
    } catch (err: any) {
      console.error('Catbox upload error:', err);
      throw err;
    }
  },
};
