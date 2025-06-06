
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut } from "lucide-react";

interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export const ZoomControls = ({ zoom, onZoomChange }: ZoomControlsProps) => {
  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 25, 300);
    onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 25, 25);
    onZoomChange(newZoom);
  };

  const handleZoomReset = () => {
    onZoomChange(100);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleZoomOut}
        className="h-8 w-8 p-0"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleZoomReset}
        className="h-8 px-3 min-w-[60px] text-sm font-medium"
      >
        {zoom}%
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleZoomIn}
        className="h-8 w-8 p-0"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
    </div>
  );
};
