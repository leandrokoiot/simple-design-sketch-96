
import { useState } from "react";
import { FabricObject } from "fabric";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Trash2,
  ChevronDown,
  ChevronRight,
  Square,
  Circle,
  Type,
  Minus,
  Image
} from "lucide-react";

interface LayersPanelProps {
  objects: FabricObject[];
  selectedObject: FabricObject | null;
  onSelectObject: (object: FabricObject) => void;
  onDeleteObject: (object: FabricObject) => void;
  onToggleVisibility: (object: FabricObject) => void;
  onToggleLock: (object: FabricObject) => void;
}

export const LayersPanel = ({
  objects,
  selectedObject,
  onSelectObject,
  onDeleteObject,
  onToggleVisibility,
  onToggleLock
}: LayersPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

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
      case 'image':
        return Image;
      default:
        return Square;
    }
  };

  const getObjectName = (obj: FabricObject, index: number) => {
    if ((obj as any).customName) {
      return (obj as any).customName;
    }
    
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

  return (
    <div className="w-80 bg-[hsl(var(--editor-panel))] border-l border-border editor-scrollbar overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="text-sm font-semibold">Layers</h3>
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4">
          {objects.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              No objects on canvas
            </div>
          ) : (
            <div className="space-y-1">
              {objects.slice().reverse().map((obj, index) => {
                const reversedIndex = objects.length - 1 - index;
                const Icon = getObjectIcon(obj.type);
                const isSelected = selectedObject === obj;
                const isVisible = obj.visible !== false;
                const isLocked = (obj as any).lockMovementX || false;

                return (
                  <div
                    key={reversedIndex}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                      isSelected ? 'bg-primary/10 border border-primary/20' : ''
                    }`}
                    onClick={() => onSelectObject(obj)}
                  >
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1 text-sm truncate">
                      {getObjectName(obj, reversedIndex)}
                    </span>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-6 h-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleVisibility(obj);
                        }}
                      >
                        {isVisible ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-muted-foreground" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-6 h-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleLock(obj);
                        }}
                      >
                        {isLocked ? (
                          <Lock className="w-3 h-3" />
                        ) : (
                          <Unlock className="w-3 h-3 text-muted-foreground" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-6 h-6 p-0 text-red-500 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteObject(obj);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
