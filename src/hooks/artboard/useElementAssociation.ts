
import { useCallback, useRef } from 'react';
import { FabricObject } from 'fabric';
import { Artboard } from '@/utils/projectState';
import { toast } from 'sonner';

export const useElementAssociation = () => {
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup function for timers
  const cleanup = useCallback(() => {
    debounceTimersRef.current.forEach(timerId => {
      clearTimeout(timerId);
    });
    debounceTimersRef.current.clear();
  }, []);

  // Verifica se um elemento está dentro de uma prancheta
  const getElementArtboard = useCallback((element: FabricObject, artboards: Artboard[]): Artboard | null => {
    if ((element as any).isArtboard || (element as any).isGridLine) return null;
    
    const elementBounds = element.getBoundingRect();
    const elementCenter = {
      x: elementBounds.left + elementBounds.width / 2,
      y: elementBounds.top + elementBounds.height / 2
    };
    
    // Encontra a prancheta que contém o centro do elemento
    return artboards.find(artboard => {
      return elementCenter.x >= artboard.x &&
             elementCenter.x <= artboard.x + artboard.width &&
             elementCenter.y >= artboard.y &&
             elementCenter.y <= artboard.y + artboard.height;
    }) || null;
  }, []);

  // Atualiza a associação de elementos com pranchetas (debounced)
  const updateElementArtboardAssociation = useCallback((element: FabricObject, artboards: Artboard[]) => {
    const elementId = (element as any).id || 'unknown';
    
    // Clear existing timer
    const existingTimer = debounceTimersRef.current.get(elementId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounced timer
    const timer = setTimeout(() => {
      const containingArtboard = getElementArtboard(element, artboards);
      const currentArtboardId = (element as any).artboardId;
      
      if (containingArtboard?.id !== currentArtboardId) {
        (element as any).artboardId = containingArtboard?.id || null;
        
        if (containingArtboard) {
          toast(`Elemento movido para prancheta "${containingArtboard.name}"`);
        } else if (currentArtboardId) {
          toast("Elemento removido da prancheta");
        }
      }
      
      debounceTimersRef.current.delete(elementId);
    }, 150); // Debounce de 150ms

    debounceTimersRef.current.set(elementId, timer);
    return false; // Sempre retorna false pois a atualização é async
  }, [getElementArtboard]);

  // Configura eventos de movimento para elementos regulares
  const setupElementMovement = useCallback((element: FabricObject, artboards: Artboard[]) => {
    if ((element as any).isArtboard) return;

    const onModified = () => {
      updateElementArtboardAssociation(element, artboards);
    };

    element.on('modified', onModified);

    return () => {
      element.off('modified', onModified);
      
      // Cleanup debounce timer for this element
      const elementId = (element as any).id || 'unknown';
      const timer = debounceTimersRef.current.get(elementId);
      if (timer) {
        clearTimeout(timer);
        debounceTimersRef.current.delete(elementId);
      }
    };
  }, [updateElementArtboardAssociation]);

  return {
    getElementArtboard,
    updateElementArtboardAssociation,
    setupElementMovement,
    cleanup
  };
};
