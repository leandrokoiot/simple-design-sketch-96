
import { useCallback } from 'react';
import { Canvas, FabricObject, Point } from 'fabric';
import { Artboard } from '@/utils/projectState';
import { calculateRepulsionForce } from '@/utils/artboardUtils';
import { toast } from 'sonner';

export const useArtboardSystem = (canvas: Canvas | null) => {
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

  // Aplica repulsão entre pranchetas
  const applyArtboardRepulsion = useCallback((movingArtboard: Artboard, allArtboards: Artboard[]) => {
    if (!canvas) return movingArtboard;

    let newX = movingArtboard.x;
    let newY = movingArtboard.y;
    
    allArtboards.forEach(staticArtboard => {
      if (staticArtboard.id === movingArtboard.id) return;
      
      const repulsion = calculateRepulsionForce(
        { ...movingArtboard, x: newX, y: newY }, 
        staticArtboard, 
        150 // Distância de repulsão
      );
      
      newX += repulsion.x;
      newY += repulsion.y;
    });

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

  // Atualiza a associação de elementos com pranchetas
  const updateElementArtboardAssociation = useCallback((element: FabricObject, artboards: Artboard[]) => {
    const containingArtboard = getElementArtboard(element, artboards);
    const currentArtboardId = (element as any).artboardId;
    
    if (containingArtboard?.id !== currentArtboardId) {
      (element as any).artboardId = containingArtboard?.id || null;
      
      if (containingArtboard) {
        toast(`Elemento movido para prancheta "${containingArtboard.name}"`);
      } else if (currentArtboardId) {
        toast("Elemento removido da prancheta");
      }
      
      return true; // Indica que houve mudança
    }
    
    return false;
  }, [getElementArtboard]);

  // Configura eventos de movimento para pranchetas
  const setupArtboardMovement = useCallback((artboardRect: FabricObject, artboard: Artboard, allArtboards: Artboard[], updateArtboards: (updater: (prev: Artboard[]) => Artboard[]) => void) => {
    if (!canvas) return;

    let isMoving = false;
    let animationFrame: number;

    const onMoving = () => {
      if (isMoving) return;
      isMoving = true;
      
      animationFrame = requestAnimationFrame(() => {
        const updatedArtboard = {
          ...artboard,
          x: artboardRect.left || 0,
          y: artboardRect.top || 0
        };
        
        // Aplica repulsão
        const repulsedArtboard = applyArtboardRepulsion(updatedArtboard, allArtboards);
        
        // Atualiza posição com repulsão suave
        if (repulsedArtboard.x !== updatedArtboard.x || repulsedArtboard.y !== updatedArtboard.y) {
          // Fixed animation calls for Fabric.js v6 - using correct syntax
          artboardRect.animate({
            left: repulsedArtboard.x,
            duration: 200,
            onChange: () => {
              syncArtboardLabel(artboardRect, repulsedArtboard);
              canvas?.renderAll();
            }
          });
          
          artboardRect.animate({
            top: repulsedArtboard.y,
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
      });
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
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
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
    };
  }, [canvas, updateElementArtboardAssociation]);

  return {
    syncArtboardLabel,
    applyArtboardRepulsion,
    getElementArtboard,
    updateElementArtboardAssociation,
    setupArtboardMovement,
    setupElementMovement
  };
};
