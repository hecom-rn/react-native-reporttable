import ReportTable from './src/ReportTable';

export enum ClassificationLinePosition {
    none = 0,
    top = 1 << 0,
    right = 1 << 1,
    bottom = 1 << 2,
    left = 1 << 3,
}

export default ReportTable;
