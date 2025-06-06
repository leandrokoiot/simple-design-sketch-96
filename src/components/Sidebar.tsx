
import { Button } from "@/components/ui/button";
import { 
  MousePointer2, 
  Square, 
  Circle, 
  Type, 
  Minus,
  Image,
  Shapes,
  Hand,
  Move,
  RotateCcw,
  Settings,
  Pen,
  Group
} from "lucide-react";

interface SidebarProps {
  activeTool: "select" | "rectangle" | "circle" | "text" | "line" | "hand" | "draw" | "image";
  onToolClick: (tool: "select" | "rectangle" | "circle" | "text" | "line" | "hand" | "draw" | "image") => void;
  onClear: () => void;
  onGroup: () => void;
  onUngroup: () => void;
}

export const Sidebar = ({ activeTool, onToolClick, onClear, onGroup, onUngroup }: SidebarProps) => {
  const tools = [
    { id: "select", icon: MousePointer2, label: "Select", shortcut: "V" },
    { id: "hand", icon: Hand, label: "Hand", shortcut: "H" },
    { id: "draw", icon: Pen, label: "Draw", shortcut: "P" },
  ];

  const shapes = [
    { id: "rectangle", icon: Square, label: "Rectangle", shortcut: "R" },
    { id: "circle", icon: Circle, label: "Circle", shortcut: "C" },
    { id: "line", icon: Minus, label: "Line", shortcut: "L" },
  ];

  const elements = [
    { id: "text", icon: Type, label: "Text", shortcut: "T" },
    { id: "image", icon: Image, label: "Image", shortcut: "I" },
  ];

  return (
    <div className="w-16 bg-[hsl(var(--editor-sidebar))] border-r border-border flex flex-col">
      {/* Logo/Brand */}
      <div className="h-16 flex items-center justify-center border-b border-border">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Move className="w-4 h-4 text-primary-foreground" />
        </div>
      </div>

      {/* Tools Section */}
      <div className="p-2 space-y-1">
        <div className="text-xs text-muted-foreground px-2 py-1">Tools</div>
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? "default" : "ghost"}
            size="sm"
            onClick={() => onToolClick(tool.id as any)}
            className="w-12 h-12 p-0 flex flex-col gap-1"
            title={`${tool.label} (${tool.shortcut})`}
          >
            <tool.icon className="w-4 h-4" />
          </Button>
        ))}
      </div>

      {/* Shapes Section */}
      <div className="p-2 space-y-1">
        <div className="text-xs text-muted-foreground px-2 py-1">Shapes</div>
        {shapes.map((shape) => (
          <Button
            key={shape.id}
            variant={activeTool === shape.id ? "default" : "ghost"}
            size="sm"
            onClick={() => onToolClick(shape.id as any)}
            className="w-12 h-12 p-0 flex flex-col gap-1"
            title={`${shape.label} (${shape.shortcut})`}
          >
            <shape.icon className="w-4 h-4" />
          </Button>
        ))}
      </div>

      {/* Elements Section */}
      <div className="p-2 space-y-1">
        <div className="text-xs text-muted-foreground px-2 py-1">Elements</div>
        {elements.map((element) => (
          <Button
            key={element.id}
            variant={activeTool === element.id ? "default" : "ghost"}
            size="sm"
            onClick={() => onToolClick(element.id as any)}
            className="w-12 h-12 p-0 flex flex-col gap-1"
            title={`${element.label} (${element.shortcut})`}
          >
            <element.icon className="w-4 h-4" />
          </Button>
        ))}
      </div>

      {/* Group Section */}
      <div className="p-2 space-y-1">
        <div className="text-xs text-muted-foreground px-2 py-1">Group</div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onGroup}
          className="w-12 h-12 p-0"
          title="Group (Ctrl+G)"
        >
          <Group className="w-4 h-4" />
        </Button>
      </div>

      {/* Bottom Actions */}
      <div className="mt-auto p-2 space-y-1 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="w-12 h-12 p-0"
          title="Clear All"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-12 h-12 p-0"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
