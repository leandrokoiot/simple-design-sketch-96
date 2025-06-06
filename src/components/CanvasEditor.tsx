import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, Circle, Rect, FabricText, Line, FabricObject, Point, Group, FabricImage } from "fabric";
import { MinimalSidebar } from "./MinimalSidebar";
import { MinimalLayersPanel } from "./MinimalLayersPanel";
import { MinimalPropertiesPanel } from "./MinimalPropertiesPanel";
import { ZoomControls } from "./ZoomControls";
import { DebugPanel } from "./DebugPanel";
import { useVersionControl } from "@/hooks/useVersionControl";
import { Artboard } from "@/utils/projectState";
import { toast } from "sonner";

export const CanvasEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<"select" | "rectangle" | "circle" | "text" | "line" | "hand" | "draw" | "image">("select");
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [canvasObjects, setCanvasObjects] = useState<FabricObject[]>([]);
  const [clipboard, setClipboard] = useState<FabricObject | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [artboards, setArtboards] = useState<Artboard[]>([]);

  const { createNewVersion } = useVersionControl();

  const gridSize = 20;

  // Update objects list with debounce
  const updateObjectsList = useCallback(() => {
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getObjects().filter(obj => !(obj as any).isGridLine && !(obj as any).isArtboard);
    setCanvasObjects(objects);
    console.log(`Objects updated: ${objects.length} objects`);
  }, [fabricCanvas]);

  // Copy/Paste/Delete handlers
  const handleCopy = useCallback(() => {
    if (!fabricCanvas) return;
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      activeObject.clone().then((cloned: FabricObject) => {
        setClipboard(cloned);
        toast("Object copied!");
      });
    }
  }, [fabricCanvas]);

  const handlePaste = useCallback(() => {
    if (!fabricCanvas || !clipboard) return;
    
    clipboard.clone().then((cloned: FabricObject) => {
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      });
      fabricCanvas.add(cloned);
      fabricCanvas.setActiveObject(cloned);
      fabricCanvas.renderAll();
      toast("Object pasted!");
    });
  }, [fabricCanvas, clipboard]);

  const handleDelete = useCallback(() => {
    if (!fabricCanvas) return;
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => fabricCanvas.remove(obj));
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
      toast(`Deleted ${activeObjects.length} object(s)`);
    }
  }, [fabricCanvas]);

  // Draw grid on canvas
  const drawGrid = useCallback((canvas: FabricCanvas) => {
    if (!showGrid) return;

    const canvasWidth = canvas.width || 1200;
    const canvasHeight = canvas.height || 800;
    
    // Clear existing grid
    const existingGrid = canvas.getObjects().filter(obj => (obj as any).isGridLine);
    existingGrid.forEach(line => canvas.remove(line));

    // Draw vertical lines
    for (let i = 0; i <= canvasWidth; i += gridSize) {
      const line = new Line([i, 0, i, canvasHeight], {
        stroke: '#e5e7eb',
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      (line as any).isGridLine = true;
      canvas.add(line);
      canvas.sendObjectToBack(line);
    }

    // Draw horizontal lines
    for (let i = 0; i <= canvasHeight; i += gridSize) {
      const line = new Line([0, i, canvasWidth, i], {
        stroke: '#e5e7eb',
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      (line as any).isGridLine = true;
      canvas.add(line);
      canvas.sendObjectToBack(line);
    }
  }, [showGrid, gridSize]);

  // Snap object to grid
  const snapToGridFn = useCallback((obj: FabricObject) => {
    if (!snapToGrid) return;
    
    const snappedLeft = Math.round((obj.left || 0) / gridSize) * gridSize;
    const snappedTop = Math.round((obj.top || 0) / gridSize) * gridSize;
    
    obj.set({
      left: snappedLeft,
      top: snappedTop
    });
  }, [snapToGrid, gridSize]);

  // Zoom functionality - FIXED
  const handleZoomChange = useCallback((newZoom: number) => {
    if (!fabricCanvas) return;
    
    const zoomLevel = newZoom / 100;
    setZoom(newZoom);
    
    const center = fabricCanvas.getCenter();
    fabricCanvas.zoomToPoint(new Point(center.left, center.top), zoomLevel);
    fabricCanvas.renderAll();
    
    console.log(`Zoom changed to ${newZoom}%`);
  }, [fabricCanvas]);

  const handleFitToScreen = useCallback(() => {
    if (!fabricCanvas) return;
    
    const canvasWidth = fabricCanvas.width || 1200;
    const canvasHeight = fabricCanvas.height || 800;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    const scaleX = (windowWidth * 0.8) / canvasWidth;
    const scaleY = (windowHeight * 0.8) / canvasHeight;
    const optimalScale = Math.min(scaleX, scaleY);
    
    const newZoom = Math.round(optimalScale * 100);
    handleZoomChange(Math.max(25, Math.min(300, newZoom)));
  }, [fabricCanvas, handleZoomChange]);

  // Find next available position for artboard to avoid overlap
  const findNextArtboardPosition = useCallback(() => {
    if (artboards.length === 0) {
      return { x: 100, y: 100 };
    }

    // Find the rightmost artboard
    let maxRight = 0;
    let currentRowY = 100;
    
    artboards.forEach(artboard => {
      const right = artboard.x + artboard.width;
      if (right > maxRight) {
        maxRight = right;
        currentRowY = artboard.y;
      }
    });

    // Place new artboard to the right with some spacing
    return { x: maxRight + 50, y: currentRowY };
  }, [artboards]);

  // Artboard functionality - IMPROVED
  const createArtboard = useCallback((artboardData: Omit<Artboard, 'id'>) => {
    if (!fabricCanvas) return;

    // Deactivate other artboards
    setArtboards(prev => prev.map(ab => ({ ...ab, isActive: false })));

    // Find position to avoid overlap
    const position = findNextArtboardPosition();

    const newArtboard: Artboard = {
      ...artboardData,
      id: `artboard_${Date.now()}`,
      x: position.x,
      y: position.y,
      // Ensure reasonable size limits
      width: Math.min(artboardData.width, 1200),
      height: Math.min(artboardData.height, 800)
    };

    // Create visual artboard on canvas
    const artboardRect = new Rect({
      left: newArtboard.x,
      top: newArtboard.y,
      width: newArtboard.width,
      height: newArtboard.height,
      fill: 'rgba(255, 255, 255, 0.95)',
      stroke: '#3b82f6',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
      rx: 8,
      ry: 8,
    });

    // Add artboard label
    const artboardLabel = new FabricText(newArtboard.name, {
      left: newArtboard.x + 10,
      top: newArtboard.y - 25,
      fontSize: 14,
      fontFamily: 'Inter, sans-serif',
      fill: '#3b82f6',
      selectable: false,
      evented: false,
    });

    (artboardRect as any).isArtboard = true;
    (artboardRect as any).artboardId = newArtboard.id;
    (artboardLabel as any).isArtboard = true;
    (artboardLabel as any).artboardId = newArtboard.id;

    fabricCanvas.add(artboardRect);
    fabricCanvas.add(artboardLabel);
    fabricCanvas.sendObjectToBack(artboardRect);
    fabricCanvas.sendObjectToBack(artboardLabel);

    // Auto-adjust canvas size if needed
    const requiredWidth = newArtboard.x + newArtboard.width + 100;
    const requiredHeight = newArtboard.y + newArtboard.height + 100;
    
    if (requiredWidth > fabricCanvas.width! || requiredHeight > fabricCanvas.height!) {
      fabricCanvas.setDimensions({
        width: Math.max(fabricCanvas.width!, requiredWidth),
        height: Math.max(fabricCanvas.height!, requiredHeight)
      });
    }

    fabricCanvas.renderAll();

    setArtboards(prev => [...prev, newArtboard]);
    
    // Create version
    createNewVersion(`Created artboard: ${newArtboard.name}`, fabricCanvas.toJSON(), zoom, [...artboards, newArtboard]);
    
    console.log(`Artboard created: ${newArtboard.name}`);
    toast(`Artboard "${newArtboard.name}" created!`);
  }, [fabricCanvas, zoom, artboards, createNewVersion, findNextArtboardPosition]);

  // Initialize canvas only once
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

    // Mouse wheel zoom - FIXED
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let newZoom = zoom;
      
      if (delta > 0) {
        newZoom = Math.max(25, zoom - 10);
      } else {
        newZoom = Math.min(300, zoom + 10);
      }
      
      if (newZoom !== zoom) {
        const pointer = canvas.getPointer(opt.e);
        const zoomLevel = newZoom / 100;
        canvas.zoomToPoint(new Point(pointer.x, pointer.y), zoomLevel);
        setZoom(newZoom);
      }
      
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

    const handleObjectAdded = () => {
      console.log("Object added to canvas");
      updateObjectsList();
    };

    const handleObjectRemoved = () => {
      console.log("Object removed from canvas");
      updateObjectsList();
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
      canvas.off('selection:created', handleSelectionCreated);
      canvas.off('selection:updated', handleSelectionUpdated);
      canvas.off('selection:cleared', handleSelectionCleared);
      canvas.off('object:added', handleObjectAdded);
      canvas.off('object:removed', handleObjectRemoved);
      canvas.dispose();
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          handleDelete();
          break;
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleCopy();
          }
          break;
        case 'v':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handlePaste();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleDelete, handleCopy, handlePaste]);

  // Tool handlers
  const handleToolClick = useCallback((tool: typeof activeTool) => {
    console.log(`Tool clicked: ${tool}`);
    setActiveTool(tool);

    if (!fabricCanvas) {
      console.error("Canvas not available");
      return;
    }

    fabricCanvas.isDrawingMode = false;

    const canvasCenter = {
      x: fabricCanvas.width! / 2,
      y: fabricCanvas.height! / 2
    };

    let newObject: FabricObject | null = null;

    if (tool === "rectangle") {
      console.log("Creating rectangle...");
      newObject = new Rect({
        left: canvasCenter.x - 75,
        top: canvasCenter.y - 50,
        width: 150,
        height: 100,
        fill: "#000000",
        rx: 0,
        ry: 0,
      });
    } else if (tool === "circle") {
      console.log("Creating circle...");
      newObject = new Circle({
        left: canvasCenter.x - 50,
        top: canvasCenter.y - 50,
        radius: 50,
        fill: "#000000",
      });
    } else if (tool === "text") {
      console.log("Creating text...");
      newObject = new FabricText("Text", {
        left: canvasCenter.x - 25,
        top: canvasCenter.y - 12,
        fontFamily: "Inter, sans-serif",
        fontSize: 24,
        fill: "#000000",
      });
    } else if (tool === "line") {
      console.log("Creating line...");
      newObject = new Line([
        canvasCenter.x - 75, 
        canvasCenter.y, 
        canvasCenter.x + 75, 
        canvasCenter.y
      ], {
        stroke: "#000000",
        strokeWidth: 2,
      });
    }

    if (newObject) {
      fabricCanvas.add(newObject);
      fabricCanvas.setActiveObject(newObject);
      fabricCanvas.renderAll();
      console.log(`${tool} added successfully`);
      toast(`${tool} added to canvas`);
      
      // Create version for object creation
      createNewVersion(`Added ${tool}`, fabricCanvas.toJSON(), zoom, artboards);
    }
  }, [fabricCanvas, zoom, artboards, createNewVersion]);

  const handleSelectObject = (obj: FabricObject) => {
    if (!fabricCanvas) return;
    fabricCanvas.setActiveObject(obj);
    fabricCanvas.renderAll();
  };

  const handleDeleteObject = (obj: FabricObject) => {
    if (!fabricCanvas) return;
    fabricCanvas.remove(obj);
    fabricCanvas.renderAll();
    setSelectedObject(null);
  };

  const handleAlign = (alignment: string) => {
    if (!fabricCanvas) return;
    
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length === 0) return;

    const canvasWidth = fabricCanvas.width || 1200;
    const canvasHeight = fabricCanvas.height || 800;

    activeObjects.forEach(obj => {
      switch (alignment) {
        case 'left':
          obj.set({ left: 0 });
          break;
        case 'center':
          obj.set({ left: (canvasWidth - (obj.width || 0) * (obj.scaleX || 1)) / 2 });
          break;
        case 'right':
          obj.set({ left: canvasWidth - (obj.width || 0) * (obj.scaleX || 1) });
          break;
        case 'top':
          obj.set({ top: 0 });
          break;
        case 'middle':
          obj.set({ top: (canvasHeight - (obj.height || 0) * (obj.scaleY || 1)) / 2 });
          break;
        case 'bottom':
          obj.set({ top: canvasHeight - (obj.height || 0) * (obj.scaleY || 1) });
          break;
      }
      obj.setCoords();
    });

    fabricCanvas.renderAll();
    toast(`Aligned ${activeObjects.length} object(s) to ${alignment}`);
  };

  const handleDistribute = (direction: 'horizontal' | 'vertical') => {
    if (!fabricCanvas) return;
    
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length < 3) {
      toast("Select at least 3 objects to distribute");
      return;
    }

    if (direction === 'horizontal') {
      const sortedObjects = [...activeObjects].sort((a, b) => (a.left || 0) - (b.left || 0));
      const leftmost = sortedObjects[0].left || 0;
      const rightmost = (sortedObjects[sortedObjects.length - 1].left || 0) + 
                       (sortedObjects[sortedObjects.length - 1].width || 0) * (sortedObjects[sortedObjects.length - 1].scaleX || 1);
      
      const totalWidth = rightmost - leftmost;
      const spacing = totalWidth / (sortedObjects.length - 1);
      
      sortedObjects.forEach((obj, index) => {
        if (index > 0 && index < sortedObjects.length - 1) {
          obj.set({ left: leftmost + spacing * index });
          obj.setCoords();
        }
      });
    } else {
      const sortedObjects = [...activeObjects].sort((a, b) => (a.top || 0) - (b.top || 0));
      const topmost = sortedObjects[0].top || 0;
      const bottommost = (sortedObjects[sortedObjects.length - 1].top || 0) + 
                        (sortedObjects[sortedObjects.length - 1].height || 0) * (sortedObjects[sortedObjects.length - 1].scaleY || 1);
      
      const totalHeight = bottommost - topmost;
      const spacing = totalHeight / (sortedObjects.length - 1);
      
      sortedObjects.forEach((obj, index) => {
        if (index > 0 && index < sortedObjects.length - 1) {
          obj.set({ top: topmost + spacing * index });
          obj.setCoords();
        }
      });
    }

    fabricCanvas.renderAll();
    toast(`Distributed ${activeObjects.length} objects ${direction}ly`);
  };

  const handleGroup = () => {
    if (!fabricCanvas) return;
    
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length < 2) {
      toast("Select at least 2 objects to group");
      return;
    }

    const group = new Group(activeObjects, {
      left: Math.min(...activeObjects.map(obj => obj.left || 0)),
      top: Math.min(...activeObjects.map(obj => obj.top || 0)),
    });

    activeObjects.forEach(obj => fabricCanvas.remove(obj));
    fabricCanvas.add(group);
    fabricCanvas.setActiveObject(group);
    fabricCanvas.renderAll();
    toast("Objects grouped!");
  };

  const handleUngroup = () => {
    if (!fabricCanvas) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    if (!activeObject || activeObject.type !== 'group') {
      toast("Select a group to ungroup");
      return;
    }

    const group = activeObject as Group;
    const objects = group.getObjects();
    
    fabricCanvas.remove(group);
    objects.forEach(obj => {
      fabricCanvas.add(obj);
    });
    
    fabricCanvas.renderAll();
    toast("Group ungrouped!");
  };

  const handleToggleVisibility = (obj: FabricObject) => {
    obj.set({ visible: !obj.visible });
    fabricCanvas?.renderAll();
  };

  const handleToggleLock = (obj: FabricObject) => {
    const isLocked = (obj as any).lockMovementX;
    (obj as any).lockMovementX = !isLocked;
    (obj as any).lockMovementY = !isLocked;
    (obj as any).lockRotation = !isLocked;
    (obj as any).lockScalingX = !isLocked;
    (obj as any).lockScalingY = !isLocked;
    obj.selectable = isLocked;
    fabricCanvas?.renderAll();
  };

  return (
    <div className="h-screen w-screen bg-gray-50 relative overflow-hidden">
      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Debug Panel */}
      <DebugPanel canvasState={fabricCanvas} zoom={zoom} artboards={artboards} />

      {/* Zoom Controls - Fixed positioning */}
      <div className="fixed bottom-6 right-6 z-40">
        <ZoomControls
          zoom={zoom}
          onZoomChange={handleZoomChange}
          onFitToScreen={handleFitToScreen}
        />
      </div>

      {/* Minimal Sidebar */}
      <MinimalSidebar
        activeTool={activeTool}
        onToolClick={handleToolClick}
        onCreateArtboard={createArtboard}
      />

      {/* Properties Panel */}
      {selectedObject && (
        <MinimalPropertiesPanel 
          selectedObject={selectedObject} 
          onUpdate={(props) => {
            if (selectedObject && fabricCanvas) {
              selectedObject.set(props);
              fabricCanvas.renderAll();
            }
          }}
        />
      )}

      {/* Layers Panel */}
      <MinimalLayersPanel
        objects={canvasObjects}
        selectedObject={selectedObject}
        onSelectObject={handleSelectObject}
        onDeleteObject={handleDeleteObject}
      />
    </div>
  );
};
