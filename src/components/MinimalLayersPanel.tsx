
import { useState } from "react";
import { FabricObject } from "fabric";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Trash2,
  Image,
  Layers
} from "lucide-react";
import { Layer } from "@/hooks/useLayerSystem";
import { toast } from "sonner";

interface MinimalLayersPanelProps {
  objects: FabricObject[];
  selectedObject: FabricObject | null;
  layers: Layer[];
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
  const [isExpanded, setIsExpanded] = useState(false);

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
    const typeNames = {
      rect: 'Retângulo',
      circle: 'Círculo',
      textbox: 'Texto',
      text: 'Texto', 
      line: 'Linha',
      image: 'Imagem'
    };
    
    return `${typeNames[obj.type as keyof typeof typeNames] || 'Objeto'} ${index + 1}`;
  };

  const handleAction = (action: () => void, actionName: string) => {
    action();
    toast(`${actionName} executado com sucesso`);
  };

  if (objects.length === 0) return null;

  const visibleLayers = layers.filter(l => l.visible).length;
  const lockedLayers = layers.filter(l => l.locked).length;

  return (
    <div 
      className="fixed top-6 right-6 z-50"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {/* Trigger */}
      <div 
        className="bg-black/80 backdrop-blur-sm rounded-xl p-3 cursor-pointer transition-all hover:bg-black/90"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-white">
          <Layers className="w-4 h-4" />
          <span className="text-sm font-medium">Camadas ({objects.length})</span>
          <div className="flex gap-1">
            <Badge variant="secondary" className="text-xs">
              {visibleLayers} visíveis
            </Badge>
            {lockedLayers > 0 && (
              <Badge variant="outline" className="text-xs">
                {lockedLayers} bloqueadas
              </Badge>
            )}
          </div>
          <MoreHorizontal className="w-4 h-4" />
        </div>
      </div>

      {/* Layers List */}
      {(isVisible || isExpanded) && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-black/90 backdrop-blur-sm rounded-xl p-3 border border-white/10 shadow-2xl">
          <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
            {objects.slice().reverse().map((obj, index) => {
              const reversedIndex = objects.length - 1 - index;
              const Icon = getObjectIcon(obj.type);
              const isSelected = selectedObject === obj;
              const objId = (obj as any).layerId || `obj-${reversedIndex}`;
              const layer = layers.find(l => l.id === objId);

              return (
                <div
                  key={reversedIndex}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-200 ${
                    isSelected 
                      ? 'bg-white/20 border border-white/30' 
                      : 'hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <div 
                    className="flex items-center gap-2 flex-1 cursor-pointer group"
                    onClick={() => onSelectObject(obj)}
                  >
                    <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-white/30' : 'bg-white/10 group-hover:bg-white/20'
                    }`}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <span className="flex-1 text-sm text-white truncate">
                      {getObjectName(obj, reversedIndex)}
                    </span>
                    {layer?.locked && <Lock className="w-3 h-3 text-yellow-400" />}
                    {layer?.visible === false && <EyeOff className="w-3 h-3 text-gray-400" />}
                  </div>

                  {/* Layer Controls */}
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-white/20 transition-colors"
                      onClick={() => handleAction(() => onToggleVisibility(objId), 'Visibilidade alterada')}
                      title={layer?.visible !== false ? 'Ocultar' : 'Mostrar'}
                    >
                      {layer?.visible !== false ? 
                        <Eye className="w-3 h-3 text-white" /> : 
                        <EyeOff className="w-3 h-3 text-white/50" />
                      }
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-white/20 transition-colors"
                      onClick={() => handleAction(() => onToggleLock(objId), 'Bloqueio alterado')}
                      title={layer?.locked ? 'Desbloquear' : 'Bloquear'}
                    >
                      {layer?.locked ? 
                        <Lock className="w-3 h-3 text-yellow-400" /> : 
                        <Unlock className="w-3 h-3 text-white/50" />
                      }
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-white/20 transition-colors"
                      onClick={() => handleAction(() => onDuplicate(objId), 'Camada duplicada')}
                      title="Duplicar"
                    >
                      <Copy className="w-3 h-3 text-white" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-white/20 transition-colors"
                      onClick={() => handleAction(() => onMoveUp(objId), 'Camada movida para frente')}
                      title="Mover para frente"
                    >
                      <ChevronUp className="w-3 h-3 text-white" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-white/20 transition-colors"
                      onClick={() => handleAction(() => onMoveDown(objId), 'Camada movida para trás')}
                      title="Mover para trás"
                    >
                      <ChevronDown className="w-3 h-3 text-white" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-red-500/20 transition-colors"
                      onClick={() => handleAction(() => onDeleteObject(obj), 'Camada removida')}
                      title="Remover"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Layer Statistics */}
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex justify-between text-xs text-white/70">
              <span>{objects.length} objetos</span>
              <span>{visibleLayers} visíveis</span>
              <span>{lockedLayers} bloqueadas</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
