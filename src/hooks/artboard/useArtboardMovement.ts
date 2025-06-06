
import { useCallback, useRef } from 'react';
import { Canvas, FabricObject } from 'fabric';
import { Artboard } from '@/utils/projectState';
import { 
  calculateRepulsionForce, 
  updateArtboardInSpatialGrid,
  clearCaches 
} from '@/utils/artboardUtils';

export const useArtboardMovement = (canvas: Canvas | null) => {
  const animationFramesRef = useRef<Map<string, number>>(new Map());
  const lastUpdateRef = useRef<Map<string, number>>(new Map());
  const THROTTLE_DELAY = 32; // ~30fps for better performance

  const cleanup = useCallback(() => {
    animationFramesRef.current.forEach(frameId => {
      cancelAnimationFrame(frameId);
    });
    animationFramesRef.current.clear();
    lastUpdateRef.current.clear();
    clearCaches();
  }, []);

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

  const applyArtboardRepulsion = useCallback((movingArtboard: Artboard, allArtboards: Artboard[]) => {
    if (!canvas) return movingArtboard;

    let newX = movingArtboard.x;
    let newY = movingArtboard.y;
    let totalForceX = 0;
    let totalForceY = 0;
    
    // Use spatial partitioning - only check nearby artboards
    const maxCheckDistance = 250;
    const nearbyArtboards = allArtboards.filter(staticArtboard => {
      if (staticArtboard.id === movingArtboard.id) return false;
      
      const distance = Math.sqrt(
        Math.pow(movingArtboard.x - staticArtboard.x, 2) + 
        Math.pow(movingArtboard.y - staticArtboard.y, 2)
      );
      
      return distance < maxCheckDistance;
    });

    nearbyArtboards.forEach(staticArtboard => {
      const repulsion = calculateRepulsionForce(
        { ...movingArtboard, x: newX, y: newY }, 
        staticArtboard, 
        100
      );
      
      totalForceX += repulsion.x;
      totalForceY += repulsion.y;
    });

    const damping = 0.6; // Reduced for smoother movement
    newX += totalForceX * damping;
    newY += totalForceY * damping;

    const updatedArtboard = { ...movingArtboard, x: newX, y: newY };
    
    // Update spatial grid
    updateArtboardInSpatialGrid(updatedArtboard);
    
    return updatedArtboard;
  }, [canvas]);

  const setupArtboardMovement = useCallback((
    artboardRect: FabricObject, 
    artboard: Artboard, 
    allArtboards: Artboard[], 
    updateArtboards: (updater: (prev: Artboard[]) => Artboard[]) => void
  ) => {
    if (!canvas) return;

    const artboardId = artboard.id;
    let isMoving = false;

    const onMoving = () => {
      if (isMoving) return;
      
      const now = Date.now();
      const lastUpdate = lastUpdateRef.current.get(artboardId) || 0;
      
      // Throttle updates for better performance
      if (now - lastUpdate < THROTTLE_DELAY) return;
      
      isMoving = true;
      lastUpdateRef.current.set(artboardId, now);
      
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
        
        const repulsedArtboard = applyArtboardRepulsion(updatedArtboard, allArtboards);
        
        const hasRepulsion = repulsedArtboard.x !== updatedArtboard.x || repulsedArtboard.y !== updatedArtboard.y;
        
        if (hasRepulsion) {
          artboardRect.animate({ left: repulsedArtboard.x }, {
            duration: 150, // Reduced duration for snappier response
            onChange: () => {
              syncArtboardLabel(artboardRect, repulsedArtboard);
              canvas?.renderAll();
            }
          });
          
          artboardRect.animate({ top: repulsedArtboard.y }, {
            duration: 150,
            onChange: () => {
              syncArtboardLabel(artboardRect, repulsedArtboard);
              canvas?.renderAll();
            }
          });
        } else {
          syncArtboardLabel(artboardRect, updatedArtboard);
        }
        
        updateArtboards(prev => prev.map(ab => 
          ab.id === artboard.id ? repulsedArtboard : ab
        ));
        
        isMoving = false;
        animationFramesRef.current.delete(artboardId);
      });

      animationFramesRef.current.set(artboardId, frameId);
    };

    const onModified = () => {
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
      
      const frameId = animationFramesRef.current.get(artboardId);
      if (frameId) {
        cancelAnimationFrame(frameId);
        animationFramesRef.current.delete(artboardId);
      }
      lastUpdateRef.current.delete(artboardId);
    };
  }, [canvas, syncArtboardLabel, applyArtboardRepulsion]);

  return {
    syncArtboardLabel,
    applyArtboardRepulsion,
    setupArtboardMovement,
    cleanup
  };
};
