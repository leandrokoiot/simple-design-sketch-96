
import { FabricObject, Point } from "fabric";
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

export const calculateRepulsionForce = (
  movingArtboard: Artboard, 
  staticArtboard: Artboard, 
  repulsionDistance: number = 150
): { x: number; y: number } => {
  const centerX1 = movingArtboard.x + movingArtboard.width / 2;
  const centerY1 = movingArtboard.y + movingArtboard.height / 2;
  const centerX2 = staticArtboard.x + staticArtboard.width / 2;
  const centerY2 = staticArtboard.y + staticArtboard.height / 2;
  
  const distance = Math.sqrt(Math.pow(centerX1 - centerX2, 2) + Math.pow(centerY1 - centerY2, 2));
  
  if (distance < repulsionDistance && distance > 0) {
    // Força de repulsão mais suave
    const force = Math.pow((repulsionDistance - distance) / repulsionDistance, 2) * 0.3;
    const angle = Math.atan2(centerY1 - centerY2, centerX1 - centerX2);
    
    // Aplicar força mínima para evitar sobreposição
    const minForce = distance < 50 ? 50 : 0;
    const totalForce = Math.max(force * 100, minForce);
    
    return {
      x: Math.cos(angle) * totalForce,
      y: Math.sin(angle) * totalForce
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

export const findOptimalPosition = (
  artboard: Artboard,
  allArtboards: Artboard[],
  minDistance: number = 80
): { x: number; y: number } => {
  let bestPosition = { x: artboard.x, y: artboard.y };
  let iterations = 0;
  const maxIterations = 20;
  
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
        minDistance + Math.max(artboard.width, artboard.height) / 2
      );
      totalForceX += repulsion.x;
      totalForceY += repulsion.y;
    });
    
    bestPosition.x += totalForceX;
    bestPosition.y += totalForceY;
    
    // Evita posições negativas
    bestPosition.x = Math.max(50, bestPosition.x);
    bestPosition.y = Math.max(50, bestPosition.y);
    
    iterations++;
  }
  
  return bestPosition;
};
