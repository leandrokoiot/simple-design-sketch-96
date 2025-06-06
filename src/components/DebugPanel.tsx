
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Bug, Download, Upload, History, Save } from 'lucide-react';
import { useVersionControl } from '@/hooks/useVersionControl';
import { toast } from 'sonner';

interface DebugPanelProps {
  canvasState: any;
  zoom: number;
  artboards: any[];
}

export const DebugPanel = ({ canvasState, zoom, artboards }: DebugPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { projectState, createNewVersion, rollbackToVersion, exportProject, importProject, saveProject } = useVersionControl();

  const handleCreateVersion = () => {
    const description = `Manual save - ${new Date().toLocaleTimeString()}`;
    createNewVersion(description, canvasState, zoom, artboards);
    toast('Version saved successfully!');
  };

  const handleExport = () => {
    const jsonData = exportProject();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canvas-project-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('Project exported successfully!');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (importProject(content)) {
          toast('Project imported successfully!');
          setIsOpen(false);
        } else {
          toast('Failed to import project');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRollback = (versionId: string) => {
    const version = rollbackToVersion(versionId);
    if (version) {
      toast(`Rolled back to version from ${version.timestamp.toLocaleString()}`);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="fixed top-4 right-4 z-50 bg-black/10 backdrop-blur-sm hover:bg-black/20 text-foreground"
          title="Debug Panel"
        >
          <Bug className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            Debug & Version Control
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleCreateVersion} size="sm">
              <Save className="w-4 h-4 mr-2" />
              Save Version
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Project
            </Button>
            <Button asChild variant="outline" size="sm">
              <label htmlFor="import-file" className="cursor-pointer flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                Import Project
                <input
                  id="import-file"
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </Button>
            <Button onClick={saveProject} variant="outline" size="sm">
              Manual Save
            </Button>
          </div>

          {/* Project Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Project Status</h3>
            <div className="space-y-1 text-sm">
              <div>Versions: {projectState.versions.length}</div>
              <div>Current Zoom: {zoom}%</div>
              <div>Artboards: {artboards.length}</div>
              <div>Canvas Objects: {canvasState?.getObjects?.()?.length || 0}</div>
            </div>
          </div>

          {/* Version History */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <History className="w-4 h-4" />
              Version History
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {projectState.versions.length === 0 ? (
                <p className="text-muted-foreground text-sm">No versions saved yet</p>
              ) : (
                projectState.versions.reverse().map((version) => (
                  <div key={version.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{version.description}</span>
                        {version.id === projectState.currentVersion && (
                          <Badge variant="default" className="text-xs">Current</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(version.timestamp).toLocaleString()}
                      </div>
                    </div>
                    {version.id !== projectState.currentVersion && (
                      <Button
                        onClick={() => handleRollback(version.id)}
                        variant="outline"
                        size="sm"
                      >
                        Restore
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
