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
    const isBold = cell.isOverstriking ?? itemConfig?.isOverstriking ?? false;

    style.fontSize = fontSize;
    if (textColor) style.color = textColor;
    if (bgColor) style.bgColor = bgColor;
    style.textAlign = textAlign;
    style.fontWeight = isBold ? 'bold' : 'normal';
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
 * Compute merged cells from keyIndex (matching iOS generateMergeRange logic).
 *
 * iOS merging logic:
 * - SameRowLength: consecutive cells in the same row with same keyIndex → horizontal merge
 * - SameColumnLength: consecutive cells in the same column with same keyIndex → vertical merge
 *
 * VTable customMergeCell array format:
 *   [{ range: { start: { col, row }, end: { col, row } }, text: '...' }]
 *
 * VTable row indices: row 0 is first header row, body rows start at headerRowCount.
 *
 * @param {Array<Array<object>>} dataSource - Full 2D data matrix.
 * @param {number} headerRowCount - Number of header rows.
 * @returns {Array<object>} Array of VTable merge rules.
 */
function computeMergedCells(dataSource, headerRowCount) {
    if (!dataSource || dataSource.length === 0) return [];

    const rowCount = dataSource.length;
    const colCount = dataSource[0]?.length ?? 0;
    if (colCount === 0) return [];

    const used = Array.from({ length: rowCount }, () => new Array(colCount).fill(false));
    const mergedCells = [];

    for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
        for (let colIdx = 0; colIdx < colCount; colIdx++) {
            if (used[rowIdx][colIdx]) continue;

            const cell = dataSource[rowIdx]?.[colIdx];
            if (!cell) continue;

            const keyIndex = cell.keyIndex;
            if (keyIndex == null) continue;

            // Horizontal span: consecutive cells in same row with same keyIndex
            let horSpan = 1;
            for (let c = colIdx + 1; c < colCount; c++) {
                const neighbor = dataSource[rowIdx]?.[c];
                if (neighbor && neighbor.keyIndex === keyIndex && !used[rowIdx][c]) {
                    horSpan++;
                } else {
                    break;
                }
            }

            // Vertical span: consecutive rows where ALL cols in horSpan have same keyIndex
            let verSpan = 1;
            for (let r = rowIdx + 1; r < rowCount; r++) {
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

            if (horSpan > 1 || verSpan > 1) {
                for (let r = rowIdx; r < rowIdx + verSpan; r++) {
                    for (let c = colIdx; c < colIdx + horSpan; c++) {
                        used[r][c] = true;
                    }
                }

                mergedCells.push({
                    range: {
                        start: { col: colIdx, row: rowIdx },
                        end: { col: colIdx + horSpan - 1, row: rowIdx + verSpan - 1 },
                    },
                    text: cell.title ?? '',
                });
            }
        }
    }

    return mergedCells;
}

/**
 * Generate per-cell style arrangements for VTable.
 * Uses customCellStyle (style definitions) + customCellStyleArrangement (cell→style mapping).
 * DataSource per-cell styles (backgroundColor, textColor, fontSize, etc.) override column defaults.
 *
 * @param {Array<Array<object>>} dataSource - Full 2D data matrix.
 * @param {object} itemConfig - Global default config.
 * @returns {{ customCellStyle: Array, customCellStyleArrangement: Array }}
 */
function buildCellStyleArrangements(dataSource, itemConfig) {
    const customCellStyle = [];
    const customCellStyleArrangement = [];
    const styleCache = new Map();

    // If itemConfig has global isOverstriking, we need a base bold style for all cells
    const globalBold = !!itemConfig?.isOverstriking;

    for (let rowIdx = 0; rowIdx < dataSource.length; rowIdx++) {
        const row = dataSource[rowIdx];
        if (!row) continue;

        for (let colIdx = 0; colIdx < row.length; colIdx++) {
            const cell = row[colIdx];
            if (!cell) continue;

            const cellStyle = {};
            let hasOverride = false;

            if (cell.backgroundColor != null) {
                cellStyle.bgColor = cell.backgroundColor;
                hasOverride = true;
            }
            if (cell.textColor != null) {
                cellStyle.color = cell.textColor;
                hasOverride = true;
            }
            if (cell.fontSize != null) {
                cellStyle.fontSize = cell.fontSize;
                hasOverride = true;
            }
            if (cell.isOverstriking || globalBold) {
                cellStyle.fontWeight = 'bold';
                hasOverride = true;
            }
            if (cell.textAlignment != null) {
                cellStyle.textAlign = mapTextAlign(cell.textAlignment);
                hasOverride = true;
            }
            if (cell.textPaddingHorizontal != null) {
                cellStyle.padding = [0, cell.textPaddingHorizontal];
                hasOverride = true;
            }

            if (!hasOverride) continue;

            const styleKey = JSON.stringify(cellStyle);
            let styleId;
            if (styleCache.has(styleKey)) {
                styleId = styleCache.get(styleKey);
            } else {
                styleId = `cs_${customCellStyle.length}`;
                styleCache.set(styleKey, styleId);
                customCellStyle.push({ id: styleId, style: cellStyle });
            }

            customCellStyleArrangement.push({
                cellPosition: { col: colIdx, row: rowIdx },
                customStyleId: styleId,
            });
        }
    }

    return { customCellStyle, customCellStyleArrangement };
}

/**
 * Convert DataSource[][] to VTable format.
 *
 * @param {Array<Array<object>>} dataSource - 2D array of DataSource cells.
 * @param {object} options
 * @returns {{ records, columns, mergedCells, customCellStyle, customCellStyleArrangement }}
 */
