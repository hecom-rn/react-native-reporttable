/**
 * vtableDataConverter.js
 *
 * Converts ReportTable DataSource[][] (2D cell matrix) into VTable's
 * { records, columns } format for use with @ohos/vtable ListTable.
 */

/**
 * Map textAlignment enum to VTable textAlign string.
 * @param {0|1|2} alignment
 * @returns {'left'|'center'|'right'}
 */
function mapTextAlign(alignment) {
    switch (alignment) {
        case 1: return 'center';
        case 2: return 'right';
        default: return 'left';
    }
}

/**
 * Build VTable column style from a DataSource cell (typically header row).
 * @param {object} cell - A single DataSource cell object.
 * @param {object} itemConfig - Global itemConfig defaults.
 * @returns {object} VTable style object for the column.
 */
function buildColumnStyle(cell, itemConfig) {
    const style = {};
    const fontSize = cell.fontSize ?? itemConfig?.fontSize ?? 14;
    const textColor = cell.textColor ?? itemConfig?.textColor;
    const bgColor = cell.backgroundColor ?? itemConfig?.backgroundColor;
    const textAlign = mapTextAlign(cell.textAlignment ?? itemConfig?.textAlignment ?? 0);
    const fontWeight = (cell.isOverstriking ?? itemConfig?.isOverstriking) ? 'bold' : 'normal';

    style.fontSize = fontSize;
    if (textColor) style.color = textColor;
    if (bgColor) style.bgColor = bgColor;
    style.textAlign = textAlign;
    style.fontWeight = fontWeight;
    style.padding = [0, cell.textPaddingHorizontal ?? itemConfig?.textPaddingHorizontal ?? 12];
    style.autoWrapText = false;

    return style;
}

/**
 * Build per-cell custom style metadata stored in the record.
 * This is used by customLayout to render special features.
 * @param {object} cell - A single DataSource cell object.
 * @returns {object} Metadata object for custom rendering.
 */
function buildCellMeta(cell) {
    const meta = {
        title: cell.title ?? '',
        keyIndex: cell.keyIndex ?? 0,
    };

    // Basic text styling
    if (cell.fontSize != null) meta.fontSize = cell.fontSize;
    if (cell.textColor != null) meta.textColor = cell.textColor;
    if (cell.backgroundColor != null) meta.backgroundColor = cell.backgroundColor;
    if (cell.textAlignment != null) meta.textAlign = mapTextAlign(cell.textAlignment);
    if (cell.isOverstriking) meta.fontWeight = 'bold';
    if (cell.textPaddingHorizontal != null) meta.textPaddingHorizontal = cell.textPaddingHorizontal;
    if (cell.textPaddingLeft != null) meta.textPaddingLeft = cell.textPaddingLeft;
    if (cell.textPaddingRight != null) meta.textPaddingRight = cell.textPaddingRight;

    // Special features
    if (cell.progressStyle) meta.progressStyle = cell.progressStyle;
    if (cell.floatIcon) meta.floatIcon = cell.floatIcon;
    if (cell.extraText) meta.extraText = cell.extraText;
    if (cell.isForbidden) meta.isForbidden = true;
    if (cell.boxLineColor) meta.boxLineColor = cell.boxLineColor;
    if (cell.classificationLinePosition != null) {
        meta.classificationLinePosition = cell.classificationLinePosition;
        if (cell.classificationLineColor) meta.classificationLineColor = cell.classificationLineColor;
    }
    if (cell.richText) meta.richText = cell.richText;
    if (cell.gradient) meta.gradient = cell.gradient;
    if (cell.icon) meta.icon = cell.icon;
    if (cell.lineBreakMode) meta.lineBreakMode = cell.lineBreakMode;

    return meta;
}

/**
 * Compute merged cells from keyIndex.
 * Adjacent cells (horizontally or vertically) with the same keyIndex are merged.
 * Follows the same merging logic as iOS (ReportTableViewModel generateMergeRange).
 *
 * Data layout: dataSource[rowIndex][colIndex] (row-major, matching RN props).
 * VTable row indices: In ListTable, row 0..headerRowCount-1 are headers,
 * body rows start from headerRowCount.
 *
 * @param {Array<Array<object>>} dataSource - Full 2D data matrix (including header rows).
 * @param {number} headerRowCount - Number of header rows.
 * @returns {Array<object>} Array of VTable merge rules: { range: { start: {col, row}, end: {col, row} } }
 */
