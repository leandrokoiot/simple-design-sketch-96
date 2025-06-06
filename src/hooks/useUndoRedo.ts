
import { useState, useCallback, useRef, useEffect } from 'react';
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
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingRef = useRef(false);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyRef.current.length - 1;

  // Cleanup function
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const saveState = useCallback((description: string = 'Action') => {
    if (!canvas || isUndoing || isRedoing || isLoadingRef.current) return;
    
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce rapid saves with more aggressive timing
    debounceTimerRef.current = setTimeout(() => {
      const now = Date.now();
      if (now - lastSaveRef.current < 200) return; // Increased debounce time
      lastSaveRef.current = now;

      try {
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

        // Limit history size more aggressively to prevent memory issues
        const maxHistorySize = 30; // Reduced from 50
        if (historyRef.current.length > maxHistorySize) {
          historyRef.current = historyRef.current.slice(-maxHistorySize);
        }

        setHistoryIndex(historyRef.current.length - 1);
        console.log(`Estado salvo: ${description} (${historyRef.current.length} estados)`);
      } catch (error) {
        console.error('Erro ao salvar estado:', error);
      }

      debounceTimerRef.current = null;
    }, 300); // 300ms debounce
  }, [canvas, historyIndex, isUndoing, isRedoing]);

  const undo = useCallback(async () => {
    if (!canvas || !canUndo || isUndoing || isRedoing || isLoadingRef.current) return;

    setIsUndoing(true);
    isLoadingRef.current = true;
    
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
      isLoadingRef.current = false;
    }
  }, [canvas, canUndo, historyIndex, isUndoing, isRedoing]);

  const redo = useCallback(async () => {
    if (!canvas || !canRedo || isUndoing || isRedoing || isLoadingRef.current) return;

    setIsRedoing(true);
    isLoadingRef.current = true;
    
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
      isLoadingRef.current = false;
    }
  }, [canvas, canRedo, historyIndex, isUndoing, isRedoing]);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    setHistoryIndex(-1);
    
    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
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
    if (canvas && historyRef.current.length === 0 && !isLoadingRef.current) {
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
