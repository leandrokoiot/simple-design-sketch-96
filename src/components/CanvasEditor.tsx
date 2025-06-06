
import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, Circle, Rect, FabricText, Line, FabricObject, Point, Group, FabricImage } from "fabric";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { PropertiesPanel } from "./PropertiesPanel";
import { LayersPanel } from "./LayersPanel";
import { toast } from "sonner";

export const CanvasEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<"select" | "rectangle" | "circle" | "text" | "line" | "hand" | "draw" | "image">("select");
  const [zoom, setZoom] = useState(100);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [canvasObjects, setCanvasObjects] = useState<FabricObject[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showLayers, setShowLayers] = useState(false);
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

  // History management
  const saveState = useCallback(() => {
    if (!fabricCanvas) return;
    
    const currentState = JSON.stringify(fabricCanvas.toJSON());
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);
    
    // Limit history to 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(prev => prev + 1);
    }
    
    setHistory(newHistory);
  }, [fabricCanvas, history, historyIndex]);

  const undo = useCallback(() => {
    if (!fabricCanvas || historyIndex <= 0) return;
    
    const prevState = history[historyIndex - 1];
    fabricCanvas.loadFromJSON(prevState, () => {
      fabricCanvas.renderAll();
      drawGrid(fabricCanvas);
      setHistoryIndex(prev => prev - 1);
      updateObjectsList();
      toast("Undone!");
    });
  }, [fabricCanvas, history, historyIndex, drawGrid]);

  const redo = useCallback(() => {
    if (!fabricCanvas || historyIndex >= history.length - 1) return;
    
    const nextState = history[historyIndex + 1];
    fabricCanvas.loadFromJSON(nextState, () => {
      fabricCanvas.renderAll();
      drawGrid(fabricCanvas);
      setHistoryIndex(prev => prev + 1);
      updateObjectsList();
      toast("Redone!");
    });
  }, [fabricCanvas, history, historyIndex, drawGrid]);

  // Update objects list
  const updateObjectsList = useCallback(() => {
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getObjects().filter(obj => !(obj as any).isGridLine);
    setCanvasObjects(objects);
  }, [fabricCanvas]);

  // Handler functions
  const handleDelete = useCallback(() => {
    if (!fabricCanvas) return;
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length === 0) return;

    activeObjects.forEach(obj => fabricCanvas.remove(obj));
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();
    setSelectedObject(null);
    toast("Objects deleted!");
  }, [fabricCanvas]);

  const handleCopy = useCallback(() => {
    if (!fabricCanvas) return;
    const activeObject = fabricCanvas.getActiveObject();
    if (!activeObject) return;

    activeObject.clone((cloned: FabricObject) => {
      setClipboard(cloned);
      toast("Object copied!");
    });
  }, [fabricCanvas]);

  const handlePaste = useCallback(() => {
    if (!fabricCanvas || !clipboard) return;

    clipboard.clone((cloned: FabricObject) => {
      cloned.set({
        left: (cloned.left || 0) + 10,
        top: (cloned.top || 0) + 10,
        evented: true,
      });
      
      if (cloned.type === 'activeSelection') {
        // Handle group pasting
        (cloned as any).canvas = fabricCanvas;
        (cloned as any).forEachObject((obj: FabricObject) => {
          fabricCanvas.add(obj);
        });
        cloned.setCoords();
      } else {
        fabricCanvas.add(cloned);
      }
      
      fabricCanvas.setActiveObject(cloned);
      fabricCanvas.renderAll();
      toast("Object pasted!");
    });
  }, [fabricCanvas, clipboard]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 1200,
      height: 800,
      backgroundColor: "#ffffff",
    });

    // Set up canvas properties
    canvas.selection = true;
    canvas.preserveObjectStacking = true;

    // Mouse wheel zoom
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 3) zoom = 3;
      if (zoom < 0.25) zoom = 0.25;
      
      const point = new Point(opt.e.offsetX, opt.e.offsetY);
      canvas.zoomToPoint(point, zoom);
      setZoom(Math.round(zoom * 100));
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Pan functionality
    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;

    canvas.on('mouse:down', (opt) => {
      const evt = opt.e;
      if (evt.altKey === true || evt.shiftKey === true) {
        isDragging = true;
        canvas.selection = false;
        if (evt instanceof MouseEvent) {
          lastPosX = evt.clientX;
          lastPosY = evt.clientY;
        }
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (isDragging) {
        const e = opt.e;
        if (e instanceof MouseEvent) {
          const vpt = canvas.viewportTransform;
          if (vpt) {
            vpt[4] += e.clientX - lastPosX;
            vpt[5] += e.clientY - lastPosY;
            canvas.requestRenderAll();
            lastPosX = e.clientX;
            lastPosY = e.clientY;
          }
        }
      }
    });

    canvas.on('mouse:up', () => {
      canvas.setViewportTransform(canvas.viewportTransform);
      isDragging = false;
      canvas.selection = true;
    });

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

    // Save state on object modifications
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
    drawGrid(canvas);

    // Initial save
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
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
          }
          break;
        case 'g':
          e.preventDefault();
          setShowGrid(!showGrid);
          break;
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            toast("Save functionality coming soon!");
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      canvas.dispose();
    };
  }, [drawGrid, snapToGridFn, showGrid, saveState, updateObjectsList, handleDelete, handleCopy, handlePaste, undo, redo]);

  // Redraw grid when showGrid changes
  useEffect(() => {
    if (fabricCanvas) {
      drawGrid(fabricCanvas);
      fabricCanvas.renderAll();
    }
  }, [showGrid, drawGrid, fabricCanvas]);

  // Tool handlers
  const handleToolClick = (tool: typeof activeTool) => {
    setActiveTool(tool);

    if (!fabricCanvas) return;

    // Reset drawing mode
    fabricCanvas.isDrawingMode = false;

    if (tool === "draw") {
      fabricCanvas.isDrawingMode = true;
      fabricCanvas.freeDrawingBrush.color = "#000000";
      fabricCanvas.freeDrawingBrush.width = 3;
    } else if (tool === "rectangle") {
      const rect = new Rect({
        left: Math.random() * 400 + 100,
        top: Math.random() * 300 + 100,
        width: 150,
        height: 100,
        fill: `hsl(${Math.random() * 360}, 70%, 60%)`,
        rx: 8,
        ry: 8,
      });
      fabricCanvas.add(rect);
      fabricCanvas.setActiveObject(rect);
      fabricCanvas.renderAll();
    } else if (tool === "circle") {
      const circle = new Circle({
        left: Math.random() * 400 + 100,
        top: Math.random() * 300 + 100,
        radius: 50,
        fill: `hsl(${Math.random() * 360}, 70%, 60%)`,
      });
      fabricCanvas.add(circle);
      fabricCanvas.setActiveObject(circle);
      fabricCanvas.renderAll();
    } else if (tool === "text") {
      const text = new FabricText("Edit me", {
        left: Math.random() * 400 + 100,
        top: Math.random() * 300 + 100,
        fontFamily: "Inter, sans-serif",
        fontSize: 24,
        fill: "#1a1a1a",
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
      fabricCanvas.renderAll();
    } else if (tool === "line") {
      const line = new Line([100, 100, 250, 200], {
        stroke: `hsl(${Math.random() * 360}, 70%, 60%)`,
        strokeWidth: 3,
        left: Math.random() * 400 + 100,
        top: Math.random() * 300 + 100,
      });
      fabricCanvas.add(line);
      fabricCanvas.setActiveObject(line);
      fabricCanvas.renderAll();
    } else if (tool === "image") {
      fileInputRef.current?.click();
    }
  };

  // Image upload handler
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fabricCanvas) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        FabricImage.fromURL(e.target?.result as string, (fabricImage) => {
          fabricImage.set({
            left: 100,
            top: 100,
            scaleX: 200 / (fabricImage.width || 1),
            scaleY: 200 / (fabricImage.height || 1),
          });
          fabricCanvas.add(fabricImage);
          fabricCanvas.setActiveObject(fabricImage);
          fabricCanvas.renderAll();
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Alignment functions
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

  // Distribute functions
  const handleDistribute = (direction: 'horizontal' | 'vertical') => {
    if (!fabricCanvas) return;
    
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length < 3) {
      toast("Select at least 3 objects to distribute");
      return;
    }

    if (direction === 'horizontal') {
      // Sort objects by left position
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
      // Sort objects by top position
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

  // Group functions
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

  // Layer functions
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
    toast("Object deleted!");
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
    <div className="h-screen bg-[hsl(var(--editor-bg))] flex flex-col overflow-hidden">
      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Header */}
      <Header
        zoom={zoom}
        onZoomChange={setZoom}
        onFitToScreen={() => {
          if (!fabricCanvas) return;
          fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
          fabricCanvas.setZoom(1);
          setZoom(100);
          fabricCanvas.renderAll();
        }}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid(!snapToGrid)}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onAlign={handleAlign}
        onDistribute={handleDistribute}
        hasSelection={!!selectedObject}
      />

      {/* Main Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTool={activeTool}
          onToolClick={handleToolClick}
          onClear={() => {
            if (!fabricCanvas) return;
            const objects = fabricCanvas.getObjects().filter(obj => !(obj as any).isGridLine);
            objects.forEach(obj => fabricCanvas.remove(obj));
            fabricCanvas.backgroundColor = "#ffffff";
            fabricCanvas.renderAll();
            toast("Canvas cleared!");
          }}
          onGroup={handleGroup}
          onUngroup={handleUngroup}
        />

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-8 bg-[hsl(var(--editor-canvas-bg))] overflow-hidden">
          <div className="bg-white rounded-xl shadow-2xl border border-border overflow-hidden">
            <canvas ref={canvasRef} className="block" />
          </div>
        </div>

        {/* Right Panels */}
        <div className="flex">
          {/* Properties Panel */}
          {selectedObject && (
            <PropertiesPanel 
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
          {showLayers && (
            <LayersPanel
              objects={canvasObjects}
              selectedObject={selectedObject}
              onSelectObject={handleSelectObject}
              onDeleteObject={handleDeleteObject}
              onToggleVisibility={handleToggleVisibility}
              onToggleLock={handleToggleLock}
            />
          )}
        </div>
      </div>

      {/* Toggle Layers Button */}
      <button
        onClick={() => setShowLayers(!showLayers)}
        className="fixed right-4 bottom-4 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
        title="Toggle Layers Panel"
      >
        <span className="text-sm font-medium">L</span>
      </button>
    </div>
  );
};
