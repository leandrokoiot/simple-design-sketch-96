
import { useCallback } from 'react';
import { Circle, Rect, FabricText, Line, FabricObject } from 'fabric';
import { useCanvas } from '@/contexts/CanvasContext';
import { useEditor } from '@/contexts/EditorContext';
import { useArtboards } from '@/contexts/ArtboardContext';
import { checkElementInArtboard } from '@/utils/artboardUtils';
import { toast } from 'sonner';

export const useEditorTools = () => {
  const { fabricCanvas } = useCanvas();
  const { activeTool, setActiveTool } = useEditor();
  const { artboards } = useArtboards();

  const createTextElement = useCallback(() => {
    if (!fabricCanvas) return;

    const canvasCenter = {
      x: fabricCanvas.width! / 2,
      y: fabricCanvas.height! / 2
    };

    const textElement = new FabricText("Text", {
      left: canvasCenter.x - 25,
      top: canvasCenter.y - 12,
      fontFamily: "Inter, sans-serif",
      fontSize: 24,
      fill: "#000000",
    });

    // Auto-assign to artboard if created inside one
    const containingArtboard = artboards.find(artboard => 
      checkElementInArtboard(textElement, artboard)
    );
    
    if (containingArtboard) {
      (textElement as any).artboardId = containingArtboard.id;
      console.log(`Element assigned to artboard: ${containingArtboard.name}`);
    }
    
    fabricCanvas.add(textElement);
    fabricCanvas.setActiveObject(textElement);
    fabricCanvas.renderAll();
    
    toast("Text added to canvas");
  }, [fabricCanvas, artboards]);

  const startInteractiveCreation = useCallback((elementType: string) => {
    if (!fabricCanvas) return;
    
    let isMouseDown = false;
    let startPoint: any = null;
    let previewElement: FabricObject | null = null;
    
    const handleMouseDown = (opt: any) => {
      isMouseDown = true;
      const pointer = fabricCanvas.getPointer(opt.e);
      startPoint = pointer;
      
      // Create preview element
      let preview: FabricObject;
      
      switch (elementType) {
        case 'rectangle':
          preview = new Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: 'rgba(0, 0, 0, 0.3)',
            stroke: '#000',
            strokeWidth: 1,
            strokeDashArray: [5, 5]
          });
          break;
        case 'circle':
          preview = new Circle({
            left: pointer.x,
            top: pointer.y,
            radius: 0,
            fill: 'rgba(0, 0, 0, 0.3)',
            stroke: '#000',
            strokeWidth: 1,
            strokeDashArray: [5, 5]
          });
          break;
        case 'line':
          preview = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: '#000',
            strokeWidth: 1,
            strokeDashArray: [5, 5]
          });
          break;
        default:
          return;
      }
      
      (preview as any).isPreview = true;
      preview.selectable = false;
      preview.evented = false;
      
      fabricCanvas.add(preview);
      previewElement = preview;
      fabricCanvas.renderAll();
    };
    
    const handleMouseMove = (opt: any) => {
      if (!isMouseDown || !startPoint || !previewElement) return;
      
      const pointer = fabricCanvas.getPointer(opt.e);
      const width = Math.abs(pointer.x - startPoint.x);
      const height = Math.abs(pointer.y - startPoint.y);
      
      if (elementType === 'rectangle') {
        previewElement.set({
          left: Math.min(startPoint.x, pointer.x),
          top: Math.min(startPoint.y, pointer.y),
          width: width,
          height: height
        });
      } else if (elementType === 'circle') {
        const radius = Math.max(width, height) / 2;
        previewElement.set({
          left: startPoint.x - radius,
          top: startPoint.y - radius,
          radius: radius
        });
      } else if (elementType === 'line') {
        const linePreview = previewElement as Line;
        linePreview.set({
          x1: startPoint.x,
          y1: startPoint.y,
          x2: pointer.x,
          y2: pointer.y
        });
      }
      
      fabricCanvas.renderAll();
    };
    
    const handleMouseUp = () => {
      if (!isMouseDown || !previewElement) return;
      
      isMouseDown = false;
      
      // Remove preview
      fabricCanvas.remove(previewElement);
      
      // Create final element
      let finalElement: FabricObject;
      
      if (elementType === 'rectangle') {
        finalElement = new Rect({
          left: previewElement.left,
          top: previewElement.top,
          width: (previewElement as any).width || 50,
          height: (previewElement as any).height || 50,
          fill: '#000000'
        });
      } else if (elementType === 'circle') {
        finalElement = new Circle({
          left: previewElement.left,
          top: previewElement.top,
          radius: (previewElement as any).radius || 25,
          fill: '#000000'
        });
      } else {
        const linePreview = previewElement as Line;
        finalElement = new Line([
          linePreview.x1 || 0,
          linePreview.y1 || 0,
          linePreview.x2 || 0,
          linePreview.y2 || 0
        ], {
          stroke: '#000000',
          strokeWidth: 2
        });
      }
      
      // Auto-assign element to artboard if created inside one
      const containingArtboard = artboards.find(artboard => 
        checkElementInArtboard(finalElement, artboard)
      );
      
      if (containingArtboard) {
        (finalElement as any).artboardId = containingArtboard.id;
        console.log(`Element assigned to artboard: ${containingArtboard.name}`);
        toast(`Element added to artboard: ${containingArtboard.name}`);
      }
      
      fabricCanvas.add(finalElement);
      fabricCanvas.setActiveObject(finalElement);
      fabricCanvas.renderAll();
      
      // Remove event listeners
      fabricCanvas.off('mouse:down', handleMouseDown);
      fabricCanvas.off('mouse:move', handleMouseMove);
      fabricCanvas.off('mouse:up', handleMouseUp);
      
      toast(`${elementType} created!`);
    };
    
    // Add event listeners
    fabricCanvas.on('mouse:down', handleMouseDown);
    fabricCanvas.on('mouse:move', handleMouseMove);
    fabricCanvas.on('mouse:up', handleMouseUp);
    
  }, [fabricCanvas, artboards]);

  const handleToolClick = useCallback((tool: typeof activeTool) => {
    console.log(`Tool clicked: ${tool}`);
    setActiveTool(tool);

    if (!fabricCanvas) {
      console.error("Canvas not available");
      return;
    }

    fabricCanvas.isDrawingMode = false;

    // For shapes, start interactive creation
    if (tool === "rectangle" || tool === "circle" || tool === "line") {
      startInteractiveCreation(tool);
      return;
    }

    if (tool === "text") {
      createTextElement();
    }
  }, [fabricCanvas, setActiveTool, startInteractiveCreation, createTextElement]);

  return {
    handleToolClick,
    activeTool
  };
};
