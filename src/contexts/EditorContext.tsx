
import React, { createContext, useContext, useState } from 'react';

interface EditorContextType {
  activeTool: "select" | "rectangle" | "circle" | "text" | "line" | "hand" | "draw" | "image";
  setActiveTool: (tool: "select" | "rectangle" | "circle" | "text" | "line" | "hand" | "draw" | "image") => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  isCreatingElement: boolean;
  setIsCreatingElement: (creating: boolean) => void;
  gridSize: number;
  setGridSize: (size: number) => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};

interface EditorProviderProps {
  children: React.ReactNode;
}

export const EditorProvider = ({ children }: EditorProviderProps) => {
  const [activeTool, setActiveTool] = useState<"select" | "rectangle" | "circle" | "text" | "line" | "hand" | "draw" | "image">("select");
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [isCreatingElement, setIsCreatingElement] = useState(false);
  const [gridSize, setGridSize] = useState(20);

  const value: EditorContextType = {
    activeTool,
    setActiveTool,
    showGrid,
    setShowGrid,
    snapToGrid,
    setSnapToGrid,
    isCreatingElement,
    setIsCreatingElement,
    gridSize,
    setGridSize,
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
};