function computeMergedCells(dataSource, headerRowCount) {
    if (!dataSource || dataSource.length === 0) return [];

    const rowCount = dataSource.length;
    const colCount = dataSource[0]?.length ?? 0;
    if (colCount === 0) return [];

    // Track which cells have been consumed by a merge
    const used = Array.from({ length: rowCount }, () => new Array(colCount).fill(false));
    const mergedCells = [];

    for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
        for (let colIdx = 0; colIdx < colCount; colIdx++) {
            if (used[rowIdx][colIdx]) continue;

            const cell = dataSource[rowIdx]?.[colIdx];
            if (!cell) continue;

            const keyIndex = cell.keyIndex;
            if (keyIndex == null) continue;

            // Find horizontal span (same row, consecutive columns with same keyIndex)
            let horSpan = 1;
            for (let c = colIdx + 1; c < colCount; c++) {
                const neighbor = dataSource[rowIdx]?.[c];
                if (neighbor && neighbor.keyIndex === keyIndex && !used[rowIdx][c]) {
                    horSpan++;
                } else {
                    break;
                }
            }

            // Find vertical span (same column range, consecutive rows with same keyIndex)
            let verSpan = 1;
            for (let r = rowIdx + 1; r < rowCount; r++) {
                // Check if all columns in the horizontal span have the same keyIndex
                let allMatch = true;
                for (let c = colIdx; c < colIdx + horSpan; c++) {
                    const neighbor = dataSource[r]?.[c];
                    if (!neighbor || neighbor.keyIndex !== keyIndex || used[r][c]) {
                        allMatch = false;
                        break;
                    }
                }
                if (allMatch) {
                    verSpan++;
                } else {
                    break;
                }
            }

            // Only create a merge rule if there's actual merging (span > 1)
            if (horSpan > 1 || verSpan > 1) {
                // Mark all cells in the merged region as used
                for (let r = rowIdx; r < rowIdx + verSpan; r++) {
                    for (let c = colIdx; c < colIdx + horSpan; c++) {
                        used[r][c] = true;
                    }
                }

                // VTable absolute row index: header rows are 0..headerRowCount-1,
                // body rows start from headerRowCount.
                // Our dataSource rowIdx maps directly since the first headerRowCount rows
                // are the header, and VTable also indexes them starting from 0.
                mergedCells.push({
                    range: {
                        start: { col: colIdx, row: rowIdx },
                        end: { col: colIdx + horSpan - 1, row: rowIdx + verSpan - 1 },
                    },
                });
            }
        }
    }

    return mergedCells;
}

/**
 * Convert DataSource[][] to VTable { records, columns } format.
 *
 * @param {Array<Array<object>>} dataSource - 2D array of DataSource cells.
 * @param {object} options
 * @param {number} [options.frozenRows=1] - Number of header rows to use as column titles.
 * @param {object} [options.itemConfig] - Global default item configuration.
 * @param {object} [options.columnsWidthMap] - Per-column width overrides { [index]: { minWidth, maxWidth } }.
 * @param {number} [options.minWidth=50] - Global minimum column width.
 * @param {number} [options.maxWidth=120] - Global maximum column width.
 * @param {number} [options.frozenColumns=0] - Number of permanently frozen columns.
 * @param {boolean} [options.permutable=false] - Whether all columns show lock icons.
 * @param {object} [options.frozenAbility] - Per-column lock ability config { [col]: { locked } }.
 * @param {number[]} [options.ignoreLocks] - Columns that should not show lock icons (1-based).
 * @returns {{ records: Array<object>, columns: Array<object>, headerRecords: Array<object>, mergedCells: Array<object> }}
 */
export function convertDataSourceToVTable(dataSource, options = {}) {
    if (!dataSource || dataSource.length === 0) {
        return { records: [], columns: [], headerRecords: [], mergedCells: [] };
    }

    const {
        frozenRows = 1,
        itemConfig = {},
        columnsWidthMap = {},
        minWidth = 50,
        maxWidth = 120,
        frozenColumns = 0,
        permutable = false,
        frozenAbility = {},
        ignoreLocks = [],
    } = options;

    const colCount = dataSource[0]?.length ?? 0;
    const headerRowCount = Math.min(frozenRows, dataSource.length);

    // --- Build columns from header rows ---
    const columns = [];
    // Build ignoreLocks set (convert from 1-based to 0-based)
    const ignoreLocksSet = new Set((ignoreLocks || []).map(i => i - 1));

    for (let colIdx = 0; colIdx < colCount; colIdx++) {
        const headerCell = dataSource[0]?.[colIdx] ?? {};
        const colWidthConfig = columnsWidthMap[String(colIdx)];

        // Determine lock icon state for this column
        let lockInfo = null; // null = no lock icon
        const isPermanentlyFrozen = colIdx < frozenColumns;
        const isIgnored = ignoreLocksSet.has(colIdx);

        if (!isPermanentlyFrozen && !isIgnored) {
            if (frozenAbility && frozenAbility[String(colIdx)] != null) {
                // frozenAbility explicitly configures this column
                lockInfo = { showLock: true, isLocked: !!frozenAbility[String(colIdx)].locked };
            } else if (permutable) {
                // permutable mode: all non-frozen columns show lock icon (initially unlocked)
                lockInfo = { showLock: true, isLocked: false };
            }
        }

        // Width: use maxWidth as the actual width (matching iOS behavior where columns render at maxWidth)
        // If columnsWidthMap provides explicit widths, use those
        const colWidth = colWidthConfig?.maxWidth ?? maxWidth;
        const colMinWidth = colWidthConfig?.minWidth ?? minWidth;
        const colMaxWidth = colWidthConfig?.maxWidth ?? maxWidth;

        const column = {
            field: String(colIdx),
            title: headerCell.title ?? '',
            // Width configuration - use maxWidth as default width
            width: colWidth,
            minWidth: colMinWidth,
            maxWidth: colMaxWidth,
            // Style from header cell
            style: buildColumnStyle(headerCell, itemConfig),
            // Header style
            headerStyle: buildColumnStyle(headerCell, itemConfig),
        };

        // Attach lock info to column for native side to render
        if (lockInfo) {
            column.__lockInfo = lockInfo;
        }

        columns.push(column);
    }

    // --- Build records from data rows (skip header rows) ---
    const records = [];
    for (let rowIdx = headerRowCount; rowIdx < dataSource.length; rowIdx++) {
        const row = dataSource[rowIdx];
        const record = { __rowIndex: rowIdx };

        for (let colIdx = 0; colIdx < colCount; colIdx++) {
            const cell = row?.[colIdx] ?? {};
            // The display value
            record[String(colIdx)] = cell.title ?? '';
            // Store full cell metadata for custom rendering
            record[`__meta_${colIdx}`] = buildCellMeta(cell);
        }

        records.push(record);
    }

    // --- Build header records (for multi-row headers) ---
    const headerRecords = [];
    for (let rowIdx = 0; rowIdx < headerRowCount; rowIdx++) {
        const row = dataSource[rowIdx];
        const record = {};
        for (let colIdx = 0; colIdx < colCount; colIdx++) {
            const cell = row?.[colIdx] ?? {};
            record[String(colIdx)] = cell.title ?? '';
            record[`__meta_${colIdx}`] = buildCellMeta(cell);
        }
        headerRecords.push(record);
    }

    // --- Compute merged cells from keyIndex ---
    const mergedCells = computeMergedCells(dataSource, headerRowCount);

    return { records, columns, headerRecords, mergedCells };
}

