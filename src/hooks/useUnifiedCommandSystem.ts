
import { useState, useCallback, useRef } from 'react';
import { Canvas as FabricCanvas, FabricObject } from 'fabric';
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

export const useUnifiedCommandSystem = (canvas: FabricCanvas | null) => {
  const [commandStack, setCommandStack] = useState<Command[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isExecutingRef = useRef(false);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingCommands = useRef<Command[]>([]);

  const canUndo = currentIndex >= 0;
  const canRedo = currentIndex < commandStack.length - 1;

  // Batch commands for better performance
  const batchExecute = useCallback((command: Command) => {
    pendingCommands.current.push(command);
    
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    batchTimeoutRef.current = setTimeout(async () => {
      if (isExecutingRef.current || pendingCommands.current.length === 0) return;
      
      isExecutingRef.current = true;
      const commandsToProcess = [...pendingCommands.current];
      pendingCommands.current = [];

      try {
        // Execute all pending commands
        for (const cmd of commandsToProcess) {
          await cmd.execute();
        }

        setCommandStack(prev => {
          const newStack = prev.slice(0, currentIndex + 1);
          
          // Try to merge commands if possible
          const mergedCommands = commandsToProcess.reduce((acc, cmd) => {
            const lastCommand = acc[acc.length - 1];
            if (lastCommand && cmd.canMerge?.(lastCommand)) {
              acc[acc.length - 1] = cmd.merge!(lastCommand);
            } else {
              acc.push(cmd);
            }
            return acc;
          }, newStack);
          
          // Limit stack size
          const maxStackSize = 50;
          if (mergedCommands.length > maxStackSize) {
            return mergedCommands.slice(-maxStackSize);
          }
          
          return mergedCommands;
        });
        
        setCurrentIndex(prev => prev + commandsToProcess.length);
        
        if (commandsToProcess.length === 1) {
          console.log(`Command executed: ${commandsToProcess[0].description}`);
        } else {
          console.log(`Batch executed: ${commandsToProcess.length} commands`);
        }
      } catch (error) {
        console.error('Failed to execute command batch:', error);
        toast(`Erro ao executar comando`);
      } finally {
        isExecutingRef.current = false;
        batchTimeoutRef.current = null;
      }
    }, 50); // 50ms batch window
  }, [currentIndex]);

  const executeCommand = useCallback(async (command: Command) => {
    if (isExecutingRef.current) return;
    batchExecute(command);
  }, [batchExecute]);

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
    pendingCommands.current = [];
    
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
    
    console.log('Command history cleared');
  }, []);

  const getHistoryInfo = useCallback(() => {
    return {
      currentIndex,
      totalCommands: commandStack.length,
      canUndo,
      canRedo,
      currentCommand: commandStack[currentIndex]?.description || 'Inicial',
      pendingCommands: pendingCommands.current.length
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
