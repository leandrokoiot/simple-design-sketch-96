
import { useState, useCallback } from 'react';
import { FabricObject, Canvas as FabricCanvas } from 'fabric';
import { toast } from 'sonner';
import { useObjectId } from './useObjectId';

export interface LayerInfo {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  object: FabricObject;
}

export const useLayerSystem = (canvas: FabricCanvas | null) => {
  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const { generateLayerId } = useObjectId();

  const getLayerName = useCallback((obj: FabricObject, index: number) => {
    const typeNames = {
      rect: 'Rectangle',
      circle: 'Circle',
      textbox: 'Text',
      text: 'Text',
      line: 'Line',
      image: 'Image',
      path: 'Drawing'
    };
    
    return `${typeNames[obj.type as keyof typeof typeNames] || 'Object'} ${index + 1}`;
  }, []);

  const updateLayers = useCallback(() => {
    if (!canvas) return;

    const objects = canvas.getObjects().filter(obj => 
      !(obj as any).isArtboard && !(obj as any).isGridLine
    );

    const newLayers: LayerInfo[] = objects.map((obj, index) => {
      const existingLayer = layers.find(l => l.object === obj);
      const objId = (obj as any).id || generateLayerId();
      
      if (!existingLayer) {
        (obj as any).id = objId;
      }

      return {
        id: existingLayer?.id || objId,
        name: existingLayer?.name || getLayerName(obj, index),
        type: obj.type,
        visible: obj.visible !== false,
        locked: (obj as any).lockMovementX || false,
        zIndex: canvas.getObjects().indexOf(obj),
        object: obj
      };
    });

    setLayers(newLayers);
  }, [canvas, layers, generateLayerId, getLayerName]);

  const selectLayer = useCallback((layerId: string) => {
    if (!canvas) return;

    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      canvas.setActiveObject(layer.object);
      canvas.renderAll();
    }
  }, [canvas, layers]);

  const toggleLayerVisibility = useCallback((layerId: string) => {
    if (!canvas) return;

    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      const newVisible = !layer.visible;
      layer.object.set({ visible: newVisible });
      canvas.renderAll();
      updateLayers();
      
      toast(`Layer ${newVisible ? 'shown' : 'hidden'}`);
    }
  }, [canvas, layers, updateLayers]);

  const toggleLayerLock = useCallback((layerId: string) => {
    if (!canvas) return;

    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      const newLocked = !layer.locked;
      layer.object.set({
        lockMovementX: newLocked,
        lockMovementY: newLocked,
        lockRotation: newLocked,
        lockScalingX: newLocked,
        lockScalingY: newLocked,
        selectable: !newLocked,
        evented: !newLocked
      });
      canvas.renderAll();
      updateLayers();
      
      toast(`Layer ${newLocked ? 'locked' : 'unlocked'}`);
    }
  }, [canvas, layers, updateLayers]);

  const deleteLayer = useCallback((layerId: string) => {
    if (!canvas) return;

    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      canvas.remove(layer.object);
      canvas.renderAll();
      updateLayers();
      
      toast('Layer deleted');
    }
  }, [canvas, layers, updateLayers]);

  const duplicateLayer = useCallback(async (layerId: string) => {
    if (!canvas) return;

    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      try {
        const cloned = await layer.object.clone();
        cloned.set({
          left: (cloned.left || 0) + 20,
          top: (cloned.top || 0) + 20,
        });
        
        (cloned as any).id = generateLayerId();
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
        updateLayers();
        
        toast('Layer duplicated');
      } catch (error) {
        console.error('Failed to duplicate layer:', error);
        toast('Failed to duplicate layer');
      }
    }
  }, [canvas, layers, updateLayers, generateLayerId]);

  const moveLayerUp = useCallback((layerId: string) => {
    if (!canvas) return;

    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      canvas.bringObjectForward(layer.object);
      canvas.renderAll();
      updateLayers();
      
      toast('Layer moved up');
    }
  }, [canvas, layers, updateLayers]);

  const moveLayerDown = useCallback((layerId: string) => {
    if (!canvas) return;

    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      canvas.sendObjectBackwards(layer.object);
      canvas.renderAll();
      updateLayers();
      
      toast('Layer moved down');
    }
  }, [canvas, layers, updateLayers]);

  const renameLayer = useCallback((layerId: string, newName: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, name: newName } : layer
    ));
    
    toast('Layer renamed');
  }, []);

  return {
    layers,
    updateLayers,
    selectLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    deleteLayer,
    duplicateLayer,
    moveLayerUp,
    moveLayerDown,
    renameLayer
  };
};
