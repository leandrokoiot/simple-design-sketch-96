import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, Circle, Rect, FabricText, Line, FabricObject, Point, Group, FabricImage } from "fabric";
import { MinimalSidebar } from "./MinimalSidebar";
import { MinimalLayersPanel } from "./MinimalLayersPanel";
import { MinimalPropertiesPanel } from "./MinimalPropertiesPanel";
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

  const gridSize = 20;

  // Update objects list with debounce
  const updateObjectsList = useCallback(() => {
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getObjects().filter(obj => !(obj as any).isGridLine);
    setCanvasObjects(objects);
    console.log(`Objects updated: ${objects.length} objects`);
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

  const handleDelete = useCallback(() => {
    if (!fabricCanvas) return;
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length === 0) return;

    activeObjects.forEach(obj => fabricCanvas.remove(obj));
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();
    setSelectedObject(null);
  }, [fabricCanvas]);

  const handleCopy = useCallback(() => {
    if (!fabricCanvas) return;
    const activeObject = fabricCanvas.getActiveObject();
    if (!activeObject) return;

    activeObject.clone().then((cloned: FabricObject) => {
      setClipboard(cloned);
    });
  }, [fabricCanvas]);

  const handlePaste = useCallback(() => {
    if (!fabricCanvas || !clipboard) return;

    clipboard.clone().then((cloned: FabricObject) => {
      cloned.set({
        left: (cloned.left || 0) + 10,
        top: (cloned.top || 0) + 10,
        evented: true,
      });
      
      fabricCanvas.add(cloned);
      fabricCanvas.setActiveObject(cloned);
      fabricCanvas.renderAll();
    });
  }, [fabricCanvas, clipboard]);

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
    }
  }, [fabricCanvas]);

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

      {/* Minimal Sidebar */}
      <MinimalSidebar
        activeTool={activeTool}
        onToolClick={handleToolClick}
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
