/**
 * Tests for Fibonacci sphere point distribution
 *
 * Validates the mathematical properties of the Fibonacci spiral algorithm
 * used to uniformly distribute points on a sphere surface.
 */
import { describe, it, expect } from "vitest";
import {
  generateFibonacciSphere,
  scalePoint,
  sphereDistance,
  type FibonacciPoint,
} from "../fibonacci-sphere";

describe("generateFibonacciSphere", () => {
  it("returns the correct number of points", () => {
    expect(generateFibonacciSphere(1)).toHaveLength(1);
    expect(generateFibonacciSphere(10)).toHaveLength(10);
    expect(generateFibonacciSphere(100)).toHaveLength(100);
  });

  it("returns empty array for zero points", () => {
    expect(generateFibonacciSphere(0)).toHaveLength(0);
  });

  it("generates points on the unit sphere (magnitude ~1)", () => {
    const points = generateFibonacciSphere(50);
    for (const p of points) {
      const mag = Math.sqrt(p.nx * p.nx + p.ny * p.ny + p.nz * p.nz);
      expect(mag).toBeCloseTo(1.0, 5);
    }
  });

  it("distributes points with y-values spanning from -1 to 1", () => {
    const points = generateFibonacciSphere(100);
    const yValues = points.map((p) => p.ny);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    // With the formula (1 - (2*(i+0.5))/n), the range should approach -1 to 1
    expect(minY).toBeLessThan(-0.95);
    expect(maxY).toBeGreaterThan(0.95);
  });

  it("produces unique points (no duplicates)", () => {
    const points = generateFibonacciSphere(50);
    const keys = points.map(
      (p) => `${p.nx.toFixed(10)},${p.ny.toFixed(10)},${p.nz.toFixed(10)}`
    );
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(50);
  });

  it("distributes points roughly uniformly (no large gaps at poles)", () => {
    const points = generateFibonacciSphere(200);

    // Divide into 4 y-bands and check each has roughly 25% of points
    const bands = [0, 0, 0, 0];
    for (const p of points) {
      const bandIdx = Math.min(3, Math.floor((p.ny + 1) / 0.5));
      bands[bandIdx]++;
    }

    // Each band should have between 15% and 35% of points
    for (const count of bands) {
      expect(count / 200).toBeGreaterThan(0.15);
      expect(count / 200).toBeLessThan(0.35);
    }
  });

  it("produces deterministic output for the same input", () => {
    const a = generateFibonacciSphere(20);
    const b = generateFibonacciSphere(20);

    for (let i = 0; i < 20; i++) {
      expect(a[i].nx).toBe(b[i].nx);
      expect(a[i].ny).toBe(b[i].ny);
      expect(a[i].nz).toBe(b[i].nz);
    }
  });
});

describe("scalePoint", () => {
  it("scales a unit sphere point to the given radius", () => {
    const point: FibonacciPoint = { nx: 1, ny: 0, nz: 0 };
    const scaled = scalePoint(point, 10);
    expect(scaled.x).toBe(10);
    expect(scaled.y).toBe(0);
    expect(scaled.z).toBe(0);
  });

  it("preserves direction when scaling", () => {
    const point: FibonacciPoint = {
      nx: 1 / Math.sqrt(3),
      ny: 1 / Math.sqrt(3),
      nz: 1 / Math.sqrt(3),
    };
    const scaled = scalePoint(point, 6);
    // All components should be equal
    expect(scaled.x).toBeCloseTo(scaled.y, 10);
    expect(scaled.y).toBeCloseTo(scaled.z, 10);
    // Magnitude should be 6
    const mag = Math.sqrt(
      scaled.x * scaled.x + scaled.y * scaled.y + scaled.z * scaled.z
    );
    expect(mag).toBeCloseTo(6, 5);
  });

  it("returns origin for radius 0", () => {
    const point: FibonacciPoint = { nx: 0.5, ny: 0.3, nz: 0.8 };
    const scaled = scalePoint(point, 0);
    expect(scaled.x).toBe(0);
    expect(scaled.y).toBe(0);
    expect(scaled.z).toBe(0);
  });
});

describe("sphereDistance", () => {
  it("returns 0 for the same point at the same radius", () => {
    const point: FibonacciPoint = { nx: 1, ny: 0, nz: 0 };
    expect(sphereDistance(point, point, 10, 10)).toBe(0);
  });

  it("returns the Euclidean distance between two points on a sphere", () => {
    const a: FibonacciPoint = { nx: 1, ny: 0, nz: 0 };
    const b: FibonacciPoint = { nx: 0, ny: 1, nz: 0 };
    const dist = sphereDistance(a, b, 10, 10);
    // Distance between (10,0,0) and (0,10,0) = sqrt(200) ~= 14.14
    expect(dist).toBeCloseTo(Math.sqrt(200), 5);
  });

  it("handles different radii (cross-layer distance)", () => {
    const a: FibonacciPoint = { nx: 1, ny: 0, nz: 0 };
    const b: FibonacciPoint = { nx: 1, ny: 0, nz: 0 };
    // Same direction, but at radius 13 and radius 6.5
    const dist = sphereDistance(a, b, 13, 6.5);
    expect(dist).toBeCloseTo(6.5, 5);
  });

  it("returns diameter for antipodal points on same sphere", () => {
    const a: FibonacciPoint = { nx: 1, ny: 0, nz: 0 };
    const b: FibonacciPoint = { nx: -1, ny: 0, nz: 0 };
    const dist = sphereDistance(a, b, 5, 5);
    expect(dist).toBeCloseTo(10, 5);
  });

  it("is symmetric", () => {
    const a: FibonacciPoint = { nx: 0.3, ny: 0.5, nz: 0.8 };
    const b: FibonacciPoint = { nx: -0.7, ny: 0.2, nz: 0.6 };
    expect(sphereDistance(a, b, 10, 10)).toBeCloseTo(
      sphereDistance(b, a, 10, 10),
      10
    );
  });
});
