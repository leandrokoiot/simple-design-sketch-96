
import { useCallback, useRef } from 'react';

export const useObjectId = () => {
  const counterRef = useRef(0);

  const generateId = useCallback((prefix: string = 'obj') => {
    return `${prefix}_${Date.now()}_${++counterRef.current}`;
  }, []);

  const generateLayerId = useCallback(() => {
    return generateId('layer');
  }, [generateId]);

  const generateArtboardId = useCallback(() => {
    return generateId('artboard');
  }, [generateId]);

  const generateElementId = useCallback(() => {
    return generateId('element');
  }, [generateId]);

  return {
    generateId,
    generateLayerId,
    generateArtboardId,
    generateElementId
  };
};
