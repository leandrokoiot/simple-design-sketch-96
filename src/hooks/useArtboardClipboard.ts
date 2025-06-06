
import { useCallback, useState } from 'react';
import { Artboard } from '@/utils/projectState';
import { FabricObject } from 'fabric';
import { toast } from 'sonner';

interface ArtboardClipboardData {
  artboard: Omit<Artboard, 'id'>;
  elements: any[]; // Serialized fabric objects
  timestamp: number;
}

export const useArtboardClipboard = () => {
  const [clipboard, setClipboard] = useState<ArtboardClipboardData | null>(null);

  const copyArtboard = useCallback(async (
    artboard: Artboard, 
    fabricCanvas?: any
  ) => {
    try {
      let elements: any[] = [];
      
      if (fabricCanvas) {
        // Get all elements in this artboard
        const artboardElements = fabricCanvas.getObjects().filter((obj: any) => 
          obj.artboardId === artboard.id && !obj.isArtboard && !obj.isGridLine
        );
        
        // Serialize elements for copying
        elements = await Promise.all(
          artboardElements.map(async (obj: FabricObject) => {
            return obj.toObject(['id', 'artboardId']);
          })
        );
      }

      const clipboardData: ArtboardClipboardData = {
        artboard: {
          name: `${artboard.name} Copy`,
          width: artboard.width,
          height: artboard.height,
          x: artboard.x,
          y: artboard.y,
          backgroundColor: artboard.backgroundColor,
          isActive: false,
          elementIds: artboard.elementIds
        },
        elements,
        timestamp: Date.now()
      };

      setClipboard(clipboardData);
      toast.success(`Prancheta "${artboard.name}" copiada para área de transferência`);
      
    } catch (error) {
      console.error('Failed to copy artboard:', error);
      toast.error('Erro ao copiar prancheta');
    }
  }, []);

  const pasteArtboard = useCallback(async (
    onCreateArtboard: (artboard: Omit<Artboard, 'id'>) => void,
    fabricCanvas?: any,
    position?: { x: number; y: number }
  ) => {
    if (!clipboard) {
      toast.error('Nenhuma prancheta na área de transferência');
      return;
    }

    try {
      // Create new artboard with offset position
      const newArtboard = {
        ...clipboard.artboard,
        x: position?.x || clipboard.artboard.x + 50,
        y: position?.y || clipboard.artboard.y + 50,
        isActive: true
      };

      onCreateArtboard(newArtboard);

      // If we have a canvas and elements, restore them
      if (fabricCanvas && clipboard.elements.length > 0) {
        // Wait a bit for artboard to be created
        setTimeout(async () => {
          try {
            const newArtboardId = `artboard_${Date.now()}`;
            
            for (const elementData of clipboard.elements) {
              // Create new fabric object from serialized data
              const fabricClass = (window as any).fabric[elementData.type];
              if (fabricClass) {
                const newElement = await fabricClass.fromObject(elementData);
                
                // Update position relative to new artboard
                const offsetX = newArtboard.x - clipboard.artboard.x;
                const offsetY = newArtboard.y - clipboard.artboard.y;
                
                newElement.set({
                  left: (newElement.left || 0) + offsetX,
                  top: (newElement.top || 0) + offsetY,
                  id: `element_${Date.now()}_${Math.random()}`,
                  artboardId: newArtboardId
                });

                fabricCanvas.add(newElement);
              }
            }
            
            fabricCanvas.renderAll();
            toast.success('Prancheta e elementos colados com sucesso');
            
          } catch (error) {
            console.error('Failed to paste elements:', error);
            toast.warning('Prancheta colada, mas alguns elementos podem não ter sido restaurados');
          }
        }, 100);
      } else {
        toast.success('Prancheta colada com sucesso');
      }

    } catch (error) {
      console.error('Failed to paste artboard:', error);
      toast.error('Erro ao colar prancheta');
    }
  }, [clipboard]);

  const duplicateArtboard = useCallback(async (
    artboard: Artboard,
    onCreateArtboard: (artboard: Omit<Artboard, 'id'>) => void,
    fabricCanvas?: any
  ) => {
    await copyArtboard(artboard, fabricCanvas);
    await pasteArtboard(onCreateArtboard, fabricCanvas);
  }, [copyArtboard, pasteArtboard]);

  const clearClipboard = useCallback(() => {
    setClipboard(null);
    toast.info('Área de transferência limpa');
  }, []);

  const hasClipboard = Boolean(clipboard);
  const clipboardAge = clipboard ? Date.now() - clipboard.timestamp : 0;

  return {
    copyArtboard,
    pasteArtboard,
    duplicateArtboard,
    clearClipboard,
    hasClipboard,
    clipboardAge,
    clipboardData: clipboard
  };
};
