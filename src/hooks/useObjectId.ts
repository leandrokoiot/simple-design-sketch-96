
import { useCallback, useRef } from 'react';

// Generate UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const useObjectId = () => {
  const counterRef = useRef(0);
  const idsCache = useRef(new Set<string>());

  const generateId = useCallback((prefix: string = 'obj') => {
    let id: string;
    do {
      id = `${prefix}_${generateUUID()}`;
    } while (idsCache.current.has(id));
    
    idsCache.current.add(id);
    return id;
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

  const releaseId = useCallback((id: string) => {
    idsCache.current.delete(id);
  }, []);

  const isIdExists = useCallback((id: string) => {
    return idsCache.current.has(id);
  }, []);

  return {
    generateId,
    generateLayerId,
    generateArtboardId,
    generateElementId,
    releaseId,
    isIdExists
  };
};
