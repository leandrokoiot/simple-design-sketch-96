
import { useEffect, useRef } from "react";
import { Canvas as FabricCanvas } from "fabric";
import { useCanvas } from "@/contexts/CanvasContext";
import { useSelection } from "@/contexts/SelectionContext";
import { useViewport } from "@/contexts/ViewportContext";
import { useEditor } from "@/contexts/EditorContext";
import { useArtboards } from "@/contexts/ArtboardContext";
import { useArtboardSystem } from "@/hooks/useArtboardSystem";
import { useObjectId } from "@/hooks/useObjectId";

export const CanvasManager = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cleanupFunctionsRef = useRef<Map<string, () => void>>(new Map());
  const { generateElementId } = useObjectId();
  
  const { 
    fabricCanvas, 
    setFabricCanvas,
  } = useCanvas();
  
  const { 
    setSelectedObject,
    clearSelection 
  } = useSelection();
  
  const { 
    zoom,
    handleZoomChange 
  } = useViewport();
  
  const { activeTool } = useEditor();
  const { artboards } = useArtboards();
  const { setupElementMovement, cleanup: cleanupArtboardSystem } = useArtboardSystem(fabricCanvas);

  useEffect(() => {
    if (!canvasRef.current || fabricCanvas) return;

    console.log("Initializing canvas...");
    const canvas = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#f8f9fa",
    });

    canvas.selection = true;
    canvas.preserveObjectStacking = true;

    // Optimized mouse wheel zoom with better throttling
    let zoomTimeout: NodeJS.Timeout | null = null;
    let lastZoomTime = 0;
    
    canvas.on('mouse:wheel', (opt) => {
      const now = Date.now();
      if (now - lastZoomTime < 50) return; // Throttle to 20fps
      
      lastZoomTime = now;
      
      if (zoomTimeout) {
        clearTimeout(zoomTimeout);
      }
      
      zoomTimeout = setTimeout(() => {
        const delta = opt.e.deltaY;
        let newZoom = zoom;
        
        const zoomStep = zoom < 100 ? 5 : zoom < 200 ? 10 : 25;
        
        if (delta > 0) {
          newZoom = Math.max(10, zoom - zoomStep);
        } else {
          newZoom = Math.min(500, zoom + zoomStep);
        }
        
        if (newZoom !== zoom) {
          handleZoomChange(newZoom, canvas);
        }
        
        zoomTimeout = null;
      }, 16);
      
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Object selection events with performance optimization
    const handleSelectionCreated = (e: any) => {
      setSelectedObject(e.selected?.[0] || null);
      console.log("Object selected:", e.selected?.[0]?.type);
    };

    const handleSelectionUpdated = (e: any) => {
      setSelectedObject(e.selected?.[0] || null);
    };

    const handleSelectionCleared = () => {
      clearSelection();
    };

    // Optimized object lifecycle events
    const handleObjectAdded = (e: any) => {
      const obj = e.target;
      if (obj && !(obj as any).isArtboard) {
        // Ensure unique ID
        if (!(obj as any).id) {
          (obj as any).id = generateElementId();
        }
        
        const cleanup = setupElementMovement(obj, artboards);
        if (cleanup) {
          const objId = (obj as any).id;
          cleanupFunctionsRef.current.set(objId, cleanup);
        }
      }
    };

    const handleObjectRemoved = (e: any) => {
      const obj = e.target;
      const objId = (obj as any).id;
      
      if (objId) {
        const cleanup = cleanupFunctionsRef.current.get(objId);
        if (cleanup) {
          cleanup();
          cleanupFunctionsRef.current.delete(objId);
        }
      }

      // Legacy cleanup
      if ((obj as any).elementCleanup) {
        (obj as any).elementCleanup();
      }
      if ((obj as any).cleanupMovement) {
        (obj as any).cleanupMovement();
      }
    };

    canvas.on('selection:created', handleSelectionCreated);
    canvas.on('selection:updated', handleSelectionUpdated);
    canvas.on('selection:cleared', handleSelectionCleared);
    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:removed', handleObjectRemoved);

    setFabricCanvas(canvas);
    console.log("Canvas initialized successfully");

    return () => {
      console.log("Disposing canvas...");
      
      if (zoomTimeout) {
        clearTimeout(zoomTimeout);
      }

      cleanupFunctionsRef.current.forEach(cleanup => cleanup());
      cleanupFunctionsRef.current.clear();
      cleanupArtboardSystem();

      canvas.off('selection:created', handleSelectionCreated);
      canvas.off('selection:updated', handleSelectionUpdated);
      canvas.off('selection:cleared', handleSelectionCleared);
      canvas.off('object:added', handleObjectAdded);
      canvas.off('object:removed', handleObjectRemoved);
      
      canvas.dispose();
    };
  }, []);

  // Update drawing mode based on active tool
  useEffect(() => {
    if (!fabricCanvas) return;
    fabricCanvas.isDrawingMode = activeTool === "draw";
  }, [activeTool, fabricCanvas]);

  // Update element associations when artboards change
  useEffect(() => {
    if (!fabricCanvas) return;
    
    const updateTimeout = setTimeout(() => {
      const objects = fabricCanvas.getObjects();
      objects.forEach(obj => {
        if (!(obj as any).isArtboard) {
          const objId = (obj as any).id;
          if (objId) {
            const existingCleanup = cleanupFunctionsRef.current.get(objId);
            if (existingCleanup) {
              existingCleanup();
            }
            
            const newCleanup = setupElementMovement(obj, artboards);
            if (newCleanup) {
              cleanupFunctionsRef.current.set(objId, newCleanup);
            }
          }
        }
      });
    }, 100);

    return () => clearTimeout(updateTimeout);
  }, [artboards, fabricCanvas, setupElementMovement]);

  return <canvas ref={canvasRef} className="absolute inset-0" />;
};
