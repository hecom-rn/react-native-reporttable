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
 * @returns {{ records: Array<object>, columns: Array<object>, headerRecords: Array<object> }}
 */
export function convertDataSourceToVTable(dataSource, options = {}) {
    if (!dataSource || dataSource.length === 0) {
        return { records: [], columns: [], headerRecords: [] };
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

        const column = {
            field: String(colIdx),
            title: headerCell.title ?? '',
            // Width configuration
            width: colWidthConfig?.minWidth ?? minWidth,
            minWidth: colWidthConfig?.minWidth ?? minWidth,
            maxWidth: colWidthConfig?.maxWidth ?? maxWidth,
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

    return { records, columns, headerRecords };
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
