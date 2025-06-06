
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
import { SelectionProvider, useSelection } from "@/contexts/SelectionContext";
import { ViewportProvider, useViewport } from "@/contexts/ViewportContext";
import { ArtboardProvider, useArtboards } from "@/contexts/ArtboardContext";
import { EditorProvider, useEditor } from "@/contexts/EditorContext";

import { useEditorTools } from "@/hooks/editor/useEditorTools";
import { useCommandSystem } from "@/hooks/useCommandSystem";
import { useLayerSystem } from "@/hooks/useLayerSystem";
import { useArtboardCreator } from "@/hooks/editor/useArtboardCreator";
import { useKeyboardShortcuts } from "@/hooks/editor/useKeyboardShortcuts";

const CanvasEditorContent = () => {
  const { 
    fabricCanvas, 
    canvasObjects 
  } = useCanvas();
  
  const { selectedObject } = useSelection();
  const { zoom, handleZoomChange, fitToScreen } = useViewport();
  
  const { 
    artboards, 
    selectedArtboard 
  } = useArtboards();
  
  const { isCreatingElement } = useEditor();
  const { handleToolClick, activeTool } = useEditorTools();
  const { createArtboard } = useArtboardCreator();
  
  const {
    undo,
    redo,
    canUndo,
    canRedo,
  } = useCommandSystem(fabricCanvas);

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

  // Setup keyboard shortcuts
  useKeyboardShortcuts();

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
          onZoomChange={(newZoom) => handleZoomChange(newZoom, fabricCanvas)}
          onFitToScreen={() => fitToScreen(fabricCanvas)}
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
        <SelectionProvider>
          <ViewportProvider>
            <ArtboardProvider>
              <CanvasEditorContent />
            </ArtboardProvider>
          </ViewportProvider>
        </SelectionProvider>
      </CanvasProvider>
    </EditorProvider>
  );
};
