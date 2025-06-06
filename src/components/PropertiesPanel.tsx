
import { useState, useEffect } from "react";
import { FabricObject } from "fabric";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface PropertiesPanelProps {
  selectedObject: FabricObject;
  onUpdate: (props: any) => void;
}

export const PropertiesPanel = ({ selectedObject, onUpdate }: PropertiesPanelProps) => {
  const [fill, setFill] = useState("#000000");
  const [stroke, setStroke] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(1);
  const [opacity, setOpacity] = useState(1);
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    if (selectedObject) {
      setFill(selectedObject.fill as string || "#000000");
      setStroke(selectedObject.stroke as string || "#000000");
      setStrokeWidth(selectedObject.strokeWidth || 1);
      setOpacity(selectedObject.opacity || 1);
      
      if (selectedObject.type === 'textbox' || selectedObject.type === 'text') {
        setFontSize((selectedObject as any).fontSize || 16);
      }
    }
  }, [selectedObject]);

  const handleFillChange = (newFill: string) => {
    setFill(newFill);
    onUpdate({ fill: newFill });
  };

  const handleStrokeChange = (newStroke: string) => {
    setStroke(newStroke);
    onUpdate({ stroke: newStroke });
  };

  const handleStrokeWidthChange = (newWidth: number) => {
    setStrokeWidth(newWidth);
    onUpdate({ strokeWidth: newWidth });
  };

  const handleOpacityChange = (newOpacity: number) => {
    setOpacity(newOpacity);
    onUpdate({ opacity: newOpacity });
  };

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    onUpdate({ fontSize: newSize });
  };

  const handleBringToFront = () => {
    selectedObject.bringToFront();
    onUpdate({});
  };

  const handleSendToBack = () => {
    selectedObject.sendToBack();
    onUpdate({});
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Properties</h3>
        <div className="text-sm text-gray-500 capitalize">
          {selectedObject.type}
        </div>
      </div>

      <div className="space-y-4">
        {/* Position & Size */}
        <div>
          <h4 className="text-sm font-medium mb-2">Position & Size</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">X</label>
              <input
                type="number"
                value={Math.round(selectedObject.left || 0)}
                onChange={(e) => onUpdate({ left: Number(e.target.value) })}
                className="w-full p-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Y</label>
              <input
                type="number"
                value={Math.round(selectedObject.top || 0)}
                onChange={(e) => onUpdate({ top: Number(e.target.value) })}
                className="w-full p-1 border rounded text-sm"
              />
            </div>
            {selectedObject.type === 'rect' && (
              <>
                <div>
                  <label className="text-xs text-gray-500">Width</label>
                  <input
                    type="number"
                    value={Math.round((selectedObject as any).width || 0)}
                    onChange={(e) => onUpdate({ width: Number(e.target.value) })}
                    className="w-full p-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Height</label>
                  <input
                    type="number"
                    value={Math.round((selectedObject as any).height || 0)}
                    onChange={(e) => onUpdate({ height: Number(e.target.value) })}
                    className="w-full p-1 border rounded text-sm"
                  />
                </div>
              </>
            )}
            {selectedObject.type === 'circle' && (
              <div className="col-span-2">
                <label className="text-xs text-gray-500">Radius</label>
                <input
                  type="number"
                  value={Math.round((selectedObject as any).radius || 0)}
                  onChange={(e) => onUpdate({ radius: Number(e.target.value) })}
                  className="w-full p-1 border rounded text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* Fill Color */}
        {selectedObject.type !== 'line' && (
          <div>
            <label className="text-sm font-medium mb-2 block">Fill Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={fill}
                onChange={(e) => handleFillChange(e.target.value)}
                className="w-12 h-8 border rounded cursor-pointer"
              />
              <input
                type="text"
                value={fill}
                onChange={(e) => handleFillChange(e.target.value)}
                className="flex-1 p-1 border rounded text-sm"
                placeholder="#000000"
              />
            </div>
          </div>
        )}

        {/* Stroke */}
        <div>
          <label className="text-sm font-medium mb-2 block">Stroke</label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="color"
                value={stroke}
                onChange={(e) => handleStrokeChange(e.target.value)}
                className="w-12 h-8 border rounded cursor-pointer"
              />
              <input
                type="text"
                value={stroke}
                onChange={(e) => handleStrokeChange(e.target.value)}
                className="flex-1 p-1 border rounded text-sm"
                placeholder="#000000"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Width</label>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={strokeWidth}
                onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500 text-center">{strokeWidth}px</div>
            </div>
          </div>
        </div>

        {/* Opacity */}
        <div>
          <label className="text-sm font-medium mb-2 block">Opacity</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={opacity}
            onChange={(e) => handleOpacityChange(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-xs text-gray-500 text-center">{Math.round(opacity * 100)}%</div>
        </div>

        {/* Text Properties */}
        {(selectedObject.type === 'textbox' || selectedObject.type === 'text') && (
          <div>
            <label className="text-sm font-medium mb-2 block">Text Size</label>
            <input
              type="range"
              min="8"
              max="72"
              step="1"
              value={fontSize}
              onChange={(e) => handleFontSizeChange(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-500 text-center">{fontSize}px</div>
          </div>
        )}

        {/* Layer Controls */}
        <div>
          <label className="text-sm font-medium mb-2 block">Layer</label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBringToFront}
              className="flex-1 text-xs"
            >
              Bring Front
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendToBack}
              className="flex-1 text-xs"
            >
              Send Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
