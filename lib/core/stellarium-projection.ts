/**
 * Stellarium projection helpers shared by click-to-coordinate and overlay projection.
 * The mapping is keyed by Stellarium core.projection numeric values.
 */

const EPSILON = 1e-8;
const MAX_LATITUDE = Math.PI / 2 - 1e-6;
const SQRT2 = Math.SQRT2;

type ProjectionMode = 0 | 1 | 2 | 3 | 4 | 5 | 7 | 8 | 9 | 10;

export interface ProjectionContext {
  projection: number;
  fov: number;
  aspect: number;
}

export interface NdcCoordinates {
  x: number;
  y: number;
}

const AZIMUTHAL_PROJECTIONS = new Set<ProjectionMode>([0, 1, 2, 3, 8]);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function asProjectionMode(value: number): ProjectionMode {
  switch (value) {
    case 0:
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
    case 7:
    case 8:
    case 9:
    case 10:
      return value;
    default:
      return 0;
  }
}

function normalizeVector(vec: number[]): number[] | null {
  const [x, y, z] = vec;
  const norm = Math.hypot(x, y, z);
  if (!Number.isFinite(norm) || norm < EPSILON) {
    return null;
  }
  return [x / norm, y / norm, z / norm];
}

function safeHalfFov(fov: number): number {
  return clamp(fov / 2, EPSILON, Math.PI - EPSILON);
}

function safePhiMax(fov: number): number {
  return clamp(fov / 2, EPSILON, MAX_LATITUDE);
}

function safeAspect(aspect: number): number {
  return Number.isFinite(aspect) && aspect > EPSILON ? aspect : 1;
}

function azimuthalRadius(mode: ProjectionMode, angularDistance: number): number {
  switch (mode) {
    case 1: // stereographic
      return 2 * Math.tan(angularDistance / 2);
    case 2: // equal-area
      return SQRT2 * Math.sin(angularDistance / 2);
    case 3: // fisheye (equidistant)
      return angularDistance;
    case 8: // orthographic
      return Math.sin(angularDistance);
    case 0: // perspective / gnomonic
    default:
      return Math.tan(angularDistance);
  }
}

function inverseAzimuthalRadius(mode: ProjectionMode, radius: number): number {
  switch (mode) {
    case 1:
      return 2 * Math.atan(radius / 2);
    case 2:
      return 2 * Math.asin(clamp(radius / SQRT2, -1, 1));
    case 3:
      return clamp(radius, 0, Math.PI);
    case 8:
      return Math.asin(clamp(radius, -1, 1));
    case 0:
    default:
      return Math.atan(radius);
  }
}

function hammerScale(phiMax: number, lambdaMax: number): { xMax: number; yMax: number } {
  const yMax = Math.max(2 * Math.sin(phiMax / 2), EPSILON);
  const halfLambda = lambdaMax / 2;
  const denom = Math.sqrt(Math.max(EPSILON, 1 + Math.cos(halfLambda)));
  const xMax = Math.max((2 * SQRT2 * Math.sin(halfLambda)) / denom, EPSILON);
  return { xMax, yMax };
}

function projectionScale(mode: ProjectionMode, context: ProjectionContext): { xMax: number; yMax: number } {
  const aspect = safeAspect(context.aspect);
  const phiMax = safePhiMax(context.fov);
  const lambdaMax = Math.min(Math.PI, phiMax * aspect);

  switch (mode) {
    case 4:
      return hammerScale(phiMax, lambdaMax);
    case 5: // cylindrical
      return { xMax: lambdaMax, yMax: phiMax };
    case 7: // mercator
      return {
        xMax: lambdaMax,
        yMax: Math.max(Math.log(Math.tan(Math.PI / 4 + phiMax / 2)), EPSILON),
      };
    case 9: // sinusoidal
      return { xMax: lambdaMax, yMax: phiMax };
    case 10: // miller
      return {
        xMax: lambdaMax,
        yMax: Math.max(1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * phiMax)), EPSILON),
      };
    default:
      return { xMax: 1, yMax: 1 };
  }
}

function sphericalToViewVector(lambda: number, phi: number): number[] {
  const cosPhi = Math.cos(phi);
  return [
    cosPhi * Math.sin(lambda),
    Math.sin(phi),
    -cosPhi * Math.cos(lambda),
  ];
}

/**
 * Convert a normalized VIEW-space vector to normalized device coordinates.
 * Returns null when the projection cannot represent the vector.
 */
