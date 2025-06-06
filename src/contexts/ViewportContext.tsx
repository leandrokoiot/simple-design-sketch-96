
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, Point } from 'fabric';

interface ViewportContextType {
  zoom: number;
  setZoom: (zoom: number) => void;
  handleZoomChange: (newZoom: number, canvas?: FabricCanvas | null) => void;
  fitToScreen: (canvas: FabricCanvas | null) => void;
  centerView: (canvas: FabricCanvas | null) => void;
  panOffset: { x: number; y: number };
  setPanOffset: (offset: { x: number; y: number }) => void;
}

const ViewportContext = createContext<ViewportContextType | null>(null);

export const useViewport = () => {
  const context = useContext(ViewportContext);
  if (!context) {
    throw new Error('useViewport must be used within a ViewportProvider');
  }
  return context;
};

interface ViewportProviderProps {
  children: React.ReactNode;
}

export const ViewportProvider = ({ children }: ViewportProviderProps) => {
  const [zoom, setZoom] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const handleZoomChange = useCallback((newZoom: number, canvas?: FabricCanvas | null) => {
    if (!canvas) return;
    
    const clampedZoom = Math.max(10, Math.min(500, newZoom));
    const zoomLevel = clampedZoom / 100;
    setZoom(clampedZoom);
    
    const center = canvas.getCenter();
    canvas.zoomToPoint(new Point(center.left, center.top), zoomLevel);
    
    // Update artboard elements based on zoom
    const objects = canvas.getObjects();
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
    
    canvas.renderAll();
    console.log(`Zoom changed to ${clampedZoom}%`);
  }, []);

  const fitToScreen = useCallback((canvas: FabricCanvas | null) => {
    if (!canvas) return;
    
    const canvasWidth = canvas.width || 1200;
    const canvasHeight = canvas.height || 800;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    const scaleX = (windowWidth * 0.8) / canvasWidth;
    const scaleY = (windowHeight * 0.8) / canvasHeight;
    const optimalScale = Math.min(scaleX, scaleY);
    
    const newZoom = Math.round(optimalScale * 100);
    handleZoomChange(Math.max(10, Math.min(500, newZoom)), canvas);
  }, [handleZoomChange]);

  const centerView = useCallback((canvas: FabricCanvas | null) => {
    if (!canvas) return;
    
    const center = canvas.getCenter();
    canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
    canvas.zoomToPoint(new Point(center.left, center.top), zoom / 100);
    setPanOffset({ x: 0, y: 0 });
  }, [zoom]);

  const value: ViewportContextType = {
    zoom,
    setZoom,
    handleZoomChange,
    fitToScreen,
    centerView,
    panOffset,
    setPanOffset,
  };

  return (
    <ViewportContext.Provider value={value}>
      {children}
    </ViewportContext.Provider>
  );
};
