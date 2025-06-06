
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
  repulsionDistance: number = 100
): { x: number; y: number } => {
  const centerX1 = movingArtboard.x + movingArtboard.width / 2;
  const centerY1 = movingArtboard.y + movingArtboard.height / 2;
  const centerX2 = staticArtboard.x + staticArtboard.width / 2;
  const centerY2 = staticArtboard.y + staticArtboard.height / 2;
  
  const distance = Math.sqrt(Math.pow(centerX1 - centerX2, 2) + Math.pow(centerY1 - centerY2, 2));
  
  if (distance < repulsionDistance && distance > 0) {
    const force = (repulsionDistance - distance) / repulsionDistance;
    const angle = Math.atan2(centerY1 - centerY2, centerX1 - centerX2);
    
    return {
      x: Math.cos(angle) * force * 20,
      y: Math.sin(angle) * force * 20
    };
  }
  
  return { x: 0, y: 0 };
};

export const getArtboardById = (artboards: Artboard[], id: string): Artboard | null => {
  return artboards.find(ab => ab.id === id) || null;
};
