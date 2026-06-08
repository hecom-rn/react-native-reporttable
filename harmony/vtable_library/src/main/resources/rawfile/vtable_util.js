var h5Port;
var output = document.querySelector('.output');

// ---- Lock icon SVG data URI helpers ----
var _lockLockedSvgUrl = null;
var _lockUnlockedSvgUrl = null;
function getLockIconUrl(locked) {
    if (locked) {
        if (!_lockLockedSvgUrl) {
            _lockLockedSvgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
                '<path fill="#555555" d="M12 2C9.24 2 7 4.24 7 7V10H5V20H19V10H17V7C17 4.24 14.76 2 12 2Z' +
                'M9 7C9 5.34 10.34 4 12 4S15 5.34 15 7V10H9V7ZM12 17C10.9 17 10 16.1 10 15S' +
                '10.9 13 12 13 14 13.9 14 15 13.1 17 12 17Z"/></svg>'
            );
        }
        return _lockLockedSvgUrl;
    } else {
        if (!_lockUnlockedSvgUrl) {
            _lockUnlockedSvgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
                '<path fill="#aaaaaa" d="M18 8H17V6C17 3.24 14.76 1 12 1S7 3.24 7 6H9C9 4.34 10.34 3 12 3S' +
                '15 4.34 15 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10' +
                'C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15S10.9 13 12 13 14 13.9 14 15 13.1 17 12 17Z"/></svg>'
            );
        }
        return _lockUnlockedSvgUrl;
    }
}

var eventMap = {
    "INITIALIZED": eventCallback,
    "UPDATED": eventCallback,
    "CLICK_CELL": eventCallback,
    "DBLCLICK_CELL": eventCallback,
    "SELECTED_CHANGED": eventCallback,
    "SELECTED_CLEAR": eventCallback,
    "SCROLL": eventCallback,
    "SCROLL_HORIZONTAL_END": eventCallback,
    "SCROLL_VERTICAL_END": eventCallback,
    "CHANGE_CELL_VALUE": eventCallback
}

var eventList = [
    'INITIALIZED',
    'UPDATED',
    'CLICK_CELL',
    'DBLCLICK_CELL',
    'SELECTED_CHANGED',
    'SELECTED_CLEAR',
    'SCROLL',
    'SCROLL_HORIZONTAL_END',
    'SCROLL_VERTICAL_END',
    'CHANGE_CELL_VALUE'
]

function extractCellClickData(data) {
    if (!data) return null;

    return {
        col: data.col,
        row: data.row,
        field: data.field || '',
        title: data.title || '',
        cellType: data.cellType || '',
        originData: data.originData || {},
        cellRange: data.cellRange ? {
            bounds: data.cellRange.bounds ? {
                x1: data.cellRange.bounds.x1 || 0,
                y1: data.cellRange.bounds.y1 || 0,
                x2: data.cellRange.bounds.x2 || 0,
                y2: data.cellRange.bounds.y2 || 0
            } : { x1: 0, y1: 0, x2: 0, y2: 0 }
        } : { bounds: { x1: 0, y1: 0, x2: 0, y2: 0 } },
        value: String(data.value || ''),
        dataValue: String(data.dataValue || ''),
        cellLocation: data.cellLocation || '',
        scaleRatio: data.scaleRatio || 1.0
    };
}

var eventCallback = (type, data) => {
    let filteredData = null;

    switch (type) {
        case "CLICK_CELL":
        case "DBLCLICK_CELL":
            filteredData = extractCellClickData(data);
            break;

        case "SELECTED_CHANGED":
        case "CHANGE_CELL_VALUE":
        case "SCROLL_VERTICAL_END":
        case "SCROLL_HORIZONTAL_END":
        case "SCROLL":
            filteredData = data
            break;

        case "UPDATED":
        case "SELECTED_CLEAR":
        case "INITIALIZED":
            filteredData = {};
            break;

        default:
            console.warn(`Unknown event type: ${type}`);
            return;
    }

    // 构建发送数据
    let newData = {
        type: type,
        data: JSON.stringify(filteredData)
    };

    // 发送到ETS端
    PostMsgToEts(JSON.stringify(newData));

    // 调试日志
    console.log(`[${type}] 发送数据:`, {
        type: type,
        dataSize: JSON.stringify(filteredData).length,
        dataPreview: JSON.stringify(filteredData).substring(0, 100) + '...'
    });

    if (type === 'CHANGE_CELL_VALUE') {
        let aa = window.tableInstance.getSelectedCellInfos()
        if (aa[0][0].col !== aa[aa.length - 1][aa[0].length - 1].col || aa[0][0].row !== aa[aa.length - 1][aa[0].length - 1].row) {
            console.log("=====> getSelectedCellInfos", JSON.stringify(aa[0][0].col))
            window.tableInstance.unmergeCells(aa[0][0].col, aa[0][0].row, aa[aa.length - 1][aa[0].length - 1].col, aa[aa.length - 1][aa[0].length - 1].row)
            window.tableInstance.mergeCells(aa[0][0].col, aa[0][0].row, aa[aa.length - 1][aa[0].length - 1].col, aa[aa.length - 1][aa[0].length - 1].row)
        }
    }
}

