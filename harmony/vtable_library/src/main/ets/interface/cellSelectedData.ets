export interface CellPosition {
  col: number;
  row: number;
}

// 选择范围接口
export interface SelectionRange {
  start: CellPosition;
  end: CellPosition;
}

// 单元格选择事件数据接口
export interface CellSelectionData {
  ranges: SelectionRange[];
  col: number;
  row: number;
}