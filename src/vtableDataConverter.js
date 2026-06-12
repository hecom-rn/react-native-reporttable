/**
 * vtableDataConverter.js
 *
 * Converts ReportTable DataSource[][] (2D cell matrix) into VTable's
 * { records, columns } format for use with @ohos/vtable ListTable.
 */

/**
 * Normalize a color string to CSS-compatible format.
 * Supports:
 *   - 6-digit hex  #RRGGBB  → passed as-is (valid CSS)
 *   - 8-digit hex  #AARRGGBB (Android / iOS format) → converted to rgba(R,G,B,A)
 *   - Other strings (rgba, named, etc.) → passed as-is
 *
 * @param {string|*} color
 * @returns {string|*}
 */
function normalizeColor(color) {
    if (!color || typeof color !== 'string') return color;
    const raw = color.startsWith('#') ? color.slice(1) : color;
    if (raw.length === 8 && /^[0-9a-fA-F]{8}$/.test(raw)) {
        // AARRGGBB → rgba()
        const a = (parseInt(raw.slice(0, 2), 16) / 255).toFixed(3);
        const r = parseInt(raw.slice(2, 4), 16);
        const g = parseInt(raw.slice(4, 6), 16);
        const b = parseInt(raw.slice(6, 8), 16);
        return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    }
    return color; // 6-digit hex or other formats are already valid CSS
}

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
    const textColor = normalizeColor(cell.textColor ?? itemConfig?.textColor);
    // NOTE: bgColor is intentionally NOT set on column.style.
    // Setting it here would override per-cell customCellStyleArrangement bgColor entries,
    // because column.style takes priority over customCellStyle in VTable.
    // Background color is applied via theme.defaultStyle/bodyStyle/headerStyle instead,
    // where per-cell customCellStyle correctly overrides it.
    const textAlign = mapTextAlign(cell.textAlignment ?? itemConfig?.textAlignment ?? 0);
    const isBold = cell.isOverstriking ?? itemConfig?.isOverstriking ?? false;

    style.fontSize = fontSize;
    if (textColor) style.color = textColor;
    style.textAlign = textAlign;
    // NOTE: fontWeight is intentionally NOT set on column.style.
    // column.style takes priority over customCellStyle/customCellStyleArrangement in VTable,
    // so setting it here would prevent per-cell isOverstriking overrides from working.
    // fontWeight is applied exclusively via customCellStyleArrangement (see buildCellStyleArrangements).
    // Vertical padding ensures autoHeight rows match iOS minHeight behavior.
    // iOS: rowHeight = lineCount*fontSize + (minHeight - fontSize - 3).
    // VTable autoHeight: rowHeight = paddingTop + lineCount*fontSize + paddingBottom.
    // So: vertPad = (minHeight - fontSize - 3) / 2.
    const minHeight = itemConfig?.__minHeight ?? 40;
    const vertPad = Math.max(0, Math.floor((minHeight - fontSize - 3) / 2));
    style.padding = [vertPad, cell.textPaddingHorizontal ?? itemConfig?.textPaddingHorizontal ?? 12];
    style.autoWrapText = true;
    style.lineBreakMode = 'normal';

    return style;
}

/**
 * Build per-cell custom style metadata stored in the record.
 * This is used by customLayout to render special features.
 * @param {object} cell - A single DataSource cell object.
 * @returns {object} Metadata object for custom rendering.
 */