// 冻结指定列数，使左侧指定数量的列固定不动
function frozenToCol(index) {
    if (!window.tableInstance) {
        console.error('表格实例未找到');
        return;
    }
    window.tableInstance.setFrozenColCount(index);
    console.log("=====> frozenToCol", JSON.stringify(window.tableInstance.options.frozenRowCount))
}

// 冻结指定行数，使上方指定数量的行固定不动
function frozenRow(index) {
    if (!window.tableInstance) {
        console.error('表格实例未找到');
        return;
    }
    window.tableInstance.frozenRowCount = index;
    renderWithRecreateCells()
}

// 合并指定范围的单元格
function mergeCell(startCol, startRow, endCol, endRow) {
    if (startCol == endCol && startRow == endRow) {
        return;
    }

    if (!window.tableInstance) {
        console.error('表格实例未找到');
        return;
    }
    console.log("=====> unmergeCells", JSON.stringify(window.tableInstance.editorManager.editingEditor))
    for (let i = startCol; i <= endCol; i++) {
        for (let j = startRow; j <= endRow; j++) {
            a_ = window.tableInstance.getCellRange(i, j)
            console.log("=====> unmergeCellsrange a_", JSON.stringify(a_.start))
            console.log("=====> unmergeCellsrange a_", JSON.stringify(a_.end))
            if (a_.start.col != a_.end.col || a_.start.row != a_.end.row) {
                return
            }
        }
    }

    const cellnumber = window.tableInstance.getCellValue(startCol, startRow, true);
    console.log("=====> mergeCell", JSON.stringify(cellnumber))
    for (let i = startCol; i <= endCol; i++) {
        for (let j = startRow; j <= endRow; j++) {
            window.tableInstance.changeCellValue(i, j, cellnumber);
        }
    }
    window.tableInstance.mergeCells(startCol, startRow, endCol, endRow);
}
// 取消指定合并
function unmergeCells(startCol, startRow, endCol, endRow) {
    if (!window.tableInstance) {
        console.error('表格实例未找到');
        return;
    }
    let hasMergeCells = false;
    console.log("=====> unmergeCells", JSON.stringify(window.tableInstance.editorManager.editingEditor))
    let a
    for (let i = startCol; i <= endCol; i++) {
        for (let j = startRow; j <= endRow; j++) {
            a_ = window.tableInstance.getCellRange(i, j)
            console.log("=====> unmergeCellsrange a_", JSON.stringify(a_.start))
            console.log("=====> unmergeCellsrange a_", JSON.stringify(a_.end))
            if (a_.start.col != a_.end.col || a_.start.row != a_.end.row) {
                hasMergeCells = true
                a = a_
                console.log("=====> unmergeCellsrange", JSON.stringify(a))
            }
        }
    }
    console.log("=====> unmergeCells", JSON.stringify(hasMergeCells))
    if (hasMergeCells) {
        // if (startCol !== endCol || startRow !== endRow) {
        const cellnumber = window.tableInstance.getCellValue(a.start.col, a.start.row, true);
        console.log("=====> unmergeCells", JSON.stringify(a))

        for (let i = a.start.col; i <= a.end.col; i++) {
            for (let j = a.start.row; j <= a.end.row; j++) {
                if (i === a.start.col && j === a.start.row) {
                    window.tableInstance.changeCellValue(i, j, cellnumber);
                    console.log("=====> unmergeCells", JSON.stringify(i), JSON.stringify(j))
                } else {
                    window.tableInstance.changeCellValue(i, j, '');
                }
            }

        }
        window.tableInstance.unmergeCells(a.start.col, a.start.row, a.end.col, a.end.row);
        // }
        deleteDiagonal(startCol, startRow, endCol, endRow)
    }
}

