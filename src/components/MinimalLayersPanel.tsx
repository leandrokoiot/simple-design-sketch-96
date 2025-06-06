
import { useState } from "react";
import { FabricObject } from "fabric";
import { Button } from "@/components/ui/button";
import { 
  Square,
  Circle,
  Type,
  Minus,
  MoreHorizontal
} from "lucide-react";

interface MinimalLayersPanelProps {
  objects: FabricObject[];
  selectedObject: FabricObject | null;
  onSelectObject: (object: FabricObject) => void;
  onDeleteObject: (object: FabricObject) => void;
}

export const MinimalLayersPanel = ({
  objects,
  selectedObject,
  onSelectObject,
  onDeleteObject
}: MinimalLayersPanelProps) => {
  const [isVisible, setIsVisible] = useState(false);

  const getObjectIcon = (type: string) => {
    switch (type) {
      case 'rect':
        return Square;
      case 'circle':
        return Circle;
      case 'textbox':
      case 'text':
        return Type;
      case 'line':
        return Minus;
      default:
        return Square;
    }
  };

  const getObjectName = (obj: FabricObject, index: number) => {
    const typeNames = {
      rect: 'Rectangle',
      circle: 'Circle',
      textbox: 'Text',
      text: 'Text', 
      line: 'Line',
      image: 'Image'
    };
    
    return `${typeNames[obj.type as keyof typeof typeNames] || 'Object'} ${index + 1}`;
  };

  if (objects.length === 0) return null;

  return (
    <div 
      className="fixed top-6 right-6 z-50"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {/* Trigger */}
      <div className="bg-black/80 backdrop-blur-sm rounded-xl p-3 cursor-pointer">
        <div className="flex items-center gap-2 text-white">
          <span className="text-sm font-medium">Layers</span>
          <MoreHorizontal className="w-4 h-4" />
        </div>
      </div>

      {/* Layers List */}
      {isVisible && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-black/90 backdrop-blur-sm rounded-xl p-3 border border-white/10">
          <div className="space-y-1">
            {objects.slice().reverse().map((obj, index) => {
              const reversedIndex = objects.length - 1 - index;
              const Icon = getObjectIcon(obj.type);
              const isSelected = selectedObject === obj;

              return (
                <div
                  key={reversedIndex}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
                  onClick={() => onSelectObject(obj)}
                >
                  <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
                    <Icon className="w-3 h-3 text-white" />
                  </div>
                  <span className="flex-1 text-sm text-white truncate">
                    {getObjectName(obj, reversedIndex)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
