
import { useCallback } from 'react';
import { FabricObject, Canvas as FabricCanvas } from 'fabric';
import { useCommandSystem } from './useCommandSystem';
import { 
  createAddObjectCommand, 
  createDeleteObjectCommand, 
  createMoveObjectCommand 
} from '@/commands/CanvasCommands';

export const useCanvasCommands = (canvas: FabricCanvas | null) => {
  const { executeCommand } = useCommandSystem(canvas);

  const addObject = useCallback(async (object: FabricObject) => {
    if (!canvas) return;
    
    const command = createAddObjectCommand(canvas, object);
    await executeCommand(command);
  }, [canvas, executeCommand]);

  const removeObject = useCallback(async (object: FabricObject) => {
    if (!canvas) return;
    
    const command = createDeleteObjectCommand(canvas, object);
    await executeCommand(command);
  }, [canvas, executeCommand]);

  const moveObject = useCallback(async (
    object: FabricObject,
    oldPosition: { left: number; top: number },
    newPosition: { left: number; top: number }
  ) => {
    if (!canvas) return;
    
    const command = createMoveObjectCommand(canvas, object, oldPosition, newPosition);
    await executeCommand(command);
  }, [canvas, executeCommand]);

  return {
    addObject,
    removeObject,
    moveObject
  };
};