// 自定义渲染
function customRender(startCol, startRow, endCol, endRow, id, style) {
    const newcolumn = {
        ...optionTemp.columns[2],

    }
    // const aa = window.tableInstance.getCustomCellStyle(startCol, startRow)
    console.log("=====> customRender", JSON.stringify(optionTemp.columns[2]))
    console.log("=====> customRender", JSON.stringify(newcolumn))
    // console.log("=====> customRender", JSON.stringify(aa.borderLineWidth))
    const styleObj = {
        borderColor: style,
        borderLineWidth: 4
    }
    window.tableInstance.registerCustomCellStyle(id, style);

    const pos = {
        range: {
            start: {
                col: startCol,
                row: startRow
            },
            end: {
                col: endCol,
                row: endRow
            }
        }
    }
    window.tableInstance.arrangeCustomCellStyle(pos, id)
}
// 自定义渲染复原
function customRenderRestore(startCol, startRow, endCol, endRow) {
    const style = window.tableInstance.theme.style

    window.tableInstance.registerCustomCellStyle('none', style)
    const pos = {
        range: {
            start: {
                col: startCol,
                row: startRow
            },
            end: {
                col: endCol,
                row: endRow
            }
        }
    }
    window.tableInstance.arrangeCustomCellStyle(pos, 'none')
}
var optionTemp

// ============================================================
// ReportTable custom cell render — injected into vtable_util.js
// Reads __meta_<col> from records and renders special features:
//   progressStyle, gradient, classificationLinePosition,
//   isForbidden, boxLineColor, extraText, floatIcon, icon, richText
// ============================================================

/**
 * Attach a customRender function to every column in the option.
 * Must be called before new VTable.ListTable() and before updateOption().
 */
function addCustomRenderToColumns(columns) {
    if (!Array.isArray(columns)) return;
    for (var i = 0; i < columns.length; i++) {
        columns[i].customRender = buildCellRender();
    }
}

/**
 * Returns a customRender function.
 * Column index is NOT needed as a closure — args.col gives the actual column
 * at render time, which is used to read __meta_<col> from the record.
 * (The old buildCellRender(i) approach had a var-hoisting bug where all columns
 * would end up referencing the same final value of i.)
 */
