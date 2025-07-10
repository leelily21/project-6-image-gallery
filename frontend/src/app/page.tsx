'use client';

import { useEffect, useState, FormEvent } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';

const API_URL = 'http://localhost:8000';

export default function Gallery() {
  const [images, setImages] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const fetchImages = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/images`);
      setImages(res.data);
    } catch (err) {
      console.error('Ошибка при получении изображений', err);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setError('');
      setProgress(0);

      await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          const percent = Math.round((event.loaded * 100) / (event.total || 1));
          setProgress(percent);
        },
      });

      setFile(null);
      await fetchImages();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка загрузки.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (url: string) => {
    const filename = url.split('/').pop();
    try {
      await axios.delete(`${API_URL}/api/images/${filename}`);
      setImages(images.filter(img => img !== url));
    } catch (err) {
      console.error('Ошибка удаления', err);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">Галерея изображений</h1>

        <form onSubmit={handleUpload} className="space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-blue-600 file:text-white file:rounded-lg hover:file:bg-blue-700"
          />

          {uploading && (
            <div className="w-full bg-gray-200 rounded h-4 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {error && <p className="text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
          >
            {uploading ? 'Загрузка...' : 'Загрузить'}
          </button>
        </form>

        {images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t">
            {images.map((url) => (
              <div key={url} className="relative group">
                <Image
                  src={`${API_URL}${url}`}
                  alt="uploaded"
                  width={300}
                  height={200}
                  className="object-cover rounded-lg w-full h-48"
                />
                <button
                  onClick={() => handleDelete(url)}
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-600 p-1 rounded-full transition-opacity opacity-0 group-hover:opacity-100"
                  title="Удалить"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">Нет загруженных изображений.</p>
        )}
      </div>
    </main>
  );
}
