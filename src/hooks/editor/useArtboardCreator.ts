
import { useCallback } from 'react';
import { Rect, FabricText } from 'fabric';
import { useCanvas } from '@/contexts/CanvasContext';
import { useViewport } from '@/contexts/ViewportContext';
import { useArtboards } from '@/contexts/ArtboardContext';
import { useArtboardMovement } from '@/hooks/artboard/useArtboardMovement';
import { Artboard } from '@/utils/projectState';
import { toast } from 'sonner';

export const useArtboardCreator = () => {
  const { fabricCanvas } = useCanvas();
  const { zoom } = useViewport();
  const { 
    artboards, 
    setArtboards, 
    setSelectedArtboard, 
    findNextArtboardPosition 
  } = useArtboards();
  
  const { applyArtboardRepulsion, setupArtboardMovement } = useArtboardMovement(fabricCanvas);

  const createArtboard = useCallback((artboardData: Omit<Artboard, 'id'>) => {
    if (!fabricCanvas) return;

    // Deactivate other artboards
    setArtboards(prev => prev.map(ab => ({ ...ab, isActive: false })));

    const position = findNextArtboardPosition(artboardData.width, artboardData.height);

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

    // Aplica repulsão antes de criar
    const repulsedArtboard = applyArtboardRepulsion(newArtboard, artboards);

    // Create artboard visual with repulsed position
    const artboardRect = new Rect({
      left: repulsedArtboard.x,
      top: repulsedArtboard.y,
      width: repulsedArtboard.width,
      height: repulsedArtboard.height,
      fill: repulsedArtboard.backgroundColor || '#ffffff',
      stroke: '#3b82f6',
      strokeWidth: 2 / (zoom / 100),
      strokeDashArray: [8, 4],
      selectable: true,
      evented: true,
      rx: 4,
      ry: 4,
    });

    const artboardLabel = new FabricText(repulsedArtboard.name, {
      left: repulsedArtboard.x + 12,
      top: repulsedArtboard.y - 35,
      fontSize: 14 / (zoom / 100),
      fontFamily: 'Inter, sans-serif',
      fontWeight: 'bold',
      fill: '#3b82f6',
      selectable: false,
      evented: false,
    });

    // Adiciona propriedades customizadas
    (artboardRect as any).isArtboard = true;
    (artboardRect as any).artboardId = repulsedArtboard.id;
    (artboardRect as any).artboardData = repulsedArtboard;
    (artboardLabel as any).isArtboard = true;
    (artboardLabel as any).artboardId = repulsedArtboard.id;

    // Configura seleção
    artboardRect.on('selected', () => {
      setSelectedArtboard(repulsedArtboard);
      console.log(`Artboard selected: ${repulsedArtboard.name}`);
    });

    // Adiciona ao canvas
    fabricCanvas.add(artboardRect);
    fabricCanvas.add(artboardLabel);
    fabricCanvas.sendObjectToBack(artboardRect);

    // Configura sistema de movimento
    const cleanupMovement = setupArtboardMovement(
      artboardRect, 
      repulsedArtboard, 
      artboards, 
      setArtboards
    );

    // Adiciona animação de entrada suave - Fixed for Fabric.js v6
    artboardRect.set({ opacity: 0, scaleX: 0.8, scaleY: 0.8 });
    artboardLabel.set({ opacity: 0 });
    
    // Fixed animation calls for Fabric.js v6
    artboardRect.animate({ opacity: 1 }, {
      duration: 300,
      onChange: () => fabricCanvas.renderAll()
    });
    
    artboardRect.animate({ scaleX: 1 }, {
      duration: 300,
      onChange: () => fabricCanvas.renderAll()
    });
    
    artboardRect.animate({ scaleY: 1 }, {
      duration: 300,
      onChange: () => fabricCanvas.renderAll()
    });
    
    artboardLabel.animate({ opacity: 1 }, {
      duration: 300,
      onChange: () => fabricCanvas.renderAll()
    });

    fabricCanvas.renderAll();
    setArtboards(prev => [...prev, repulsedArtboard]);
    setSelectedArtboard(repulsedArtboard);
    
    console.log(`Artboard created: ${repulsedArtboard.name}`);
    toast(`Prancheta "${repulsedArtboard.name}" criada!`);

    // Armazena cleanup function para uso posterior
    (artboardRect as any).cleanupMovement = cleanupMovement;
  }, [fabricCanvas, zoom, findNextArtboardPosition, setArtboards, setSelectedArtboard, artboards, applyArtboardRepulsion, setupArtboardMovement]);

  return {
    createArtboard
  };
};
