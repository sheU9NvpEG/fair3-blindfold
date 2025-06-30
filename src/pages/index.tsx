import React, { useState, useRef, useCallback, useEffect } from 'react';
import './index.less';

interface GlassesProps {
  id: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export default function HomePage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [glasses, setGlasses] = useState<GlassesProps[]>([]);
  const [selectedGlassIndex, setSelectedGlassIndex] = useState<number>(-1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image file is too large, please select an image smaller than 10MB!');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file!');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setImageLoaded(true);
        // Clear existing glasses
        setGlasses([]);
        setSelectedGlassIndex(-1);
      };
              reader.onerror = () => {
          alert('Image loading failed, please try again!');
        };
      reader.readAsDataURL(file);
    }
  };

  // Add glasses
  const addGlasses = () => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newGlasses: GlassesProps = {
      id,
      x: 250,
      y: 150,
      rotation: 0,
      scale: 1,
    };
    setGlasses([...glasses, newGlasses]);
  };

  // Delete selected glasses
  const deleteSelectedGlasses = () => {
    if (selectedGlassIndex >= 0) {
      const newGlasses = glasses.filter((_, index) => index !== selectedGlassIndex);
      setGlasses(newGlasses);
      setSelectedGlassIndex(-1);
    }
  };

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedGlassIndex(index);
    setIsDragging(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left - glasses[index].x,
        y: e.clientY - rect.top - glasses[index].y,
      });
    }
  };

  // Handle mouse move
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && selectedGlassIndex >= 0 && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - dragStart.x;
      const newY = e.clientY - rect.top - dragStart.y;
      
      // Limit glasses within canvas bounds
      const clampedX = Math.max(50, Math.min(450, newX));
      const clampedY = Math.max(25, Math.min(375, newY));
      
      const newGlasses = [...glasses];
      newGlasses[selectedGlassIndex] = {
        ...newGlasses[selectedGlassIndex],
        x: clampedX,
        y: clampedY,
      };
      setGlasses(newGlasses);
    }
  }, [isDragging, selectedGlassIndex, glasses, dragStart]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Click empty area to deselect
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedGlassIndex(-1);
    }
  };

  // Handle keyboard events
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (selectedGlassIndex >= 0) {
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          deleteSelectedGlasses();
          break;
        case 'ArrowLeft':
          rotateGlasses(selectedGlassIndex, 'left');
          break;
        case 'ArrowRight':
          rotateGlasses(selectedGlassIndex, 'right');
          break;
        case '+':
        case '=':
          scaleGlasses(selectedGlassIndex, 'up');
          break;
        case '-':
          scaleGlasses(selectedGlassIndex, 'down');
          break;
        case 'Escape':
          setSelectedGlassIndex(-1);
          break;
      }
    }
  }, [selectedGlassIndex, glasses]);

  // Add event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    // Add keyboard event listeners
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleKeyDown]);

  // Rotate glasses
  const rotateGlasses = (index: number, direction: 'left' | 'right') => {
    const newGlasses = [...glasses];
    const rotationChange = direction === 'left' ? -15 : 15;
    newGlasses[index] = {
      ...newGlasses[index],
      rotation: (newGlasses[index].rotation + rotationChange) % 360,
    };
    setGlasses(newGlasses);
  };

  // Scale glasses
  const scaleGlasses = (index: number, direction: 'up' | 'down') => {
    const newGlasses = [...glasses];
    const scaleChange = direction === 'up' ? 0.1 : -0.1;
    const newScale = Math.max(0.3, Math.min(3, newGlasses[index].scale + scaleChange));
    newGlasses[index] = {
      ...newGlasses[index],
      scale: newScale,
    };
    setGlasses(newGlasses);
  };

  // Download image
  const downloadImage = () => {
    if (!canvasRef.current || !uploadedImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Create a temporary canvas for composition
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;

      // Clear canvas
      tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Draw background image
      const aspectRatio = img.width / img.height;
      let drawWidth, drawHeight;
      
      if (aspectRatio > tempCanvas.width / tempCanvas.height) {
        drawWidth = tempCanvas.width;
        drawHeight = tempCanvas.width / aspectRatio;
      } else {
        drawHeight = tempCanvas.height;
        drawWidth = tempCanvas.height * aspectRatio;
      }
      
      const x = (tempCanvas.width - drawWidth) / 2;
      const y = (tempCanvas.height - drawHeight) / 2;
      
      tempCtx.drawImage(img, x, y, drawWidth, drawHeight);
      
      // Draw glasses
      glasses.forEach((glass) => {
        tempCtx.save();
        tempCtx.translate(glass.x, glass.y);
        tempCtx.rotate((glass.rotation * Math.PI) / 180);
        tempCtx.scale(glass.scale, glass.scale);
        
        // Draw glasses frame
        tempCtx.strokeStyle = '#333';
        tempCtx.lineWidth = 3;
        tempCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        
        // Left lens
        tempCtx.beginPath();
        tempCtx.ellipse(-25, 0, 20, 15, 0, 0, 2 * Math.PI);
        tempCtx.fill();
        tempCtx.stroke();
        
        // Right lens
        tempCtx.beginPath();
        tempCtx.ellipse(25, 0, 20, 15, 0, 0, 2 * Math.PI);
        tempCtx.fill();
        tempCtx.stroke();
        
        // Nose bridge
        tempCtx.beginPath();
        tempCtx.moveTo(-5, -3);
        tempCtx.lineTo(5, -3);
        tempCtx.stroke();
        
        // Glasses temples
        tempCtx.beginPath();
        tempCtx.moveTo(-45, 0);
        tempCtx.lineTo(-65, -5);
        tempCtx.stroke();
        
        tempCtx.beginPath();
        tempCtx.moveTo(45, 0);
        tempCtx.lineTo(65, -5);
        tempCtx.stroke();
        
        tempCtx.restore();
      });
      
      // Download image
      try {
        const link = document.createElement('a');
        link.download = `swag-avatar-${Date.now()}.png`;
        link.href = tempCanvas.toDataURL('image/png', 1.0);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        alert('Download failed, please try again!');
        console.error('Download error:', error);
      }
    };
    img.onerror = () => {
      alert('Image processing failed, please try again!');
    };
    img.src = uploadedImage;
  };

  return (
    <div className="avatar-editor" ref={editorRef}>
      <h1>PFP MAKER</h1>
      
      <div className="controls">
        <button 
          className="btn" 
          onClick={() => fileInputRef.current?.click()}
        >
          Upload Image
        </button>
        <button 
          className="btn" 
          onClick={addGlasses}
          disabled={!imageLoaded}
        >
          Add Glasses
        </button>
        <button 
          className="btn download-btn" 
          onClick={downloadImage}
          disabled={!imageLoaded || glasses.length === 0}
        >
          Download Image
        </button>
      </div>

      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          width={500}
          height={400}
          style={{
            background: uploadedImage ? `url(${uploadedImage}) center/contain no-repeat #333` : '#333',
            border: '2px solid #666',
            borderRadius: '8px',
          }}
          onClick={handleCanvasClick}
        />
        
        {/* Glasses overlay */}
        <div className="glasses-overlay">
          {glasses.map((glass, index) => (
            <div
              key={glass.id}
              className={`glasses ${selectedGlassIndex === index ? 'selected' : ''} ${isDragging && selectedGlassIndex === index ? 'dragging' : ''}`}
              style={{
                left: glass.x - 50,
                top: glass.y - 25,
                transform: `rotate(${glass.rotation}deg) scale(${glass.scale})`,
              }}
              onMouseDown={(e) => handleMouseDown(e, index)}
            >
              <div className="glasses-frame">👓</div>
              {selectedGlassIndex === index && (
                <div 
                  className="controls-overlay"
                  style={{
                    transform: `translateX(-50%) scale(${1 / glass.scale})`,
                  }}
                >
                  <button 
                    onClick={(e) => {e.stopPropagation(); rotateGlasses(index, 'left');}}
                    title="Rotate Counterclockwise"
                  >
                    ↺
                  </button>
                  <button 
                    onClick={(e) => {e.stopPropagation(); rotateGlasses(index, 'right');}}
                    title="Rotate Clockwise"
                  >
                    ↻
                  </button>
                  <button 
                    onClick={(e) => {e.stopPropagation(); scaleGlasses(index, 'up');}}
                    title="Scale Up"
                  >
                    +
                  </button>
                  <button 
                    onClick={(e) => {e.stopPropagation(); scaleGlasses(index, 'down');}}
                    title="Scale Down"
                  >
                    -
                  </button>
                  <button 
                    onClick={(e) => {e.stopPropagation(); deleteSelectedGlasses();}}
                    title="Delete"
                    className="delete-btn"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {!imageLoaded && (
        <div className="welcome-message">
          <p>👆 Click "Upload Image" to start creating your awesome avatar</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
}
