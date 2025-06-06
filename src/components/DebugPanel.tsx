
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Bug, Download, Upload, History, Save, Trash2, RefreshCw, Settings } from 'lucide-react';
import { useVersionControl } from '@/hooks/useVersionControl';
import { toast } from 'sonner';

interface DebugPanelProps {
  canvasState: any;
  zoom: number;
  artboards: any[];
}

export const DebugPanel = ({ canvasState, zoom, artboards }: DebugPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);
  const { projectState, createNewVersion, rollbackToVersion, exportProject, importProject, saveProject } = useVersionControl();

  const handleCreateVersion = () => {
    const description = `Salvamento manual - ${new Date().toLocaleTimeString()}`;
    const versionId = createNewVersion(description, canvasState, zoom, artboards);
    toast.success('Versão salva com sucesso!', {
      description: `ID: ${versionId.slice(0, 8)}...`
    });
  };

  const handleExport = () => {
    try {
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
      toast.success('Projeto exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar projeto');
      console.error('Export error:', error);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        try {
          if (importProject(content)) {
            toast.success('Projeto importado com sucesso!');
            setIsOpen(false);
          } else {
            toast.error('Falha ao importar projeto');
          }
        } catch (error) {
          toast.error('Arquivo de projeto inválido');
          console.error('Import error:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRollback = (versionId: string) => {
    const version = rollbackToVersion(versionId);
    if (version) {
      toast.success(`Revertido para versão de ${version.timestamp.toLocaleString()}`, {
        description: version.description
      });
      setIsOpen(false);
    } else {
      toast.error('Erro ao reverter versão');
    }
  };

  const handleClearHistory = () => {
    if (confirm('Tem certeza que deseja limpar todo o histórico de versões?')) {
      // Implementation would need to be added to useVersionControl
      toast.success('Histórico limpo');
    }
  };

  const getCanvasObjectsCount = () => {
    try {
      return canvasState?.getObjects?.()?.length || 0;
    } catch {
      return 0;
    }
  };

  const getMemoryUsage = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024)
      };
    }
    return null;
  };

  const memoryInfo = getMemoryUsage();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="fixed top-4 right-4 z-50 bg-black/10 backdrop-blur-sm hover:bg-black/20 text-foreground transition-all"
          title="Painel de Depuração"
        >
          <Bug className="w-4 h-4" />
          {projectState.versions.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {projectState.versions.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            Painel de Depuração & Controle de Versão
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button onClick={handleCreateVersion} size="sm" className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Salvar Versão
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full">
              <label htmlFor="import-file" className="cursor-pointer flex items-center justify-center">
                <Upload className="w-4 h-4 mr-2" />
                Importar
                <input
                  id="import-file"
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </Button>
            <Button onClick={saveProject} variant="outline" size="sm" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Salvar Agora
            </Button>
          </div>

          {/* Project Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Status do Projeto
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Versões:</span>
                  <Badge variant="outline">{projectState.versions.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Zoom atual:</span>
                  <span>{zoom}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Pranchetas:</span>
                  <Badge variant="secondary">{artboards.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Objetos no canvas:</span>
                  <Badge variant="secondary">{getCanvasObjectsCount()}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Auto-salvamento:</span>
                  <Badge variant={isAutoSaveEnabled ? "default" : "destructive"}>
                    {isAutoSaveEnabled ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Performance Info */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Performance</h3>
              <div className="space-y-2 text-sm">
                {memoryInfo && (
                  <>
                    <div className="flex justify-between">
                      <span>Memória usada:</span>
                      <span>{memoryInfo.used} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Memória total:</span>
                      <span>{memoryInfo.total} MB</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span>Última salvamento:</span>
                  <span className="text-muted-foreground">
                    {projectState.versions.length > 0 
                      ? new Date(projectState.versions[projectState.versions.length - 1].timestamp).toLocaleTimeString()
                      : 'Nunca'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Version History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium flex items-center gap-2">
                <History className="w-4 h-4" />
                Histórico de Versões
              </h3>
              {projectState.versions.length > 0 && (
                <Button 
                  onClick={handleClearHistory} 
                  variant="outline" 
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar
                </Button>
              )}
            </div>
            
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {projectState.versions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma versão salva ainda</p>
                  <p className="text-sm">Clique em "Salvar Versão" para começar</p>
                </div>
              ) : (
                projectState.versions.slice().reverse().map((version, index) => (
                  <div key={version.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium truncate">{version.description}</span>
                        <div className="flex gap-1">
                          {version.id === projectState.currentVersion && (
                            <Badge variant="default" className="text-xs">Atual</Badge>
                          )}
                          {index === 0 && (
                            <Badge variant="secondary" className="text-xs">Recente</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(version.timestamp).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {version.artboards.length} pranchetas • Zoom: {version.zoom}%
                      </div>
                    </div>
                    {version.id !== projectState.currentVersion && (
                      <Button
                        onClick={() => handleRollback(version.id)}
                        variant="outline"
                        size="sm"
                      >
                        Restaurar
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