export function convertDataSourceToVTable(dataSource, options = {}) {
    if (!dataSource || dataSource.length === 0) {
        return { records: [], columns: [], mergedCells: [], customCellStyle: [], customCellStyleArrangement: [] };
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

    // --- Build columns ---
    const columns = [];
    const ignoreLocksSet = new Set((ignoreLocks || []).map(i => i - 1));

    for (let colIdx = 0; colIdx < colCount; colIdx++) {
        const headerCell = dataSource[0]?.[colIdx] ?? {};
        const colWidthConfig = columnsWidthMap[String(colIdx)];

        let lockInfo = null;
        const isPermanentlyFrozen = colIdx < frozenColumns;
        const isIgnored = ignoreLocksSet.has(colIdx);

        if (!isPermanentlyFrozen && !isIgnored) {
            if (frozenAbility && frozenAbility[String(colIdx)] != null) {
                lockInfo = { showLock: true, isLocked: !!frozenAbility[String(colIdx)].locked };
            } else if (permutable) {
                lockInfo = { showLock: true, isLocked: false };
            }
        }

        const colMinWidth = colWidthConfig?.minWidth ?? minWidth;
        const colMaxWidth = colWidthConfig?.maxWidth ?? maxWidth;

        const column = {
            field: String(colIdx),
            title: headerCell.title ?? '',
            // 'auto': VTable calculates width based on content, clamped by min/max
            width: 'auto',
            minWidth: colMinWidth,
            maxWidth: colMaxWidth,
            style: buildColumnStyle(headerCell, itemConfig),
            headerStyle: buildColumnStyle(headerCell, itemConfig),
            // Disable interaction effects
            disableHover: true,
            disableSelect: true,
            disableHeaderHover: true,
            disableHeaderSelect: true,
        };

        if (lockInfo) {
            column.__lockInfo = lockInfo;
        }

        columns.push(column);
    }

    // --- Build records (body rows, skip header rows) ---
    const records = [];
    for (let rowIdx = headerRowCount; rowIdx < dataSource.length; rowIdx++) {
        const row = dataSource[rowIdx];
        const record = { __rowIndex: rowIdx };

        for (let colIdx = 0; colIdx < colCount; colIdx++) {
            const cell = row?.[colIdx] ?? {};
            record[String(colIdx)] = cell.title ?? '';
            record[`__meta_${colIdx}`] = buildCellMeta(cell);
        }

        records.push(record);
    }

    // --- Compute merged cells ---
    const mergedCells = computeMergedCells(dataSource, headerRowCount);

    // --- Compute per-cell style overrides ---
    const { customCellStyle, customCellStyleArrangement } = buildCellStyleArrangements(dataSource, itemConfig);

    return { records, columns, mergedCells, customCellStyle, customCellStyleArrangement };
}

/**
 * Compute the effective initial frozenColCount from frozenAbility + frozenColumns.
 * Logic matches iOS: frozenColumns are permanently frozen, frozenAbility columns
 * with locked:true extend the frozen range consecutively.
 *
 * @param {object} frozenAbility - { [colIndex]: { locked: boolean } }
 * @param {number} frozenColumns - Number of permanently frozen columns
 * @param {number} colCount - Total number of columns
 * @returns {number} Effective initial frozen column count
 */
export function computeInitialFrozenColCount(frozenAbility, frozenColumns, colCount) {
    let frozenColCount = frozenColumns || 0;
    if (!frozenAbility || typeof frozenAbility !== 'object') return frozenColCount;

    // Scan from frozenColumns outward, find consecutive locked columns
    for (let i = frozenColCount; i < colCount; i++) {
        const entry = frozenAbility[String(i)];
        if (entry && entry.locked) {
            frozenColCount = i + 1;
        } else if (entry) {
            // Has frozenAbility entry but not locked → stop here
            break;
        }
    }

    return frozenColCount;
}

/**
 * Build VTable theme object from ReportTable props.
 */
export function buildVTableTheme(props) {
    const { lineColor, itemConfig = {}, showBorder = false } = props;

    const borderColor = lineColor || '#e8e8e8';
    const bgColor = itemConfig.backgroundColor || '#FFFFFF';
    const fontSize = itemConfig.fontSize || 14;
    const textColor = itemConfig.textColor || '#222222';
    const textAlign = mapTextAlign(itemConfig.textAlignment ?? 0);
    const isBold = !!itemConfig.isOverstriking;
    const fontWeight = isBold ? 'bold' : 'normal';
    const padding = [0, itemConfig.textPaddingHorizontal ?? 12];

    return {
        defaultStyle: {
            fontSize, color: textColor, bgColor, textAlign, fontWeight, padding,
            borderColor, borderLineWidth: 1,
        },
        headerStyle: {
            fontSize, color: textColor, bgColor, textAlign, fontWeight, padding,
            borderColor, borderLineWidth: 1,
        },
        bodyStyle: {
            fontSize, color: textColor, bgColor, textAlign, fontWeight, padding,
            borderColor, borderLineWidth: 1,
        },
        frameStyle: {
            borderColor,
            borderLineWidth: showBorder ? 1 : 0,
        },
        scrollStyle: {
            visible: 'none',
            barWidth: 0,
            hoverOn: false,
        },
    };
}

/**
 * Convert updateData params to VTable changeCellValues format.
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
        startRow: y + frozenRows,
        values,
    };
}

/**
 * Convert spliceData params to VTable addRecords/deleteRecords format.
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
