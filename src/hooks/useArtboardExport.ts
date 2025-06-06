
import { FabricCanvas, FabricObject } from "fabric";
import { Artboard } from "@/utils/projectState";
import { toast } from "sonner";

export const useArtboardExport = () => {
  const exportArtboardAsPNG = async (
    canvas: FabricCanvas,
    artboard: Artboard,
    scale: number = 2
  ): Promise<string> => {
    if (!canvas) throw new Error("Canvas não disponível");

    // Get all objects in the artboard
    const artboardObjects = canvas.getObjects().filter(obj => 
      (obj as any).artboardId === artboard.id && !(obj as any).isArtboard
    );

    // Create temporary canvas for export
    const tempCanvas = new FabricCanvas(document.createElement('canvas'), {
      width: artboard.width * scale,
      height: artboard.height * scale,
      backgroundColor: artboard.backgroundColor || '#ffffff'
    });

    // Clone and add objects to temp canvas
    for (const obj of artboardObjects) {
      const cloned = await obj.clone();
      cloned.set({
        left: ((cloned.left || 0) - artboard.x) * scale,
        top: ((cloned.top || 0) - artboard.y) * scale,
        scaleX: (cloned.scaleX || 1) * scale,
        scaleY: (cloned.scaleY || 1) * scale
      });
      tempCanvas.add(cloned);
    }

    tempCanvas.renderAll();
    
    // Export as PNG
    const dataURL = tempCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1
    });

    // Cleanup
    tempCanvas.dispose();
    
    return dataURL;
  };

  const exportArtboardAsSVG = async (
    canvas: FabricCanvas,
    artboard: Artboard
  ): Promise<string> => {
    if (!canvas) throw new Error("Canvas não disponível");

    // Get all objects in the artboard
    const artboardObjects = canvas.getObjects().filter(obj => 
      (obj as any).artboardId === artboard.id && !(obj as any).isArtboard
    );

    // Create temporary canvas for export
    const tempCanvas = new FabricCanvas(document.createElement('canvas'), {
      width: artboard.width,
      height: artboard.height,
      backgroundColor: artboard.backgroundColor || '#ffffff'
    });

    // Clone and add objects to temp canvas
    for (const obj of artboardObjects) {
      const cloned = await obj.clone();
      cloned.set({
        left: (cloned.left || 0) - artboard.x,
        top: (cloned.top || 0) - artboard.y
      });
      tempCanvas.add(cloned);
    }

    tempCanvas.renderAll();
    
    // Export as SVG
    const svgString = tempCanvas.toSVG();

    // Cleanup
    tempCanvas.dispose();
    
    return svgString;
  };

  const downloadFile = (dataURL: string, filename: string, type: 'png' | 'svg') => {
    const link = document.createElement('a');
    link.download = filename;
    
    if (type === 'svg') {
      const blob = new Blob([dataURL], { type: 'image/svg+xml' });
      link.href = URL.createObjectURL(blob);
    } else {
      link.href = dataURL;
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (type === 'svg') {
      URL.revokeObjectURL(link.href);
    }
  };

  const exportArtboard = async (
    canvas: FabricCanvas,
    artboard: Artboard,
    format: 'png' | 'svg' = 'png',
    scale: number = 2
  ) => {
    try {
      toast("Exportando prancheta...");
      
      let data: string;
      let filename: string;
      
      if (format === 'png') {
        data = await exportArtboardAsPNG(canvas, artboard, scale);
        filename = `${artboard.name.replace(/[^a-z0-9]/gi, '_')}.png`;
      } else {
        data = await exportArtboardAsSVG(canvas, artboard);
        filename = `${artboard.name.replace(/[^a-z0-9]/gi, '_')}.svg`;
      }
      
      downloadFile(data, filename, format);
      toast(`Prancheta exportada como ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Erro ao exportar prancheta:', error);
      toast("Erro ao exportar prancheta!");
    }
  };

  return {
    exportArtboard,
    exportArtboardAsPNG,
    exportArtboardAsSVG
  };
};
