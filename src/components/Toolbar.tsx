
import { Button } from "@/components/ui/button";
import { MousePointer2, Square, Circle, Type, Trash2, RotateCcw, Minus } from "lucide-react";

interface ToolbarProps {
  activeTool: "select" | "rectangle" | "circle" | "text" | "line";
  onToolClick: (tool: "select" | "rectangle" | "circle" | "text" | "line") => void;
  onClear: () => void;
  onDelete: () => void;
}

export const Toolbar = ({ activeTool, onToolClick, onClear, onDelete }: ToolbarProps) => {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center gap-1">
      <Button
        variant={activeTool === "select" ? "default" : "ghost"}
        size="sm"
        onClick={() => onToolClick("select")}
        className="h-10 w-10 p-0"
        title="Select (V)"
      >
        <MousePointer2 className="h-4 w-4" />
      </Button>
      
      <Button
        variant={activeTool === "rectangle" ? "default" : "ghost"}
        size="sm"
        onClick={() => onToolClick("rectangle")}
        className="h-10 w-10 p-0"
        title="Rectangle (R)"
      >
        <Square className="h-4 w-4" />
      </Button>
      
      <Button
        variant={activeTool === "circle" ? "default" : "ghost"}
        size="sm"
        onClick={() => onToolClick("circle")}
        className="h-10 w-10 p-0"
        title="Circle (C)"
      >
        <Circle className="h-4 w-4" />
      </Button>
      
      <Button
        variant={activeTool === "text" ? "default" : "ghost"}
        size="sm"
        onClick={() => onToolClick("text")}
        className="h-10 w-10 p-0"
        title="Text (T)"
      >
        <Type className="h-4 w-4" />
      </Button>

      <Button
        variant={activeTool === "line" ? "default" : "ghost"}
        size="sm"
        onClick={() => onToolClick("line")}
        className="h-10 w-10 p-0"
        title="Line (L)"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-gray-200 mx-1" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="h-10 w-10 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
        title="Delete (Del)"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="h-10 w-10 p-0"
        title="Clear All"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
};
