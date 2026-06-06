export interface CellChangeEvent {
  col: number;
  row: number;
  rawValue: string;
  currentValue: string;
  changedValue: string;
}