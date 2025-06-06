
// Spatial partitioning system for optimizing artboard repulsion calculations
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpatialItem {
  id: string;
  bounds: Bounds;
  data: any;
}

export class SpatialGrid {
  private cellSize: number;
  private grid: Map<string, SpatialItem[]>;
  
  constructor(cellSize: number = 200) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  private getCellsForBounds(bounds: Bounds): string[] {
    const keys: string[] = [];
    const startX = Math.floor(bounds.x / this.cellSize);
    const endX = Math.floor((bounds.x + bounds.width) / this.cellSize);
    const startY = Math.floor(bounds.y / this.cellSize);
    const endY = Math.floor((bounds.y + bounds.height) / this.cellSize);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        keys.push(`${x},${y}`);
      }
    }
    return keys;
  }

  insert(item: SpatialItem): void {
    const cells = this.getCellsForBounds(item.bounds);
    
    cells.forEach(cellKey => {
      if (!this.grid.has(cellKey)) {
        this.grid.set(cellKey, []);
      }
      this.grid.get(cellKey)!.push(item);
    });
  }

  remove(itemId: string): void {
    this.grid.forEach((items, cellKey) => {
      const index = items.findIndex(item => item.id === itemId);
      if (index !== -1) {
        items.splice(index, 1);
        if (items.length === 0) {
          this.grid.delete(cellKey);
        }
      }
    });
  }

  query(bounds: Bounds, excludeId?: string): SpatialItem[] {
    const cells = this.getCellsForBounds(bounds);
    const found = new Set<SpatialItem>();

    cells.forEach(cellKey => {
      const items = this.grid.get(cellKey);
      if (items) {
        items.forEach(item => {
          if (item.id !== excludeId && this.boundsIntersect(bounds, item.bounds)) {
            found.add(item);
          }
        });
      }
    });

    return Array.from(found);
  }

  private boundsIntersect(a: Bounds, b: Bounds): boolean {
    return !(
      a.x + a.width < b.x ||
      b.x + b.width < a.x ||
      a.y + a.height < b.y ||
      b.y + b.height < a.y
    );
  }

  clear(): void {
    this.grid.clear();
  }

  update(item: SpatialItem): void {
    this.remove(item.id);
    this.insert(item);
  }
}
