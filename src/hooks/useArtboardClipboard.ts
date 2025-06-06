
import { useCallback, useState } from 'react';
import { Artboard } from '@/utils/projectState';
import { toast } from 'sonner';

interface ClipboardData {
  artboard: Omit<Artboard, 'id'>;
  elements: any[];
  timestamp: number;
}

export const useArtboardClipboard = () => {
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);

  const copyArtboard = useCallback(async (artboard: Artboard, fabricCanvas?: any) => {
    try {
      let elements: any[] = [];
      
      if (fabricCanvas) {
        const artboardElements = fabricCanvas.getObjects().filter((obj: any) => 
          obj.artboardId === artboard.id && !obj.isArtboard && !obj.isGridLine
        );
        
        elements = artboardElements.map((obj: any) => {
          const serialized = obj.toObject(['id', 'artboardId']);
          return {
            ...serialized,
            originalLeft: obj.left,
            originalTop: obj.top
          };
        });
      }

      const clipboardData: ClipboardData = {
        artboard: {
          name: artboard.name,
          width: artboard.width,
          height: artboard.height,
          x: artboard.x,
          y: artboard.y,
          backgroundColor: artboard.backgroundColor,
          isActive: false,
          elementIds: []
        },
        elements,
        timestamp: Date.now()
      };

      setClipboard(clipboardData);
      toast.success(`Prancheta copiada`);
      
    } catch (error) {
      console.error('Failed to copy artboard:', error);
      toast.error('Erro ao copiar prancheta');
    }
  }, []);

  const pasteArtboard = useCallback(async (
    onCreateArtboard: (artboard: Omit<Artboard, 'id'>) => void,
    fabricCanvas?: any,
    findOptimalPosition?: (width: number, height: number) => { x: number; y: number }
  ) => {
    if (!clipboard) {
      toast.error('Nenhuma prancheta copiada');
      return;
    }

    try {
      const position = findOptimalPosition 
        ? findOptimalPosition(clipboard.artboard.width, clipboard.artboard.height)
        : { x: clipboard.artboard.x + 50, y: clipboard.artboard.y + 50 };

      const newArtboard = {
        ...clipboard.artboard,
        x: position.x,
        y: position.y,
        isActive: true
      };

      onCreateArtboard(newArtboard);

      if (fabricCanvas && clipboard.elements.length > 0) {
        setTimeout(async () => {
          const offsetX = position.x - clipboard.artboard.x;
          const offsetY = position.y - clipboard.artboard.y;
          
          const newArtboardId = `artboard_${Date.now()}`;
          
          for (const elementData of clipboard.elements) {
            try {
              const fabricClass = (window as any).fabric[elementData.type];
              if (fabricClass && fabricClass.fromObject) {
                const newElement = await new Promise((resolve, reject) => {
                  fabricClass.fromObject(elementData, (obj: any) => {
                    if (obj) {
                      resolve(obj);
                    } else {
                      reject(new Error('Failed to create object'));
                    }
                  });
                });

                if (newElement) {
                  (newElement as any).set({
                    left: (elementData.originalLeft || 0) + offsetX,
                    top: (elementData.originalTop || 0) + offsetY,
                    id: `element_${Date.now()}_${Math.random()}`,
                    artboardId: newArtboardId
                  });

                  fabricCanvas.add(newElement);
                }
              }
            } catch (error) {
              console.error('Failed to create element:', error);
            }
          }
          
          fabricCanvas.renderAll();
        }, 200);
      }

      toast.success('Prancheta colada');
      
    } catch (error) {
      console.error('Failed to paste artboard:', error);
      toast.error('Erro ao colar prancheta');
    }
  }, [clipboard]);

  const duplicateArtboard = useCallback(async (
    artboard: Artboard,
    onCreateArtboard: (artboard: Omit<Artboard, 'id'>) => void,
    fabricCanvas?: any,
    findOptimalPosition?: (width: number, height: number) => { x: number; y: number }
  ) => {
    await copyArtboard(artboard, fabricCanvas);
    await pasteArtboard(onCreateArtboard, fabricCanvas, findOptimalPosition);
  }, [copyArtboard, pasteArtboard]);

  const clearClipboard = useCallback(() => {
    setClipboard(null);
    toast.info('Área de transferência limpa');
  }, []);

  return {
    copyArtboard,
    pasteArtboard,
    duplicateArtboard,
    clearClipboard,
    hasClipboard: Boolean(clipboard),
    clipboardData: clipboard
  };
};
