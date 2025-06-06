import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Copy, 
  Trash2, 
  ZoomIn,
  Lock,
  Unlock,
  FileImage,
  Code,
  Plus,
  Save,
  Clipboard,
  ClipboardPaste,
  Search,
  Star,
  Clock
} from "lucide-react";
import { Artboard } from "@/utils/projectState";
import { FabricObject } from "fabric";
import { useArtboardExport } from "@/hooks/useArtboardExport";
import { useArtboardClipboard } from "@/hooks/useArtboardClipboard";
import { useArtboards } from "@/contexts/ArtboardContext";
import { 
  defaultArtboardTemplates, 
  getTemplatesByCategory, 
  createArtboardFromTemplate,
  ArtboardTemplate,
  searchTemplates,
  getPopularTemplates,
  getRecentTemplates
} from "@/utils/artboardTemplates";

interface ArtboardManagerProps {
  artboards: Artboard[];
  selectedArtboard: Artboard | null;
  onUpdateArtboard: (id: string, updates: Partial<Artboard>) => void;
  onDeleteArtboard: (id: string) => void;
  onDuplicateArtboard: (id: string) => void;
  onZoomToArtboard: (id: string) => void;
  onExportArtboard: (id: string) => void;
  onCreateArtboard?: (artboardData: Omit<Artboard, 'id'>) => void;
  canvasObjects?: FabricObject[];
  fabricCanvas?: any;
}

