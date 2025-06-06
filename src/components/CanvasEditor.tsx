import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, Circle, Rect, FabricText, Line, FabricObject, Point } from "fabric";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { PropertiesPanel } from "./PropertiesPanel";
import { toast } from "sonner";

export const CanvasEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<"select" | "rectangle" | "circle" | "text" | "line" | "hand">("select");
  const [zoom, setZoom] = useState(100);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
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

    // Object moving with snap
    canvas.on('object:moving', (e) => {
      if (e.target) {
        snapToGridFn(e.target);
      }
    });

    setFabricCanvas(canvas);
    drawGrid(canvas);

    // Add some sample elements
    const welcomeText = new FabricText("Welcome to Design Editor", {
      left: 100,
      top: 100,
      fontFamily: "Inter, sans-serif",
      fontSize: 32,
      fill: "#1a1a1a",
      fontWeight: "600",
    });

    const sampleRect = new Rect({
      left: 100,
      top: 200,
      width: 200,
      height: 120,
      fill: "#6366f1",
      rx: 8,
      ry: 8,
    });

    canvas.add(welcomeText, sampleRect);
    canvas.renderAll();

    toast("Canvas ready! Use Alt+drag to pan, Shift+drag to pan, mouse wheel to zoom");

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
            handleCopy();
          }
          break;
        case 'v':
          if (e.ctrlKey || e.metaKey) {
            handlePaste();
          }
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            if (e.shiftKey) {
              // Redo (Ctrl+Shift+Z)
              toast("Redo functionality coming soon!");
            } else {
              // Undo (Ctrl+Z)
              toast("Undo functionality coming soon!");
            }
          }
          break;
        case 'g':
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
  }, [drawGrid, snapToGridFn, showGrid]);

  // Redraw grid when showGrid changes
  useEffect(() => {
    if (fabricCanvas) {
      drawGrid(fabricCanvas);
      fabricCanvas.renderAll();
    }
  }, [showGrid, drawGrid, fabricCanvas]);

  const handleToolClick = (tool: typeof activeTool) => {
    setActiveTool(tool);

    if (!fabricCanvas) return;

    if (tool === "rectangle") {
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
    } else if (tool === "hand") {
      fabricCanvas.isDrawingMode = true;
    }
  };

  const handleZoom = (newZoom: number) => {
    if (!fabricCanvas) return;
    
    const zoomLevel = newZoom / 100;
    fabricCanvas.setZoom(zoomLevel);
    fabricCanvas.renderAll();
    setZoom(newZoom);
  };

  const handleFitToScreen = () => {
    if (!fabricCanvas) return;
    
    fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    fabricCanvas.setZoom(1);
    setZoom(100);
    fabricCanvas.renderAll();
    toast("Fit to screen!");
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    
    // Remove all objects except grid lines
    const objects = fabricCanvas.getObjects().filter(obj => !(obj as any).isGridLine);
    objects.forEach(obj => fabricCanvas.remove(obj));
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    toast("Canvas cleared!");
  };

  const handleDelete = () => {
    if (!fabricCanvas) return;
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject && !(activeObject as any).isGridLine) {
      fabricCanvas.remove(activeObject);
      fabricCanvas.renderAll();
      setSelectedObject(null);
      toast("Object deleted!");
    }
  };

  const handleCopy = () => {
    if (!fabricCanvas) return;
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject && !(activeObject as any).isGridLine) {
      // Store in a simple way for now
      (window as any).copiedObject = activeObject.toObject();
      toast("Object copied! Press Ctrl+V to paste");
    }
  };

  const handlePaste = () => {
    if (!fabricCanvas || !(window as any).copiedObject) return;
    
    const copiedObj = (window as any).copiedObject;
    
    // Create new object based on type
    let newObj: FabricObject;
    
    if (copiedObj.type === 'rect') {
      newObj = new Rect({
        ...copiedObj,
        left: (copiedObj.left || 0) + 20,
        top: (copiedObj.top || 0) + 20,
      });
    } else if (copiedObj.type === 'circle') {
      newObj = new Circle({
        ...copiedObj,
        left: (copiedObj.left || 0) + 20,
        top: (copiedObj.top || 0) + 20,
      });
    } else if (copiedObj.type === 'textbox' || copiedObj.type === 'text') {
      newObj = new FabricText(copiedObj.text, {
        ...copiedObj,
        left: (copiedObj.left || 0) + 20,
        top: (copiedObj.top || 0) + 20,
      });
    } else if (copiedObj.type === 'line') {
      newObj = new Line(copiedObj.coords, {
        ...copiedObj,
        left: (copiedObj.left || 0) + 20,
        top: (copiedObj.top || 0) + 20,
      });
    } else {
      return;
    }

    fabricCanvas.add(newObj);
    fabricCanvas.setActiveObject(newObj);
    fabricCanvas.renderAll();
    toast("Object pasted!");
  };

  return (
    <div className="h-screen bg-[hsl(var(--editor-bg))] flex flex-col overflow-hidden">
      {/* Header */}
      <Header
        zoom={zoom}
        onZoomChange={handleZoom}
        onFitToScreen={handleFitToScreen}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid(!snapToGrid)}
      />

      {/* Main Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTool={activeTool}
          onToolClick={handleToolClick}
          onClear={handleClear}
        />

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-8 bg-[hsl(var(--editor-canvas-bg))] overflow-hidden">
          <div className="bg-white rounded-xl shadow-2xl border border-border overflow-hidden">
            <canvas ref={canvasRef} className="block" />
          </div>
        </div>

        {/* Right Properties Panel */}
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
      </div>
    </div>
  );
};
