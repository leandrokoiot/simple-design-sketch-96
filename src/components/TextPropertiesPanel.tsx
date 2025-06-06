
import { useState, useEffect } from "react";
import { FabricObject } from "fabric";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bold, 
  Italic, 
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Superscript,
  Subscript
} from "lucide-react";

interface TextPropertiesPanelProps {
  selectedObject: FabricObject;
  onUpdate: (props: any) => void;
}

const fontFamilies = [
  "Inter",
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Verdana",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat"
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

export const TextPropertiesPanel = ({ selectedObject, onUpdate }: TextPropertiesPanelProps) => {
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontWeight, setFontWeight] = useState(400);
  const [fontSize, setFontSize] = useState(16);
  const [textAlign, setTextAlign] = useState("left");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [fill, setFill] = useState("#000000");
  
  // Shadow properties
  const [shadowEnabled, setShadowEnabled] = useState(false);
  const [shadowColor, setShadowColor] = useState("#000000");
  const [shadowOffsetX, setShadowOffsetX] = useState(2);
  const [shadowOffsetY, setShadowOffsetY] = useState(2);
  const [shadowBlur, setShadowBlur] = useState(4);

  useEffect(() => {
    if (selectedObject && (selectedObject.type === 'textbox' || selectedObject.type === 'text')) {
      const textObj = selectedObject as any;
      setFontFamily(textObj.fontFamily || "Inter");
      setFontWeight(textObj.fontWeight || 400);
      setFontSize(textObj.fontSize || 16);
      setTextAlign(textObj.textAlign || "left");
      setFill(textObj.fill || "#000000");
      setLetterSpacing(textObj.charSpacing || 0);
      setLineHeight(textObj.lineHeight || 1.2);
      
      // Text styles
      setIsBold(textObj.fontWeight >= 600);
      setIsItalic(textObj.fontStyle === "italic");
      setIsUnderline(textObj.underline || false);
      
      // Shadow
      setShadowEnabled(Boolean(textObj.shadow));
      if (textObj.shadow) {
        setShadowColor(textObj.shadow.color || "#000000");
        setShadowOffsetX(textObj.shadow.offsetX || 2);
        setShadowOffsetY(textObj.shadow.offsetY || 2);
        setShadowBlur(textObj.shadow.blur || 4);
      }
    }
  }, [selectedObject]);

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

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    onUpdate({ fontSize: newSize });
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

  return (
    <div className="w-80 bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
      {/* Font Family */}
      <div className="mb-4">
        <label className="text-sm font-medium mb-2 block">Font Family</label>
        <Select value={fontFamily} onValueChange={handleFontFamilyChange}>
          <SelectTrigger>
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
      <div className="mb-4">
        <label className="text-sm font-medium mb-2 block">Weight</label>
        <Select value={fontWeight.toString()} onValueChange={handleFontWeightChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontWeights.map((weight) => (
              <SelectItem key={weight.value} value={weight.value.toString()}>
                {weight.value} - {weight.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font Size */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Size</label>
          <span className="text-lg font-bold">{fontSize}</span>
        </div>
        <input
          type="range"
          min="8"
          max="120"
          value={fontSize}
          onChange={(e) => handleFontSizeChange(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
      </div>

      {/* Text Alignment */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-3 block">Align</label>
        <div className="grid grid-cols-4 gap-2">
          <Button
            variant={textAlign === "left" ? "default" : "outline"}
            size="sm"
            onClick={() => handleTextAlignChange("left")}
            className="p-2"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            variant={textAlign === "center" ? "default" : "outline"}
            size="sm"
            onClick={() => handleTextAlignChange("center")}
            className="p-2"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            variant={textAlign === "right" ? "default" : "outline"}
            size="sm"
            onClick={() => handleTextAlignChange("right")}
            className="p-2"
          >
            <AlignRight className="w-4 h-4" />
          </Button>
          <Button
            variant={textAlign === "justify" ? "default" : "outline"}
            size="sm"
            onClick={() => handleTextAlignChange("justify")}
            className="p-2"
          >
            <AlignJustify className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Text Styles */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-3 block">Transform</label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={isBold ? "default" : "outline"}
            size="sm"
            onClick={handleBoldToggle}
            className="p-3"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant={isItalic ? "default" : "outline"}
            size="sm"
            onClick={handleItalicToggle}
            className="p-3"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant={isUnderline ? "default" : "outline"}
            size="sm"
            onClick={handleUnderlineToggle}
            className="p-3"
          >
            <Underline className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Color */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={fill}
            onChange={(e) => {
              setFill(e.target.value);
              onUpdate({ fill: e.target.value });
            }}
            className="w-12 h-10 rounded-lg border-none cursor-pointer"
          />
          <input
            type="text"
            value={fill}
            onChange={(e) => {
              setFill(e.target.value);
              onUpdate({ fill: e.target.value });
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="#000000"
          />
        </div>
      </div>

      {/* Letter Spacing */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Letter Spacing</label>
          <span className="text-sm font-bold">{letterSpacing}</span>
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
          className="w-full accent-blue-500"
        />
      </div>

      {/* Line Height */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Line Height</label>
          <span className="text-sm font-bold">{lineHeight.toFixed(1)}</span>
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
          className="w-full accent-blue-500"
        />
      </div>

      {/* Shadow */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-medium">Shadow</label>
          <button
            onClick={handleShadowToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              shadowEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                shadowEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {shadowEnabled && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-600">X offset</label>
                <span className="text-sm font-bold">{shadowOffsetX}</span>
              </div>
              <input
                type="range"
                min="-20"
                max="20"
                value={shadowOffsetX}
                onChange={(e) => handleShadowPropertyChange('offsetX', Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-600">Y offset</label>
                <span className="text-sm font-bold">{shadowOffsetY}</span>
              </div>
              <input
                type="range"
                min="-20"
                max="20"
                value={shadowOffsetY}
                onChange={(e) => handleShadowPropertyChange('offsetY', Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-600">Blur</label>
                <span className="text-sm font-bold">{shadowBlur}</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={shadowBlur}
                onChange={(e) => handleShadowPropertyChange('blur', Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-600 mb-2 block">Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={shadowColor}
                  onChange={(e) => handleShadowPropertyChange('color', e.target.value)}
                  className="w-8 h-8 rounded border-none cursor-pointer"
                />
                <input
                  type="text"
                  value={shadowColor}
                  onChange={(e) => handleShadowPropertyChange('color', e.target.value)}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
