"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, GripVertical, Moon, Sun } from 'lucide-react';

const ImageGridStep2 = () => {
  const [images, setImages] = useState([]);
  const [direction, setDirection] = useState('horizontal');
  const [spacing, setSpacing] = useState(10);
  const [format, setFormat] = useState('png');
  const [quality, setQuality] = useState(90);
  const [debug, setDebug] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  // Controlla il tema di sistema all'avvio
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  const addDebugLog = (message) => {
    console.log(message);
    setDebug(prev => [...prev, message]);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    addDebugLog(`Inizio upload di ${files.length} files`);
    
    files.forEach(file => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        addDebugLog(`File ${file.name} caricato come DataURL`);
        setImages(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          src: event.target.result,
          name: file.name,
          type: file.type,
          size: file.size
        }]);
      };
      
      reader.onerror = (error) => {
        addDebugLog(`Errore nella lettura del file ${file.name}: ${error}`);
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedItem === null) return;

    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedItem, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    
    setImages(newImages);
    setDraggedItem(null);
    addDebugLog(`Immagine spostata da posizione ${draggedItem} a ${dropIndex}`);
  };

  const mergeAndDownload = async () => {
    if (images.length === 0) {
      addDebugLog('Nessuna immagine da processare');
      return;
    }

    try {
      addDebugLog('Inizio processo di unione immagini');
      
      const loadImage = (src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      };

      const loadedImages = await Promise.all(images.map(img => loadImage(img.src)));
      addDebugLog(`Caricate ${loadedImages.length} immagini`);

      let totalWidth = 0;
      let totalHeight = 0;

      if (direction === 'horizontal') {
        totalWidth = loadedImages.reduce((sum, img) => sum + img.width, 0) + 
                    (spacing * (loadedImages.length - 1));
        totalHeight = Math.max(...loadedImages.map(img => img.height));
      } else {
        totalWidth = Math.max(...loadedImages.map(img => img.width));
        totalHeight = loadedImages.reduce((sum, img) => sum + img.height, 0) + 
                     (spacing * (loadedImages.length - 1));
      }

      const canvas = document.createElement('canvas');
      canvas.width = totalWidth;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = darkMode ? '#1F2937' : '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let currentX = 0;
      let currentY = 0;

      loadedImages.forEach((img, index) => {
        if (direction === 'horizontal') {
          ctx.drawImage(img, currentX, 0);
          currentX += img.width + spacing;
        } else {
          ctx.drawImage(img, 0, currentY);
          currentY += img.height + spacing;
        }
        addDebugLog(`Immagine ${index + 1} disegnata`);
      });

      canvas.toBlob(
        (blob) => {
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `combined-image.${format}`;
          link.href = blobUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
          addDebugLog('Download completato');
        },
        `image/${format}`,
        format !== 'png' ? quality / 100 : undefined
      );

    } catch (error) {
      addDebugLog(`ERRORE: ${error.message}`);
      console.error('Stack trace:', error);
      alert('Si è verificato un errore. Controlla la console per i dettagli.');
    }
  };

  const showQualitySelector = format === 'jpeg' || format === 'webp';

  return (
    <div className={`min-h-screen w-full ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-white text-black'}`}>
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Tema e controlli principali */}
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Image Grid Creator</h1>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          {/* Controlli principali */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className={`flex items-center justify-center px-4 py-2 rounded-lg cursor-pointer transition-colors ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}>
              <Upload className="w-5 h-5 mr-2" />
              Carica Immagini
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className={`px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
            >
              <option value="horizontal">Orizzontale</option>
              <option value="vertical">Verticale</option>
            </select>

            <div className="flex items-center gap-2">
              <label>Spazio (px):</label>
              <input
                type="number"
                min="0"
                max="100"
                value={spacing}
                onChange={(e) => setSpacing(parseInt(e.target.value))}
                className={`w-20 px-2 py-1 border rounded-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
              />
            </div>

            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className={`px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
              <option value="webp">WebP</option>
            </select>

            {showQualitySelector && (
              <div className="flex items-center gap-2">
                <label>Qualità:</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="w-12 text-center">{quality}%</span>
              </div>
            )}

            <button
              onClick={mergeAndDownload}
              disabled={images.length === 0}
              className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                ${darkMode ? 
                  'bg-green-600 hover:bg-green-700 text-white' : 
                  'bg-green-500 hover:bg-green-600 text-white'}`}
            >
              <Download className="w-5 h-5 mr-2" />
              Unisci e Scarica
            </button>
          </div>
        </div>

        {/* Area immagini */}
        <div className={`border rounded-lg p-4 ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
          <div
            className="flex flex-wrap gap-4"
            style={{
              flexDirection: direction === 'horizontal' ? 'row' : 'column',
              gap: `${spacing}px`
            }}
          >
            {images.map((image, index) => (
              <div
                key={image.id}
                className="relative group"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                style={{ opacity: draggedItem === index ? 0.5 : 1 }}
              >
                <div className={`absolute top-2 left-2 cursor-grab active:cursor-grabbing rounded-full p-1 shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <GripVertical className="w-4 h-4" />
                </div>
                <img
                  src={image.src}
                  alt={`Uploaded ${image.name}`}
                  className="max-w-[280px] md:max-w-xs rounded shadow-sm"
                />
                <button
                  onClick={() => {
                    addDebugLog(`Rimozione immagine: ${image.name}`);
                    setImages(images.filter((_, i) => i !== index));
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Area debug */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <h3 className="font-bold mb-2">Log di debug:</h3>
          <div className={`text-sm font-mono whitespace-pre-wrap h-40 overflow-y-auto ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {debug.map((log, index) => (
              <div key={index} className="py-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGridStep2;