
import { useCallback, useRef } from 'react';
import { Canvas, FabricObject, Point } from 'fabric';
import { Artboard } from '@/utils/projectState';
import { calculateRepulsionForce } from '@/utils/artboardUtils';
import { toast } from 'sonner';

export const useArtboardSystem = (canvas: Canvas | null) => {
  const animationFramesRef = useRef<Map<string, number>>(new Map());
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup function for animations and timers
  const cleanup = useCallback(() => {
    animationFramesRef.current.forEach(frameId => {
      cancelAnimationFrame(frameId);
    });
    animationFramesRef.current.clear();

    debounceTimersRef.current.forEach(timerId => {
      clearTimeout(timerId);
    });
    debounceTimersRef.current.clear();
  }, []);

  // Sincroniza o label da prancheta com sua posição
  const syncArtboardLabel = useCallback((artboardRect: FabricObject, artboard: Artboard) => {
    if (!canvas) return;
    
    const artboardLabel = canvas.getObjects().find(obj => 
      (obj as any).isArtboard && 
      (obj as any).artboardId === artboard.id && 
      obj.type === 'text'
    );
    
    if (artboardLabel) {
      artboardLabel.set({
        left: (artboardRect.left || 0) + 12,
        top: (artboardRect.top || 0) - 35
      });
      artboardLabel.setCoords();
    }
  }, [canvas]);

  // Aplica repulsão entre pranchetas com otimização
  const applyArtboardRepulsion = useCallback((movingArtboard: Artboard, allArtboards: Artboard[]) => {
    if (!canvas) return movingArtboard;

    let newX = movingArtboard.x;
    let newY = movingArtboard.y;
    let totalForceX = 0;
    let totalForceY = 0;
    
    // Limitar verificações apenas para artboards próximos
    const nearbyArtboards = allArtboards.filter(staticArtboard => {
      if (staticArtboard.id === movingArtboard.id) return false;
      
      const distance = Math.sqrt(
        Math.pow(movingArtboard.x - staticArtboard.x, 2) + 
        Math.pow(movingArtboard.y - staticArtboard.y, 2)
      );
      
      return distance < 300; // Só verificar artboards próximos
    });

    nearbyArtboards.forEach(staticArtboard => {
      const repulsion = calculateRepulsionForce(
        { ...movingArtboard, x: newX, y: newY }, 
        staticArtboard, 
        120 // Reduzir distância de repulsão para performance
      );
      
      totalForceX += repulsion.x;
      totalForceY += repulsion.y;
    });

    // Aplicar força com damping para evitar oscilações
    const damping = 0.8;
    newX += totalForceX * damping;
    newY += totalForceY * damping;

    return { ...movingArtboard, x: newX, y: newY };
  }, [canvas]);

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

  // Configura eventos de movimento para pranchetas
  const setupArtboardMovement = useCallback((artboardRect: FabricObject, artboard: Artboard, allArtboards: Artboard[], updateArtboards: (updater: (prev: Artboard[]) => Artboard[]) => void) => {
    if (!canvas) return;

    const artboardId = artboard.id;
    let isMoving = false;

    const onMoving = () => {
      if (isMoving) return;
      isMoving = true;
      
      // Cancel previous animation frame
      const existingFrame = animationFramesRef.current.get(artboardId);
      if (existingFrame) {
        cancelAnimationFrame(existingFrame);
      }

      const frameId = requestAnimationFrame(() => {
        const updatedArtboard = {
          ...artboard,
          x: artboardRect.left || 0,
          y: artboardRect.top || 0
        };
        
        // Aplica repulsão
        const repulsedArtboard = applyArtboardRepulsion(updatedArtboard, allArtboards);
        
        // Atualiza posição com repulsão suave apenas se necessário
        const hasRepulsion = repulsedArtboard.x !== updatedArtboard.x || repulsedArtboard.y !== updatedArtboard.y;
        
        if (hasRepulsion) {
          // Fixed animation call for Fabric.js v6 - using object format
          artboardRect.animate('left', repulsedArtboard.x, {
            duration: 200,
            onChange: () => {
              syncArtboardLabel(artboardRect, repulsedArtboard);
              canvas?.renderAll();
            }
          });
          
          artboardRect.animate('top', repulsedArtboard.y, {
            duration: 200,
            onChange: () => {
              syncArtboardLabel(artboardRect, repulsedArtboard);
              canvas?.renderAll();
            }
          });
        } else {
          syncArtboardLabel(artboardRect, updatedArtboard);
        }
        
        // Atualiza estado
        updateArtboards(prev => prev.map(ab => 
          ab.id === artboard.id ? repulsedArtboard : ab
        ));
        
        isMoving = false;
        animationFramesRef.current.delete(artboardId);
      });

      animationFramesRef.current.set(artboardId, frameId);
    };

    const onModified = () => {
      // Sincroniza após modificação completa
      syncArtboardLabel(artboardRect, {
        ...artboard,
        x: artboardRect.left || 0,
        y: artboardRect.top || 0
      });
    };

    artboardRect.on('moving', onMoving);
    artboardRect.on('modified', onModified);

    return () => {
      artboardRect.off('moving', onMoving);
      artboardRect.off('modified', onModified);
      
      // Cleanup animation frames and timers for this artboard
      const frameId = animationFramesRef.current.get(artboardId);
      if (frameId) {
        cancelAnimationFrame(frameId);
        animationFramesRef.current.delete(artboardId);
      }
    };
  }, [canvas, syncArtboardLabel, applyArtboardRepulsion]);

  // Configura eventos de movimento para elementos regulares
  const setupElementMovement = useCallback((element: FabricObject, artboards: Artboard[]) => {
    if (!canvas || (element as any).isArtboard) return;

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
  }, [canvas, updateElementArtboardAssociation]);

  return {
    syncArtboardLabel,
    applyArtboardRepulsion,
    getElementArtboard,
    updateElementArtboardAssociation,
    setupArtboardMovement,
    setupElementMovement,
    cleanup
  };
};
