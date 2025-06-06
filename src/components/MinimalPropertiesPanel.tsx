
import { useState, useEffect } from "react";
import { FabricObject } from "fabric";
import { TextPropertiesPanel } from "./TextPropertiesPanel";

interface MinimalPropertiesPanelProps {
  selectedObject: FabricObject;
  onUpdate: (props: any) => void;
}

export const MinimalPropertiesPanel = ({ selectedObject, onUpdate }: MinimalPropertiesPanelProps) => {
  const [fill, setFill] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [borderRadius, setBorderRadius] = useState(0);

  useEffect(() => {
    if (selectedObject) {
      setFill(selectedObject.fill as string || "#000000");
      setStrokeWidth(selectedObject.strokeWidth || 0);
      setBorderRadius((selectedObject as any).rx || 0);
    }
  }, [selectedObject]);

  // If it's a text object, show the text properties panel
  if (selectedObject && (selectedObject.type === 'textbox' || selectedObject.type === 'text')) {
    return (
      <div className="fixed top-6 left-6 z-50">
        <TextPropertiesPanel selectedObject={selectedObject} onUpdate={onUpdate} />
      </div>
    );
  }

  const handleFillChange = (newFill: string) => {
    setFill(newFill);
    onUpdate({ fill: newFill });
  };

  const handleStrokeWidthChange = (newWidth: number) => {
    setStrokeWidth(newWidth);
    onUpdate({ strokeWidth: newWidth, stroke: newWidth > 0 ? "#000000" : "transparent" });
  };

  const handleBorderRadiusChange = (newRadius: number) => {
    setBorderRadius(newRadius);
    onUpdate({ rx: newRadius, ry: newRadius });
  };

  return (
    <div className="fixed top-6 left-6 z-50">
      <div className="bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 w-80">
        {/* Shape Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Shape</h3>
          
          {/* Shape Types */}
          <div className="grid grid-cols-5 gap-2 mb-6">
            <div className="w-12 h-12 bg-black rounded-lg"></div>
            <div className="w-12 h-12 bg-gray-400 rounded-lg" style={{clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)"}}></div>
            <div className="w-12 h-12 bg-gray-400 rounded-lg transform rotate-45"></div>
            <div className="w-12 h-12 bg-gray-400 rounded-full"></div>
            <div className="w-12 h-12 bg-gray-400 rounded-lg" style={{clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"}}></div>
          </div>

          {/* Color Picker */}
          <div className="mb-4">
            <input
              type="color"
              value={fill}
              onChange={(e) => handleFillChange(e.target.value)}
              className="w-8 h-8 rounded-lg border-none cursor-pointer"
            />
          </div>

          {/* Borders */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Borders</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{strokeWidth}</span>
                <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={strokeWidth}
              onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
              className="w-full accent-black"
            />
          </div>

          {/* Radius */}
          {selectedObject.type === 'rect' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Radius</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{borderRadius}</span>
                  <div className="w-6 h-6 border-2 border-gray-300 rounded-lg"></div>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={borderRadius}
                onChange={(e) => handleBorderRadiusChange(Number(e.target.value))}
                className="w-full accent-black"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
