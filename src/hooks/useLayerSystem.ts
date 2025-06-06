
import { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas, FabricObject } from 'fabric';
import { toast } from 'sonner';

export interface LayerInfo {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  artboardId?: string;
  zIndex: number;
}

export const useLayerSystem = (canvas: Canvas | null) => {
  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const updateLayers = useCallback(() => {
    if (!canvas) return;
    
    // Debounce layer updates for performance
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      const objects = canvas.getObjects();
      const layerInfos: LayerInfo[] = objects
        .filter(obj => !(obj as any).isGridLine && !(obj as any).isArtboard)
        .map((obj, index) => {
          // Ensure object has an ID
          if (!(obj as any).id) {
            (obj as any).id = `layer-${Date.now()}-${index}`;
          }
          
          return {
            id: (obj as any).id,
            name: (obj as any).name || `${obj.type} ${index + 1}`,
            type: obj.type || 'object',
            visible: obj.visible !== false,
            locked: !obj.selectable,
            opacity: obj.opacity || 1,
            artboardId: (obj as any).artboardId,
            zIndex: index
          };
        });
      
      setLayers(layerInfos);
      updateTimeoutRef.current = null;
    }, 50); // 50ms debounce
  }, [canvas]);

  const getObjectById = useCallback((id: string): FabricObject | null => {
    if (!canvas) return null;
    return canvas.getObjects().find(obj => (obj as any).id === id) || null;
  }, [canvas]);

  const toggleLayerVisibility = useCallback((id: string) => {
    const obj = getObjectById(id);
    if (!obj || !canvas) return;
    
    obj.set({ visible: !obj.visible });
    canvas.renderAll();
    updateLayers();
    
    toast(`Camada ${obj.visible ? 'visível' : 'oculta'}`);
  }, [canvas, getObjectById, updateLayers]);

  const toggleLayerLock = useCallback((id: string) => {
    const obj = getObjectById(id);
    if (!obj || !canvas) return;
    
    const locked = !obj.selectable;
    obj.set({ 
      selectable: locked,
      evented: locked,
      moveable: locked,
      hoverCursor: locked ? 'default' : 'move'
    });
    
    if (!locked && canvas.getActiveObject() === obj) {
      canvas.discardActiveObject();
    }
    
    canvas.renderAll();
    updateLayers();
    
    toast(`Camada ${locked ? 'desbloqueada' : 'bloqueada'}`);
  }, [canvas, getObjectById, updateLayers]);

  const setLayerOpacity = useCallback((id: string, opacity: number) => {
    const obj = getObjectById(id);
    if (!obj || !canvas) return;
    
    obj.set({ opacity: Math.max(0, Math.min(1, opacity)) });
    canvas.renderAll();
    updateLayers();
  }, [canvas, getObjectById, updateLayers]);

  const renameLayer = useCallback((id: string, name: string) => {
    const obj = getObjectById(id);
    if (!obj) return;
    
    (obj as any).name = name;
    updateLayers();
    toast(`Camada renomeada para "${name}"`);
  }, [getObjectById, updateLayers]);

  const moveLayerUp = useCallback((id: string) => {
    const obj = getObjectById(id);
    if (!obj || !canvas) return;
    
    canvas.bringObjectForward(obj);
    canvas.renderAll();
    updateLayers();
    toast("Camada movida para frente");
  }, [canvas, getObjectById, updateLayers]);

  const moveLayerDown = useCallback((id: string) => {
    const obj = getObjectById(id);
    if (!obj || !canvas) return;
    
    canvas.sendObjectBackwards(obj);
    canvas.renderAll();
    updateLayers();
    toast("Camada movida para trás");
  }, [canvas, getObjectById, updateLayers]);

  const moveLayerToTop = useCallback((id: string) => {
    const obj = getObjectById(id);
    if (!obj || !canvas) return;
    
    canvas.bringObjectToFront(obj);
    canvas.renderAll();
    updateLayers();
    toast("Camada movida para o topo");
  }, [canvas, getObjectById, updateLayers]);

  const moveLayerToBottom = useCallback((id: string) => {
    const obj = getObjectById(id);
    if (!obj || !canvas) return;
    
    canvas.sendObjectToBack(obj);
    canvas.renderAll();
    updateLayers();
    toast("Camada movida para o fundo");
  }, [canvas, getObjectById, updateLayers]);

  const duplicateLayer = useCallback(async (id: string) => {
    const obj = getObjectById(id);
    if (!obj || !canvas) return;
    
    try {
      const cloned = await obj.clone();
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20
      });
      
      // Generate new ID for cloned object
      (cloned as any).id = `layer-${Date.now()}-cloned`;
      
      // Preserve artboard assignment
      if ((obj as any).artboardId) {
        (cloned as any).artboardId = (obj as any).artboardId;
      }
      
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
      updateLayers();
      
      toast("Camada duplicada");
    } catch (error) {
      console.error('Erro ao duplicar camada:', error);
      toast("Erro ao duplicar camada");
    }
  }, [canvas, getObjectById, updateLayers]);

  const deleteLayer = useCallback((id: string) => {
    const obj = getObjectById(id);
    if (!obj || !canvas) return;
    
    canvas.remove(obj);
    canvas.renderAll();
    updateLayers();
    toast("Camada removida");
  }, [canvas, getObjectById, updateLayers]);

  const selectLayer = useCallback((id: string) => {
    const obj = getObjectById(id);
    if (!obj || !canvas) return;
    
    canvas.setActiveObject(obj);
    canvas.renderAll();
  }, [canvas, getObjectById]);

  return {
    layers,
    updateLayers,
    toggleLayerVisibility,
    toggleLayerLock,
    setLayerOpacity,
    renameLayer,
    moveLayerUp,
    moveLayerDown,
    moveLayerToTop,
    moveLayerToBottom,
    duplicateLayer,
    deleteLayer,
    selectLayer
  };
};