/**
 * Build VTable theme object from ReportTable props.
 *
 * @param {object} props - ReportTable component props.
 * @returns {object} VTable ITableThemeDefine object.
 */
export function buildVTableTheme(props) {
    const { lineColor, itemConfig = {}, showBorder = false } = props;

    const borderColor = lineColor || '#e8e8e8';
    const bgColor = itemConfig.backgroundColor || '#FFFFFF';
    const fontSize = itemConfig.fontSize || 14;
    const textColor = itemConfig.textColor || '#222222';
    const textAlign = mapTextAlign(itemConfig.textAlignment ?? 0);
    const fontWeight = itemConfig.isOverstriking ? 'bold' : 'normal';
    const padding = [0, itemConfig.textPaddingHorizontal ?? 12];

    const theme = {
        defaultStyle: {
            fontSize,
            color: textColor,
            bgColor,
            textAlign,
            fontWeight,
            padding,
            borderColor,
            borderLineWidth: 1,
        },
        headerStyle: {
            fontSize,
            color: textColor,
            bgColor,
            textAlign,
            fontWeight,
            padding,
            borderColor,
            borderLineWidth: 1,
        },
        bodyStyle: {
            fontSize,
            color: textColor,
            bgColor,
            textAlign,
            fontWeight,
            padding,
            borderColor,
            borderLineWidth: 1,
        },
        frameStyle: {
            borderColor,
            borderLineWidth: showBorder ? 1 : 0,
        },
    };

    return theme;
}

/**
 * Convert updateData params to VTable changeCellValues format.
 *
 * @param {Array<Array<object>>} data - Sub-matrix of DataSource cells.
 * @param {number} x - Start column.
 * @param {number} y - Start row.
 * @param {number} frozenRows - Number of frozen header rows.
 * @returns {{ startCol: number, startRow: number, values: string[][] }}
 */
export function convertUpdateData(data, x, y, frozenRows) {
    const values = [];
    for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
        const rowValues = [];
        for (let colIdx = 0; colIdx < (data[rowIdx]?.length ?? 0); colIdx++) {
            const cell = data[rowIdx][colIdx];
            rowValues.push(cell?.title ?? '');
        }
        values.push(rowValues);
    }
    return {
        startCol: x,
        startRow: y + frozenRows, // VTable row index includes header rows
        values,
    };
}

/**
 * Convert spliceData params to VTable addRecords/deleteRecords format.
 *
 * @param {Array<{data?: DataSource[][], l?: number, y?: number}>} params
 * @param {number} colCount - Number of columns.
 * @returns {{ deleteIndices: number[], addAtIndex: number, newRecords: object[] }[]}
 */
export function convertSpliceData(params, colCount) {
    const operations = [];
    for (const item of params) {
        const { data = [], l = 0, y = 0 } = item;
        const deleteIndices = [];
        for (let i = 0; i < l; i++) {
            deleteIndices.push(y + i);
        }

        const newRecords = [];
        for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
            const row = data[rowIdx];
            const record = { __rowIndex: y + rowIdx };
            for (let colIdx = 0; colIdx < colCount; colIdx++) {
                const cell = row?.[colIdx] ?? {};
                record[String(colIdx)] = cell.title ?? '';
                record[`__meta_${colIdx}`] = buildCellMeta(cell);
            }
            newRecords.push(record);
        }

        operations.push({ deleteIndices, addAtIndex: y, newRecords });
    }
    return operations;
}
