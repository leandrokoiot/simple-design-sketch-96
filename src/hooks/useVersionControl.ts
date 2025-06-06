
import { useState, useCallback, useEffect } from 'react';
import { 
  ProjectState, 
  ProjectVersion, 
  Artboard,
  saveProjectState, 
  loadProjectState, 
  createVersion,
  exportProjectJSON 
} from '@/utils/projectState';

export const useVersionControl = () => {
  const [projectState, setProjectState] = useState<ProjectState>({
    versions: [],
    currentVersion: '',
    artboards: [],
    zoom: 100,
    canvasState: null
  });

  // Load state on mount
  useEffect(() => {
    const savedState = loadProjectState();
    if (savedState) {
      setProjectState(savedState);
    }
  }, []);

  // Auto-save every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (projectState.versions.length > 0) {
        saveProjectState(projectState);
        console.log('Auto-saved project state');
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [projectState]);

  const createNewVersion = useCallback((description: string, canvasState: any, zoom: number, artboards: Artboard[]) => {
    const newVersion = createVersion(description, canvasState, zoom, artboards);
    
    setProjectState(prev => {
      const newState = {
        ...prev,
        versions: [...prev.versions, newVersion],
        currentVersion: newVersion.id,
        canvasState,
        zoom,
        artboards
      };
      
      // Save immediately when creating a version
      saveProjectState(newState);
      return newState;
    });

    return newVersion.id;
  }, []);

  const rollbackToVersion = useCallback((versionId: string) => {
    const version = projectState.versions.find(v => v.id === versionId);
    if (version) {
      setProjectState(prev => ({
        ...prev,
        currentVersion: versionId,
        canvasState: version.canvasState,
        zoom: version.zoom,
        artboards: version.artboards
      }));
      return version;
    }
    return null;
  }, [projectState.versions]);

  const exportProject = useCallback(() => {
    return exportProjectJSON(projectState);
  }, [projectState]);

  const importProject = useCallback((jsonData: string) => {
    try {
      const importedState: ProjectState = JSON.parse(jsonData);
      setProjectState(importedState);
      saveProjectState(importedState);
      return true;
    } catch (error) {
      console.error('Failed to import project:', error);
      return false;
    }
  }, []);

  return {
    projectState,
    createNewVersion,
    rollbackToVersion,
    exportProject,
    importProject,
    saveProject: () => saveProjectState(projectState)
  };
};
