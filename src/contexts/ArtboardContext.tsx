
import React, { createContext, useContext, useCallback, useState } from 'react';
import { Artboard } from '@/utils/projectState';
import { toast } from 'sonner';

interface ArtboardContextType {
  artboards: Artboard[];
  setArtboards: (artboards: Artboard[] | ((prev: Artboard[]) => Artboard[])) => void;
  selectedArtboard: Artboard | null;
  setSelectedArtboard: (artboard: Artboard | null) => void;
  handleUpdateArtboard: (id: string, updates: Partial<Artboard>) => void;
  handleDeleteArtboard: (id: string, fabricCanvas?: any) => void;
  findOptimalPosition: (width: number, height: number) => { x: number; y: number };
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
    
    if (selectedArtboard?.id === id) {
      setSelectedArtboard(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [selectedArtboard]);

  const handleDeleteArtboard = useCallback((id: string, fabricCanvas?: any) => {
    if (fabricCanvas) {
      const artboardElements = fabricCanvas.getObjects().filter((obj: any) => 
        obj.artboardId === id
      );
      
      artboardElements.forEach((element: any) => fabricCanvas.remove(element));
      fabricCanvas.renderAll();
    }
    
    setArtboards(prev => prev.filter(ab => ab.id !== id));
    setSelectedArtboard(null);
    
    toast.success("Prancheta excluída!");
  }, []);

  const findOptimalPosition = useCallback((width: number, height: number) => {
    if (artboards.length === 0) {
      return { x: 100, y: 100 };
    }

    const buffer = 50;
    
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const x = 100 + col * (width + buffer);
        const y = 100 + row * (height + buffer);
        
        const overlaps = artboards.some(artboard => {
          return !(
            x + width < artboard.x ||
            artboard.x + artboard.width < x ||
            y + height < artboard.y ||
            artboard.y + artboard.height < y
          );
        });
        
        if (!overlaps) {
          return { x, y };
        }
      }
    }
    
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
    findOptimalPosition,
  };

  return (
    <ArtboardContext.Provider value={value}>
      {children}
    </ArtboardContext.Provider>
  );
};
