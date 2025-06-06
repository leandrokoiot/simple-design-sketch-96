import { useState, useEffect } from "react";
import { FabricObject } from "fabric";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronDown, 
  ChevronRight, 
  Layers, 
  Palette, 
  Type,
  Move,
  Eye,
  EyeOff
} from "lucide-react";

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
  
  const [showPosition, setShowPosition] = useState(true);
  const [showAppearance, setShowAppearance] = useState(true);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    if (selectedObject) {
      setFill(selectedObject.fill as string || "#000000");
      setStroke(selectedObject.stroke as string || "#000000");
      setStrokeWidth(selectedObject.strokeWidth || 1);
      setOpacity(selectedObject.opacity || 1);
      
      if (selectedObject.type === 'textbox' || selectedObject.type === 'text') {
        setFontSize((selectedObject as any).fontSize || 16);
        setShowText(true);
      } else {
        setShowText(false);
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
    const canvas = selectedObject.canvas;
    if (canvas) {
      canvas.bringObjectToFront(selectedObject);
      onUpdate({});
    }
  };

  const handleSendToBack = () => {
    const canvas = selectedObject.canvas;
    if (canvas) {
      canvas.sendObjectToBack(selectedObject);
      onUpdate({});
    }
  };

  const CollapsibleSection = ({ 
    title, 
    icon: Icon, 
    isOpen, 
    onToggle, 
    children 
  }: { 
    title: string; 
    icon: any; 
    isOpen: boolean; 
    onToggle: () => void; 
    children: React.ReactNode;
  }) => (
    <div className="border border-border rounded-lg mb-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      {isOpen && (
        <div className="p-3 pt-0 border-t border-border">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-80 bg-[hsl(var(--editor-panel))] border-l border-border editor-scrollbar overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Properties</h3>
          <div className="flex items-center gap-1">
            <div className="text-xs text-muted-foreground capitalize bg-muted px-2 py-1 rounded">
              {selectedObject.type}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Position & Transform */}
        <CollapsibleSection
          title="Position & Size"
          icon={Move}
          isOpen={showPosition}
          onToggle={() => setShowPosition(!showPosition)}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">X</label>
                <input
                  type="number"
                  value={Math.round(selectedObject.left || 0)}
                  onChange={(e) => onUpdate({ left: Number(e.target.value) })}
                  className="w-full px-2 py-1 text-xs border border-border rounded bg-background"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Y</label>
                <input
                  type="number"
                  value={Math.round(selectedObject.top || 0)}
                  onChange={(e) => onUpdate({ top: Number(e.target.value) })}
                  className="w-full px-2 py-1 text-xs border border-border rounded bg-background"
                />
              </div>
            </div>

            {selectedObject.type === 'rect' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Width</label>
                  <input
                    type="number"
                    value={Math.round((selectedObject as any).width || 0)}
                    onChange={(e) => onUpdate({ width: Number(e.target.value) })}
                    className="w-full px-2 py-1 text-xs border border-border rounded bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Height</label>
                  <input
                    type="number"
                    value={Math.round((selectedObject as any).height || 0)}
                    onChange={(e) => onUpdate({ height: Number(e.target.value) })}
                    className="w-full px-2 py-1 text-xs border border-border rounded bg-background"
                  />
                </div>
              </div>
            )}

            {selectedObject.type === 'circle' && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Radius</label>
                <input
                  type="number"
                  value={Math.round((selectedObject as any).radius || 0)}
                  onChange={(e) => onUpdate({ radius: Number(e.target.value) })}
                  className="w-full px-2 py-1 text-xs border border-border rounded bg-background"
                />
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Appearance */}
        <CollapsibleSection
          title="Appearance"
          icon={Palette}
          isOpen={showAppearance}
          onToggle={() => setShowAppearance(!showAppearance)}
        >
          <div className="space-y-4">
            {/* Fill Color */}
            {selectedObject.type !== 'line' && (
              <div>
                <label className="text-xs text-muted-foreground block mb-2">Fill</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={fill}
                    onChange={(e) => handleFillChange(e.target.value)}
                    className="w-10 h-8 border border-border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={fill}
                    onChange={(e) => handleFillChange(e.target.value)}
                    className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background"
                    placeholder="#000000"
                  />
                </div>
              </div>
            )}

            {/* Stroke */}
            <div>
              <label className="text-xs text-muted-foreground block mb-2">Stroke</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={stroke}
                    onChange={(e) => handleStrokeChange(e.target.value)}
                    className="w-10 h-8 border border-border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={stroke}
                    onChange={(e) => handleStrokeChange(e.target.value)}
                    className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background"
                    placeholder="#000000"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Width</label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={strokeWidth}
                    onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="text-xs text-muted-foreground text-center mt-1">{strokeWidth}px</div>
                </div>
              </div>
            </div>

            {/* Opacity */}
            <div>
              <label className="text-xs text-muted-foreground block mb-2">Opacity</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={opacity}
                onChange={(e) => handleOpacityChange(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="text-xs text-muted-foreground text-center mt-1">{Math.round(opacity * 100)}%</div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Text Properties */}
        {showText && (
          <CollapsibleSection
            title="Typography"
            icon={Type}
            isOpen={true}
            onToggle={() => {}}
          >
            <div>
              <label className="text-xs text-muted-foreground block mb-2">Font Size</label>
              <input
                type="range"
                min="8"
                max="72"
                step="1"
                value={fontSize}
                onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="text-xs text-muted-foreground text-center mt-1">{fontSize}px</div>
            </div>
          </CollapsibleSection>
        )}

        {/* Layer Controls */}
        <CollapsibleSection
          title="Layers"
          icon={Layers}
          isOpen={true}
          onToggle={() => {}}
        >
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBringToFront}
                className="flex-1 text-xs h-8"
              >
                Bring Front
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendToBack}
                className="flex-1 text-xs h-8"
              >
                Send Back
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs h-8"
            >
              <Eye className="w-3 h-3 mr-1" />
              Visible
            </Button>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
};
