
import { useState } from "react";
import { FabricObject } from "fabric";
import { Button } from "@/components/ui/button";
import { 
  Square,
  Circle,
  Type,
  Minus,
  MoreHorizontal,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  ChevronUp,
  ChevronDown,
  Trash2
} from "lucide-react";
import { LayerInfo } from "@/hooks/useLayerSystem";

interface MinimalLayersPanelProps {
  objects: FabricObject[];
  selectedObject: FabricObject | null;
  layers: LayerInfo[];
  onSelectObject: (object: FabricObject) => void;
  onDeleteObject: (object: FabricObject) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

export const MinimalLayersPanel = ({
  objects,
  selectedObject,
  layers,
  onSelectObject,
  onDeleteObject,
  onToggleVisibility,
  onToggleLock,
  onDuplicate,
  onMoveUp,
  onMoveDown
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
          <span className="text-sm font-medium">Layers ({objects.length})</span>
          <MoreHorizontal className="w-4 h-4" />
        </div>
      </div>

      {/* Layers List */}
      {isVisible && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-black/90 backdrop-blur-sm rounded-xl p-3 border border-white/10">
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {objects.slice().reverse().map((obj, index) => {
              const reversedIndex = objects.length - 1 - index;
              const Icon = getObjectIcon(obj.type);
              const isSelected = selectedObject === obj;
              const objId = (obj as any).id || `obj-${reversedIndex}`;
              const layer = layers.find(l => l.id === objId);

              return (
                <div
                  key={reversedIndex}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                    isSelected ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
                >
                  <div 
                    className="flex items-center gap-2 flex-1 cursor-pointer"
                    onClick={() => onSelectObject(obj)}
                  >
                    <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <span className="flex-1 text-sm text-white truncate">
                      {getObjectName(obj, reversedIndex)}
                    </span>
                  </div>

                  {/* Layer Controls */}
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-white/20"
                      onClick={() => onToggleVisibility(objId)}
                    >
                      {layer?.visible !== false ? 
                        <Eye className="w-3 h-3 text-white" /> : 
                        <EyeOff className="w-3 h-3 text-white/50" />
                      }
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-white/20"
                      onClick={() => onToggleLock(objId)}
                    >
                      {layer?.locked ? 
                        <Lock className="w-3 h-3 text-white" /> : 
                        <Unlock className="w-3 h-3 text-white/50" />
                      }
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-white/20"
                      onClick={() => onDuplicate(objId)}
                    >
                      <Copy className="w-3 h-3 text-white" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-white/20"
                      onClick={() => onMoveUp(objId)}
                    >
                      <ChevronUp className="w-3 h-3 text-white" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-white/20"
                      onClick={() => onMoveDown(objId)}
                    >
                      <ChevronDown className="w-3 h-3 text-white" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-white/20"
                      onClick={() => onDeleteObject(obj)}
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
