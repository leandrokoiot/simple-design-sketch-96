
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Palette, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff,
  ZoomIn,
  Download
} from "lucide-react";
import { Artboard } from "@/utils/projectState";

interface ArtboardManagerProps {
  artboards: Artboard[];
  selectedArtboard: Artboard | null;
  onUpdateArtboard: (id: string, updates: Partial<Artboard>) => void;
  onDeleteArtboard: (id: string) => void;
  onDuplicateArtboard: (id: string) => void;
  onZoomToArtboard: (id: string) => void;
  onExportArtboard: (id: string) => void;
}

export const ArtboardManager = ({
  artboards,
  selectedArtboard,
  onUpdateArtboard,
  onDeleteArtboard,
  onDuplicateArtboard,
  onZoomToArtboard,
  onExportArtboard
}: ArtboardManagerProps) => {
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");

  const handleColorChange = (color: string) => {
    setBackgroundColor(color);
    if (selectedArtboard) {
      onUpdateArtboard(selectedArtboard.id, { backgroundColor: color });
    }
  };

  if (!selectedArtboard) {
    return (
      <div className="w-80 bg-[hsl(var(--editor-panel))] border-l border-border p-4">
        <h3 className="text-sm font-semibold mb-4">Artboard Manager</h3>
        <p className="text-sm text-muted-foreground">Select an artboard to edit its properties</p>
        
        {artboards.length > 0 && (
          <div className="mt-4 space-y-2">
            <Label className="text-xs">All Artboards</Label>
            {artboards.map((artboard) => (
              <div key={artboard.id} className="flex items-center justify-between p-2 border rounded">
                <span className="text-xs truncate">{artboard.name}</span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onZoomToArtboard(artboard.id)}
                    className="h-6 w-6 p-0"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-80 bg-[hsl(var(--editor-panel))] border-l border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Artboard Properties</h3>
        <div className="text-xs bg-muted px-2 py-1 rounded">
          {selectedArtboard.width} × {selectedArtboard.height}
        </div>
      </div>

      <Separator />

      {/* Artboard Name */}
      <div>
        <Label className="text-xs text-muted-foreground">Name</Label>
        <Input
          value={selectedArtboard.name}
          onChange={(e) => onUpdateArtboard(selectedArtboard.id, { name: e.target.value })}
          className="text-xs h-8 mt-1"
        />
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">Width</Label>
          <Input
            type="number"
            value={selectedArtboard.width}
            onChange={(e) => onUpdateArtboard(selectedArtboard.id, { width: Number(e.target.value) })}
            className="text-xs h-8 mt-1"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Height</Label>
          <Input
            type="number"
            value={selectedArtboard.height}
            onChange={(e) => onUpdateArtboard(selectedArtboard.id, { height: Number(e.target.value) })}
            className="text-xs h-8 mt-1"
          />
        </div>
      </div>

      {/* Background Color */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Background Color</Label>
        <div className="flex gap-2">
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-10 h-8 border border-border rounded cursor-pointer"
          />
          <Input
            type="text"
            value={backgroundColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="text-xs h-8 flex-1"
            placeholder="#ffffff"
          />
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Actions</Label>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDuplicateArtboard(selectedArtboard.id)}
            className="text-xs h-8"
          >
            <Copy className="w-3 h-3 mr-1" />
            Duplicate
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onZoomToArtboard(selectedArtboard.id)}
            className="text-xs h-8"
          >
            <ZoomIn className="w-3 h-3 mr-1" />
            Zoom To
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onExportArtboard(selectedArtboard.id)}
            className="text-xs h-8"
          >
            <Download className="w-3 h-3 mr-1" />
            Export
          </Button>
          
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDeleteArtboard(selectedArtboard.id)}
            className="text-xs h-8"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Element Count */}
      <div className="pt-2 border-t">
        <div className="text-xs text-muted-foreground">
          Elements in this artboard: <span className="font-medium">0</span>
        </div>
      </div>
    </div>
  );
};
