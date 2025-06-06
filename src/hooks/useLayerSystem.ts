
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas as FabricCanvas, FabricObject } from 'fabric';
import { useObjectId } from './useObjectId';

export interface Layer {
  id: string;
  name: string;
  type: string;
  object: FabricObject;
  visible: boolean;
  locked: boolean;
  zIndex: number;
}

export const useLayerSystem = (canvas: FabricCanvas | null) => {
  const [layers, setLayers] = useState<Layer[]>([]);
  const { generateLayerId, releaseId } = useObjectId();

  // Memoize layer creation to avoid unnecessary recalculations
  const createLayerFromObject = useCallback((obj: FabricObject, index: number): Layer => {
    const existingId = (obj as any).layerId;
    const layerId = existingId || generateLayerId();
    
    if (!existingId) {
      (obj as any).layerId = layerId;
    }

    return {
      id: layerId,
      name: (obj as any).name || `${obj.type} ${index + 1}`,
      type: obj.type || 'object',
      object: obj,
      visible: obj.visible !== false,
      locked: (obj as any).locked === true,
      zIndex: canvas ? canvas.getObjects().indexOf(obj) : index
    };
  }, [generateLayerId, canvas]);

  // Optimized layer updates with debouncing
  const updateLayers = useCallback(() => {
    if (!canvas) {
      setLayers([]);
      return;
    }

    const objects = canvas.getObjects();
    const newLayers = objects
      .filter(obj => !(obj as any).isArtboard && !(obj as any).isGridLine)
      .map((obj, index) => createLayerFromObject(obj, index));

    setLayers(prev => {
      // Only update if layers actually changed
      if (prev.length !== newLayers.length) {
        return newLayers;
      }
      
      const hasChanged = prev.some((layer, index) => {
        const newLayer = newLayers[index];
        return !newLayer || 
               layer.id !== newLayer.id || 
               layer.visible !== newLayer.visible ||
               layer.locked !== newLayer.locked ||
               layer.zIndex !== newLayer.zIndex;
      });
      
      return hasChanged ? newLayers : prev;
    });
  }, [canvas, createLayerFromObject]);

  // Debounced update to prevent excessive re-renders
  useEffect(() => {
    if (!canvas) return;

    let timeoutId: NodeJS.Timeout;
    
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateLayers, 100);
    };

    const handleObjectAdded = () => debouncedUpdate();
    const handleObjectRemoved = (e: any) => {
      const obj = e.target;
      const layerId = (obj as any).layerId;
      if (layerId) {
        releaseId(layerId);
      }
      debouncedUpdate();
    };
    const handleObjectModified = () => debouncedUpdate();

    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:removed', handleObjectRemoved);
    canvas.on('object:modified', handleObjectModified);
    
    // Initial update
    updateLayers();

    return () => {
      clearTimeout(timeoutId);
      canvas.off('object:added', handleObjectAdded);
      canvas.off('object:removed', handleObjectRemoved);
      canvas.off('object:modified', handleObjectModified);
    };
  }, [canvas, updateLayers, releaseId]);

  const toggleLayerVisibility = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !canvas) return;

    const newVisible = !layer.visible;
    layer.object.set({ visible: newVisible });
    canvas.renderAll();
    
    setLayers(prev => prev.map(l => 
      l.id === layerId ? { ...l, visible: newVisible } : l
    ));
  }, [layers, canvas]);

  const toggleLayerLock = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !canvas) return;

    const newLocked = !layer.locked;
    (layer.object as any).locked = newLocked;
    layer.object.set({
      selectable: !newLocked,
      evented: !newLocked
    });
    canvas.renderAll();
    
    setLayers(prev => prev.map(l => 
      l.id === layerId ? { ...l, locked: newLocked } : l
    ));
  }, [layers, canvas]);

  const moveLayerUp = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !canvas) return;

    // Use correct Fabric.js v6 method
    canvas.bringObjectForward(layer.object);
    canvas.renderAll();
    updateLayers();
  }, [layers, canvas, updateLayers]);

  const moveLayerDown = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !canvas) return;

    // Use correct Fabric.js v6 method
    canvas.sendObjectBackwards(layer.object);
    canvas.renderAll();
    updateLayers();
  }, [layers, canvas, updateLayers]);

  const duplicateLayer = useCallback(async (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !canvas) return;

    try {
      // Use correct Fabric.js v6 clone method
      const cloned = await layer.object.clone();
      cloned.set({
        left: (cloned.left || 0) + 10,
        top: (cloned.top || 0) + 10,
      });
      
      const newLayerId = generateLayerId();
      (cloned as any).layerId = newLayerId;
      (cloned as any).name = `${layer.name} Copy`;
      
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
    } catch (error) {
      console.error('Failed to duplicate layer:', error);
    }
  }, [layers, canvas, generateLayerId]);

  const deleteLayer = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !canvas) return;

    canvas.remove(layer.object);
    releaseId(layerId);
    canvas.renderAll();
  }, [layers, canvas, releaseId]);

  // Memoize expensive calculations
  const layerStats = useMemo(() => ({
    total: layers.length,
    visible: layers.filter(l => l.visible).length,
    locked: layers.filter(l => l.locked).length
  }), [layers]);

  return {
    layers,
    layerStats,
    updateLayers,
    toggleLayerVisibility,
    toggleLayerLock,
    moveLayerUp,
    moveLayerDown,
    duplicateLayer,
    deleteLayer
  };
};
