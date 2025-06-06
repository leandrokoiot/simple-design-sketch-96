
import { useEffect, useRef } from "react";
import { Canvas as FabricCanvas, Point } from "fabric";
import { useCanvas } from "@/contexts/CanvasContext";
import { useEditor } from "@/contexts/EditorContext";
import { useArtboards } from "@/contexts/ArtboardContext";
import { useArtboardSystem } from "@/hooks/useArtboardSystem";

export const CanvasManager = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cleanupFunctionsRef = useRef<Map<string, () => void>>(new Map());
  const { 
    fabricCanvas, 
    setFabricCanvas, 
    setSelectedObject,
    zoom,
    handleZoomChange 
  } = useCanvas();
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

    // Enhanced mouse wheel zoom with throttling
    let zoomTimeout: NodeJS.Timeout | null = null;
    canvas.on('mouse:wheel', (opt) => {
      if (zoomTimeout) return; // Throttle zoom events
      
      const delta = opt.e.deltaY;
      let newZoom = zoom;
      
      const zoomStep = zoom < 100 ? 5 : zoom < 200 ? 10 : 25;
      
      if (delta > 0) {
        newZoom = Math.max(10, zoom - zoomStep);
      } else {
        newZoom = Math.min(500, zoom + zoomStep);
      }
      
      if (newZoom !== zoom) {
        handleZoomChange(newZoom);
      }
      
      // Throttle zoom events
      zoomTimeout = setTimeout(() => {
        zoomTimeout = null;
      }, 16); // ~60fps throttling
      
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Object selection events
    const handleSelectionCreated = (e: any) => {
      setSelectedObject(e.selected?.[0] || null);
      console.log("Object selected:", e.selected?.[0]?.type);
    };

    const handleSelectionUpdated = (e: any) => {
      setSelectedObject(e.selected?.[0] || null);
    };

    const handleSelectionCleared = () => {
      setSelectedObject(null);
    };

    // Object added event - setup element movement
    const handleObjectAdded = (e: any) => {
      const obj = e.target;
      if (obj && !(obj as any).isArtboard) {
        const cleanup = setupElementMovement(obj, artboards);
        if (cleanup) {
          const objId = (obj as any).id || `obj-${Date.now()}`;
          (obj as any).id = objId; // Ensure object has an ID
          cleanupFunctionsRef.current.set(objId, cleanup);
        }
      }
    };

    // Object removed event - cleanup
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

      // Legacy cleanup for backwards compatibility
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
      
      // Clear zoom timeout
      if (zoomTimeout) {
        clearTimeout(zoomTimeout);
      }

      // Cleanup all object event listeners
      cleanupFunctionsRef.current.forEach(cleanup => cleanup());
      cleanupFunctionsRef.current.clear();

      // Cleanup artboard system
      cleanupArtboardSystem();

      // Remove canvas event listeners
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

  // Update element associations when artboards change (optimized)
  useEffect(() => {
    if (!fabricCanvas) return;
    
    // Debounce artboard updates
    const updateTimeout = setTimeout(() => {
      const objects = fabricCanvas.getObjects();
      objects.forEach(obj => {
        if (!(obj as any).isArtboard) {
          const objId = (obj as any).id;
          if (objId) {
            // Cleanup existing listener
            const existingCleanup = cleanupFunctionsRef.current.get(objId);
            if (existingCleanup) {
              existingCleanup();
            }
            
            // Setup new listener with updated artboards
            const newCleanup = setupElementMovement(obj, artboards);
            if (newCleanup) {
              cleanupFunctionsRef.current.set(objId, newCleanup);
            }
          }
        }
      });
    }, 100); // Debounce by 100ms

    return () => clearTimeout(updateTimeout);
  }, [artboards, fabricCanvas, setupElementMovement]);

  return <canvas ref={canvasRef} className="absolute inset-0" />;
};
