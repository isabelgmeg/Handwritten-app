/**
 * Lazy Brush Engine
 * Implements the lazy brush algorithm for smooth drawing
 */

/**
 * LazyBrush class implements a lazy/stabilizing brush algorithm
 * Keeps the brush slightly behind the cursor for smoother strokes
 */
export class LazyBrush {
  x: number = 0;
  y: number = 0;
  px: number = 0;
  py: number = 0;

  /**
   * Update brush position based on pointer coordinates
   * Returns true if position changed, false otherwise
   */
  update(px: number, py: number, radius: number): boolean {
    this.px = px;
    this.py = py;

    if (radius <= 0) {
      this.x = px;
      this.y = py;
      return true;
    }

    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > radius) {
      const a = Math.atan2(dy, dx);
      this.x = px - Math.cos(a) * radius;
      this.y = py - Math.sin(a) * radius;
      return true;
    }

    return false;
  }

  /**
   * Reset brush to a specific position
   */
  reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.px = x;
    this.py = y;
  }
}
