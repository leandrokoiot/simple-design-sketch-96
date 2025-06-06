
import { FabricObject, Canvas as FabricCanvas } from 'fabric';
import { Command } from '@/hooks/useCommandSystem';

export class AddObjectCommand implements Command {
  id: string;
  type = 'add_object';
  description: string;
  timestamp: number;

  constructor(
    private canvas: FabricCanvas,
    private object: FabricObject,
    private position?: { index?: number }
  ) {
    this.id = `add_object_${Date.now()}`;
    this.description = `Adicionar ${object.type}`;
    this.timestamp = Date.now();
  }

  async execute() {
    if (this.position?.index !== undefined) {
      this.canvas.insertAt(this.object, this.position.index);
    } else {
      this.canvas.add(this.object);
    }
    this.canvas.renderAll();
  }

  async undo() {
    this.canvas.remove(this.object);
    this.canvas.renderAll();
  }
}

export class RemoveObjectCommand implements Command {
  id: string;
  type = 'remove_object';
  description: string;
  timestamp: number;
  private objectIndex: number;

  constructor(
    private canvas: FabricCanvas,
    private object: FabricObject
  ) {
    this.id = `remove_object_${Date.now()}`;
    this.description = `Remover ${object.type}`;
    this.timestamp = Date.now();
    this.objectIndex = canvas.getObjects().indexOf(object);
  }

  async execute() {
    this.canvas.remove(this.object);
    this.canvas.renderAll();
  }

  async undo() {
    this.canvas.insertAt(this.object, this.objectIndex);
    this.canvas.renderAll();
  }
}

export class ModifyObjectCommand implements Command {
  id: string;
  type = 'modify_object';
  description: string;
  timestamp: number;

  constructor(
    private canvas: FabricCanvas,
    private object: FabricObject,
    private oldProps: Partial<FabricObject>,
    private newProps: Partial<FabricObject>,
    description?: string
  ) {
    this.id = `modify_object_${Date.now()}`;
    this.description = description || `Modificar ${object.type}`;
    this.timestamp = Date.now();
  }

  async execute() {
    this.object.set(this.newProps);
    this.canvas.renderAll();
  }

  async undo() {
    this.object.set(this.oldProps);
    this.canvas.renderAll();
  }

  canMerge(other: Command): boolean {
    return other.type === 'modify_object' && 
           (other as ModifyObjectCommand).object === this.object &&
           this.timestamp - other.timestamp < 1000; // Merge if within 1 second
  }

  merge(other: Command): Command {
    const otherCmd = other as ModifyObjectCommand;
    return new ModifyObjectCommand(
      this.canvas,
      this.object,
      otherCmd.oldProps, // Keep the original old props
      this.newProps, // Use the latest new props
      `Modificar ${this.object.type} (merged)`
    );
  }
}

export class MoveObjectCommand implements Command {
  id: string;
  type = 'move_object';
  description: string;
  timestamp: number;

  constructor(
    private canvas: FabricCanvas,
    private object: FabricObject,
    private oldPosition: { left: number; top: number },
    private newPosition: { left: number; top: number }
  ) {
    this.id = `move_object_${Date.now()}`;
    this.description = `Mover ${object.type}`;
    this.timestamp = Date.now();
  }

  async execute() {
    this.object.set(this.newPosition);
    this.canvas.renderAll();
  }

  async undo() {
    this.object.set(this.oldPosition);
    this.canvas.renderAll();
  }

  canMerge(other: Command): boolean {
    return other.type === 'move_object' && 
           (other as MoveObjectCommand).object === this.object &&
           this.timestamp - other.timestamp < 500; // Merge moves within 500ms
  }

  merge(other: Command): Command {
    const otherCmd = other as MoveObjectCommand;
    return new MoveObjectCommand(
      this.canvas,
      this.object,
      otherCmd.oldPosition, // Keep the original position
      this.newPosition, // Use the latest position
    );
  }
}

export class BatchCommand implements Command {
  id: string;
  type = 'batch';
  description: string;
  timestamp: number;

  constructor(
    private commands: Command[],
    description?: string
  ) {
    this.id = `batch_${Date.now()}`;
    this.description = description || `Operação em lote (${commands.length} comandos)`;
    this.timestamp = Date.now();
  }

  async execute() {
    for (const command of this.commands) {
      await command.execute();
    }
  }

  async undo() {
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      await this.commands[i].undo();
    }
  }
}