export function viewVectorToNdc(viewVector: number[], context: ProjectionContext): NdcCoordinates | null {
  const projection = asProjectionMode(context.projection);
  const aspect = safeAspect(context.aspect);
  const normalized = normalizeVector(viewVector);
  if (!normalized) return null;
  const [x, y, z] = normalized;

  if (AZIMUTHAL_PROJECTIONS.has(projection)) {
    const c = Math.acos(clamp(-z, -1, 1));
    if (projection === 8 && c > Math.PI / 2 + EPSILON) {
      return null;
    }
    const rMax = azimuthalRadius(projection, safeHalfFov(context.fov));
    if (!Number.isFinite(rMax) || Math.abs(rMax) < EPSILON) {
      return null;
    }
    const r = azimuthalRadius(projection, c);
    const sinC = Math.sin(c);
    let u = 0;
    let v = 0;
    if (sinC > EPSILON && Number.isFinite(r)) {
      const scale = r / rMax;
      u = (x / sinC) * scale;
      v = (y / sinC) * scale;
    }
    return { x: u / aspect, y: v };
  }

  const lambda = Math.atan2(x, -z);
  const phi = Math.asin(clamp(y, -1, 1));
  const { xMax, yMax } = projectionScale(projection, context);
  if (xMax < EPSILON || yMax < EPSILON) return null;

  let xProj = 0;
  let yProj = 0;

  switch (projection) {
    case 4: {
      const denom = Math.sqrt(Math.max(EPSILON, 1 + Math.cos(phi) * Math.cos(lambda / 2)));
      xProj = (2 * SQRT2 * Math.cos(phi) * Math.sin(lambda / 2)) / denom;
      yProj = (SQRT2 * Math.sin(phi)) / denom;
      break;
    }
    case 5:
      xProj = lambda;
      yProj = phi;
      break;
    case 7:
      xProj = lambda;
      yProj = Math.log(Math.tan(Math.PI / 4 + phi / 2));
      break;
    case 9:
      xProj = lambda * Math.cos(phi);
      yProj = phi;
      break;
    case 10:
      xProj = lambda;
      yProj = 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * phi));
      break;
    default:
      return null;
  }

  if (!Number.isFinite(xProj) || !Number.isFinite(yProj)) {
    return null;
  }

  return {
    x: xProj / xMax,
    y: yProj / yMax,
  };
}

/**
 * Convert normalized device coordinates to a normalized VIEW-space vector.
 * Returns null when the input point is outside of projection domain.
 */
export function ndcToViewVector(ndcX: number, ndcY: number, context: ProjectionContext): number[] | null {
  const projection = asProjectionMode(context.projection);
  const aspect = safeAspect(context.aspect);

  if (AZIMUTHAL_PROJECTIONS.has(projection)) {
    const u = ndcX * aspect;
    const v = ndcY;
    const rho = Math.hypot(u, v);
    const rMax = azimuthalRadius(projection, safeHalfFov(context.fov));
    if (!Number.isFinite(rMax) || Math.abs(rMax) < EPSILON) {
      return null;
    }
    const r = rho * rMax;
    const c = inverseAzimuthalRadius(projection, r);
    if (!Number.isFinite(c)) {
      return null;
    }
    const sinC = Math.sin(c);
    const cosC = Math.cos(c);
    const x = rho > EPSILON ? (sinC * u) / rho : 0;
    const y = rho > EPSILON ? (sinC * v) / rho : 0;
    const z = -cosC;
    return normalizeVector([x, y, z]);
  }

  const { xMax, yMax } = projectionScale(projection, context);
  if (xMax < EPSILON || yMax < EPSILON) return null;
  const xProj = ndcX * xMax;
  const yProj = ndcY * yMax;

  let lambda = 0;
  let phi = 0;

  switch (projection) {
    case 4: {
      const zTerm = 1 - (xProj * xProj) / 16 - (yProj * yProj) / 4;
      if (zTerm < 0) {
        return null;
      }
      const z = Math.sqrt(zTerm);
      lambda = 2 * Math.atan2(z * xProj, 2 * (2 * z * z - 1));
      const sinPhi = z * yProj;
      if (Math.abs(sinPhi) > 1) {
        return null;
      }
      phi = Math.asin(sinPhi);
      break;
    }
    case 5:
      lambda = xProj;
      phi = yProj;
      break;
    case 7:
      lambda = xProj;
      phi = 2 * Math.atan(Math.exp(yProj)) - Math.PI / 2;
      break;
    case 9: {
      phi = yProj;
      const cosPhi = Math.cos(phi);
      if (Math.abs(cosPhi) < EPSILON) {
        return null;
      }
      lambda = xProj / cosPhi;
      break;
    }
    case 10:
      lambda = xProj;
      phi = 2.5 * (Math.atan(Math.exp(0.8 * yProj)) - Math.PI / 4);
      break;
    default:
      return null;
  }

  if (!Number.isFinite(lambda) || !Number.isFinite(phi) || Math.abs(phi) > Math.PI / 2 + EPSILON) {
    return null;
  }

  return normalizeVector(sphericalToViewVector(lambda, phi));
}
