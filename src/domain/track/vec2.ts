import type { Vec2 } from "../race/types";

export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function hypot(vector: Vec2): number {
  return Math.hypot(vector.x, vector.y);
}

export function normalize(vector: Vec2): Vec2 {
  const length = hypot(vector);
  if (length === 0) {
    return vec2(0, 0);
  }

  return vec2(vector.x / length, vector.y / length);
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

export function scale(vector: Vec2, scalar: number): Vec2 {
  return vec2(vector.x * scalar, vector.y * scalar);
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return vec2(a.x + b.x, a.y + b.y);
}

export function inwardNormal(tangent: Vec2): Vec2 {
  return normalize(vec2(-tangent.y, tangent.x));
}

export function wrapLapDistance(distanceM: number, lapLengthM: number): number {
  return ((distanceM % lapLengthM) + lapLengthM) % lapLengthM;
}
