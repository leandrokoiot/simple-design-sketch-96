
import { useEffect } from "react";
import { CanvasManager } from "./CanvasManager";
import { MinimalSidebar } from "../MinimalSidebar";
import { MinimalLayersPanel } from "../MinimalLayersPanel";
import { MinimalPropertiesPanel } from "../MinimalPropertiesPanel";
import { ArtboardManager } from "../ArtboardManager";
import { ZoomControls } from "../ZoomControls";
import { DebugPanel } from "../DebugPanel";
import { Button } from "@/components/ui/button";
import { Undo, Redo } from "lucide-react";

import { CanvasProvider, useCanvas } from "@/contexts/CanvasContext";
import { ArtboardProvider, useArtboards } from "@/contexts/ArtboardContext";
import { EditorProvider, useEditor } from "@/contexts/EditorContext";

import { useEditorTools } from "@/hooks/editor/useEditorTools";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useLayerSystem } from "@/hooks/useLayerSystem";
import { useArtboardCreator } from "@/hooks/editor/useArtboardCreator";
import { useKeyboardShortcuts } from "@/hooks/editor/useKeyboardShortcuts";

const CanvasEditorContent = () => {
  const { 
    fabricCanvas, 
    selectedObject, 
    canvasObjects, 
    zoom, 
    handleZoomChange 
  } = useCanvas();
  
  const { 
    artboards, 
    selectedArtboard 
  } = useArtboards();
  
  const { isCreatingElement } = useEditor();
  const { handleToolClick, activeTool } = useEditorTools();
  const { createArtboard } = useArtboardCreator();
  
  const {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    initializeHistory
  } = useUndoRedo(fabricCanvas);

  const { 
    layers, 
    updateLayers, 
    toggleLayerVisibility, 
    toggleLayerLock, 
    moveLayerUp,
    moveLayerDown,
    duplicateLayer,
    deleteLayer
  } = useLayerSystem(fabricCanvas);

  // Initialize history when canvas is ready
  useEffect(() => {
    if (fabricCanvas) {
      initializeHistory();
    }
  }, [fabricCanvas, initializeHistory]);

  // Setup keyboard shortcuts
  useKeyboardShortcuts();

  const handleFitToScreen = () => {
    if (!fabricCanvas) return;
    
    const canvasWidth = fabricCanvas.width || 1200;
    const canvasHeight = fabricCanvas.height || 800;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    const scaleX = (windowWidth * 0.8) / canvasWidth;
    const scaleY = (windowHeight * 0.8) / canvasHeight;
    const optimalScale = Math.min(scaleX, scaleY);
    
    const newZoom = Math.round(optimalScale * 100);
    handleZoomChange(Math.max(10, Math.min(500, newZoom)));
  };

  const handleSelectObject = (obj: any) => {
    if (!fabricCanvas) return;
    fabricCanvas.setActiveObject(obj);
    fabricCanvas.renderAll();
  };

  const handleDeleteObject = (obj: any) => {
    if (!fabricCanvas) return;
    fabricCanvas.remove(obj);
    fabricCanvas.renderAll();
  };

  return (
    <div className="h-screen w-screen bg-gray-50 relative overflow-hidden">
      {/* Canvas */}
      <CanvasManager />

      {/* Debug Panel */}
      <DebugPanel canvasState={fabricCanvas} zoom={zoom} artboards={artboards} />

      {/* Zoom Controls */}
      <div className="fixed bottom-6 right-6 z-40">
        <ZoomControls
          zoom={zoom}
          onZoomChange={handleZoomChange}
          onFitToScreen={handleFitToScreen}
        />
      </div>

      {/* Minimal Sidebar */}
      <MinimalSidebar
        activeTool={activeTool}
        onToolClick={handleToolClick}
        onCreateArtboard={createArtboard}
      />

      {/* Properties Panel or Artboard Manager */}
      {selectedObject && !(selectedObject as any).isArtboard ? (
        <MinimalPropertiesPanel 
          selectedObject={selectedObject} 
          onUpdate={(props) => {
            if (selectedObject && fabricCanvas) {
              selectedObject.set(props);
              fabricCanvas.renderAll();
              saveState('Propriedades atualizadas');
            }
          }}
        />
      ) : (
        <ArtboardManager
          artboards={artboards}
          selectedArtboard={selectedArtboard}
          canvasObjects={canvasObjects}
          fabricCanvas={fabricCanvas}
          onUpdateArtboard={() => {}}
          onDeleteArtboard={() => {}}
          onDuplicateArtboard={() => {}}
          onZoomToArtboard={() => {}}
          onExportArtboard={() => {}}
          onCreateArtboard={createArtboard}
        />
      )}

      {/* Layers Panel */}
      <MinimalLayersPanel
        objects={canvasObjects}
        selectedObject={selectedObject}
        layers={layers}
        onSelectObject={handleSelectObject}
        onDeleteObject={handleDeleteObject}
        onToggleVisibility={toggleLayerVisibility}
        onToggleLock={toggleLayerLock}
        onDuplicate={duplicateLayer}
        onMoveUp={moveLayerUp}
        onMoveDown={moveLayerDown}
      />

      {/* Undo/Redo Controls */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={undo}
          disabled={!canUndo}
          className="h-8 px-3"
        >
          <Undo className="w-4 h-4 mr-1" />
          Desfazer
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={redo}
          disabled={!canRedo}
          className="h-8 px-3"
        >
          <Redo className="w-4 h-4 mr-1" />
          Refazer
        </Button>
      </div>

      {/* Instructions overlay for interactive creation */}
      {isCreatingElement && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 text-white px-4 py-2 rounded-lg">
          Clique e arraste para criar o elemento. Pressione ESC para cancelar.
        </div>
      )}
    </div>
  );
};

export const CanvasEditor = () => {
  return (
    <EditorProvider>
      <CanvasProvider>
        <ArtboardProvider>
          <CanvasEditorContent />
        </ArtboardProvider>
      </CanvasProvider>
    </EditorProvider>
  );
};
