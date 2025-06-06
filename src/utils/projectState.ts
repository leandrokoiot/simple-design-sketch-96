
export interface ProjectVersion {
  id: string;
  timestamp: Date;
  description: string;
  canvasState: any;
  zoom: number;
  artboards: Artboard[];
}

export interface Artboard {
  id: string;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  isActive: boolean;
}

export interface ProjectState {
  versions: ProjectVersion[];
  currentVersion: string;
  artboards: Artboard[];
  zoom: number;
  canvasState: any;
}

const STORAGE_KEY = 'lovable-canvas-project-state';

export const saveProjectState = (state: ProjectState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    console.log('Project state saved successfully');
  } catch (error) {
    console.error('Failed to save project state:', error);
  }
};

export const loadProjectState = (): ProjectState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load project state:', error);
  }
  return null;
};

export const exportProjectJSON = (state: ProjectState): string => {
  return JSON.stringify(state, null, 2);
};

export const createVersion = (
  description: string,
  canvasState: any,
  zoom: number,
  artboards: Artboard[]
): ProjectVersion => {
  return {
    id: `v${Date.now()}`,
    timestamp: new Date(),
    description,
    canvasState,
    zoom,
    artboards
  };
};

export const artboardPresets = [
  { name: 'A4 Portrait', width: 595, height: 842 },
  { name: 'A4 Landscape', width: 842, height: 595 },
  { name: 'A3 Portrait', width: 842, height: 1191 },
  { name: 'HD Video', width: 1920, height: 1080 },
  { name: '4K Video', width: 3840, height: 2160 },
  { name: 'Instagram Post', width: 1080, height: 1080 },
  { name: 'Instagram Story', width: 1080, height: 1920 },
  { name: 'Facebook Cover', width: 1200, height: 630 },
  { name: 'Custom', width: 800, height: 600 }
];