function buildCellRender() {
    return function(args) {
        var col = args.col;
        var row = args.row;
        var w = args.rect.width;
        var h = args.rect.height;

        // getRecordByCell returns null for header rows — let VTable handle them.
        var record = args.table.getRecordByCell(col, row);
        if (!record) return { renderDefault: true };

        var meta = record['__meta_' + col];
        if (!meta) return { renderDefault: true };

        var hasBackground = !!(meta.gradient || meta.progressStyle);
        var hasOverlay = !!(
            meta.isForbidden ||
            meta.boxLineColor ||
            (meta.classificationLinePosition && meta.classificationLinePosition > 0) ||
            meta.floatIcon ||
            meta.extraText
        );
        var hasCustomText = !!(meta.icon || (meta.richText && meta.richText.length > 0));

        // No special features — let VTable render natively (fastest path).
        if (!hasBackground && !hasOverlay && !hasCustomText) {
            return { renderDefault: true };
        }

        var elements = [];

        // Read style values directly from meta (set by vtableDataConverter.js buildCellMeta).
        // Avoid getCellStyle() — it's slow when called per-cell on every render.
        var padH       = meta.textPaddingHorizontal || 12;
        var padLeft    = meta.textPaddingLeft  != null ? meta.textPaddingLeft  : padH;
        var padRight   = meta.textPaddingRight != null ? meta.textPaddingRight : padH;
        var fontSize   = meta.fontSize   || 14;
        var textColor  = meta.textColor  || '#222222';
        var fontWeight = meta.fontWeight || 'normal';
        var textAlign  = meta.textAlign  || 'left';

        // ---- 1. Gradient background ----
        if (meta.gradient) {
            var gColors = meta.gradient.colors;
            var gStart  = meta.gradient.start;
            var gEnd    = meta.gradient.end;
            var gStops  = [];
            for (var gi = 0; gi < gColors.length; gi++) {
                gStops.push({ offset: gi / Math.max(gColors.length - 1, 1), color: gColors[gi] });
            }
            elements.push({
                type: 'rect',
                x: 0, y: 0, width: w, height: h,
                fill: {
                    gradient: 'linear',
                    x0: gStart.x * w, y0: gStart.y * h,
                    x1: gEnd.x * w,   y1: gEnd.y * h,
                    stops: gStops
                },
                pickable: false
            });
        }

        // ---- 2. Progress bar ----
        if (meta.progressStyle) {
            var ps       = meta.progressStyle;
            var pHeight  = ps.height           || 20;
            var pRadius  = ps.cornerRadius     || 1;
            var pMarginH = ps.marginHorizontal || 8;
            var pBarW    = w - pMarginH * 2;
            var pStartX  = pMarginH + pBarW * (ps.startRatio || 0);
            var pEndX    = pMarginH + pBarW * (ps.endRatio   || 0);
            var pW       = pEndX - pStartX;
            var pBarY    = (h - pHeight) / 2;

            if (ps.colors && ps.colors.length > 0) {
                var pFill;
                if (ps.colors.length === 1) {
                    pFill = ps.colors[0];
                } else {
                    var pStops = [];
                    for (var pi = 0; pi < ps.colors.length; pi++) {
                        pStops.push({ offset: pi / Math.max(ps.colors.length - 1, 1), color: ps.colors[pi] });
                    }
                    pFill = { gradient: 'linear', x0: 0, y0: 0, x1: pW, y1: 0, stops: pStops };
                }
                elements.push({
                    type: 'rect',
                    x: pStartX, y: pBarY, width: pW, height: pHeight,
                    cornerRadius: pRadius,
                    fill: pFill,
                    pickable: false
                });
            }

            // Ants dashed line
            if (ps.antsLineStyle && ps.antsLineStyle.lineRatio != null) {
                var al    = ps.antsLineStyle;
                var alX   = pMarginH + pBarW * al.lineRatio;
                elements.push({
                    type: 'line',
                    points: [{ x: alX, y: pBarY }, { x: alX, y: pBarY + pHeight }],
                    stroke:   al.color            || '#222222',
                    lineWidth: al.lineWidth        || 1,
                    lineDash:  al.lineDashPattern  || [4, 2],
                    pickable: false
                });
            }
        }

        // ---- 3. Main text (only when we own the render, i.e. renderDefault=false) ----
        if (hasBackground || hasCustomText) {
            var textX = padLeft;
            var textY = h / 2;
            var anchor = 'left';
            if (textAlign === 'center') { textX = w / 2; anchor = 'center'; }
            else if (textAlign === 'right') { textX = w - padRight; anchor = 'right'; }
            var maxLineWidth = w - padLeft - padRight;

            if (meta.richText && meta.richText.length > 0) {
                // Rich text segments
                var curX = padH;
                for (var ri = 0; ri < meta.richText.length; ri++) {
                    var seg  = meta.richText[ri];
                    var rs   = seg.style || {};
                    var rFs  = rs.fontSize   || fontSize;
                    var rCol = rs.textColor  || textColor;
                    var rFw  = rs.isOverstriking ? 'bold' : fontWeight;
                    var rCw  = rFs * 0.6;
                    var rW   = seg.text.length * rCw;

                    if (rs.backgroundColor) {
                        var rPadH = rs.paddingHorizontal || rFs * 0.4;
                        var rHt   = rs.height            || rFs * 1.5;
                        elements.push({
                            type: 'rect',
                            x: curX - rPadH, y: textY - rHt / 2,
                            width: rW + rPadH * 2, height: rHt,
                            fill: rs.backgroundColor,
                            cornerRadius: rs.borderRadius || 0,
                            stroke:    rs.borderColor,
                            lineWidth: rs.borderWidth || 0,
                            pickable: false
                        });
                    }
                    elements.push({
                        type: 'text',
                        x: curX, y: textY,
                        text: seg.text,
                        fontSize: rFs, fill: rCol, fontWeight: rFw,
                        textBaseline: 'middle',
                        textDecoration: rs.strikethrough ? 'line-through' : 'none',
                        pickable: false
                    });
                    curX += rW + 4;
                }

            } else if (meta.icon) {
                // Icon + text
                var icon     = meta.icon;
                var iW       = icon.width  || 16;
                var iH       = icon.height || 16;
                var iPad     = icon.paddingHorizontal != null ? icon.paddingHorizontal : 4;
                var iAlign   = icon.imageAlignment || 3; // 1=left, 3=right(default)
                var iText    = meta.title || '';
                var iTextW   = iText.length * fontSize * 0.6;
                var iTotalW  = iTextW + iW + iPad;
                var iStartX;
                if (textAlign === 'center') iStartX = (w - iTotalW) / 2;
                else if (textAlign === 'right') iStartX = w - padRight - iTotalW;
                else iStartX = padLeft;
                var iY = (h - iH) / 2;
                var iconX, tX;
                if (iAlign === 1) { // icon left
                    iconX = iStartX;
                    tX    = iStartX + iW + iPad;
                } else { // icon right (default)
                    tX    = iStartX;
                    iconX = iStartX + iTextW + iPad;
                }
                elements.push({
                    type: 'image',
                    x: iconX, y: iY, width: iW, height: iH,
                    image: (icon.path && icon.path.uri) ? icon.path.uri : (icon.name || ''),
                    pickable: false
                });
                elements.push({
                    type: 'text',
                    x: tX, y: textY,
                    text: iText,
                    fontSize: fontSize, fill: textColor, fontWeight: fontWeight,
                    textBaseline: 'middle',
                    maxLineWidth: maxLineWidth - iW - iPad,
                    ellipsis: '...',
                    pickable: false
                });

            } else {
                // Plain text over background
                elements.push({
                    type: 'text',
                    x: textX, y: textY,
                    text: meta.title || '',
                    fontSize: fontSize, fill: textColor, fontWeight: fontWeight,
                    textAlign: anchor,
                    textBaseline: 'middle',
                    maxLineWidth: maxLineWidth,
                    ellipsis: '...',
                    pickable: false
                });
            }
        }

        // ---- 4. Overlay elements (rendered on top when renderDefault=true, or after text) ----

        // Forbidden diagonal
        if (meta.isForbidden) {
            elements.push({
                type: 'line',
                points: [{ x: 0, y: 0 }, { x: w, y: h }],
                stroke: '#ff0000', lineWidth: 1,
                pickable: false, cursor: 'default'
            });
        }

        // Box inner border
        if (meta.boxLineColor) {
            elements.push({
                type: 'rect',
                x: 0.5, y: 0.5, width: w - 1, height: h - 1,
                stroke: meta.boxLineColor, lineWidth: 1,
                fill: 'transparent',
                pickable: false
            });
        }

        // Classification separator lines
        if (meta.classificationLinePosition && meta.classificationLinePosition > 0) {
            var clColor = meta.classificationLineColor || '#9cb3c8';
            var clPos   = meta.classificationLinePosition;
            if (clPos & 1) elements.push({ type: 'line', points: [{ x: 0, y: 0 },   { x: w, y: 0 }],   stroke: clColor, lineWidth: 1, pickable: false });
            if (clPos & 2) elements.push({ type: 'line', points: [{ x: w-1, y: 0 }, { x: w-1, y: h }], stroke: clColor, lineWidth: 1, pickable: false });
            if (clPos & 4) elements.push({ type: 'line', points: [{ x: 0, y: h-1 }, { x: w, y: h-1 }], stroke: clColor, lineWidth: 1, pickable: false });
            if (clPos & 8) elements.push({ type: 'line', points: [{ x: 0, y: 0 },   { x: 0, y: h }],   stroke: clColor, lineWidth: 1, pickable: false });
        }

        // Extra badge text
        if (meta.extraText) {
            var et    = meta.extraText;
            var etBg  = et.backgroundStyle || {};
            var etTs  = et.style || {};
            var etBW  = etBg.width  || 20;
            var etBH  = etBg.height || 14;
            var etBX  = (et.isLeft) ? padLeft : w - padRight - etBW;
            var etBY  = 2;
            elements.push({
                type: 'rect',
                x: etBX, y: etBY, width: etBW, height: etBH,
                fill: etBg.color || '#ff0000',
                cornerRadius: etBg.radius || 2,
                pickable: false
            });
            elements.push({
                type: 'text',
                x: etBX + etBW / 2, y: etBY + etBH / 2,
                text: et.text || '',
                fontSize: etTs.fontSize || 10,
                fill: etTs.color || '#ffffff',
                textAlign: 'center', textBaseline: 'middle',
                pickable: false
            });
        }

        // Float icon overlay
        if (meta.floatIcon) {
            var fi = meta.floatIcon;
            var fiX = 0, fiY = 0;
            if (fi.left  != null) fiX = fi.left;
            else if (fi.right != null)  fiX = w - fi.right  - (fi.width  || 16);
            if (fi.top   != null) fiY = fi.top;
            else if (fi.bottom != null) fiY = h - fi.bottom - (fi.height || 16);
            elements.push({
                type: 'image',
                x: fiX, y: fiY, width: fi.width || 16, height: fi.height || 16,
                image: (fi.path && fi.path.uri) ? fi.path.uri : (fi.name || ''),
                pickable: false
            });
        }

        // renderDefault: true  → VTable renders text first, our elements overlay on top
        // renderDefault: false → We rendered text ourselves (background cells), no double-draw
        return { elements: elements, renderDefault: !hasBackground && !hasCustomText };
    };
}

