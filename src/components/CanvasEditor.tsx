import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, Circle, Rect, FabricText, Line, FabricObject, Point, Group, FabricImage } from "fabric";
import { MinimalSidebar } from "./MinimalSidebar";
import { MinimalLayersPanel } from "./MinimalLayersPanel";
import { MinimalPropertiesPanel } from "./MinimalPropertiesPanel";
import { ArtboardManager } from "./ArtboardManager";
import { ZoomControls } from "./ZoomControls";
import { DebugPanel } from "./DebugPanel";
import { useVersionControl } from "@/hooks/useVersionControl";
import { Artboard } from "@/utils/projectState";
import { 
  checkElementInArtboard, 
  findElementsInArtboard, 
  constrainElementToArtboard,
  calculateRepulsionForce,
  getArtboardById
} from "@/utils/artboardUtils";
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
  const [selectedArtboard, setSelectedArtboard] = useState<Artboard | null>(null);
  const [isCreatingElement, setIsCreatingElement] = useState(false);
  const [previewElement, setPreviewElement] = useState<FabricObject | null>(null);

  const { createNewVersion } = useVersionControl();

  const gridSize = 20;

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

  // Update objects list
  const updateObjectsList = useCallback(() => {
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getObjects().filter(obj => !(obj as any).isGridLine && !(obj as any).isArtboard);
    setCanvasObjects(objects);
    console.log(`Objects updated: ${objects.length} objects`);
  }, [fabricCanvas]);

  // Draw grid on canvas - FIXED Line constructor for Fabric.js v6
  const drawGrid = useCallback((canvas: FabricCanvas) => {
    if (!showGrid) return;

    const canvasWidth = canvas.width || 1200;
    const canvasHeight = canvas.height || 800;
    
    // Clear existing grid
    const existingGrid = canvas.getObjects().filter(obj => (obj as any).isGridLine);
    existingGrid.forEach(line => canvas.remove(line));

    // Draw vertical lines - FIXED: Use array coordinates for Fabric.js v6
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

    // Draw horizontal lines - FIXED: Use array coordinates for Fabric.js v6
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

  // Enhanced zoom functionality
  const handleZoomChange = useCallback((newZoom: number) => {
    if (!fabricCanvas) return;
    
    const clampedZoom = Math.max(10, Math.min(500, newZoom));
    const zoomLevel = clampedZoom / 100;
    setZoom(clampedZoom);
    
    const center = fabricCanvas.getCenter();
    fabricCanvas.zoomToPoint(new Point(center.left, center.top), zoomLevel);
    
    updateArtboardLabelsSize(fabricCanvas, zoomLevel);
    fabricCanvas.renderAll();
    console.log(`Zoom changed to ${clampedZoom}%`);
  }, [fabricCanvas]);

  // Update artboard labels size based on zoom
  const updateArtboardLabelsSize = useCallback((canvas: FabricCanvas, zoomLevel: number) => {
    const objects = canvas.getObjects();
    objects.forEach(obj => {
      if ((obj as any).isArtboard && obj.type === 'text') {
        const baseSize = 14;
        obj.set({
          fontSize: baseSize / zoomLevel,
          strokeWidth: (obj.strokeWidth || 0) / zoomLevel
        });
      }
      if ((obj as any).isArtboard && obj.type === 'rect') {
        const baseStrokeWidth = 2;
        obj.set({
          strokeWidth: baseStrokeWidth / zoomLevel
        });
      }
    });
  }, []);

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
    handleZoomChange(Math.max(10, Math.min(500, newZoom)));
  }, [fabricCanvas, handleZoomChange]);

  // IMPLEMENTED: Enhanced artboard collision with REAL repulsion animation
  const checkArtboardCollisionWithRepulsion = useCallback((movingArtboard: Artboard, newX: number, newY: number) => {
    const buffer = 100; // Increased buffer for better repulsion
    let finalX = newX;
    let finalY = newY;
    let hasRepulsion = false;
    
    for (const artboard of artboards) {
      if (artboard.id === movingArtboard.id) continue;
      
      // Calculate distance between centers
      const centerX1 = newX + movingArtboard.width / 2;
      const centerY1 = newY + movingArtboard.height / 2;
      const centerX2 = artboard.x + artboard.width / 2;
      const centerY2 = artboard.y + artboard.height / 2;
      
      const distance = Math.sqrt(
        Math.pow(centerX1 - centerX2, 2) + Math.pow(centerY1 - centerY2, 2)
      );
      
      if (distance < buffer) {
        hasRepulsion = true;
        const repulsion = calculateRepulsionForce(
          { ...movingArtboard, x: newX, y: newY }, 
          artboard, 
          buffer
        );
        
        finalX += repulsion.x;
        finalY += repulsion.y;
        
        // IMPLEMENTED: Visual feedback for repulsion
        const artboardElement = fabricCanvas?.getObjects().find(obj => 
          (obj as any).artboardId === artboard.id && obj.type === 'rect'
        ) as Rect;
        
        if (artboardElement) {
          // Red highlight during repulsion
          artboardElement.set({ stroke: '#ef4444', strokeWidth: 4 / (zoom / 100) });
          fabricCanvas?.renderAll();
          
          setTimeout(() => {
            artboardElement.set({ stroke: '#3b82f6', strokeWidth: 2 / (zoom / 100) });
            fabricCanvas?.renderAll();
          }, 300);
        }
      }
    }
    
    return { x: finalX, y: finalY, hasRepulsion };
  }, [artboards, fabricCanvas, zoom]);

  // IMPLEMENTED: Find next available position for artboard
  const findNextArtboardPosition = useCallback(() => {
    if (artboards.length === 0) {
      return { x: 100, y: 100 };
    }

    const buffer = 80;
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
      const x = 100 + (attempts % 4) * 350;
      const y = 100 + Math.floor(attempts / 4) * 250;
      
      let collision = false;
      for (const artboard of artboards) {
        const distance = Math.sqrt(Math.pow(x - artboard.x, 2) + Math.pow(y - artboard.y, 2));
        if (distance < buffer) {
          collision = true;
          break;
        }
      }
      
      if (!collision) {
        return { x, y };
      }
      
      attempts++;
    }
    
    // Fallback: place far to the right
    const maxRight = Math.max(...artboards.map(ab => ab.x + ab.width));
    return { x: maxRight + buffer, y: 100 };
  }, [artboards]);

  // IMPLEMENTED: Enhanced artboard creation with REAL containment system
  const createArtboard = useCallback((artboardData: Omit<Artboard, 'id'>) => {
    if (!fabricCanvas) return;

    // Deactivate other artboards
    setArtboards(prev => prev.map(ab => ({ ...ab, isActive: false })));

    const position = findNextArtboardPosition();

    const newArtboard: Artboard = {
      ...artboardData,
      id: `artboard_${Date.now()}`,
      x: position.x,
      y: position.y,
      width: Math.min(artboardData.width, 800),
      height: Math.min(artboardData.height, 600),
      backgroundColor: '#ffffff',
      isActive: true,
      elementIds: []
    };

    // Create artboard visual
    const artboardRect = new Rect({
      left: newArtboard.x,
      top: newArtboard.y,
      width: newArtboard.width,
      height: newArtboard.height,
      fill: newArtboard.backgroundColor || '#ffffff',
      stroke: '#3b82f6',
      strokeWidth: 2 / (zoom / 100),
      strokeDashArray: [5, 5],
      selectable: true,
      evented: true,
      rx: 0,
      ry: 0,
    });

    const artboardLabel = new FabricText(newArtboard.name, {
      left: newArtboard.x + 10,
      top: newArtboard.y - 30,
      fontSize: 14 / (zoom / 100),
      fontFamily: 'Inter, sans-serif',
      fill: '#3b82f6',
      selectable: false,
      evented: false,
    });

    (artboardRect as any).isArtboard = true;
    (artboardRect as any).artboardId = newArtboard.id;
    (artboardRect as any).artboardData = newArtboard;
    (artboardLabel as any).isArtboard = true;
    (artboardLabel as any).artboardId = newArtboard.id;

    // IMPLEMENTED: Enhanced movement with repulsion and element containment
    artboardRect.on('moving', () => {
      const currentX = artboardRect.left || 0;
      const currentY = artboardRect.top || 0;
      
      // Apply repulsion
      const newPos = checkArtboardCollisionWithRepulsion(newArtboard, currentX, currentY);
      
      if (newPos.hasRepulsion) {
        // Smooth animation for repulsion
        artboardRect.animate('left', newPos.x, {
          duration: 200,
          easing: (t: number) => t * (2 - t)
        });
        artboardRect.animate('top', newPos.y, {
          duration: 200,
          easing: (t: number) => t * (2 - t)
        });
      }
      
      // Update label position
      artboardLabel.set({
        left: (artboardRect.left || 0) + 10,
        top: (artboardRect.top || 0) - 30
      });
      
      // IMPLEMENTED: Move contained elements with artboard
      const deltaX = (artboardRect.left || 0) - newArtboard.x;
      const deltaY = (artboardRect.top || 0) - newArtboard.y;
      
      if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
        const containedElements = fabricCanvas.getObjects().filter(obj => 
          (obj as any).artboardId === newArtboard.id && !(obj as any).isArtboard
        );
        
        containedElements.forEach(element => {
          element.set({
            left: (element.left || 0) + deltaX,
            top: (element.top || 0) + deltaY
          });
          element.setCoords();
        });
      }
      
      // Update artboard data
      newArtboard.x = artboardRect.left || 0;
      newArtboard.y = artboardRect.top || 0;
      
      fabricCanvas.renderAll();
    });

    // Selection event for artboard management
    artboardRect.on('selected', () => {
      setSelectedArtboard(newArtboard);
      console.log(`Artboard selected: ${newArtboard.name}`);
    });

    fabricCanvas.add(artboardRect);
    fabricCanvas.add(artboardLabel);
    fabricCanvas.sendObjectToBack(artboardRect);

    fabricCanvas.renderAll();
    setArtboards(prev => [...prev, newArtboard]);
    setSelectedArtboard(newArtboard);
    
    createNewVersion(`Created artboard: ${newArtboard.name}`, fabricCanvas.toJSON(), zoom, [...artboards, newArtboard]);
    
    console.log(`Enhanced artboard created: ${newArtboard.name}`);
    toast(`Artboard "${newArtboard.name}" created with containment system!`);
  }, [fabricCanvas, zoom, artboards, createNewVersion, findNextArtboardPosition, checkArtboardCollisionWithRepulsion]);

  // Artboard management functions
  const handleUpdateArtboard = useCallback((id: string, updates: Partial<Artboard>) => {
    setArtboards(prev => prev.map(ab => 
      ab.id === id ? { ...ab, ...updates } : ab
    ));
    
    // Update visual artboard on canvas
    if (fabricCanvas) {
      const artboardElement = fabricCanvas.getObjects().find(obj => 
        (obj as any).artboardId === id && obj.type === 'rect'
      ) as Rect;
      
      if (artboardElement) {
        if (updates.backgroundColor) {
          artboardElement.set({ fill: updates.backgroundColor });
        }
        if (updates.width) {
          artboardElement.set({ width: updates.width });
        }
        if (updates.height) {
          artboardElement.set({ height: updates.height });
        }
        fabricCanvas.renderAll();
      }
      
      // Update label if name changed
      if (updates.name) {
        const labelElement = fabricCanvas.getObjects().find(obj => 
          (obj as any).artboardId === id && obj.type === 'text'
        ) as FabricText;
        
        if (labelElement) {
          labelElement.set({ text: updates.name });
          fabricCanvas.renderAll();
        }
      }
    }
  }, [fabricCanvas]);

  const handleDeleteArtboard = useCallback((id: string) => {
    if (!fabricCanvas) return;
    
    // Remove artboard elements from canvas
    const artboardElements = fabricCanvas.getObjects().filter(obj => 
      (obj as any).artboardId === id
    );
    
    artboardElements.forEach(element => fabricCanvas.remove(element));
    
    setArtboards(prev => prev.filter(ab => ab.id !== id));
    setSelectedArtboard(null);
    fabricCanvas.renderAll();
    
    toast("Artboard deleted!");
  }, [fabricCanvas]);

  const handleZoomToArtboard = useCallback((id: string) => {
    const artboard = getArtboardById(artboards, id);
    if (!artboard || !fabricCanvas) return;
    
    const centerX = artboard.x + artboard.width / 2;
    const centerY = artboard.y + artboard.height / 2;
    
    fabricCanvas.zoomToPoint(new Point(centerX, centerY), 1);
    fabricCanvas.absolutePan(new Point(
      fabricCanvas.width! / 2 - centerX,
      fabricCanvas.height! / 2 - centerY
    ));
    
    setZoom(100);
    toast(`Zoomed to artboard: ${artboard.name}`);
  }, [artboards, fabricCanvas]);

  // IMPLEMENTED: Interactive element creation with preview
  const startInteractiveCreation = useCallback((elementType: string) => {
    if (!fabricCanvas) return;
    
    setIsCreatingElement(true);
    setActiveTool("select");
    
    let isMouseDown = false;
    let startPoint: Point | null = null;
    
    const handleMouseDown = (opt: any) => {
      if (!isCreatingElement) return;
      
      isMouseDown = true;
      const pointer = fabricCanvas.getPointer(opt.e);
      startPoint = new Point(pointer.x, pointer.y);
      
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
        default:
          return;
      }
      
      (preview as any).isPreview = true;
      preview.selectable = false;
      preview.evented = false;
      
      fabricCanvas.add(preview);
      setPreviewElement(preview);
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
      }
      
      fabricCanvas.renderAll();
    };
    
    const handleMouseUp = () => {
      if (!isMouseDown || !previewElement) return;
      
      isMouseDown = false;
      setIsCreatingElement(false);
      
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
      } else {
        finalElement = new Circle({
          left: previewElement.left,
          top: previewElement.top,
          radius: (previewElement as any).radius || 25,
          fill: '#000000'
        });
      }
      
      // IMPLEMENTED: Auto-assign element to artboard if created inside one
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
      
      setPreviewElement(null);
      
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
    
  }, [fabricCanvas, isCreatingElement, previewElement, artboards]);

  // Initialize canvas
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

    // Enhanced mouse wheel zoom
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let newZoom = zoom;
      
      const zoomStep = zoom < 100 ? 5 : zoom < 200 ? 10 : 25;
      
      if (delta > 0) {
        newZoom = Math.max(10, zoom - zoomStep);
      } else {
        newZoom = Math.min(500, zoom + zoomStep);
      }
      
      if (newZoom !== zoom) {
        const pointer = canvas.getPointer(opt.e);
        const zoomLevel = newZoom / 100;
        canvas.zoomToPoint(new Point(pointer.x, pointer.y), zoomLevel);
        setZoom(newZoom);
        updateArtboardLabelsSize(canvas, zoomLevel);
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

  // Update zoom on canvas change
  useEffect(() => {
    if (fabricCanvas) {
      updateArtboardLabelsSize(fabricCanvas, zoom / 100);
    }
  }, [fabricCanvas, zoom, updateArtboardLabelsSize]);

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
        case 'Escape':
          if (isCreatingElement) {
            setIsCreatingElement(false);
            if (previewElement && fabricCanvas) {
              fabricCanvas.remove(previewElement);
              setPreviewElement(null);
              fabricCanvas.renderAll();
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleDelete, handleCopy, handlePaste, isCreatingElement, previewElement, fabricCanvas]);

  // Enhanced tool handlers with interactive creation
  const handleToolClick = useCallback((tool: typeof activeTool) => {
    console.log(`Tool clicked: ${tool}`);
    setActiveTool(tool);

    if (!fabricCanvas) {
      console.error("Canvas not available");
      return;
    }

    fabricCanvas.isDrawingMode = false;

    // For shapes, start interactive creation
    if (tool === "rectangle" || tool === "circle") {
      startInteractiveCreation(tool);
      return;
    }

    const canvasCenter = {
      x: fabricCanvas.width! / 2,
      y: fabricCanvas.height! / 2
    };

    let newObject: FabricObject | null = null;

    if (tool === "text") {
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
      // FIXED: Use array coordinates for Fabric.js v6
      newObject = new Line([canvasCenter.x - 75, canvasCenter.y, canvasCenter.x + 75, canvasCenter.y], {
        stroke: "#000000",
        strokeWidth: 2,
      });
    }

    if (newObject) {
      // IMPLEMENTED: Auto-assign to artboard if created inside one
      const containingArtboard = artboards.find(artboard => 
        checkElementInArtboard(newObject!, artboard)
      );
      
      if (containingArtboard) {
        (newObject as any).artboardId = containingArtboard.id;
        console.log(`Element assigned to artboard: ${containingArtboard.name}`);
      }
      
      fabricCanvas.add(newObject);
      fabricCanvas.setActiveObject(newObject);
      fabricCanvas.renderAll();
      console.log(`${tool} added successfully`);
      toast(`${tool} added to canvas`);
      
      createNewVersion(`Added ${tool}`, fabricCanvas.toJSON(), zoom, artboards);
    }
  }, [fabricCanvas, zoom, artboards, createNewVersion, startInteractiveCreation]);

  // IMPLEMENTED: Enhanced object movement with artboard containment
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleObjectMoving = (e: any) => {
      const obj = e.target;
      if ((obj as any).isArtboard) return;

      // Check if object should be contained in artboard
      const containingArtboard = artboards.find(artboard => 
        checkElementInArtboard(obj, artboard)
      );

      if (containingArtboard) {
        // Assign element to artboard if not already assigned
        if ((obj as any).artboardId !== containingArtboard.id) {
          (obj as any).artboardId = containingArtboard.id;
          console.log(`Element auto-assigned to artboard: ${containingArtboard.name}`);
        }
        
        // Constrain element to artboard boundaries
        constrainElementToArtboard(obj, containingArtboard);
        fabricCanvas.renderAll();
      }
    };

    fabricCanvas.on('object:moving', handleObjectMoving);

    return () => {
      fabricCanvas.off('object:moving', handleObjectMoving);
    };
  }, [fabricCanvas, artboards]);

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

  return (
    <div className="h-screen w-screen bg-gray-50 relative overflow-hidden">
      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Debug Panel */}
      <DebugPanel canvasState={fabricCanvas} zoom={zoom} artboards={artboards} />

      {/* Zoom Controls */}
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

      {/* Enhanced Properties Panel or Artboard Manager */}
      {selectedObject && !(selectedObject as any).isArtboard ? (
        <MinimalPropertiesPanel 
          selectedObject={selectedObject} 
          onUpdate={(props) => {
            if (selectedObject && fabricCanvas) {
              selectedObject.set(props);
              fabricCanvas.renderAll();
            }
          }}
        />
      ) : (
        <ArtboardManager
          artboards={artboards}
          selectedArtboard={selectedArtboard}
          canvasObjects={canvasObjects}
          onUpdateArtboard={handleUpdateArtboard}
          onDeleteArtboard={handleDeleteArtboard}
          onDuplicateArtboard={(id) => {
            const artboard = getArtboardById(artboards, id);
            if (artboard) {
              createArtboard({
                ...artboard,
                name: `${artboard.name} Copy`,
                x: artboard.x + 50,
                y: artboard.y + 50
              });
            }
          }}
          onZoomToArtboard={handleZoomToArtboard}
          onExportArtboard={(id) => {
            const artboard = getArtboardById(artboards, id);
            if (artboard) {
              toast(`Export functionality for "${artboard.name}" coming soon!`);
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

      {/* Instructions overlay for interactive creation */}
      {isCreatingElement && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 text-white px-4 py-2 rounded-lg">
          Clique e arraste para criar o elemento. Pressione ESC para cancelar.
        </div>
      )}
    </div>
  );
};
