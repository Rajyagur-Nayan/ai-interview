export interface Point3D {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface Classifications {
  categories: {
    index: number;
    score: number;
    categoryName: string;
    displayName?: string;
  }[];
  headIndex?: number;
  headName?: string;
}

export interface FaceLandmarkResult {
  landmarks: Point3D[][];
  faceBlendshapes?: Classifications[];
  facialTransformationMatrixes?: number[][][];
}
