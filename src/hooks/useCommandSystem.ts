
import { useState, useCallback, useRef } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { toast } from 'sonner';

export interface Command {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  execute: () => Promise<void> | void;
  undo: () => Promise<void> | void;
  canMerge?: (other: Command) => boolean;
  merge?: (other: Command) => Command;
}

export const useCommandSystem = (canvas: FabricCanvas | null) => {
  const [commandStack, setCommandStack] = useState<Command[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isExecutingRef = useRef(false);

  const canUndo = currentIndex >= 0;
  const canRedo = currentIndex < commandStack.length - 1;

  const executeCommand = useCallback(async (command: Command) => {
    if (isExecutingRef.current) return;
    
    isExecutingRef.current = true;
    
    try {
      await command.execute();
      
      setCommandStack(prev => {
        const newStack = prev.slice(0, currentIndex + 1);
        
        // Try to merge with previous command if possible
        const lastCommand = newStack[newStack.length - 1];
        if (lastCommand && command.canMerge?.(lastCommand)) {
          const mergedCommand = command.merge!(lastCommand);
          newStack[newStack.length - 1] = mergedCommand;
          return newStack;
        }
        
        // Add new command
        newStack.push(command);
        
        // Limit stack size
        const maxStackSize = 50;
        if (newStack.length > maxStackSize) {
          return newStack.slice(-maxStackSize);
        }
        
        return newStack;
      });
      
      setCurrentIndex(prev => Math.min(prev + 1, commandStack.length));
      
      console.log(`Command executed: ${command.description}`);
    } catch (error) {
      console.error('Failed to execute command:', error);
      toast(`Erro ao executar: ${command.description}`);
    } finally {
      isExecutingRef.current = false;
    }
  }, [currentIndex, commandStack.length]);

  const undo = useCallback(async () => {
    if (!canUndo || isExecutingRef.current) return;
    
    isExecutingRef.current = true;
    
    try {
      const command = commandStack[currentIndex];
      await command.undo();
      setCurrentIndex(prev => prev - 1);
      
      toast(`Desfeito: ${command.description}`);
      console.log(`Command undone: ${command.description}`);
    } catch (error) {
      console.error('Failed to undo command:', error);
      toast("Erro ao desfazer comando");
    } finally {
      isExecutingRef.current = false;
    }
  }, [canUndo, commandStack, currentIndex]);

  const redo = useCallback(async () => {
    if (!canRedo || isExecutingRef.current) return;
    
    isExecutingRef.current = true;
    
    try {
      const command = commandStack[currentIndex + 1];
      await command.execute();
      setCurrentIndex(prev => prev + 1);
      
      toast(`Refeito: ${command.description}`);
      console.log(`Command redone: ${command.description}`);
    } catch (error) {
      console.error('Failed to redo command:', error);
      toast("Erro ao refazer comando");
    } finally {
      isExecutingRef.current = false;
    }
  }, [canRedo, commandStack, currentIndex]);

  const clearHistory = useCallback(() => {
    setCommandStack([]);
    setCurrentIndex(-1);
    console.log('Command history cleared');
  }, []);

  const getHistoryInfo = useCallback(() => {
    return {
      currentIndex,
      totalCommands: commandStack.length,
      canUndo,
      canRedo,
      currentCommand: commandStack[currentIndex]?.description || 'Inicial'
    };
  }, [currentIndex, commandStack, canUndo, canRedo]);

  return {
    executeCommand,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    getHistoryInfo,
    commandStack,
    currentIndex
  };
};