export const ArtboardManager = ({
  artboards,
  selectedArtboard,
  onUpdateArtboard,
  onDeleteArtboard,
  onDuplicateArtboard,
  onZoomToArtboard,
  onExportArtboard,
  onCreateArtboard,
  canvasObjects = [],
  fabricCanvas
}: ArtboardManagerProps) => {
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ArtboardTemplate | null>(null);
  const [customName, setCustomName] = useState("");
  const [exportFormat, setExportFormat] = useState<'png' | 'svg'>('png');
  const [exportScale, setExportScale] = useState(2);
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Popular");
  
  const { exportArtboard } = useArtboardExport();
  const { findOptimalPosition } = useArtboards();
  const { 
    copyArtboard, 
    pasteArtboard, 
    duplicateArtboard,
    hasClipboard
  } = useArtboardClipboard();

  // Calculate elements in selected artboard
  const elementsInArtboard = useMemo(() => {
    if (!selectedArtboard) return 0;
    return canvasObjects.filter(obj => 
      (obj as any).artboardId === selectedArtboard.id && 
      !(obj as any).isArtboard &&
      !(obj as any).isGridLine
    ).length;
  }, [selectedArtboard, canvasObjects]);

  // Get templates based on category and search
  const filteredTemplates = useMemo(() => {
    let templates: ArtboardTemplate[] = [];
    
    if (selectedCategory === "Popular") {
      templates = getPopularTemplates();
    } else if (selectedCategory === "Recent") {
      templates = getRecentTemplates();
    } else {
      templates = getTemplatesByCategory(selectedCategory);
    }

    if (templateSearch) {
      templates = searchTemplates(templateSearch).filter(t => 
        selectedCategory === "Popular" || 
        selectedCategory === "Recent" || 
        t.category === selectedCategory
      );
    }

    return templates;
  }, [selectedCategory, templateSearch]);

  const categories = ['Popular', 'Recent', 'Print', 'Digital', 'Social Media', 'Web', 'Custom'];

  const handleColorChange = (color: string) => {
    setBackgroundColor(color);
    if (selectedArtboard) {
      onUpdateArtboard(selectedArtboard.id, { backgroundColor: color });
    }
  };

  const handleToggleLock = () => {
    if (!selectedArtboard) return;
    const isLocked = (selectedArtboard as any).isLocked || false;
    onUpdateArtboard(selectedArtboard.id, { isLocked: !isLocked } as any);
  };

  const handleExportWithFormat = async () => {
    if (!selectedArtboard || !fabricCanvas) return;
    
    try {
      await exportArtboard(fabricCanvas, selectedArtboard, exportFormat, exportScale);
    } catch (error) {
      console.error('Erro na exportação:', error);
    }
  };

  const handleCreateFromTemplate = () => {
    if (!selectedTemplate || !onCreateArtboard) return;
    
    const artboardData = createArtboardFromTemplate(
      selectedTemplate,
      customName || selectedTemplate.name
    );
    
    onCreateArtboard(artboardData);
    setShowTemplateDialog(false);
    setCustomName("");
    setSelectedTemplate(null);
    setTemplateSearch("");
  };

  const handleCopyArtboard = async () => {
    if (!selectedArtboard) return;
    await copyArtboard(selectedArtboard, fabricCanvas);
  };

  const handlePasteArtboard = async () => {
    if (!onCreateArtboard) return;
    await pasteArtboard(onCreateArtboard, fabricCanvas, findOptimalPosition);
  };

  const handleDuplicateArtboard = async () => {
    if (!selectedArtboard || !onCreateArtboard) return;
    await duplicateArtboard(selectedArtboard, onCreateArtboard, fabricCanvas, findOptimalPosition);
  };

  if (!selectedArtboard) {
    return (
      <div className="w-80 bg-[hsl(var(--editor-panel))] border-l border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Artboard Manager</h3>
          <div className="flex gap-1">
            {onCreateArtboard && (
              <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-7 px-2">
                    <Plus className="w-3 h-3 mr-1" />
                    Novo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>Criar Nova Prancheta</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs">Nome (opcional)</Label>
                      <Input
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Nome da prancheta"
                        className="text-xs h-8 mt-1"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Pesquisar</Label>
                          <div className="relative">
                            <Search className="absolute left-2 top-2 w-3 h-3 text-muted-foreground" />
                            <Input
                              value={templateSearch}
                              onChange={(e) => setTemplateSearch(e.target.value)}
                              placeholder="Buscar templates..."
                              className="text-xs h-8 pl-7 mt-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Categoria</Label>
                          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-32 h-8 text-xs mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(category => (
                                <SelectItem key={category} value={category}>
                                  <div className="flex items-center gap-1">
                                    {category === 'Popular' && <Star className="w-3 h-3" />}
                                    {category === 'Recent' && <Clock className="w-3 h-3" />}
                                    {category}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="max-h-80 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-2">
                          {filteredTemplates.map(template => (
                            <button
                              key={template.id}
                              onClick={() => setSelectedTemplate(template)}
                              className={`text-left p-3 rounded border text-xs hover:bg-muted transition-colors ${
                                selectedTemplate?.id === template.id 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-border'
                              }`}
                            >
                              <div className="font-medium">{template.name}</div>
                              <div className="text-muted-foreground text-xs">
                                {template.description}
                              </div>
                              {template.tags && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {template.tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="bg-muted px-1 rounded text-xs">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setShowTemplateDialog(false)}
                        variant="outline" 
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleCreateFromTemplate}
                        disabled={!selectedTemplate}
                        className="flex-1"
                      >
                        Criar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePasteArtboard}
              disabled={!hasClipboard}
              className="h-7 px-2"
              title="Colar prancheta"
            >
              <ClipboardPaste className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">Selecione uma prancheta para editar suas propriedades</p>
        
        {artboards.length > 0 && (
          <div className="mt-4 space-y-2">
            <Label className="text-xs">Todas as Pranchetas ({artboards.length})</Label>
            {artboards.map((artboard) => {
              const elementsCount = canvasObjects.filter(obj => 
                (obj as any).artboardId === artboard.id && 
                !(obj as any).isArtboard &&
                !(obj as any).isGridLine
              ).length;
              
              return (
                <div key={artboard.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="text-xs font-medium truncate">{artboard.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {artboard.width} × {artboard.height} • {elementsCount} elementos
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {(artboard as any).isLocked && (
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onZoomToArtboard(artboard.id)}
                      className="h-6 w-6 p-0"
                      title="Zoom para prancheta"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const isLocked = (selectedArtboard as any).isLocked || false;

  return (
    <div className="w-80 bg-[hsl(var(--editor-panel))] border-l border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Propriedades da Prancheta</h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleToggleLock}
            className="h-6 w-6 p-0"
            title={isLocked ? "Desbloquear prancheta" : "Bloquear prancheta"}
          >
            {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </Button>
          <div className="text-xs bg-muted px-2 py-1 rounded">
            {selectedArtboard.width} × {selectedArtboard.height}
          </div>
        </div>
      </div>

      <Separator />

      {/* Artboard Name */}
      <div>
        <Label className="text-xs text-muted-foreground">Nome</Label>
        <Input
          value={selectedArtboard.name}
          onChange={(e) => onUpdateArtboard(selectedArtboard.id, { name: e.target.value })}
          className="text-xs h-8 mt-1"
          placeholder="Nome da prancheta"
          disabled={isLocked}
        />
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">Largura</Label>
          <Input
            type="number"
            value={selectedArtboard.width}
            onChange={(e) => onUpdateArtboard(selectedArtboard.id, { width: Number(e.target.value) })}
            className="text-xs h-8 mt-1"
            min="50"
            max="5000"
            disabled={isLocked}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Altura</Label>
          <Input
            type="number"
            value={selectedArtboard.height}
            onChange={(e) => onUpdateArtboard(selectedArtboard.id, { height: Number(e.target.value) })}
            className="text-xs h-8 mt-1"
            min="50"
            max="5000"
            disabled={isLocked}
          />
        </div>
      </div>

      {/* Background Color */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Cor de Fundo</Label>
        <div className="flex gap-2">
          <input
            type="color"
            value={selectedArtboard.backgroundColor || backgroundColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-10 h-8 border border-border rounded cursor-pointer"
            disabled={isLocked}
          />
          <Input
            type="text"
            value={selectedArtboard.backgroundColor || backgroundColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="text-xs h-8 flex-1"
            placeholder="#ffffff"
            disabled={isLocked}
          />
        </div>
      </div>

      <Separator />

      {/* Export Settings */}
      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground">Exportação</Label>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Formato</Label>
            <Select value={exportFormat} onValueChange={(value: 'png' | 'svg') => setExportFormat(value)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="svg">SVG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {exportFormat === 'png' && (
            <div>
              <Label className="text-xs">Escala</Label>
              <Select value={exportScale.toString()} onValueChange={(value) => setExportScale(Number(value))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1x</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                  <SelectItem value="3">3x</SelectItem>
                  <SelectItem value="4">4x</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <Button
          onClick={handleExportWithFormat}
          variant="outline"
          className="w-full text-xs h-8"
        >
          {exportFormat === 'png' ? <FileImage className="w-3 h-3 mr-1" /> : <Code className="w-3 h-3 mr-1" />}
          Exportar {exportFormat.toUpperCase()}
        </Button>
      </div>

      <Separator />

      {/* Clipboard Actions */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Área de Transferência</Label>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyArtboard}
            className="text-xs h-8"
            disabled={isLocked}
          >
            <Clipboard className="w-3 h-3 mr-1" />
            Copiar
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handlePasteArtboard}
            disabled={!hasClipboard}
            className="text-xs h-8"
          >
            <ClipboardPaste className="w-3 h-3 mr-1" />
            Colar
          </Button>
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Ações</Label>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDuplicateArtboard}
            className="text-xs h-8"
            disabled={isLocked}
          >
            <Copy className="w-3 h-3 mr-1" />
            Duplicar
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onZoomToArtboard(selectedArtboard.id)}
            className="text-xs h-8"
          >
            <ZoomIn className="w-3 h-3 mr-1" />
            Focar
          </Button>
          
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDeleteArtboard(selectedArtboard.id)}
            className="text-xs h-8 col-span-2"
            disabled={isLocked}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Excluir Prancheta
          </Button>
        </div>
      </div>

      {/* Element Count & Info */}
      <div className="pt-2 border-t space-y-2">
        <div className="text-xs text-muted-foreground">
          Elementos nesta prancheta: <span className="font-medium text-foreground">{elementsInArtboard}</span>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Posição: <span className="font-medium">{Math.round(selectedArtboard.x)}, {Math.round(selectedArtboard.y)}</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          {selectedArtboard.isActive && (
            <div className="text-blue-600 font-medium">● Ativa</div>
          )}
          {isLocked && (
            <div className="text-orange-600 font-medium">🔒 Bloqueada</div>
          )}
        </div>
      </div>
    </div>
  );
};
