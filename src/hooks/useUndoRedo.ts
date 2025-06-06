
import { useState, useCallback, useRef } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { toast } from 'sonner';

interface HistoryState {
  canvasState: string;
  timestamp: number;
  description: string;
}

export const useUndoRedo = (canvas: FabricCanvas | null) => {
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isRedoing, setIsRedoing] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const historyRef = useRef<HistoryState[]>([]);
  const lastSaveRef = useRef<number>(0);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyRef.current.length - 1;

  const saveState = useCallback((description: string = 'Action') => {
    if (!canvas || isUndoing || isRedoing) return;
    
    // Debounce rapid saves
    const now = Date.now();
    if (now - lastSaveRef.current < 100) return;
    lastSaveRef.current = now;

    const state: HistoryState = {
      canvasState: canvas.toJSON(),
      timestamp: now,
      description
    };

    // Remove any future states if we're not at the end
    if (historyIndex < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndex + 1);
    }

    // Add new state
    historyRef.current.push(state);

    // Limit history size to prevent memory issues
    const maxHistorySize = 50;
    if (historyRef.current.length > maxHistorySize) {
      historyRef.current = historyRef.current.slice(-maxHistorySize);
    }

    setHistoryIndex(historyRef.current.length - 1);
    console.log(`Estado salvo: ${description} (${historyRef.current.length} estados)`);
  }, [canvas, historyIndex, isUndoing, isRedoing]);

  const undo = useCallback(async () => {
    if (!canvas || !canUndo || isUndoing || isRedoing) return;

    setIsUndoing(true);
    
    try {
      const targetIndex = historyIndex - 1;
      const targetState = historyRef.current[targetIndex];
      
      if (targetState) {
        await canvas.loadFromJSON(targetState.canvasState);
        canvas.renderAll();
        setHistoryIndex(targetIndex);
        
        toast(`Desfeito: ${targetState.description}`);
        console.log(`Undo para: ${targetState.description}`);
      }
    } catch (error) {
      console.error('Erro no undo:', error);
      toast("Erro ao desfazer ação");
    } finally {
      setIsUndoing(false);
    }
  }, [canvas, canUndo, historyIndex, isUndoing, isRedoing]);

  const redo = useCallback(async () => {
    if (!canvas || !canRedo || isUndoing || isRedoing) return;

    setIsRedoing(true);
    
    try {
      const targetIndex = historyIndex + 1;
      const targetState = historyRef.current[targetIndex];
      
      if (targetState) {
        await canvas.loadFromJSON(targetState.canvasState);
        canvas.renderAll();
        setHistoryIndex(targetIndex);
        
        toast(`Refeito: ${targetState.description}`);
        console.log(`Redo para: ${targetState.description}`);
      }
    } catch (error) {
      console.error('Erro no redo:', error);
      toast("Erro ao refazer ação");
    } finally {
      setIsRedoing(false);
    }
  }, [canvas, canRedo, historyIndex, isUndoing, isRedoing]);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    setHistoryIndex(-1);
    console.log('Histórico limpo');
  }, []);

  const getHistoryInfo = useCallback(() => {
    return {
      currentIndex: historyIndex,
      totalStates: historyRef.current.length,
      canUndo,
      canRedo,
      currentState: historyRef.current[historyIndex]?.description || 'Inicial'
    };
  }, [historyIndex, canUndo, canRedo]);

  // Initialize with first state
  const initializeHistory = useCallback(() => {
    if (canvas && historyRef.current.length === 0) {
      saveState('Estado inicial');
    }
  }, [canvas, saveState]);

  return {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    getHistoryInfo,
    initializeHistory,
    isUndoing,
    isRedoing
  };
};
