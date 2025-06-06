
import React, { createContext, useContext, useState, useCallback } from 'react';
import { FabricObject } from 'fabric';

interface SelectionContextType {
  selectedObject: FabricObject | null;
  setSelectedObject: (obj: FabricObject | null) => void;
  selectedObjects: FabricObject[];
  setSelectedObjects: (objects: FabricObject[]) => void;
  clearSelection: () => void;
  selectMultiple: (objects: FabricObject[]) => void;
}

const SelectionContext = createContext<SelectionContextType | null>(null);

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
};

interface SelectionProviderProps {
  children: React.ReactNode;
}

export const SelectionProvider = ({ children }: SelectionProviderProps) => {
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<FabricObject[]>([]);

  const clearSelection = useCallback(() => {
    setSelectedObject(null);
    setSelectedObjects([]);
  }, []);

  const selectMultiple = useCallback((objects: FabricObject[]) => {
    setSelectedObjects(objects);
    setSelectedObject(objects[0] || null);
  }, []);

  const value: SelectionContextType = {
    selectedObject,
    setSelectedObject,
    selectedObjects,
    setSelectedObjects,
    clearSelection,
    selectMultiple,
  };

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
};
