"use client"

import React, { useState, useRef } from 'react';
import { Upload, Download, GripVertical } from 'lucide-react';

const ImageGridStep2 = () => {
  const [images, setImages] = useState([]);
  const [direction, setDirection] = useState('horizontal');
  const [spacing, setSpacing] = useState(10);
  const [format, setFormat] = useState('png');
  const [debug, setDebug] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  
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
    // Necessario per Firefox
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

      // Carica tutte le immagini
      addDebugLog('Caricamento immagini...');
      const loadedImages = await Promise.all(
        images.map(img => loadImage(img.src))
      );
      addDebugLog(`Caricate ${loadedImages.length} immagini`);

      // Calcola dimensioni
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

      addDebugLog(`Dimensioni canvas calcolate: ${totalWidth}x${totalHeight}`);

      // Crea canvas
      const canvas = document.createElement('canvas');
      canvas.width = totalWidth;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d');
      
      addDebugLog('Canvas creato');

      // Disegna sfondo
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      addDebugLog('Sfondo disegnato');

      // Disegna immagini
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

      // Crea il blob e scarica
      canvas.toBlob((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `combined-image.${format}`;
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        addDebugLog('Download completato');
      }, `image/${format}`, format === 'jpeg' ? 0.9 : undefined);

    } catch (error) {
      addDebugLog(`ERRORE: ${error.message}`);
      console.error('Stack trace:', error);
      alert('Si è verificato un errore. Controlla la console per i dettagli.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
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
            className="px-4 py-2 border rounded-lg"
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
              className="w-20 px-2 py-1 border rounded-lg"
            />
          </div>

          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
            <option value="webp">WebP</option>
          </select>

          <button
            onClick={mergeAndDownload}
            disabled={images.length === 0}
            className="flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5 mr-2" />
            Unisci e Scarica
          </button>
        </div>
      </div>

      <div className="border rounded-lg p-4">
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
              className="relative"
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              style={{ opacity: draggedItem === index ? 0.5 : 1 }}
            >
              <div className="absolute top-2 left-2 cursor-grab active:cursor-grabbing bg-white rounded-full p-1 shadow-md">
                <GripVertical className="w-4 h-4" />
              </div>
              <img
                src={image.src}
                alt={`Uploaded ${image.name}`}
                className="max-w-xs rounded shadow-sm"
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

      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-bold mb-2">Log di debug:</h3>
        <div className="text-sm font-mono whitespace-pre-wrap h-40 overflow-y-auto">
          {debug.map((log, index) => (
            <div key={index} className="py-1">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageGridStep2;