function customIcon() {
}

function initializeTable(option) {

    optionTemp = option;
    option.theme = VTable.themes.DEFAULT.extends({
        frozenColumnLine: {
            shadow: {
                width: 4,
                startColor: 'rgba(0,0,0,0.08)',
                endColor: 'transparent'
            }
        },
        scrollStyle: {
            visible: "none"
        },
        headerStyle: {
            hover: {
                cellBgColor: 'transparent'
            }
        },
        bodyStyle: {
            hover: {
                cellBgColor: 'transparent',
            }
        }
    })

    const input_editor = new VTable.editors.InputEditor();
    VTable.register.editor('input-editor', input_editor);

    // Attach customRender to all columns before creating the table instance.
    // Functions are stripped by JSON.stringify in ArkTS, so we inject them here
    // inside the WebView where they can reference the live VRender primitives.
    addCustomRenderToColumns(option.columns);

    const tableInstance = new VTable.ListTable(document.getElementById('tableContainer'), option);
    eventList.forEach(eventName => {
        tableInstance.on(VTable.ListTable.EVENT_TYPE[eventName], (event) => {
            if (eventName === 'CLICK_CELL') {
                // tableInstance.eventManager.isDraging = false;
                // renderWithRecreateCells();

                // 仅执行单选（可选，确保点击只选中当前单元格）
                // tableInstance.stateManager.updateSelectPosition(
                //     event.col, event.row, false, false, false
                // );
                // console.log("=====> CLICK_CELL3", JSON.stringify(tableInstance.eventManager.isDraging))
            }
            eventCallback(eventName, event);
        });
    })
    window.tableInstance = tableInstance;

    const height = tableInstance.getRowHeight(1)
    tableInstance.setRowHeight(1, height)
}

