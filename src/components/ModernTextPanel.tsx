
import { useState, useEffect } from "react";
import { FabricObject } from "fabric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Bold, 
  Italic, 
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Palette
} from "lucide-react";

interface ModernTextPanelProps {
  selectedObject: FabricObject;
  onUpdate: (props: any) => void;
}

const fontFamilies = [
  "Inter", "SF Pro Display", "Helvetica Neue", "Arial", "Roboto", 
  "Open Sans", "Lato", "Montserrat", "Poppins", "Source Sans Pro"
];

export const ModernTextPanel = ({ selectedObject, onUpdate }: ModernTextPanelProps) => {
  const [text, setText] = useState("");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontSize, setFontSize] = useState(16);
  const [fontWeight, setFontWeight] = useState(400);
  const [textAlign, setTextAlign] = useState("left");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [fill, setFill] = useState("#000000");

  useEffect(() => {
    if (selectedObject && (selectedObject.type === 'textbox' || selectedObject.type === 'text')) {
      const textObj = selectedObject as any;
      setText(textObj.text || "");
      setFontFamily(textObj.fontFamily || "Inter");
      setFontSize(textObj.fontSize || 16);
      setFontWeight(textObj.fontWeight || 400);
      setTextAlign(textObj.textAlign || "left");
      setFill(textObj.fill || "#000000");
      setLetterSpacing(textObj.charSpacing || 0);
      setLineHeight(textObj.lineHeight || 1.2);
      
      setIsBold(textObj.fontWeight >= 600);
      setIsItalic(textObj.fontStyle === "italic");
      setIsUnderline(textObj.underline || false);
    }
  }, [selectedObject]);

  const handleTextChange = (newText: string) => {
    setText(newText);
    onUpdate({ text: newText });
  };

  const handleFontFamilyChange = (newFont: string) => {
    setFontFamily(newFont);
    onUpdate({ fontFamily: newFont });
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

  return (
    <div className="fixed top-6 left-6 z-50">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-gray-100/50 w-80">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Type className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Text</h3>
        </div>

        {/* Text Input */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-3 block">Content</label>
          <Input
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Enter your text..."
            className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-gray-50/50 focus:bg-white transition-all"
          />
        </div>

        {/* Font Family */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-3 block">Font</label>
          <select
            value={fontFamily}
            onChange={(e) => handleFontFamilyChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-gray-50/50 focus:bg-white transition-all appearance-none cursor-pointer"
          >
            {fontFamilies.map((font) => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Size</label>
            <div className="bg-gray-100 px-3 py-1 rounded-lg">
              <span className="text-sm font-semibold text-gray-900">{fontSize}</span>
            </div>
          </div>
          <input
            type="range"
            min="8"
            max="72"
            value={fontSize}
            onChange={(e) => handleFontSizeChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((fontSize - 8) / (72 - 8)) * 100}%, #e5e7eb ${((fontSize - 8) / (72 - 8)) * 100}%, #e5e7eb 100%)`
            }}
          />
        </div>

        {/* Text Styles */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-3 block">Style</label>
          <div className="flex gap-2">
            <Button
              variant={isBold ? "default" : "outline"}
              size="sm"
              onClick={handleBoldToggle}
              className={`flex-1 h-12 rounded-xl transition-all ${
                isBold 
                  ? 'bg-gray-900 text-white hover:bg-gray-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-0'
              }`}
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              variant={isItalic ? "default" : "outline"}
              size="sm"
              onClick={handleItalicToggle}
              className={`flex-1 h-12 rounded-xl transition-all ${
                isItalic 
                  ? 'bg-gray-900 text-white hover:bg-gray-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-0'
              }`}
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              variant={isUnderline ? "default" : "outline"}
              size="sm"
              onClick={handleUnderlineToggle}
              className={`flex-1 h-12 rounded-xl transition-all ${
                isUnderline 
                  ? 'bg-gray-900 text-white hover:bg-gray-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-0'
              }`}
            >
              <Underline className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Text Alignment */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-3 block">Align</label>
          <div className="flex gap-2">
            <Button
              variant={textAlign === "left" ? "default" : "outline"}
              size="sm"
              onClick={() => handleTextAlignChange("left")}
              className={`flex-1 h-12 rounded-xl transition-all ${
                textAlign === "left" 
                  ? 'bg-gray-900 text-white hover:bg-gray-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-0'
              }`}
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button
              variant={textAlign === "center" ? "default" : "outline"}
              size="sm"
              onClick={() => handleTextAlignChange("center")}
              className={`flex-1 h-12 rounded-xl transition-all ${
                textAlign === "center" 
                  ? 'bg-gray-900 text-white hover:bg-gray-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-0'
              }`}
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button
              variant={textAlign === "right" ? "default" : "outline"}
              size="sm"
              onClick={() => handleTextAlignChange("right")}
              className={`flex-1 h-12 rounded-xl transition-all ${
                textAlign === "right" 
                  ? 'bg-gray-900 text-white hover:bg-gray-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-0'
              }`}
            >
              <AlignRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Color */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-3 block">Color</label>
          <div className="flex gap-3">
            <div className="relative">
              <input
                type="color"
                value={fill}
                onChange={(e) => {
                  setFill(e.target.value);
                  onUpdate({ fill: e.target.value });
                }}
                className="w-12 h-12 rounded-xl border-0 cursor-pointer shadow-sm"
              />
            </div>
            <Input
              type="text"
              value={fill}
              onChange={(e) => {
                setFill(e.target.value);
                onUpdate({ fill: e.target.value });
              }}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white transition-all font-mono text-sm"
              placeholder="#000000"
            />
          </div>
        </div>

        {/* Letter Spacing */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Letter Spacing</label>
            <div className="bg-gray-100 px-3 py-1 rounded-lg">
              <span className="text-sm font-semibold text-gray-900">{letterSpacing}</span>
            </div>
          </div>
          <input
            type="range"
            min="-2"
            max="10"
            step="0.1"
            value={letterSpacing}
            onChange={(e) => {
              const value = Number(e.target.value);
              setLetterSpacing(value);
              onUpdate({ charSpacing: value });
            }}
            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((letterSpacing + 2) / 12) * 100}%, #e5e7eb ${((letterSpacing + 2) / 12) * 100}%, #e5e7eb 100%)`
            }}
          />
        </div>

        {/* Line Height */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Line Height</label>
            <div className="bg-gray-100 px-3 py-1 rounded-lg">
              <span className="text-sm font-semibold text-gray-900">{lineHeight.toFixed(1)}</span>
            </div>
          </div>
          <input
            type="range"
            min="0.8"
            max="2.5"
            step="0.1"
            value={lineHeight}
            onChange={(e) => {
              const value = Number(e.target.value);
              setLineHeight(value);
              onUpdate({ lineHeight: value });
            }}
            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((lineHeight - 0.8) / 1.7) * 100}%, #e5e7eb ${((lineHeight - 0.8) / 1.7) * 100}%, #e5e7eb 100%)`
            }}
          />
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
          border: 2px solid white;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
          border: 2px solid white;
        }
      `}</style>
    </div>
  );
};
