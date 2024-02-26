import ReportTable from './src/ReportTable';

export const ClassificationLinePosition = Object.freeze({
    none: 0,
    top: 1 << 0,
    right: 1 << 1,
    bottom: 1 << 2,
    left: 1 << 3,
});

export const TrianglePosition = Object.freeze({
    NONE: 0,
    TOP_LEFT: 1 << 0,
    TOP_RIGHT: 1 << 1,
    BOTTOM_LEFT: 1 << 2,
    BOTTOM_RIGHT: 1 << 3,
});
export default ReportTable;