// 滚动到行
function scrollToRow(rowIndex) {
    window.tableInstance.scrollToRow(rowIndex);
}

// 滚动到列
function scrollToCol(colIndex) {
    window.tableInstance.scrollToCol(colIndex);
}

// 滚动到单元格
function scrollToRowCol(cellAddr) {
    window.tableInstance.scrollToCell(cellAddr);
}

// 设置列宽
function setColWidth(colIndex, width) {
    window.tableInstance.setColWidth(colIndex, width);
}

// 设置行高
function setRowHeight(rowIndex, height) {
    window.tableInstance.setRowHeight(rowIndex, height);
}

// 更新列配置
function updateColumns(newColumns) {
    window.tableInstance.updateColumns(newColumns, { clearColWidthCache: true });
}

// 设置分割线颜色
function setSplitLineColor(colors) {
    const currentTheme = window.tableInstance.theme.extends({
        headerStyle: {
            borderColor: colors
        },
        bodyStyle: {
            borderColor: colors
        }
    });
    window.tableInstance.updateTheme(currentTheme);
}


window.addEventListener('message', function (event) {
    if (event.data === '__init_port__') {
        if (event.ports[0] !== null) {
            h5Port = event.ports[0]; // 1. 保存从应用侧发送过来的端口。
            h5Port.onmessage = function (event) {
                // 2. 接收ets侧发送过来的消息。
                var msg = 'Got message from ets:';
                var result = event.data;
                if (typeof (result) === 'string') {
                    console.info(`received string message from ets, string is: ${result}`);
                    msg = msg + result;
                } else if (typeof (result) === 'object') {
                    if (result instanceof ArrayBuffer) {
                        console.info(`received arraybuffer from ets, length is: ${result.byteLength}`);
                        msg = msg + 'length is ' + result.byteLength;
                    } else {
                        console.info('not support');
                    }
                } else {
                    console.info('not support');
                }
                output.innerHTML = msg;
            }
        }
    }
})

function PostMsgToEts(data) {
    if (h5Port) {
        h5Port.postMessage(data);
    } else {
        console.error('h5Port is null, Please initialize first');
    }
}

function release() {
    window.tableInstance.release();
}

function clearSelected() {
    window.tableInstance.clearSelected();
}

function updateOption(options) {
    // Re-attach customRender after every option update — ArkTS serializes columns
    // to JSON which strips functions, so we must re-inject on every update.
    addCustomRenderToColumns(options.columns);
    window.tableInstance.updateOption(options);
}

