/**
 * Fibonacci sphere distribution for uniformly distributing points on a sphere
 *
 * Based on the golden ratio to create evenly-spaced points.
 * This is used to position nodes in the HNSW visualization.
 */

const PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio

export interface FibonacciPoint {
  nx: number; // Normalized x (-1 to 1)
  ny: number; // Normalized y (-1 to 1)
  nz: number; // Normalized z (-1 to 1)
}

/**
 * Generate n points distributed on a unit sphere using Fibonacci spiral
 */
export function generateFibonacciSphere(n: number): FibonacciPoint[] {
  const points: FibonacciPoint[] = [];

  for (let i = 0; i < n; i++) {
    // Golden angle increment
    const theta = (2 * Math.PI * i) / PHI;

    // Latitude: evenly distributed from -1 to 1
    const cosPhi = 1 - (2 * (i + 0.5)) / n;
    const sinPhi = Math.sqrt(1 - cosPhi * cosPhi);

    points.push({
      nx: sinPhi * Math.cos(theta),
      ny: cosPhi,
      nz: sinPhi * Math.sin(theta),
    });
  }

  return points;
}

/**
 * Scale a Fibonacci point to a specific radius
 */
export function scalePoint(point: FibonacciPoint, radius: number): { x: number; y: number; z: number } {
  return {
    x: point.nx * radius,
    y: point.ny * radius,
    z: point.nz * radius,
  };
}

/**
 * Calculate distance between two points on a sphere
 */
export function sphereDistance(
  a: FibonacciPoint,
  b: FibonacciPoint,
  radiusA: number,
  radiusB: number
): number {
  const ax = a.nx * radiusA;
  const ay = a.ny * radiusA;
  const az = a.nz * radiusA;
  const bx = b.nx * radiusB;
  const by = b.ny * radiusB;
  const bz = b.nz * radiusB;

  return Math.sqrt(
    Math.pow(ax - bx, 2) + Math.pow(ay - by, 2) + Math.pow(az - bz, 2)
  );
}
