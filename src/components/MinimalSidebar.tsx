
import { Button } from "@/components/ui/button";
import { 
  MousePointer2, 
  Square, 
  Circle, 
  Type, 
  Minus,
  Plus
} from "lucide-react";

interface MinimalSidebarProps {
  activeTool: "select" | "rectangle" | "circle" | "text" | "line" | "hand" | "draw" | "image";
  onToolClick: (tool: "select" | "rectangle" | "circle" | "text" | "line" | "hand" | "draw" | "image") => void;
}

export const MinimalSidebar = ({ activeTool, onToolClick }: MinimalSidebarProps) => {
  const tools = [
    { id: "text", icon: Type, label: "Text" },
    { id: "rectangle", icon: Square, label: "Rectangle" },
    { id: "circle", icon: Circle, label: "Circle" },
    { id: "line", icon: Minus, label: "Line" },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-black/80 backdrop-blur-sm rounded-2xl p-2 flex items-center gap-1">
        {/* Selection tool */}
        <Button
          variant={activeTool === "select" ? "default" : "ghost"}
          size="sm"
          onClick={() => onToolClick("select")}
          className="w-12 h-12 p-0 rounded-xl bg-transparent hover:bg-white/10 data-[state=active]:bg-white data-[state=active]:text-black"
          data-state={activeTool === "select" ? "active" : "inactive"}
        >
          <MousePointer2 className="w-5 h-5" />
        </Button>

        {/* Separator */}
        <div className="w-px h-8 bg-white/20 mx-1" />

        {/* Drawing tools */}
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant="ghost"
            size="sm"
            onClick={() => onToolClick(tool.id as any)}
            className="w-12 h-12 p-0 rounded-xl bg-transparent hover:bg-white/10 data-[state=active]:bg-white data-[state=active]:text-black text-white"
            data-state={activeTool === tool.id ? "active" : "inactive"}
          >
            <tool.icon className="w-5 h-5" />
          </Button>
        ))}

        {/* Separator */}
        <div className="w-px h-8 bg-white/20 mx-1" />

        {/* Add element */}
        <Button
          variant="ghost"
          size="sm"
          className="w-12 h-12 p-0 rounded-xl bg-transparent hover:bg-white/10 text-white"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
