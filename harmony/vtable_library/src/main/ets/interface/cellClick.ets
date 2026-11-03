// 单元格边界坐标接口
export interface CellBounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// 单元格范围接口
export interface CellRange {
  bounds: CellBounds;
}

// 单元格点击事件数据接口
export interface CellClickData {
  col: number;
  row: number;
  field: string;
  title: string;
  cellType: string;
  originData: Record<string, Object>;
  cellRange: CellRange;
  value: string;
  dataValue: string;
  cellLocation: string;
  scaleRatio: number;
}