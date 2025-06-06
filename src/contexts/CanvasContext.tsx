
import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, FabricObject, Point } from 'fabric';
import { toast } from 'sonner';

interface CanvasContextType {
  fabricCanvas: FabricCanvas | null;
  setFabricCanvas: (canvas: FabricCanvas | null) => void;
  selectedObject: FabricObject | null;
  setSelectedObject: (obj: FabricObject | null) => void;
  canvasObjects: FabricObject[];
  updateObjectsList: () => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  handleZoomChange: (newZoom: number) => void;
  clipboard: FabricObject | null;
  handleCopy: () => void;
  handlePaste: () => void;
  handleDelete: () => void;
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
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [canvasObjects, setCanvasObjects] = useState<FabricObject[]>([]);
  const [zoom, setZoom] = useState(100);
  const [clipboard, setClipboard] = useState<FabricObject | null>(null);

  const updateObjectsList = useCallback(() => {
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getObjects().filter(obj => 
      !(obj as any).isGridLine && !(obj as any).isArtboard
    );
    setCanvasObjects(objects);
    console.log(`Objects updated: ${objects.length} objects`);
  }, [fabricCanvas]);

  const handleZoomChange = useCallback((newZoom: number) => {
    if (!fabricCanvas) return;
    
    const clampedZoom = Math.max(10, Math.min(500, newZoom));
    const zoomLevel = clampedZoom / 100;
    setZoom(clampedZoom);
    
    const center = fabricCanvas.getCenter();
    fabricCanvas.zoomToPoint(new Point(center.left, center.top), zoomLevel);
    
    // Update artboard labels size based on zoom
    const objects = fabricCanvas.getObjects();
    objects.forEach(obj => {
      if ((obj as any).isArtboard && obj.type === 'text') {
        const baseSize = 14;
        obj.set({
          fontSize: baseSize / zoomLevel,
          strokeWidth: (obj.strokeWidth || 0) / zoomLevel
        });
      }
      if ((obj as any).isArtboard && obj.type === 'rect') {
        const baseStrokeWidth = 2;
        obj.set({
          strokeWidth: baseStrokeWidth / zoomLevel
        });
      }
    });
    
    fabricCanvas.renderAll();
    console.log(`Zoom changed to ${clampedZoom}%`);
  }, [fabricCanvas]);

  const handleCopy = useCallback(() => {
    if (!fabricCanvas) return;
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      activeObject.clone().then((cloned: FabricObject) => {
        setClipboard(cloned);
        toast("Object copied!");
      });
    }
  }, [fabricCanvas]);

  const handlePaste = useCallback(() => {
    if (!fabricCanvas || !clipboard) return;
    
    clipboard.clone().then((cloned: FabricObject) => {
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      });
      fabricCanvas.add(cloned);
      fabricCanvas.setActiveObject(cloned);
      fabricCanvas.renderAll();
      toast("Object pasted!");
    });
  }, [fabricCanvas, clipboard]);

  const handleDelete = useCallback(() => {
    if (!fabricCanvas) return;
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => fabricCanvas.remove(obj));
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
      toast(`Deleted ${activeObjects.length} object(s)`);
    }
  }, [fabricCanvas]);

  // Update objects list when canvas changes
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleObjectAdded = () => updateObjectsList();
    const handleObjectRemoved = () => updateObjectsList();

    fabricCanvas.on('object:added', handleObjectAdded);
    fabricCanvas.on('object:removed', handleObjectRemoved);

    return () => {
      fabricCanvas.off('object:added', handleObjectAdded);
      fabricCanvas.off('object:removed', handleObjectRemoved);
    };
  }, [fabricCanvas, updateObjectsList]);

  const value: CanvasContextType = {
    fabricCanvas,
    setFabricCanvas,
    selectedObject,
    setSelectedObject,
    canvasObjects,
    updateObjectsList,
    zoom,
    setZoom,
    handleZoomChange,
    clipboard,
    handleCopy,
    handlePaste,
    handleDelete,
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
};
