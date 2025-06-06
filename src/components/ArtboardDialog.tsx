
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Layout } from 'lucide-react';
import { artboardPresets, Artboard } from '@/utils/projectState';
import { toast } from 'sonner';

interface ArtboardDialogProps {
  onCreateArtboard: (artboard: Omit<Artboard, 'id'>) => void;
}

export const ArtboardDialog = ({ onCreateArtboard }: ArtboardDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [customWidth, setCustomWidth] = useState(400);
  const [customHeight, setCustomHeight] = useState(300);

  const handleCreate = () => {
    if (!name.trim()) {
      toast('Please enter a name for the artboard');
      return;
    }

    let width = customWidth;
    let height = customHeight;

    if (selectedPreset && selectedPreset !== 'Custom') {
      const preset = artboardPresets.find(p => p.name === selectedPreset);
      if (preset) {
        // Scale down large presets to reasonable canvas sizes
        width = preset.width > 800 ? Math.round(preset.width * 0.3) : preset.width;
        height = preset.height > 600 ? Math.round(preset.height * 0.3) : preset.height;
      }
    }

    // Ensure reasonable limits
    width = Math.max(100, Math.min(width, 800));
    height = Math.max(100, Math.min(height, 600));

    const artboard: Omit<Artboard, 'id'> = {
      name: name.trim(),
      width,
      height,
      x: 100,
      y: 100,
      isActive: true
    };

    onCreateArtboard(artboard);
    toast(`Artboard "${name}" created successfully!`);
    
    // Reset form
    setName('');
    setSelectedPreset('');
    setCustomWidth(400);
    setCustomHeight(300);
    setIsOpen(false);
  };

  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName);
    const preset = artboardPresets.find(p => p.name === presetName);
    if (preset && presetName !== 'Custom') {
      // Scale down for better canvas display
      const scaledWidth = preset.width > 800 ? Math.round(preset.width * 0.3) : preset.width;
      const scaledHeight = preset.height > 600 ? Math.round(preset.height * 0.3) : preset.height;
      setCustomWidth(scaledWidth);
      setCustomHeight(scaledHeight);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-12 w-12 p-0 rounded-xl bg-transparent hover:bg-white/10 text-white"
          title="Create Artboard"
        >
          <Layout className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            Create New Artboard
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="artboard-name">Artboard Name</Label>
            <Input
              id="artboard-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter artboard name"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="preset-select">Size Preset</Label>
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a preset or set custom" />
              </SelectTrigger>
              <SelectContent>
                {artboardPresets.map((preset) => (
                  <SelectItem key={preset.name} value={preset.name}>
                    {preset.name} ({preset.width} × {preset.height})
                    {preset.width > 800 || preset.height > 600 ? ' - Scaled' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="width">Width (px)</Label>
              <Input
                id="width"
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(Math.min(800, Math.max(100, Number(e.target.value))))}
                min={100}
                max={800}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="height">Height (px)</Label>
              <Input
                id="height"
                type="number"
                value={customHeight}
                onChange={(e) => setCustomHeight(Math.min(600, Math.max(100, Number(e.target.value))))}
                min={100}
                max={600}
                className="mt-1"
              />
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>📏 Sizes are optimized for canvas display</p>
            <p>🎯 Large presets are automatically scaled down</p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleCreate} className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              Create Artboard
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
