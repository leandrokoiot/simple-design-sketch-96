
import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, FabricObject } from 'fabric';

interface CanvasContextType {
  fabricCanvas: FabricCanvas | null;
  setFabricCanvas: (canvas: FabricCanvas | null) => void;
  canvasObjects: FabricObject[];
  updateObjectsList: () => void;
  clipboard: FabricObject | null;
  handleCopy: () => void;
  handlePaste: () => void;
  handleDelete: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const CanvasContext = createContext<CanvasContextType | null>(null);

export const useCanvas = () => {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
};

interface CanvasProviderProps {
  children: React.ReactNode;
}

export const CanvasProvider = ({ children }: CanvasProviderProps) => {
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [canvasObjects, setCanvasObjects] = useState<FabricObject[]>([]);
  const [clipboard, setClipboard] = useState<FabricObject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateObjectsList = useCallback(() => {
    if (!fabricCanvas) return;
    
    // Debounce updates for better performance
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      const objects = fabricCanvas.getObjects().filter(obj => 
        !(obj as any).isGridLine && !(obj as any).isArtboard
      );
      setCanvasObjects(objects);
      console.log(`Objects updated: ${objects.length} objects`);
      updateTimeoutRef.current = null;
    }, 50);
  }, [fabricCanvas]);

  const handleCopy = useCallback(async () => {
    if (!fabricCanvas) return;
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      try {
        const cloned = await activeObject.clone();
        setClipboard(cloned);
        console.log("Object copied to clipboard");
      } catch (error) {
        console.error("Failed to copy object:", error);
      }
    }
  }, [fabricCanvas]);

  const handlePaste = useCallback(async () => {
    if (!fabricCanvas || !clipboard) return;
    
    try {
      const cloned = await clipboard.clone();
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      });
      
      // Generate unique ID for pasted object
      (cloned as any).id = `pasted_${Date.now()}`;
      
      fabricCanvas.add(cloned);
      fabricCanvas.setActiveObject(cloned);
      fabricCanvas.renderAll();
      console.log("Object pasted");
    } catch (error) {
      console.error("Failed to paste object:", error);
    }
  }, [fabricCanvas, clipboard]);

  const handleDelete = useCallback(() => {
    if (!fabricCanvas) return;
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => {
        // Don't delete artboards or grid lines
        if (!(obj as any).isArtboard && !(obj as any).isGridLine) {
          fabricCanvas.remove(obj);
        }
      });
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
      console.log(`Deleted ${activeObjects.length} object(s)`);
    }
  }, [fabricCanvas]);

  // Update objects list when canvas changes
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleObjectAdded = () => updateObjectsList();
    const handleObjectRemoved = () => updateObjectsList();
    const handleObjectModified = () => updateObjectsList();

    fabricCanvas.on('object:added', handleObjectAdded);
    fabricCanvas.on('object:removed', handleObjectRemoved);
    fabricCanvas.on('object:modified', handleObjectModified);

    return () => {
      fabricCanvas.off('object:added', handleObjectAdded);
      fabricCanvas.off('object:removed', handleObjectRemoved);
      fabricCanvas.off('object:modified', handleObjectModified);
      
      // Cleanup timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [fabricCanvas, updateObjectsList]);

  const value: CanvasContextType = {
    fabricCanvas,
    setFabricCanvas,
    canvasObjects,
    updateObjectsList,
    clipboard,
    handleCopy,
    handlePaste,
    handleDelete,
    isLoading,
    setIsLoading,
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
};
