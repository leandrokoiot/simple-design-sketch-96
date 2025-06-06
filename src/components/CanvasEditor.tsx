
import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Circle, Rect, FabricText } from "fabric";
import { Toolbar } from "./Toolbar";
import { ZoomControls } from "./ZoomControls";
import { toast } from "sonner";

export const CanvasEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<"select" | "rectangle" | "circle" | "text">("select");
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 1200,
      height: 800,
      backgroundColor: "#ffffff",
    });

    // Set up canvas properties for smooth interactions
    canvas.selection = true;
    canvas.preserveObjectStacking = true;

    setFabricCanvas(canvas);

    // Add some sample elements to start with
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

    const sampleCircle = new Circle({
      left: 350,
      top: 200,
      radius: 60,
      fill: "#06b6d4",
    });

    canvas.add(welcomeText, sampleRect, sampleCircle);
    canvas.renderAll();

    toast("Canvas ready! Start designing!");

    return () => {
      canvas.dispose();
    };
  }, []);

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
    }
  };

  const handleZoom = (newZoom: number) => {
    if (!fabricCanvas) return;
    
    const zoomLevel = newZoom / 100;
    fabricCanvas.setZoom(zoomLevel);
    fabricCanvas.renderAll();
    setZoom(newZoom);
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    toast("Canvas cleared!");
  };

  const handleDelete = () => {
    if (!fabricCanvas) return;
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      fabricCanvas.remove(activeObject);
      fabricCanvas.renderAll();
      toast("Object deleted!");
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Design Editor</h1>
          <div className="flex items-center gap-4">
            <ZoomControls zoom={zoom} onZoomChange={handleZoom} />
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 relative overflow-hidden">
        {/* Floating Toolbar */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
          <Toolbar 
            activeTool={activeTool} 
            onToolClick={handleToolClick} 
            onClear={handleClear}
            onDelete={handleDelete}
          />
        </div>

        {/* Canvas Container */}
        <div className="w-full h-full flex items-center justify-center p-8">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <canvas ref={canvasRef} className="block" />
          </div>
        </div>
      </div>
    </div>
  );
};