function renderWithRecreateCells() {
    window.tableInstance.renderWithRecreateCells();
    window.tableInstance.resize();
}

// 缩放
function zoomIn() {
    // console.log("=====> setPixelRatio",JSON.stringify(window.tableInstance.columns[0].icon.width))
    const oldHeaderFontSize = window.tableInstance.theme.headerStyle.fontSize
    const oldBodyFontSize = window.tableInstance.theme.bodyStyle.fontSize
    const newTheme = window.tableInstance.theme.extends({
        headerStyle: {
            fontSize: oldHeaderFontSize * 1.2 < 32 ? oldHeaderFontSize * 1.2 : 32,
        },
        bodyStyle: {
            fontSize: oldBodyFontSize * 1.2 < 32 ? oldBodyFontSize * 1.2 : 32,
        }
    })
    window.tableInstance.updateTheme(newTheme);

    const newColums = window.tableInstance.columns
    for (let i = 0; i < window.tableInstance.columns.length; i++) {
        if (window.tableInstance.columns[i].icon) {
            newColums[i].icon.width = window.tableInstance.columns[i].icon.width * 1.2 < 32 ? window.tableInstance.columns[i].icon.width * 1.2 : 32
            newColums[i].icon.height = window.tableInstance.columns[i].icon.height * 1.2 < 32 ? window.tableInstance.columns[i].icon.height * 1.2 : 32
            console.log("=====> setPixelRatio", JSON.stringify(newColums[i].icon.width))
        } else {
            continue
        }
    }
    window.tableInstance.updateColumns(newColums);
}
function zoomOut() {
    const oldHeaderFontSize = window.tableInstance.theme.headerStyle.fontSize
    const oldBodyFontSize = window.tableInstance.theme.bodyStyle.fontSize
    const newTheme = window.tableInstance.theme.extends({
        headerStyle: {
            fontSize: oldHeaderFontSize / 1.2 > 12 ? oldHeaderFontSize / 1.2 : 12,
        },
        bodyStyle: {
            fontSize: oldBodyFontSize / 1.2 > 12 ? oldBodyFontSize / 1.2 : 12,
        }
    })
    window.tableInstance.updateTheme(newTheme);

    const newColums = window.tableInstance.columns
    for (let i = 0; i < window.tableInstance.columns.length; i++) {
        if (window.tableInstance.columns[i].icon) {
            newColums[i].icon.width = window.tableInstance.columns[i].icon.width / 1.2 > 12 ? window.tableInstance.columns[i].icon.width / 1.2 : 12
            newColums[i].icon.height = window.tableInstance.columns[i].icon.height / 1.2 > 12 ? window.tableInstance.columns[i].icon.height / 1.2 : 12
            console.log("=====> setPixelRatio", JSON.stringify(newColums[i].icon.width))
        } else {
            continue
        }
    }
    window.tableInstance.updateColumns(newColums);
}

var arr = []

function setDiagonal(startCol, startRow, endCol, endRow) {
    const newColumns = window.tableInstance.options.columns;

    const keySet = new Set(arr.map(item => `${item.col},${item.row}`));

    for (let i = startCol; i <= endCol; i++) {
        for (let j = startRow; j <= endRow; j++) {
            const key = `${i},${j}`;
            if (!keySet.has(key)) {
                keySet.add(key);
                arr.push({ col: i, row: j });
            }
        }
    }

    newColumns.map((item) => {
        item.customRender = (args) => {
            colRow_ = { col: args.col, row: args.row }

            const exactExists = arr.some(item =>
                item.col === colRow_.col && item.row === colRow_.row
            );

            if (exactExists) {
                return {
                    elements: [
                        {
                            type: 'line',
                            elementKey: 'diagonal-line',
                            x: 0,
                            y: 0,
                            points: [
                                { x: 0, y: 0 },
                                { x: args.rect.width, y: args.rect.height }
                            ],
                            stroke: '#ff0000',
                            lineWidth: 2,
                            pickable: false,
                            cursor: 'default'
                        }
                    ],
                    renderDefault: true
                }
            } else {
                return {
                    renderDefault: true
                }
            }
        }
    })

    window.tableInstance.updateColumns(newColumns, { clearColWidthCache: true });

    const options = window.tableInstance.options;
    const mergeCells = options?.customMergeCell;
    if (!mergeCells) return;

    const diagonalRender = args => ({
        elements: [{
            type: 'line',
            elementKey: 'diagonal-line',
            x: 0, y: 0,
            points: [{ x: 0, y: 2 }, { x: args.rect.width, y: args.rect.height }],
            stroke: '#ff0000',
            lineWidth: 2,
            pickable: false,
            cursor: 'default'
        }],
        renderDefault: true
    });

    for (let i = 0, len = mergeCells.length; i < len; i++) {
        const item = mergeCells[i];
        const start = item.range.start;
        const end = item.range.end;

        if (start.col < startCol || start.row < startRow) continue;
        if (end.col > endCol || end.row > endRow) continue;

        item.customRender = diagonalRender;
    }

    renderWithRecreateCells();
}

