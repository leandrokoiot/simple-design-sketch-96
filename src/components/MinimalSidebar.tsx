
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  MousePointer2, 
  Square, 
  Circle, 
  Type, 
  Minus,
  Plus,
  ChevronUp
} from "lucide-react";

interface MinimalSidebarProps {
  activeTool: "select" | "rectangle" | "circle" | "text" | "line" | "hand" | "draw" | "image";
  onToolClick: (tool: "select" | "rectangle" | "circle" | "text" | "line" | "hand" | "draw" | "image") => void;
}

export const MinimalSidebar = ({ activeTool, onToolClick }: MinimalSidebarProps) => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const tools = [
    { id: "text", icon: Type, label: "Text" },
    { id: "rectangle", icon: Square, label: "Rectangle" },
    { id: "circle", icon: Circle, label: "Circle" },
    { id: "line", icon: Minus, label: "Line" },
  ];

  const handleQuickAdd = (toolId: string) => {
    console.log(`Quick add: ${toolId}`);
    onToolClick(toolId as any);
    setShowQuickAdd(false);
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      {/* Quick Add Menu */}
      {showQuickAdd && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2">
          <div className="bg-black/80 backdrop-blur-sm rounded-2xl p-2 flex flex-col gap-1">
            {tools.map((tool) => (
              <Button
                key={tool.id}
                variant="ghost"
                size="sm"
                onClick={() => handleQuickAdd(tool.id)}
                className="w-12 h-12 p-0 rounded-xl bg-transparent hover:bg-white/10 text-white justify-center items-center flex flex-col gap-1"
              >
                <tool.icon className="w-4 h-4" />
                <span className="text-xs">{tool.label}</span>
              </Button>
            ))}
            {/* Arrow pointing down */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <ChevronUp className="w-4 h-4 text-black/80 rotate-180" />
            </div>
          </div>
        </div>
      )}

      {/* Main Toolbar */}
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

        {/* Quick Add element */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowQuickAdd(!showQuickAdd)}
          className="w-12 h-12 p-0 rounded-xl bg-transparent hover:bg-white/10 text-white"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
