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
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [clipboard, setClipboard] = useState<FabricObject | null>(null);

  const gridSize = 20;

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

  // Update objects list
  const updateObjectsList = useCallback(() => {
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getObjects().filter(obj => !(obj as any).isGridLine);
    setCanvasObjects(objects);
  }, [fabricCanvas]);

  // History management
  const saveState = useCallback(() => {
    if (!fabricCanvas) return;
    
    const currentState = JSON.stringify(fabricCanvas.toJSON());
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);
    
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(prev => prev + 1);
    }
    
    setHistory(newHistory);
  }, [fabricCanvas, history, historyIndex]);

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

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#f8f9fa",
    });

    canvas.selection = true;
    canvas.preserveObjectStacking = true;

    // Object selection
    canvas.on('selection:created', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    canvas.on('object:added', () => {
      updateObjectsList();
      setTimeout(() => saveState(), 100);
    });

    canvas.on('object:removed', () => {
      updateObjectsList();
      setTimeout(() => saveState(), 100);
    });

    canvas.on('object:modified', () => {
      setTimeout(() => saveState(), 100);
    });

    setFabricCanvas(canvas);
    setTimeout(() => saveState(), 100);

    // Keyboard shortcuts
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

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      canvas.dispose();
    };
  }, [updateObjectsList, saveState, handleDelete, handleCopy, handlePaste]);

  // Tool handlers
  const handleToolClick = (tool: typeof activeTool) => {
    setActiveTool(tool);

    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = false;

    if (tool === "rectangle") {
      const rect = new Rect({
        left: fabricCanvas.width! / 2 - 75,
        top: fabricCanvas.height! / 2 - 50,
        width: 150,
        height: 100,
        fill: "#000000",
        rx: 0,
        ry: 0,
      });
      fabricCanvas.add(rect);
      fabricCanvas.setActiveObject(rect);
      fabricCanvas.renderAll();
    } else if (tool === "circle") {
      const circle = new Circle({
        left: fabricCanvas.width! / 2 - 50,
        top: fabricCanvas.height! / 2 - 50,
        radius: 50,
        fill: "#000000",
      });
      fabricCanvas.add(circle);
      fabricCanvas.setActiveObject(circle);
      fabricCanvas.renderAll();
    } else if (tool === "text") {
      const text = new FabricText("Text", {
        left: fabricCanvas.width! / 2 - 25,
        top: fabricCanvas.height! / 2 - 12,
        fontFamily: "Inter, sans-serif",
        fontSize: 24,
        fill: "#000000",
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
      fabricCanvas.renderAll();
    } else if (tool === "line") {
      const line = new Line([
        fabricCanvas.width! / 2 - 75, 
        fabricCanvas.height! / 2, 
        fabricCanvas.width! / 2 + 75, 
        fabricCanvas.height! / 2
      ], {
        stroke: "#000000",
        strokeWidth: 2,
      });
      fabricCanvas.add(line);
      fabricCanvas.setActiveObject(line);
      fabricCanvas.renderAll();
    }
  };

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
