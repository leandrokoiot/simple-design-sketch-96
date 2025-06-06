
import { useCallback } from 'react';
import { Rect, FabricText } from 'fabric';
import { useCanvas } from '@/contexts/CanvasContext';
import { useArtboards } from '@/contexts/ArtboardContext';
import { Artboard } from '@/utils/projectState';
import { toast } from 'sonner';

export const useArtboardCreator = () => {
  const { fabricCanvas, zoom } = useCanvas();
  const { 
    artboards, 
    setArtboards, 
    setSelectedArtboard, 
    findNextArtboardPosition 
  } = useArtboards();

  const createArtboard = useCallback((artboardData: Omit<Artboard, 'id'>) => {
    if (!fabricCanvas) return;

    // Deactivate other artboards
    setArtboards(prev => prev.map(ab => ({ ...ab, isActive: false })));

    const position = findNextArtboardPosition();

    const newArtboard: Artboard = {
      ...artboardData,
      id: `artboard_${Date.now()}`,
      x: position.x,
      y: position.y,
      width: Math.min(artboardData.width, 2000),
      height: Math.min(artboardData.height, 2000),
      backgroundColor: artboardData.backgroundColor || '#ffffff',
      isActive: true,
      elementIds: []
    };

    // Create artboard visual
    const artboardRect = new Rect({
      left: newArtboard.x,
      top: newArtboard.y,
      width: newArtboard.width,
      height: newArtboard.height,
      fill: newArtboard.backgroundColor || '#ffffff',
      stroke: '#3b82f6',
      strokeWidth: 2 / (zoom / 100),
      strokeDashArray: [8, 4],
      selectable: true,
      evented: true,
      rx: 4,
      ry: 4,
    });

    const artboardLabel = new FabricText(newArtboard.name, {
      left: newArtboard.x + 12,
      top: newArtboard.y - 35,
      fontSize: 14 / (zoom / 100),
      fontFamily: 'Inter, sans-serif',
      fontWeight: 'bold',
      fill: '#3b82f6',
      selectable: false,
      evented: false,
    });

    (artboardRect as any).isArtboard = true;
    (artboardRect as any).artboardId = newArtboard.id;
    (artboardRect as any).artboardData = newArtboard;
    (artboardLabel as any).isArtboard = true;
    (artboardLabel as any).artboardId = newArtboard.id;

    artboardRect.on('selected', () => {
      setSelectedArtboard(newArtboard);
      console.log(`Artboard selected: ${newArtboard.name}`);
    });

    fabricCanvas.add(artboardRect);
    fabricCanvas.add(artboardLabel);
    fabricCanvas.sendObjectToBack(artboardRect);

    fabricCanvas.renderAll();
    setArtboards(prev => [...prev, newArtboard]);
    setSelectedArtboard(newArtboard);
    
    console.log(`Artboard created: ${newArtboard.name}`);
    toast(`Prancheta "${newArtboard.name}" criada!`);
  }, [fabricCanvas, zoom, findNextArtboardPosition, setArtboards, setSelectedArtboard]);

  return {
    createArtboard
  };
};
