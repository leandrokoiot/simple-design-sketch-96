
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Moon, 
  Sun, 
  Download, 
  Upload, 
  Share2,
  User,
  ChevronDown,
  Undo,
  Redo,
  Settings,
  Zap,
  Wifi,
  WifiOff
} from "lucide-react";
import { ZoomControls } from "./ZoomControls";
import { AlignmentTools } from "./AlignmentTools";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface HeaderProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFitToScreen: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onAlign: (alignment: string) => void;
  onDistribute: (direction: 'horizontal' | 'vertical') => void;
  hasSelection: boolean;
}

export const Header = ({ 
  zoom, 
  onZoomChange, 
  onFitToScreen,
  showGrid,
  onToggleGrid,
  snapToGrid,
  onToggleSnap,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onAlign,
  onDistribute,
  hasSelection
}: HeaderProps) => {
  const [isDark, setIsDark] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  useEffect(() => {
    const handleOnlineStatusChange = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        toast.success('Conexão restaurada');
      } else {
        toast.error('Sem conexão com a internet');
      }
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  // Simulate auto-save status
  useEffect(() => {
    const interval = setInterval(() => {
      setAutoSaveStatus('saving');
      setTimeout(() => {
        setAutoSaveStatus('saved');
        setLastSaved(new Date());
      }, 1000);
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
    toast(`Tema ${!isDark ? 'escuro' : 'claro'} ativado`);
  };

  const getAutoSaveText = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return 'Salvando...';
      case 'error':
        return 'Erro ao salvar';
      case 'saved':
      default:
        const now = new Date();
        const diffMs = now.getTime() - lastSaved.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins === 0) {
          return 'Salvo agora';
        } else if (diffMins === 1) {
          return 'Salvo há 1 minuto';
        } else {
          return `Salvo há ${diffMins} minutos`;
        }
    }
  };

  const getAutoSaveIcon = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return <Zap className="w-3 h-3 text-yellow-500 animate-pulse" />;
      case 'error':
        return <WifiOff className="w-3 h-3 text-red-500" />;
      case 'saved':
      default:
        return <Wifi className="w-3 h-3 text-green-500" />;
    }
  };

  return (
    <div className="h-16 bg-[hsl(var(--editor-toolbar))] border-b border-border flex items-center justify-between px-6 shadow-sm">
      {/* Left Section - Project Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Design Editor</h1>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          {getAutoSaveIcon()}
          <span className={`transition-colors ${
            autoSaveStatus === 'error' ? 'text-red-500' : 
            autoSaveStatus === 'saving' ? 'text-yellow-600' : 
            'text-muted-foreground'
          }`}>
            {getAutoSaveText()}
          </span>
          {!isOnline && (
            <Badge variant="destructive" className="text-xs">
              Offline
            </Badge>
          )}
        </div>
      </div>

      {/* Center Section - Controls */}
      <div className="flex items-center gap-4">
        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="w-8 h-8 p-0"
            title="Desfazer (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            className="w-8 h-8 p-0"
            title="Refazer (Ctrl+Shift+Z)"
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Alignment Tools */}
        <AlignmentTools 
          onAlign={onAlign}
          onDistribute={onDistribute}
          disabled={!hasSelection}
        />

        <div className="w-px h-6 bg-border" />

        {/* Canvas Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={showGrid ? "default" : "ghost"}
            size="sm"
            onClick={onToggleGrid}
            className="text-xs h-8"
            title="Alternar grade"
          >
            Grade
          </Button>
          <Button
            variant={snapToGrid ? "default" : "ghost"}
            size="sm"
            onClick={onToggleSnap}
            className="text-xs h-8"
            title="Alternar encaixe"
          >
            Encaixe
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
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => toast('Funcionalidade de importação em desenvolvimento')}
        >
          <Upload className="w-4 h-4 mr-2" />
          Importar
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => toast('Funcionalidade de exportação em desenvolvimento')}
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => toast('Funcionalidade de compartilhamento em desenvolvimento')}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Compartilhar
        </Button>
        
        <div className="w-px h-6 bg-border mx-2" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="w-10 h-10 p-0"
          title="Alternar tema"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-10 h-10 p-0"
          title="Configurações do usuário"
        >
          <User className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
