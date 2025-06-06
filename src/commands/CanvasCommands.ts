
import { FabricObject, Canvas as FabricCanvas } from 'fabric';
import { Command } from '@/hooks/useCommandSystem';

export const createAddObjectCommand = (
  canvas: FabricCanvas,
  object: FabricObject
): Command => ({
  id: `add_${Date.now()}`,
  type: 'add_object',
  description: `Adicionar ${object.type}`,
  timestamp: Date.now(),
  execute: async () => {
    canvas.add(object);
    canvas.setActiveObject(object);
    canvas.renderAll();
  },
  undo: async () => {
    canvas.remove(object);
    canvas.renderAll();
  }
});

export const createDeleteObjectCommand = (
  canvas: FabricCanvas,
  object: FabricObject
): Command => ({
  id: `delete_${Date.now()}`,
  type: 'delete_object',
  description: `Excluir ${object.type}`,
  timestamp: Date.now(),
  execute: async () => {
    canvas.remove(object);
    canvas.renderAll();
  },
  undo: async () => {
    canvas.add(object);
    canvas.renderAll();
  }
});

export const createMoveObjectCommand = (
  canvas: FabricCanvas,
  object: FabricObject,
  oldPosition: { left: number; top: number },
  newPosition: { left: number; top: number }
): Command => ({
  id: `move_${Date.now()}`,
  type: 'move_object',
  description: `Mover ${object.type}`,
  timestamp: Date.now(),
  execute: async () => {
    object.set({
      left: newPosition.left,
      top: newPosition.top
    });
    object.setCoords();
    canvas.renderAll();
  },
  undo: async () => {
    object.set({
      left: oldPosition.left,
      top: oldPosition.top
    });
    object.setCoords();
    canvas.renderAll();
  },
  canMerge: (other: Command) => {
    return other.type === 'move_object' && 
           (other as any).objectId === (object as any).id &&
           Date.now() - other.timestamp < 1000;
  },
  merge: (other: Command) => createMoveObjectCommand(
    canvas,
    object,
    (other as any).oldPosition,
    newPosition
  )
});
