
import { useCallback } from 'react';
import { FabricObject, Canvas as FabricCanvas } from 'fabric';
import { useCommandSystem } from './useCommandSystem';
import { AddObjectCommand, RemoveObjectCommand, ModifyObjectCommand, MoveObjectCommand, BatchCommand } from '@/commands/CanvasCommands';

export const useCanvasCommands = (canvas: FabricCanvas | null) => {
  const { executeCommand } = useCommandSystem(canvas);

  const addObject = useCallback(async (object: FabricObject, index?: number) => {
    if (!canvas) return;
    
    const command = new AddObjectCommand(canvas, object, { index });
    await executeCommand(command);
  }, [canvas, executeCommand]);

  const removeObject = useCallback(async (object: FabricObject) => {
    if (!canvas) return;
    
    const command = new RemoveObjectCommand(canvas, object);
    await executeCommand(command);
  }, [canvas, executeCommand]);

  const modifyObject = useCallback(async (
    object: FabricObject, 
    oldProps: Partial<FabricObject>, 
    newProps: Partial<FabricObject>,
    description?: string
  ) => {
    if (!canvas) return;
    
    const command = new ModifyObjectCommand(canvas, object, oldProps, newProps, description);
    await executeCommand(command);
  }, [canvas, executeCommand]);

  const moveObject = useCallback(async (
    object: FabricObject,
    oldPosition: { left: number; top: number },
    newPosition: { left: number; top: number }
  ) => {
    if (!canvas) return;
    
    const command = new MoveObjectCommand(canvas, object, oldPosition, newPosition);
    await executeCommand(command);
  }, [canvas, executeCommand]);

  const batchExecute = useCallback(async (commands: any[], description?: string) => {
    if (!canvas || commands.length === 0) return;
    
    const batchCommand = new BatchCommand(commands, description);
    await executeCommand(batchCommand);
  }, [canvas, executeCommand]);

  return {
    addObject,
    removeObject,
    modifyObject,
    moveObject,
    batchExecute
  };
};