function deleteDiagonal(startCol, startRow, endCol, endRow) {
    const oldLength = arr.length;
    arr = arr.filter(item => {
        return item.col < startCol || item.col > endCol ||
            item.row < startRow || item.row > endRow;
    });

    if (arr.length === oldLength) {
        return;
    }

    const diagonalSet = new Set();
    for (const item of arr) {
        diagonalSet.add(`${item.col},${item.row}`);
    }

    const diagonalRenderCache = (() => {
        const cache = new Map();
        return (width, height) => {
            const key = `${width},${height}`;
            if (!cache.has(key)) {
                cache.set(key, {
                    elements: [{
                        type: 'line',
                        elementKey: 'diagonal-line',
                        x: 0, y: 0,
                        points: [{ x: 0, y: 0 }, { x: width, y: height }],
                        stroke: '#ff0000',
                        lineWidth: 2,
                        pickable: false,
                        cursor: 'default'
                    }],
                    renderDefault: true
                });
            }
            return cache.get(key);
        };
    })();

    const newColumns = window.tableInstance.options.columns;
    const startColIdx = Math.max(0, startCol);
    const endColIdx = Math.min(newColumns.length - 1, endCol);

    for (let colIndex = startColIdx; colIndex <= endColIdx; colIndex++) {
        const column = newColumns[colIndex];
        if (!column) continue;

        let needUpdate = false;
        for (let row = startRow; row <= endRow; row++) {
            if (diagonalSet.has(`${colIndex},${row}`)) {
                needUpdate = true;
                break;
            }
        }

        if (needUpdate) {
            const originalRender = column.customRender;

            column.customRender = (function (oriRender, colIdx) {
                return (args) => {
                    const key = `${args.col},${args.row}`;
                    if (diagonalSet.has(key)) {
                        return diagonalRenderCache(args.rect.width, args.rect.height);
                    }
                    return oriRender ? oriRender(args) : { renderDefault: true };
                };
            })(originalRender, colIndex);
        }
    }

    const options = window.tableInstance.options;
    const mergeCells = options?.customMergeCell;

    if (mergeCells) {
        const mergedDiagonalRender = args => ({
            elements: [{
                type: 'line',
                elementKey: 'diagonal-line-merged',
                x: 0, y: 0,
                points: [{ x: 0, y: 2 }, { x: args.rect.width, y: args.rect.height }],
                stroke: '#ff0000',
                lineWidth: 2,
                pickable: false,
                cursor: 'default'
            }],
            renderDefault: true
        });

        for (let i = 0, len = mergeCells.length; i < len; i++) {
            const item = mergeCells[i];
            const start = item.range.start;
            const end = item.range.end;

            if (start.col > endCol || end.col < startCol ||
                start.row > endRow || end.row < startRow) {
                continue;
            }

            const overlapStartCol = Math.max(start.col, startCol);
            const overlapEndCol = Math.min(end.col, endCol);
            const overlapStartRow = Math.max(start.row, startRow);
            const overlapEndRow = Math.min(end.row, endRow);

            if (overlapStartCol <= overlapEndCol && overlapStartRow <= overlapEndRow) {
                let hasDiagonal = false;

                for (let col = overlapStartCol; col <= overlapEndCol && !hasDiagonal; col++) {
                    for (let row = overlapStartRow; row <= overlapEndRow && !hasDiagonal; row++) {
                        if (diagonalSet.has(`${col},${row}`)) {
                            hasDiagonal = true;
                        }
                    }
                }

                if (hasDiagonal) {
                    item.customRender = mergedDiagonalRender;
                } else {
                    delete item.customRender;
                }
            }
        }
    }

    window.tableInstance.updateColumns(newColumns, { clearColWidthCache: true });
    renderWithRecreateCells();
}