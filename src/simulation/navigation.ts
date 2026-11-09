import type { FarmGrid } from '../core/grid';

export interface PathNode {
    x: number;
    y: number;
}

interface InternalNode {
    x: number;
    y: number;
    g: number;
    h: number;
    f: number;
    parent: InternalNode | null;
}

export class NavigationSystem {
    private grid: FarmGrid;

    constructor(grid: FarmGrid) {
        this.grid = grid;
    }

    findPath(startX: number, startY: number, targetX: number, targetY: number): PathNode[] {
        // Validação de limites
        if (!this.grid.isInside(startX, startY) || !this.grid.isInside(targetX, targetY)) {
            return [];
        }

        const startCell = this.grid.getCell(startX, startY);
        const targetCell = this.grid.getCell(targetX, targetY);

        if (!startCell || !targetCell) return [];

        // Se o destino exato for não-caminhável, procura vizinho caminhável mais próximo
        let actualTargetX = targetX;
        let actualTargetY = targetY;

        if (!targetCell.walkable) {
            const neighbors = this.getWalkableNeighbors(targetX, targetY);
            if (neighbors.length === 0) return [];
            // Escolhe vizinho mais próximo do início
            neighbors.sort(
                (a, b) => this.heuristic(a.x, a.y, startX, startY) - this.heuristic(b.x, b.y, startX, startY)
            );
            actualTargetX = neighbors[0].x;
            actualTargetY = neighbors[0].y;
        }

        const openSet: InternalNode[] = [];
        const closedSet = new Set<string>();

        const key = (x: number, y: number) => `${x},${y}`;

        const startNode: InternalNode = {
            x: startX,
            y: startY,
            g: 0,
            h: this.heuristic(startX, startY, actualTargetX, actualTargetY),
            f: 0,
            parent: null
        };
        startNode.f = startNode.g + startNode.h;

        openSet.push(startNode);

        while (openSet.length > 0) {
            // Pega nó com menor f
            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift()!;

            if (current.x === actualTargetX && current.y === actualTargetY) {
                // Reconstruir caminho
                return this.reconstructPath(current);
            }

            closedSet.add(key(current.x, current.y));

            const neighbors = this.getNeighbors(current.x, current.y);
            for (const neighbor of neighbors) {
                if (closedSet.has(key(neighbor.x, neighbor.y))) continue;

                const cell = this.grid.getCell(neighbor.x, neighbor.y);
                if (!cell || !cell.walkable) continue;

                // Custo de movimento (1 para cardeal, 1.414 para diagonal se permitido)
                const isDiagonal = neighbor.x !== current.x && neighbor.y !== current.y;
                const moveCost = isDiagonal ? 1.414 : 1.0;

                // Não cortar cantos fechados se for diagonal
                if (isDiagonal) {
                    const cellA = this.grid.getCell(current.x, neighbor.y);
                    const cellB = this.grid.getCell(neighbor.x, current.y);
                    if (!cellA?.walkable || !cellB?.walkable) continue;
                }

                const tentativeG = current.g + moveCost;

                let existing = openSet.find((n) => n.x === neighbor.x && n.y === neighbor.y);
                if (!existing) {
                    const h = this.heuristic(neighbor.x, neighbor.y, actualTargetX, actualTargetY);
                    existing = {
                        x: neighbor.x,
                        y: neighbor.y,
                        g: tentativeG,
                        h,
                        f: tentativeG + h,
                        parent: current
                    };
                    openSet.push(existing);
                } else if (tentativeG < existing.g) {
                    existing.g = tentativeG;
                    existing.f = tentativeG + existing.h;
                    existing.parent = current;
                }
            }
        }

        // Sem caminho possível
        return [];
    }

    private heuristic(x1: number, y1: number, x2: number, y2: number): number {
        // Distância octil (diagonal)
        const dx = Math.abs(x1 - x2);
        const dy = Math.abs(y1 - y2);
        return Math.max(dx, dy) + 0.414 * Math.min(dx, dy);
    }

    private getNeighbors(x: number, y: number): PathNode[] {
        const dirs = [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 },
            { x: -1, y: -1 },
            { x: 1, y: -1 },
            { x: -1, y: 1 },
            { x: 1, y: 1 }
        ];

        return dirs.map((d) => ({ x: x + d.x, y: y + d.y })).filter((pos) => this.grid.isInside(pos.x, pos.y));
    }

    private getWalkableNeighbors(x: number, y: number): PathNode[] {
        return this.getNeighbors(x, y).filter((pos) => {
            const cell = this.grid.getCell(pos.x, pos.y);
            return cell && cell.walkable;
        });
    }

    private reconstructPath(endNode: InternalNode): PathNode[] {
        const path: PathNode[] = [];
        let curr: InternalNode | null = endNode;
        while (curr) {
            path.unshift({ x: curr.x, y: curr.y });
            curr = curr.parent;
        }
        return path;
    }
}
