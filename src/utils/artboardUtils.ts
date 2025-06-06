
import { FabricObject } from "fabric";
import { Artboard } from "./projectState";

export interface ArtboardElement {
  id: string;
  artboardId: string;
  fabricObject: FabricObject;
}

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
  
  // Constrain to artboard boundaries
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

// Simplified and optimized repulsion system
export const calculateRepulsionForce = (
  movingArtboard: Artboard, 
  staticArtboard: Artboard, 
  repulsionDistance: number = 120
): { x: number; y: number } => {
  const centerX1 = movingArtboard.x + movingArtboard.width / 2;
  const centerY1 = movingArtboard.y + movingArtboard.height / 2;
  const centerX2 = staticArtboard.x + staticArtboard.width / 2;
  const centerY2 = staticArtboard.y + staticArtboard.height / 2;
  
  const dx = centerX1 - centerX2;
  const dy = centerY1 - centerY2;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance < repulsionDistance && distance > 0) {
    const force = Math.min((repulsionDistance - distance) / repulsionDistance * 0.5, 1);
    const normalizedX = dx / distance;
    const normalizedY = dy / distance;
    
    return {
      x: normalizedX * force * 80,
      y: normalizedY * force * 80
    };
  }
  
  return { x: 0, y: 0 };
};

export const getArtboardById = (artboards: Artboard[], id: string): Artboard | null => {
  return artboards.find(ab => ab.id === id) || null;
};

export const getArtboardsOverlapping = (artboard: Artboard, allArtboards: Artboard[]): Artboard[] => {
  return allArtboards.filter(other => {
    if (other.id === artboard.id) return false;
    
    return !(
      artboard.x + artboard.width < other.x ||
      other.x + other.width < artboard.x ||
      artboard.y + artboard.height < other.y ||
      other.y + other.height < artboard.y
    );
  });
};

// Simplified position finding algorithm
export const findOptimalPosition = (
  artboard: Artboard,
  allArtboards: Artboard[],
  minDistance: number = 60
): { x: number; y: number } => {
  let bestPosition = { x: artboard.x, y: artboard.y };
  let iterations = 0;
  const maxIterations = 10; // Reduced from 20
  
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
        minDistance + Math.max(artboard.width, artboard.height) / 3
      );
      totalForceX += repulsion.x;
      totalForceY += repulsion.y;
    });
    
    bestPosition.x += totalForceX;
    bestPosition.y += totalForceY;
    
    // Ensure positive positions with minimum padding
    bestPosition.x = Math.max(30, bestPosition.x);
    bestPosition.y = Math.max(30, bestPosition.y);
    
    iterations++;
  }
  
  return bestPosition;
};
