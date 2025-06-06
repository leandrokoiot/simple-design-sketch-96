
import { useCallback } from 'react';
import { Canvas } from 'fabric';
import { useArtboardMovement } from '@/hooks/artboard/useArtboardMovement';
import { useElementAssociation } from '@/hooks/artboard/useElementAssociation';

export const useArtboardSystem = (canvas: Canvas | null) => {
  const artboardMovement = useArtboardMovement(canvas);
  const elementAssociation = useElementAssociation();

  // Cleanup function for all subsystems
  const cleanup = useCallback(() => {
    artboardMovement.cleanup();
    elementAssociation.cleanup();
  }, [artboardMovement, elementAssociation]);

  return {
    // Artboard movement functions
    syncArtboardLabel: artboardMovement.syncArtboardLabel,
    applyArtboardRepulsion: artboardMovement.applyArtboardRepulsion,
    setupArtboardMovement: artboardMovement.setupArtboardMovement,
    
    // Element association functions
    getElementArtboard: elementAssociation.getElementArtboard,
    updateElementArtboardAssociation: elementAssociation.updateElementArtboardAssociation,
    setupElementMovement: elementAssociation.setupElementMovement,
    
    // Global cleanup
    cleanup
  };
};
