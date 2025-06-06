
import { FabricObject } from "fabric";
import { Artboard } from "./projectState";
import { SpatialGrid, Bounds, SpatialItem } from "./spatialIndex";

export interface ArtboardElement {
  id: string;
  artboardId: string;
  fabricObject: FabricObject;
}

// Cache for distance calculations
const distanceCache = new Map<string, number>();
const CACHE_EXPIRY = 5000; // 5 seconds
const cacheTimestamps = new Map<string, number>();

// Spatial grid for artboard optimization
let spatialGrid = new SpatialGrid(300);

export const clearCaches = () => {
  distanceCache.clear();
  cacheTimestamps.clear();
  spatialGrid.clear();
};

export const updateArtboardInSpatialGrid = (artboard: Artboard) => {
  const bounds: Bounds = {
    x: artboard.x,
    y: artboard.y,
    width: artboard.width,
    height: artboard.height
  };
  
  const item: SpatialItem = {
    id: artboard.id,
    bounds,
    data: artboard
  };
  
  spatialGrid.update(item);
};

export const addArtboardToSpatialGrid = (artboard: Artboard) => {
  const bounds: Bounds = {
    x: artboard.x,
    y: artboard.y,
    width: artboard.width,
    height: artboard.height
  };
  
  const item: SpatialItem = {
    id: artboard.id,
    bounds,
    data: artboard
  };
  
  spatialGrid.insert(item);
};

export const removeArtboardFromSpatialGrid = (artboardId: string) => {
  spatialGrid.remove(artboardId);
};

const getCachedDistance = (id1: string, id2: string, x1: number, y1: number, x2: number, y2: number): number | null => {
  const key = `${id1}-${id2}`;
  const now = Date.now();
  
  if (distanceCache.has(key)) {
    const timestamp = cacheTimestamps.get(key);
    if (timestamp && now - timestamp < CACHE_EXPIRY) {
      return distanceCache.get(key)!;
    }
  }
  
  const distance = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  distanceCache.set(key, distance);
  cacheTimestamps.set(key, now);
  
  return distance;
};

export const checkElementInArtboard = (element: FabricObject, artboard: Artboard): boolean => {
  const elementBounds = element.getBoundingRect();
  
  return (
    elementBounds.left >= artboard.x &&
    elementBounds.top >= artboard.y &&
    elementBounds.left + elementBounds.width <= artboard.x + artboard.width &&
    elementBounds.top + elementBounds.height <= artboard.y + artboard.height
  );
};

export const findElementsInArtboard = (elements: FabricObject[], artboard: Artboard): FabricObject[] => {
  return elements.filter(element => {
    if ((element as any).isArtboard || (element as any).isGridLine) return false;
    return checkElementInArtboard(element, artboard);
  });
};

export const constrainElementToArtboard = (element: FabricObject, artboard: Artboard): void => {
  const elementBounds = element.getBoundingRect();
  
  let newLeft = element.left || 0;
  let newTop = element.top || 0;
  
  if (elementBounds.left < artboard.x) {
    newLeft = artboard.x;
  } else if (elementBounds.left + elementBounds.width > artboard.x + artboard.width) {
    newLeft = artboard.x + artboard.width - elementBounds.width;
  }
  
  if (elementBounds.top < artboard.y) {
    newTop = artboard.y;
  } else if (elementBounds.top + elementBounds.height > artboard.y + artboard.height) {
    newTop = artboard.y + artboard.height - elementBounds.height;
  }
  
  if (newLeft !== element.left || newTop !== element.top) {
    element.set({ left: newLeft, top: newTop });
    element.setCoords();
  }
};

// Optimized repulsion system using spatial grid
export const calculateRepulsionForce = (
  movingArtboard: Artboard, 
  staticArtboard: Artboard, 
  repulsionDistance: number = 100
): { x: number; y: number } => {
  const centerX1 = movingArtboard.x + movingArtboard.width / 2;
  const centerY1 = movingArtboard.y + movingArtboard.height / 2;
  const centerX2 = staticArtboard.x + staticArtboard.width / 2;
  const centerY2 = staticArtboard.y + staticArtboard.height / 2;
  
  const distance = getCachedDistance(
    movingArtboard.id, 
    staticArtboard.id,
    centerX1, centerY1, centerX2, centerY2
  );
  
  if (distance < repulsionDistance && distance > 0) {
    const force = Math.min((repulsionDistance - distance) / repulsionDistance * 0.4, 1);
    const dx = centerX1 - centerX2;
    const dy = centerY1 - centerY2;
    const normalizedX = dx / distance;
    const normalizedY = dy / distance;
    
    return {
      x: normalizedX * force * 60,
      y: normalizedY * force * 60
    };
  }
  
  return { x: 0, y: 0 };
};

export const getArtboardById = (artboards: Artboard[], id: string): Artboard | null => {
  return artboards.find(ab => ab.id === id) || null;
};

// Optimized using spatial grid
export const getArtboardsOverlapping = (artboard: Artboard, allArtboards: Artboard[]): Artboard[] => {
  const bounds: Bounds = {
    x: artboard.x - 100, // Add buffer for repulsion detection
    y: artboard.y - 100,
    width: artboard.width + 200,
    height: artboard.height + 200
  };
  
  const nearbyItems = spatialGrid.query(bounds, artboard.id);
  
  return nearbyItems
    .map(item => item.data)
    .filter(other => {
      return !(
        artboard.x + artboard.width < other.x ||
        other.x + other.width < artboard.x ||
        artboard.y + artboard.height < other.y ||
        other.y + other.height < artboard.y
      );
    });
};

// Optimized position finding with reduced iterations
export const findOptimalPosition = (
  artboard: Artboard,
  allArtboards: Artboard[],
  minDistance: number = 50
): { x: number; y: number } => {
  let bestPosition = { x: artboard.x, y: artboard.y };
  let iterations = 0;
  const maxIterations = 8; // Reduced for better performance
  
  while (iterations < maxIterations) {
    const overlapping = getArtboardsOverlapping(
      { ...artboard, x: bestPosition.x, y: bestPosition.y },
      allArtboards
    );
    
    if (overlapping.length === 0) break;
    
    let totalForceX = 0;
    let totalForceY = 0;
    
    overlapping.forEach(other => {
      const repulsion = calculateRepulsionForce(
        { ...artboard, x: bestPosition.x, y: bestPosition.y },
        other,
        minDistance + Math.max(artboard.width, artboard.height) / 4
      );
      totalForceX += repulsion.x;
      totalForceY += repulsion.y;
    });
    
    bestPosition.x += totalForceX * 0.7; // Damping factor
    bestPosition.y += totalForceY * 0.7;
    
    bestPosition.x = Math.max(20, bestPosition.x);
    bestPosition.y = Math.max(20, bestPosition.y);
    
    iterations++;
  }
  
  return bestPosition;
};
