
import { useCallback, useRef } from 'react';
import { Canvas, FabricObject } from 'fabric';
import { Artboard } from '@/utils/projectState';
import { calculateRepulsionForce } from '@/utils/artboardUtils';

export const useArtboardMovement = (canvas: Canvas | null) => {
  const animationFramesRef = useRef<Map<string, number>>(new Map());

  // Cleanup function for animations
  const cleanup = useCallback(() => {
    animationFramesRef.current.forEach(frameId => {
      cancelAnimationFrame(frameId);
    });
    animationFramesRef.current.clear();
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
          // Fixed animation call for Fabric.js v6
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
      
      // Cleanup animation frames for this artboard
      const frameId = animationFramesRef.current.get(artboardId);
      if (frameId) {
        cancelAnimationFrame(frameId);
        animationFramesRef.current.delete(artboardId);
      }
    };
  }, [canvas, syncArtboardLabel, applyArtboardRepulsion]);

  return {
    syncArtboardLabel,
    applyArtboardRepulsion,
    setupArtboardMovement,
    cleanup
  };
};
