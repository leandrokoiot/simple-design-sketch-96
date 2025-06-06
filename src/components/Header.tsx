
import { Button } from "@/components/ui/button";
import { 
  Moon, 
  Sun, 
  Download, 
  Upload, 
  Share2,
  User,
  ChevronDown
} from "lucide-react";
import { ZoomControls } from "./ZoomControls";
import { useState } from "react";

interface HeaderProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFitToScreen: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
}

export const Header = ({ 
  zoom, 
  onZoomChange, 
  onFitToScreen,
  showGrid,
  onToggleGrid,
  snapToGrid,
  onToggleSnap
}: HeaderProps) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="h-16 bg-[hsl(var(--editor-toolbar))] border-b border-border flex items-center justify-between px-6">
      {/* Left Section - Project Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Untitled Project</h1>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="text-sm text-muted-foreground">
          Auto-saved 2 minutes ago
        </div>
      </div>

      {/* Center Section - Canvas Controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={showGrid ? "default" : "ghost"}
            size="sm"
            onClick={onToggleGrid}
            className="text-xs"
          >
            Grid
          </Button>
          <Button
            variant={snapToGrid ? "default" : "ghost"}
            size="sm"
            onClick={onToggleSnap}
            className="text-xs"
          >
            Snap
          </Button>
        </div>
        
        <div className="w-px h-6 bg-border" />
        
        <ZoomControls 
          zoom={zoom} 
          onZoomChange={onZoomChange} 
          onFitToScreen={onFitToScreen} 
        />
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Import
        </Button>
        
        <Button variant="ghost" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        
        <Button variant="ghost" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
        
        <div className="w-px h-6 bg-border mx-2" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="w-10 h-10 p-0"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        
        <Button variant="ghost" size="sm" className="w-10 h-10 p-0">
          <User className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