function buildCellMeta(cell, itemConfig) {
    const meta = {
        title: cell.title ?? '',
        keyIndex: cell.keyIndex ?? 0,
    };

    // Basic text styling — merge with itemConfig defaults so vtable_util.js
    // customRender doesn't need a separate itemConfig reference.
    const fontSize = cell.fontSize ?? itemConfig?.fontSize;
    const textColor = normalizeColor(cell.textColor ?? itemConfig?.textColor);
    const isOverstriking = cell.isOverstriking ?? itemConfig?.isOverstriking ?? false;
    const padH = cell.textPaddingHorizontal ?? itemConfig?.textPaddingHorizontal ?? 12;

    if (fontSize != null) meta.fontSize = fontSize;
    if (textColor) meta.textColor = textColor;
    if (cell.backgroundColor != null) meta.backgroundColor = normalizeColor(cell.backgroundColor);
    if (cell.textAlignment != null) meta.textAlign = mapTextAlign(cell.textAlignment);
    else if (itemConfig?.textAlignment != null) meta.textAlign = mapTextAlign(itemConfig.textAlignment);
    if (isOverstriking) meta.fontWeight = 'bold';
    // Always store padding so customRender can use it
    meta.textPaddingHorizontal = cell.textPaddingLeft != null || cell.textPaddingRight != null
        ? padH  // use default as fallback when left/right are set separately
        : padH;
    if (cell.textPaddingLeft != null) meta.textPaddingLeft = cell.textPaddingLeft;
    if (cell.textPaddingRight != null) meta.textPaddingRight = cell.textPaddingRight;

    // Special features — merge itemConfig defaults into progressStyle
    if (cell.progressStyle) {
        const icPs = itemConfig?.progressStyle ?? {};
        meta.progressStyle = {
            height:          cell.progressStyle.height           ?? icPs.height          ?? 20,
            cornerRadius:    cell.progressStyle.cornerRadius     ?? icPs.cornerRadius    ?? 1,
            marginHorizontal:cell.progressStyle.marginHorizontal ?? icPs.marginHorizontal ?? 8,
            startRatio:      cell.progressStyle.startRatio       ?? 0,
            endRatio:        cell.progressStyle.endRatio         ?? 0,
            colors:          (cell.progressStyle.colors ?? []).map(normalizeColor),
        };
        // antsLineStyle — only inherit from itemConfig if cell explicitly sets antsLineStyle.
        // If cell has no antsLineStyle, do NOT apply itemConfig default (per spec).
        const cellAnts = cell.progressStyle.antsLineStyle;
        if (cellAnts) {
            const icAnts = icPs.antsLineStyle || {};
            // cellAnts overrides icAnts defaults
            const mergedAnts = Object.assign({}, icAnts, cellAnts);
            meta.progressStyle.antsLineStyle = {
                color:           normalizeColor(mergedAnts.color           ?? '#222222'),
                lineWidth:       mergedAnts.lineWidth        ?? 1,
                lineDashPattern: mergedAnts.lineDashPattern  ?? [4, 2],
                lineRatio:       mergedAnts.lineRatio        ?? 0,
            };
        }
    }
    if (cell.floatIcon) meta.floatIcon = cell.floatIcon;
    if (cell.extraText) meta.extraText = cell.extraText;
    if (cell.isForbidden) meta.isForbidden = true;
    if (cell.boxLineColor) meta.boxLineColor = normalizeColor(cell.boxLineColor);
    if (cell.classificationLinePosition != null) {
        meta.classificationLinePosition = cell.classificationLinePosition;
        // Resolve color: cell > itemConfig > built-in default (resolved in vtable_util.js)
        const clColor = cell.classificationLineColor ?? itemConfig?.classificationLineColor;
        if (clColor) meta.classificationLineColor = normalizeColor(clColor);
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

    const minHeight = itemConfig?.__minHeight ?? 40;
    const defaultFontSize = itemConfig?.fontSize ?? 14;

    // Precompute per-column bold default from the header row (row 0).
    // Body cells without explicit isOverstriking inherit the header cell's setting.
    // NOTE: fontWeight is NOT set in column.style (column.style > customCellStyle in VTable),
    // so ALL fontWeight must come from customCellStyleArrangement entries.
    const colCount = dataSource[0]?.length ?? 0;
    const colDefaultBold = [];
    for (let c = 0; c < colCount; c++) {
        const headerCell = dataSource[0]?.[c] ?? {};
        colDefaultBold[c] = !!(headerCell.isOverstriking ?? itemConfig?.isOverstriking ?? false);
    }

    for (let rowIdx = 0; rowIdx < dataSource.length; rowIdx++) {
        const row = dataSource[rowIdx];
        if (!row) continue;

        for (let colIdx = 0; colIdx < row.length; colIdx++) {
            const cell = row[colIdx];
            if (!cell) continue;

            const cellStyle = {};
            let hasOverride = false;

            if (cell.backgroundColor != null) {
                cellStyle.bgColor = normalizeColor(cell.backgroundColor);
                hasOverride = true;
            }
            if (cell.textColor != null) {
                cellStyle.color = normalizeColor(cell.textColor);
                hasOverride = true;
            }
            if (cell.fontSize != null) {
                cellStyle.fontSize = cell.fontSize;
                hasOverride = true;
            }
            // Effective bold: cell explicit setting > column header default > itemConfig default.
            // Emit 'bold' for any bold cell; no need to emit 'normal' since VTable DEFAULT is normal.
            const effectiveBold = cell.isOverstriking != null ? !!cell.isOverstriking : colDefaultBold[colIdx];
            if (effectiveBold) {
                cellStyle.fontWeight = 'bold';
                hasOverride = true;
            }
            if (cell.textAlignment != null) {
                cellStyle.textAlign = mapTextAlign(cell.textAlignment);
                hasOverride = true;
            }
            if (cell.textPaddingHorizontal != null) {
                const fs = cell.fontSize ?? defaultFontSize;
                const vertPad = Math.max(0, Math.floor((minHeight - fs - 3) / 2));
                cellStyle.padding = [vertPad, cell.textPaddingHorizontal];
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
        lineColor,
    } = options;

    const colCount = dataSource[0]?.length ?? 0;
    // VTable ListTable can show a single header row built from columns.title.
    // When frozenRows > 0, dataSource[0] becomes the VTable header row (frozen).
    // When frozenRows === 0, dataSource[0] is rendered as the first body row and
    // no rows are frozen, matching iOS/Android behavior.
    const showHeader = frozenRows > 0;
    const headerRowCount = showHeader ? 1 : 0;

    // Pre-compute which columns are covered (non-anchor) in the first header row (row 0).
    // Covered columns in merged header cells should NOT show lock icons.
    const headerCoveredCols = new Set();
    if (dataSource[0]) {
        const headerRow0 = dataSource[0];
        let hc = 0;
        while (hc < colCount) {
            const hCell = headerRow0[hc];
            if (!hCell || hCell.keyIndex == null) { hc++; continue; }
            const hKeyIndex = hCell.keyIndex;
            let hSpan = 1;
            while (hc + hSpan < colCount) {
                const hn = headerRow0[hc + hSpan];
                if (hn && hn.keyIndex === hKeyIndex) hSpan++;
                else break;
            }
            for (let s = 1; s < hSpan; s++) headerCoveredCols.add(hc + s);
            hc += hSpan;
        }
    }

    const ignoreLocksSet = new Set((ignoreLocks || []).map(i => i - 1));

    // Pre-fill lock info from frozenAbility/permutable (before merge propagation).
    const headerLockPropagation = new Map();
    for (let colIdx = 0; colIdx < colCount; colIdx++) {
        const isPermanentlyFrozen = colIdx < frozenColumns;
        const isIgnored = ignoreLocksSet.has(colIdx);
        if (isPermanentlyFrozen || isIgnored) continue;
        if (frozenAbility && frozenAbility[String(colIdx)] != null) {
            headerLockPropagation.set(colIdx, { showLock: true, isLocked: !!frozenAbility[String(colIdx)].locked });
        } else if (permutable) {
            headerLockPropagation.set(colIdx, { showLock: true, isLocked: false });
        }
    }

    // --- Compute merged cells (before records so we can clear non-anchor covered cells) ---
    const mergedCells = computeMergedCells(dataSource, headerRowCount);

    // Propagate frozenAbility/permutable lock info from covered columns to anchor columns
    // for horizontal header merges (matches iOS behavior).
    // iOS iterates all frozenAbility keys and copies values within the merge range to startY,
    // so later keys overwrite earlier ones. We do the same: iterate left-to-right so the
    // rightmost column's lockInfo wins (same as NSDictionary key iteration order in iOS).
    for (const mc of mergedCells) {
        const { start, end } = mc.range;
        if (start.row !== 0 || start.col === end.col) continue;
        for (let c = start.col; c <= end.col; c++) {
            if (headerLockPropagation.has(c)) {
                headerLockPropagation.set(start.col, headerLockPropagation.get(c));
            }
        }
    }

    // --- Build columns ---
    const columns = [];
    for (let colIdx = 0; colIdx < colCount; colIdx++) {
        const headerCell = showHeader ? (dataSource[0]?.[colIdx] ?? {}) : {};
        const colWidthConfig = columnsWidthMap[String(colIdx)];

        // Lock icons are only shown on the VTable header row. When frozenRows=0
        // the header row is hidden, so no column should display a lock icon.
        let lockInfo = null;
        if (showHeader) {
            const isPermanentlyFrozen = colIdx < frozenColumns;
            const isIgnored = ignoreLocksSet.has(colIdx);
            const isHeaderCovered = headerCoveredCols.has(colIdx);
            if (!isPermanentlyFrozen && !isIgnored && !isHeaderCovered) {
                if (headerLockPropagation.has(colIdx)) {
                    lockInfo = headerLockPropagation.get(colIdx);
                }
            }
        }

        const colMaxWidth = colWidthConfig?.maxWidth ?? maxWidth;
        const colMinWidth = Math.min(colWidthConfig?.minWidth ?? minWidth, colMaxWidth);

        const column = {
            field: String(colIdx),
            title: showHeader ? (headerCell.title ?? '') : '',
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

    // Build set of non-anchor merged cell positions (row_col) to avoid text overlap.
    // VTable renders merged cell content via customMergeCell; underlying cells must be empty.
    const mergedCoveredSet = new Set();
    for (const mc of mergedCells) {
        const { start, end } = mc.range;
        for (let r = start.row; r <= end.row; r++) {
            for (let c = start.col; c <= end.col; c++) {
                if (r !== start.row || c !== start.col) {
                    mergedCoveredSet.add(`${r}_${c}`);
                }
            }
        }
    }

    // Aggregate classificationLine from all cells in each merged range into the anchor cell.
    // This handles vertical/horizontal merges where classificationLine may be on covered cells.
    const mergedAnchorClassif = new Map(); // key: "rowIdx_colIdx", value: { pos, color }
    for (const mc of mergedCells) {
        const { start, end } = mc.range;
        let combinedPos = 0;
        let combinedColor = null;
        for (let r = start.row; r <= end.row; r++) {
            for (let c = start.col; c <= end.col; c++) {
                const mcCell = dataSource[r]?.[c];
                if (!mcCell) continue;
                if (mcCell.classificationLinePosition) combinedPos |= mcCell.classificationLinePosition;
                if (!combinedColor) combinedColor = mcCell.classificationLineColor || itemConfig?.classificationLineColor || null;
            }
        }
        if (combinedPos > 0) {
            mergedAnchorClassif.set(`${start.row}_${start.col}`, { pos: combinedPos, color: combinedColor });
        }
    }

    // Store __headerMeta in each column so vtable_util.js can draw classificationLine
    // for header rows (where getRecordByCell returns null).
    for (let colIdx = 0; colIdx < colCount; colIdx++) {
        const hMetaArr = [];
        for (let rowIdx = 0; rowIdx < headerRowCount; rowIdx++) {
            const hCell = dataSource[rowIdx]?.[colIdx] ?? {};
            const isCoveredH = mergedCoveredSet.has(`${rowIdx}_${colIdx}`);
            if (isCoveredH) {
                hMetaArr.push(null);
            } else {
                const hm = { classificationLinePosition: 0, classificationLineColor: null };
                if (hCell.classificationLinePosition) hm.classificationLinePosition = hCell.classificationLinePosition;
                const clColor = hCell.classificationLineColor ?? itemConfig?.classificationLineColor;
                if (clColor) hm.classificationLineColor = normalizeColor(clColor);
                // Aggregate from merged span (covers both this cell and covered cells)
                const anchorKey = `${rowIdx}_${colIdx}`;
                if (mergedAnchorClassif.has(anchorKey)) {
                    const clInfo = mergedAnchorClassif.get(anchorKey);
                    hm.classificationLinePosition |= clInfo.pos;
                    if (!hm.classificationLineColor && clInfo.color) hm.classificationLineColor = normalizeColor(clInfo.color);
                }
                hMetaArr.push(hm.classificationLinePosition > 0 ? hm : null);
            }
        }
        columns[colIdx].__headerMeta = hMetaArr;
    }

    // Post-process column width constraints for progressStyle and icon cells.
    // progressStyle cells must show full text without wrapping (break through maxWidth).
    // Icon cells need extra width for icon + padding.
    for (let c = 0; c < colCount; c++) {
        let hasProgressStyle = false;
        let maxNeededW = columns[c].maxWidth || maxWidth;
        for (let r = headerRowCount; r < dataSource.length; r++) {
            const cell = dataSource[r]?.[c];
            if (!cell) continue;
            const cFontSize = cell.fontSize ?? itemConfig?.fontSize ?? 14;
            const cPadL = cell.textPaddingLeft ?? cell.textPaddingHorizontal ?? itemConfig?.textPaddingHorizontal ?? 12;
            const cPadR = cell.textPaddingRight ?? cell.textPaddingHorizontal ?? itemConfig?.textPaddingHorizontal ?? 12;
            const cTitle = cell.title ?? '';
            if (cell.progressStyle) {
                hasProgressStyle = true;
                // Width will be measured accurately in vtable_util.js via canvas.measureText().
            }
            if (cell.icon) {
                const iW = cell.icon.width ?? 16;
                const iPad = cell.icon.paddingHorizontal ?? 4;
                const needed = cTitle.length * cFontSize * 0.6 + iW + iPad + cPadL + cPadR;
                if (needed > maxNeededW) maxNeededW = needed;
            }
        }
        if (hasProgressStyle) {
            // Mark column so vtable_util.js can measure and set exact width via canvas.measureText().
            columns[c].__progressStyle = true;
            columns[c].style.autoWrapText = false;
            columns[c].headerStyle.autoWrapText = false;
        } else {
            // Also account for header lock icon when present
            if (columns[c].__lockInfo && columns[c].__lockInfo.showLock) {
                const hTitle = columns[c].title || '';
                const hFontSize = columns[c].headerStyle?.fontSize ?? itemConfig?.fontSize ?? 14;
                const hPadH = 12; // default header padding
                const lockNeeded = hTitle.length * hFontSize * 0.6 + 4 + 13 + hPadH * 2; // iPad=4, iW=13
                if (lockNeeded > maxNeededW) maxNeededW = lockNeeded;
            }
            if (maxNeededW > (columns[c].maxWidth || maxWidth)) {
                columns[c].maxWidth = maxNeededW;
            }
        }
    }

    // --- Build records (body rows, skip the header row only when there is one) ---
    const records = [];
    for (let rowIdx = headerRowCount; rowIdx < dataSource.length; rowIdx++) {
        const row = dataSource[rowIdx];
        const record = { __rowIndex: rowIdx };

        for (let colIdx = 0; colIdx < colCount; colIdx++) {
            const cell = row?.[colIdx] ?? {};
            // Clear text for cells covered by a vertical/horizontal merge (non-anchor)
            // to prevent content overlap when VTable renders the merged cell on top.
            const isCovered = mergedCoveredSet.has(`${rowIdx}_${colIdx}`);
            record[String(colIdx)] = isCovered ? '' : (cell.title ?? '');
            const cellMeta = isCovered ? { title: '', keyIndex: cell.keyIndex ?? 0 } : buildCellMeta(cell, itemConfig);
            // Aggregate classificationLine from entire merged span into the anchor cell.
            if (!isCovered) {
                const anchorKey = `${rowIdx}_${colIdx}`;
                if (mergedAnchorClassif.has(anchorKey)) {
                    const clInfo = mergedAnchorClassif.get(anchorKey);
                    const existingPos = cellMeta.classificationLinePosition || 0;
                    cellMeta.classificationLinePosition = existingPos | clInfo.pos;
                    if (!cellMeta.classificationLineColor && clInfo.color) {
                        cellMeta.classificationLineColor = normalizeColor(clInfo.color);
                    }
                }
            }
            record[`__meta_${colIdx}`] = cellMeta;
        }

        records.push(record);
    }

    // --- Compute per-cell style overrides ---
    const { customCellStyle, customCellStyleArrangement } = buildCellStyleArrangements(dataSource, itemConfig);

    // frozenRowCount for VTable is the number of body rows to freeze BEYOND the header.
    // When frozenRows=0 there is no header row, so no extra body rows are frozen.
    const vtableFrozenRowCount = showHeader ? Math.max(0, frozenRows - 1) : 0;

    return { records, columns, mergedCells, customCellStyle, customCellStyleArrangement, frozenRowCount: vtableFrozenRowCount, showHeader };
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

    const borderColor = normalizeColor(lineColor || '#e8e8e8');
    const bgColor = normalizeColor(itemConfig.backgroundColor || '#FFFFFF');
    const fontSize = itemConfig.fontSize || 14;
    const textColor = normalizeColor(itemConfig.textColor || '#222222');
    const textAlign = mapTextAlign(itemConfig.textAlignment ?? 0);
    const isBold = !!itemConfig.isOverstriking;
    const fontWeight = isBold ? 'bold' : 'normal';
    const minHeight = itemConfig?.__minHeight ?? 40;
    const vertPad = Math.max(0, Math.floor((minHeight - fontSize - 3) / 2));
    const padding = [vertPad, itemConfig.textPaddingHorizontal ?? 12];

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
        // VTable applies different theme styles to frozen columns/rows.
        // Keep them identical to the normal body/header styles so that locking
        // a column does not change its text color or background.
        rowHeaderStyle: {
            fontSize, color: textColor, bgColor, textAlign, fontWeight, padding,
            borderColor, borderLineWidth: 1,
        },
        rightFrozenStyle: {
            fontSize, color: textColor, bgColor, textAlign, fontWeight, padding,
            borderColor, borderLineWidth: 1,
        },
        bottomFrozenStyle: {
            fontSize, color: textColor, bgColor, textAlign, fontWeight, padding,
            borderColor, borderLineWidth: 1,
        },
        cornerHeaderStyle: {
            fontSize, color: textColor, bgColor, textAlign, fontWeight, padding,
            borderColor, borderLineWidth: 1,
        },
        frameStyle: {
            borderColor,
            borderLineWidth: showBorder ? 1 : 0,
        },
        frozenColumnLine: {
            // Shadow is controlled dynamically in ArkTS based on horizontal scroll offset.
            // It is applied via controller.updateOption when scrollLeft > 0.
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
export function convertUpdateData(data, x, y) {
    const values = [];
    for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
        const rowValues = [];
        for (let colIdx = 0; colIdx < (data[rowIdx]?.length ?? 0); colIdx++) {
            const cell = data[rowIdx][colIdx];
            rowValues.push(cell?.title ?? '');
        }
        values.push(rowValues);
    }
    // Cross-platform alignment: iOS native treats `y` as a full-data index
    // (data[0] is the header). VTable row indices match the original data
    // indices because the header row (when present) is row 0.
    return {
        startCol: x,
        startRow: y,
        values,
    };
}

/**
 * Convert spliceData params to VTable addRecords/deleteRecords format.
 *
 * Cross-platform note:
 *   - iOS native receives `y` as a full-data index (data[0] is the header row).
 *   - Android native also receives `y` as a full-data index.
 *   - VTable's `records` array starts at dataSource[headerRowCount].
 *     headerRowCount is 1 when showHeader=true, 0 when showHeader=false.
 */
export function convertSpliceData(params, colCount, itemConfig = {}, headerRowCount = 1) {
    const operations = [];
    for (const item of params) {
        const { data = [], l = 0, y = 0 } = item;
        // `y` is a full-data index. Convert to body index.
        const bodyY = Math.max(0, y - headerRowCount);

        const deleteIndices = [];
        for (let i = 0; i < l; i++) {
            deleteIndices.push(bodyY + i);
        }

        const newRecords = [];
        for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
            const row = data[rowIdx];
            const record = { __rowIndex: bodyY + rowIdx };
            for (let colIdx = 0; colIdx < colCount; colIdx++) {
                const cell = row?.[colIdx] ?? {};
                record[String(colIdx)] = cell.title ?? '';
                record[`__meta_${colIdx}`] = buildCellMeta(cell, itemConfig);
            }
            newRecords.push(record);
        }

        operations.push({ deleteIndices, addAtIndex: bodyY, newRecords });
    }
    return operations;
}
