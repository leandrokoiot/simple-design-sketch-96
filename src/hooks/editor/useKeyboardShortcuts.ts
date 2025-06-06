
import { useEffect } from 'react';
import { useCanvas } from '@/contexts/CanvasContext';
import { useEditor } from '@/contexts/EditorContext';
import { useUndoRedo } from '@/hooks/useUndoRedo';

export const useKeyboardShortcuts = () => {
  const { handleDelete, handleCopy, handlePaste, fabricCanvas } = useCanvas();
  const { isCreatingElement, setIsCreatingElement } = useEditor();
  const { undo, redo } = useUndoRedo(fabricCanvas);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          handleDelete();
          break;
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleCopy();
          }
          break;
        case 'v':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handlePaste();
          }
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
          }
          break;
        case 'y':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            redo();
          }
          break;
        case 'Escape':
          if (isCreatingElement) {
            setIsCreatingElement(false);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleDelete, handleCopy, handlePaste, undo, redo, isCreatingElement, setIsCreatingElement]);
};
