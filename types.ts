
export type WasteType = 
  | 'Plastic' 
  | 'Organic' 
  | 'Cloth/Textile' 
  | 'Metal' 
  | 'Paper/Cardboard' 
  | 'Glass' 
  | 'Other / Non-recyclable';

export type IoTBin = 
  | 'Plastic Bin' 
  | 'Organic Bin' 
  | 'Cloth/Textile Bin' 
  | 'Metal Bin' 
  | 'Paper Bin' 
  | 'Glass Bin' 
  | 'General Waste Bin';

export interface DetectedObject {
  name: string;
  color: string;
  wasteType: WasteType;
  targetBin: IoTBin;
  confidence: number;
  box2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
}

export interface BinStatus {
  fillLevel: 'Low' | 'Medium' | 'High';
  sensorStatus: 'Active' | 'Inactive';
  alertRequired: boolean;
  count: number;
}

export interface SystemState {
  processedCount: number;
  operatingState: 'Normal' | 'Warning' | 'Overload';
}

export interface AnalysisResponse {
  detectedObjects: DetectedObject[];
  sortingAction: string;
  systemStatus: SystemState;
}
