
import React, { createContext, useContext, useCallback, useState } from 'react';
import { Artboard } from '@/utils/projectState';
import { getArtboardById } from '@/utils/artboardUtils';
import { toast } from 'sonner';

interface ArtboardContextType {
  artboards: Artboard[];
  setArtboards: (artboards: Artboard[] | ((prev: Artboard[]) => Artboard[])) => void;
  selectedArtboard: Artboard | null;
  setSelectedArtboard: (artboard: Artboard | null) => void;
  handleUpdateArtboard: (id: string, updates: Partial<Artboard>) => void;
  handleDeleteArtboard: (id: string, fabricCanvas?: any) => void;
  findNextArtboardPosition: () => { x: number; y: number };
}

const ArtboardContext = createContext<ArtboardContextType | null>(null);

export const useArtboards = () => {
  const context = useContext(ArtboardContext);
  if (!context) {
    throw new Error('useArtboards must be used within an ArtboardProvider');
  }
  return context;
};

interface ArtboardProviderProps {
  children: React.ReactNode;
}

export const ArtboardProvider = ({ children }: ArtboardProviderProps) => {
  const [artboards, setArtboards] = useState<Artboard[]>([]);
  const [selectedArtboard, setSelectedArtboard] = useState<Artboard | null>(null);

  const handleUpdateArtboard = useCallback((id: string, updates: Partial<Artboard>) => {
    setArtboards(prev => prev.map(ab => 
      ab.id === id ? { ...ab, ...updates } : ab
    ));
  }, []);

  const handleDeleteArtboard = useCallback((id: string, fabricCanvas?: any) => {
    if (fabricCanvas) {
      // Remove artboard elements from canvas
      const artboardElements = fabricCanvas.getObjects().filter((obj: any) => 
        obj.artboardId === id
      );
      
      artboardElements.forEach((element: any) => fabricCanvas.remove(element));
      fabricCanvas.renderAll();
    }
    
    setArtboards(prev => prev.filter(ab => ab.id !== id));
    setSelectedArtboard(null);
    
    toast("Artboard deleted!");
  }, []);

  const findNextArtboardPosition = useCallback(() => {
    if (artboards.length === 0) {
      return { x: 100, y: 100 };
    }

    const buffer = 80;
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
      const x = 100 + (attempts % 4) * 350;
      const y = 100 + Math.floor(attempts / 4) * 250;
      
      let collision = false;
      for (const artboard of artboards) {
        const distance = Math.sqrt(Math.pow(x - artboard.x, 2) + Math.pow(y - artboard.y, 2));
        if (distance < buffer) {
          collision = true;
          break;
        }
      }
      
      if (!collision) {
        return { x, y };
      }
      
      attempts++;
    }
    
    // Fallback: place far to the right
    const maxRight = Math.max(...artboards.map(ab => ab.x + ab.width));
    return { x: maxRight + buffer, y: 100 };
  }, [artboards]);

  const value: ArtboardContextType = {
    artboards,
    setArtboards,
    selectedArtboard,
    setSelectedArtboard,
    handleUpdateArtboard,
    handleDeleteArtboard,
    findNextArtboardPosition,
  };

  return (
    <ArtboardContext.Provider value={value}>
      {children}
    </ArtboardContext.Provider>
  );
};
