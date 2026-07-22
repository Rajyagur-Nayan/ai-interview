import { Point3D } from "../types/landmarks";

export function distance3D(p1: Point3D, p2: Point3D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function distance2D(p1: Point3D, p2: Point3D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function midpoint(p1: Point3D, p2: Point3D): Point3D {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
    z: ((p1.z || 0) + ((p2.z || 0))) / 2,
  };
}

export function clamp(val: number, min: number = 0, max: number = 100): number {
  return Math.min(Math.max(val, min), max);
}
