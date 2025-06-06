import { useState, useEffect } from "react";
import { FabricObject } from "fabric";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCanvas } from "@/contexts/CanvasContext";
import { 
  ChevronDown, 
  ChevronRight, 
  Layers, 
  Palette, 
  Type,
  Move,
  Eye,
  EyeOff,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify
} from "lucide-react";

interface PropertiesPanelProps {
  selectedObject: FabricObject;
  onUpdate: (props: any) => void;
}

const fontFamilies = [
  "Inter", "Arial", "Helvetica", "Times New Roman", "Georgia", 
  "Verdana", "Roboto", "Open Sans", "Lato", "Montserrat"
];

const fontWeights = [
  { value: 100, label: "Thin" },
  { value: 200, label: "Extra Light" },
  { value: 300, label: "Light" },
  { value: 400, label: "Regular" },
  { value: 500, label: "Medium" },
  { value: 600, label: "Semi Bold" },
  { value: 700, label: "Bold" },
  { value: 800, label: "Extra Bold" },
  { value: 900, label: "Black" }
];

export const PropertiesPanel = ({ selectedObject, onUpdate }: PropertiesPanelProps) => {
  const { fabricCanvas } = useCanvas();
  
  const [fill, setFill] = useState("#000000");
  const [stroke, setStroke] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(1);
  const [opacity, setOpacity] = useState(1);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontWeight, setFontWeight] = useState(400);
  const [textAlign, setTextAlign] = useState("left");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [shadowEnabled, setShadowEnabled] = useState(false);
  const [shadowColor, setShadowColor] = useState("#000000");
  const [shadowOffsetX, setShadowOffsetX] = useState(2);
  const [shadowOffsetY, setShadowOffsetY] = useState(2);
  const [shadowBlur, setShadowBlur] = useState(4);
  
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
        const textObj = selectedObject as any;
        setFontSize(textObj.fontSize || 16);
        setFontFamily(textObj.fontFamily || "Inter");
        setFontWeight(textObj.fontWeight || 400);
        setTextAlign(textObj.textAlign || "left");
        setLetterSpacing(textObj.charSpacing || 0);
        setLineHeight(textObj.lineHeight || 1.2);
        setIsBold(textObj.fontWeight >= 600);
        setIsItalic(textObj.fontStyle === "italic");
        setIsUnderline(textObj.underline || false);
        
        setShadowEnabled(Boolean(textObj.shadow));
        if (textObj.shadow) {
          setShadowColor(textObj.shadow.color || "#000000");
          setShadowOffsetX(textObj.shadow.offsetX || 2);
          setShadowOffsetY(textObj.shadow.offsetY || 2);
          setShadowBlur(textObj.shadow.blur || 4);
        }
        
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

  const handleFontFamilyChange = (newFont: string) => {
    setFontFamily(newFont);
    onUpdate({ fontFamily: newFont });
  };

  const handleFontWeightChange = (newWeight: string) => {
    const weight = parseInt(newWeight);
    setFontWeight(weight);
    setIsBold(weight >= 600);
    onUpdate({ fontWeight: weight });
  };

  const handleTextAlignChange = (align: string) => {
    setTextAlign(align);
    onUpdate({ textAlign: align });
  };

  const handleBoldToggle = () => {
    const newBold = !isBold;
    setIsBold(newBold);
    const newWeight = newBold ? 700 : 400;
    setFontWeight(newWeight);
    onUpdate({ fontWeight: newWeight });
  };

  const handleItalicToggle = () => {
    const newItalic = !isItalic;
    setIsItalic(newItalic);
    onUpdate({ fontStyle: newItalic ? "italic" : "normal" });
  };

  const handleUnderlineToggle = () => {
    const newUnderline = !isUnderline;
    setIsUnderline(newUnderline);
    onUpdate({ underline: newUnderline });
  };

  const handleShadowToggle = () => {
    const newShadowEnabled = !shadowEnabled;
    setShadowEnabled(newShadowEnabled);
    
    if (newShadowEnabled) {
      onUpdate({
        shadow: {
          color: shadowColor,
          offsetX: shadowOffsetX,
          offsetY: shadowOffsetY,
          blur: shadowBlur
        }
      });
    } else {
      onUpdate({ shadow: null });
    }
  };

  const handleShadowPropertyChange = (property: string, value: any) => {
    const newShadow = {
      color: shadowColor,
      offsetX: shadowOffsetX,
      offsetY: shadowOffsetY,
      blur: shadowBlur,
      [property]: value
    };

    switch (property) {
      case 'color':
        setShadowColor(value);
        break;
      case 'offsetX':
        setShadowOffsetX(value);
        break;
      case 'offsetY':
        setShadowOffsetY(value);
        break;
      case 'blur':
        setShadowBlur(value);
        break;
    }

    if (shadowEnabled) {
      onUpdate({ shadow: newShadow });
    }
  };

  const handleBringToFront = () => {
    if (!fabricCanvas || !selectedObject) return;
    fabricCanvas.bringObjectToFront(selectedObject);
    fabricCanvas.renderAll();
  };

  const handleSendToBack = () => {
    if (!fabricCanvas || !selectedObject) return;
    fabricCanvas.sendObjectToBack(selectedObject);
    fabricCanvas.renderAll();
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

        {/* Enhanced Text Properties */}
        {showText && (
          <>
            <CollapsibleSection
              title="Typography"
              icon={Type}
              isOpen={true}
              onToggle={() => {}}
            >
              <div className="space-y-4">
                {/* Font Family */}
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">Font Family</label>
                  <Select value={fontFamily} onValueChange={handleFontFamilyChange}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontFamilies.map((font) => (
                        <SelectItem key={font} value={font}>{font}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Font Weight */}
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">Weight</label>
                  <Select value={fontWeight.toString()} onValueChange={handleFontWeightChange}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontWeights.map((weight) => (
                        <SelectItem key={weight.value} value={weight.value.toString()}>
                          {weight.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Font Size */}
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">Font Size</label>
                  <input
                    type="range"
                    min="8"
                    max="72"
                    step="1"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="text-xs text-muted-foreground text-center mt-1">{fontSize}px</div>
                </div>

                {/* Text Alignment */}
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">Alignment</label>
                  <div className="grid grid-cols-4 gap-1">
                    <Button
                      variant={textAlign === "left" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTextAlignChange("left")}
                      className="h-8 p-0"
                    >
                      <AlignLeft className="w-3 h-3" />
                    </Button>
                    <Button
                      variant={textAlign === "center" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTextAlignChange("center")}
                      className="h-8 p-0"
                    >
                      <AlignCenter className="w-3 h-3" />
                    </Button>
                    <Button
                      variant={textAlign === "right" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTextAlignChange("right")}
                      className="h-8 p-0"
                    >
                      <AlignRight className="w-3 h-3" />
                    </Button>
                    <Button
                      variant={textAlign === "justify" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTextAlignChange("justify")}
                      className="h-8 p-0"
                    >
                      <AlignJustify className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Text Styles */}
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">Style</label>
                  <div className="grid grid-cols-3 gap-1">
                    <Button
                      variant={isBold ? "default" : "outline"}
                      size="sm"
                      onClick={handleBoldToggle}
                      className="h-8 p-0"
                    >
                      <Bold className="w-3 h-3" />
                    </Button>
                    <Button
                      variant={isItalic ? "default" : "outline"}
                      size="sm"
                      onClick={handleItalicToggle}
                      className="h-8 p-0"
                    >
                      <Italic className="w-3 h-3" />
                    </Button>
                    <Button
                      variant={isUnderline ? "default" : "outline"}
                      size="sm"
                      onClick={handleUnderlineToggle}
                      className="h-8 p-0"
                    >
                      <Underline className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Letter Spacing */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-muted-foreground">Letter Spacing</label>
                    <span className="text-xs">{letterSpacing}</span>
                  </div>
                  <input
                    type="range"
                    min="-5"
                    max="20"
                    step="0.1"
                    value={letterSpacing}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setLetterSpacing(value);
                      onUpdate({ charSpacing: value });
                    }}
                    className="w-full accent-primary"
                  />
                </div>

                {/* Line Height */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-muted-foreground">Line Height</label>
                    <span className="text-xs">{lineHeight.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={lineHeight}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setLineHeight(value);
                      onUpdate({ lineHeight: value });
                    }}
                    className="w-full accent-primary"
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Text Shadow */}
            <CollapsibleSection
              title="Shadow"
              icon={Palette}
              isOpen={shadowEnabled}
              onToggle={handleShadowToggle}
            >
              {shadowEnabled && (
                <div className="space-y-3">
                  {/* Shadow controls */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-muted-foreground">X offset</label>
                      <span className="text-xs">{shadowOffsetX}</span>
                    </div>
                    <input
                      type="range"
                      min="-20"
                      max="20"
                      value={shadowOffsetX}
                      onChange={(e) => handleShadowPropertyChange('offsetX', Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-muted-foreground">Y offset</label>
                      <span className="text-xs">{shadowOffsetY}</span>
                    </div>
                    <input
                      type="range"
                      min="-20"
                      max="20"
                      value={shadowOffsetY}
                      onChange={(e) => handleShadowPropertyChange('offsetY', Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-muted-foreground">Blur</label>
                      <span className="text-xs">{shadowBlur}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={shadowBlur}
                      onChange={(e) => handleShadowPropertyChange('blur', Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground block mb-2">Shadow Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={shadowColor}
                        onChange={(e) => handleShadowPropertyChange('color', e.target.value)}
                        className="w-8 h-6 border border-border rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={shadowColor}
                        onChange={(e) => handleShadowPropertyChange('color', e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CollapsibleSection>
          </>
        )}

        {/* Appearance - keep existing code for non-text objects */}
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

        {/* Layer Controls - keep existing code */}
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
