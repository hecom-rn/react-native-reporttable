var h5Port;
var output = document.querySelector('.output');

// Global cell render metadata — populated in initializeTable/updateOption
window._tableHeaderMeta = {}; // { 'vtableRow_col': { classificationLinePosition, classificationLineColor } }
window._lockInfoMap = {};     // { colIndex: { showLock: bool } }
// 全列锁定标志：frozenColCount >= colCount 时 VTable 的 setFrozenColCount 会静默清零
// （`t>=this.colCount&&(t=0)`），_resetFrozenColCount 的剩余空间检查也会清零。全列锁定时
// 表格已无横向滚动，视觉上与"不冻结"等价，因此映射为 0 传给 VTable，改用本标志驱动
// 锁图标状态（对齐 iOS/Android 全列锁定合法的行为，缺陷 71100586）。
window.__allColsLocked = false;

// Map a "lock all columns" request to a VTable-safe frozenColCount (0) and
// record it in window.__allColsLocked for lock-icon rendering.
function _applyAllColsLockedFlag(colCount, frozenColCount) {
    window.__allColsLocked = frozenColCount != null && colCount > 0 && frozenColCount >= colCount;
    return window.__allColsLocked ? 0 : frozenColCount;
}

/**
 * Extract __headerMeta and __lockInfo from column definitions and store globally.
 * Called before passing options to VTable so the data is always available even
 * if VTable strips unknown column properties internally.
 */
function _extractColumnMeta(columns) {
    window._tableHeaderMeta = {};
    window._lockInfoMap = {};
    if (!Array.isArray(columns)) return;
    for (var _ci = 0; _ci < columns.length; _ci++) {
        var _col = columns[_ci];
        if (!_col) continue;
        if (_col['__lockInfo']) {
            window._lockInfoMap[_ci] = _col['__lockInfo'];
        }
        var _hm = _col['__headerMeta'];
        if (Array.isArray(_hm)) {
            for (var _ri = 0; _ri < _hm.length; _ri++) {
                if (_hm[_ri]) {
                    window._tableHeaderMeta[_ri + '_' + _ci] = _hm[_ri];
                }
            }
        }
    }
}

/**
 * Accurately measure text pixel width using an off-screen Canvas (WebView context only).
 */
var _measureCanvas = null;
function _measureTextWidth(text, fontSize, fontWeight) {
    if (!_measureCanvas) _measureCanvas = document.createElement('canvas');
    var ctx = _measureCanvas.getContext('2d');
    ctx.font = (fontWeight || 'normal') + ' ' + (fontSize || 14) + 'px sans-serif';
    return ctx.measureText(text || '').width;
}

/**
 * For columns marked __progressStyle:true, measure every header title and every
 * record value via canvas.measureText() and set an exact fixed width.
 * Must be called BEFORE passing options to new VTable.ListTable() or updateOption().
 */
function _fixProgressStyleWidths(options) {
    if (!Array.isArray(options.columns)) return;
    for (var _pi = 0; _pi < options.columns.length; _pi++) {
        var _col = options.columns[_pi];
        if (!_col || !_col.__progressStyle) continue;
        var _st  = _col.style || {};
        var _hst = _col.headerStyle || _st;
        var _fontSize    = _st.fontSize  || 14;
        var _fontWeight  = _st.fontWeight || 'normal';
        var _hFontSize   = _hst.fontSize  || _fontSize;
        var _hFontWeight = _hst.fontWeight || _fontWeight;
        // padding is [vertPad, padH] — index 1 is the horizontal padding
        var _padH  = Array.isArray(_st.padding)  ? (_st.padding[1]  || 12) : (_st.padding  || 12);
        var _hPadH = Array.isArray(_hst.padding) ? (_hst.padding[1] || 12) : (_hst.padding || 12);
        // Measure header title
        var _maxW = _measureTextWidth(_col.title || '', _hFontSize, _hFontWeight) + _hPadH * 2;
        // Measure all record values for this column
        var _field = _col.field;
        if (Array.isArray(options.records)) {
            for (var _pr = 0; _pr < options.records.length; _pr++) {
                var _val = String(options.records[_pr][_field] || '');
                var _vw = _measureTextWidth(_val, _fontSize, _fontWeight) + _padH * 2;
                if (_vw > _maxW) _maxW = _vw;
            }
        }
        var _minW = _col.minWidth || 50;
        var _fixedW = Math.max(_minW, Math.ceil(_maxW) + 2); // +2px safety
        _col.width    = _fixedW;
        _col.minWidth = _fixedW;
        _col.maxWidth = _fixedW;
    }
}

/**
 * Parse a CSS color string to [r, g, b, a].
 * Supports rgba(), #RRGGBB, #RGB.
 */
function _parseColorRGBA(color) {
    if (!color) return [0, 0, 0, 1];
    var m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/.exec(color);
    if (m) return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3]), m[4] != null ? parseFloat(m[4]) : 1];
    var h6 = /^#([0-9a-fA-F]{6})$/.exec(color);
    if (h6) { var v = h6[1]; return [parseInt(v.slice(0,2),16), parseInt(v.slice(2,4),16), parseInt(v.slice(4,6),16), 1]; }
    var h3 = /^#([0-9a-fA-F]{3})$/.exec(color);
    if (h3) { var c = h3[1]; return [parseInt(c[0]+c[0],16), parseInt(c[1]+c[1],16), parseInt(c[2]+c[2],16), 1]; }
    return [0, 0, 0, 1];
}

/**
 * Build rect elements that simulate a horizontal linear gradient.
 * VRender's { gradient:'linear', ... } fill format is not supported in HarmonyOS WebView,
 * so we draw multiple thin vertical strips with interpolated solid colors.
 * @param {number}   x       left edge
 * @param {number}   y       top edge
 * @param {number}   w       width
 * @param {number}   h       height
 * @param {number}   r       corner radius
 * @param {string[]} colors  2+ CSS color strings
 * @returns {Array}  VRender rect elements
 */
function _buildGradientRects(x, y, w, h, r, colors) {
    if (!colors || colors.length === 0) return [];
    if (colors.length === 1 || w < 1) {
        return [{ type: 'rect', x: x, y: y, width: w, height: h, cornerRadius: r,
            fill: colors[0], lineWidth: 0, pickable: false }];
    }
    var parsed = [];
    for (var _gi = 0; _gi < colors.length; _gi++) parsed.push(_parseColorRGBA(colors[_gi]));
    // 1 strip per pixel, max 64 strips for performance
    var N = Math.max(2, Math.min(Math.ceil(w), 64));
    var totalSegs = parsed.length - 1;
    var els = [];
    for (var _si = 0; _si < N; _si++) {
        var t = _si / (N - 1);
        var sf = t * totalSegs;
        var si = Math.min(Math.floor(sf), totalSegs - 1);
        var st = sf - si;
        var c1 = parsed[si], c2 = parsed[si + 1];
        var rr = Math.round(c1[0] + (c2[0] - c1[0]) * st);
        var gg = Math.round(c1[1] + (c2[1] - c1[1]) * st);
        var bb = Math.round(c1[2] + (c2[2] - c1[2]) * st);
        var aa = (c1[3] + (c2[3] - c1[3]) * st).toFixed(3);
        var sx = x + (_si / N) * w;
        var sw = w / N + 0.5;  // +0.5 to avoid hairline gaps
        // Apply corner radius only to outermost strips to approximate rounded corners
        var cr = (_si === 0 || _si === N - 1) ? r : 0;
        els.push({ type: 'rect', x: sx, y: y, width: sw, height: h, cornerRadius: cr,
            fill: 'rgba(' + rr + ',' + gg + ',' + bb + ',' + aa + ')',
            lineWidth: 0, pickable: false });
    }
    return els;
}

/**
 * Inject customRender into customMergeCell items that need special rendering:
 * - Header merges with lock icons or classification lines
 * - Body merges with classification lines, box lines, forbidden lines, etc.
 * VTable does NOT call the column's customRender for merged cells — the merged cell item
 * must have its own customRender.
 */
function _injectMergedCellRenders(options) {
    var mc = options.customMergeCell;
    if (!Array.isArray(mc)) return;
    // VTable has a header row (row 0) only when showHeader=true. With
    // showHeader=false (e.g. home report cards, where frozenRows is not passed)
    // every dataSource row is a body record — the row-0 header-meta branch must
    // be skipped and the record index mapping must not subtract the header row.
    var _showHeader = options.showHeader !== false;
    for (var _mi = 0; _mi < mc.length; _mi++) {
        var _item = mc[_mi];
        if (!_item || !_item.range || !_item.range.start) continue;
        var _sr = _item.range.start.row;
        var _sc = _item.range.start.col;
        var _er = _item.range.end.row;
        var _ec = _item.range.end.col;

        // Header row merges: lock icon, classification lines, extra-text badge
        if (_sr === 0 && _showHeader) {
            var _hasLock = window._lockInfoMap && window._lockInfoMap[_sc];
            var _hasCL   = window._tableHeaderMeta && window._tableHeaderMeta['0_' + _sc];
            if (_hasLock || _hasCL) {
                var _fn = buildCellRender();
                _item.customRender = _fn;
                _item.headerCustomRender = _fn;
            }
            continue;
        }

        // showHeader=false merges covering the first body row (row 0): the
        // dimension title cell may share keyIndex with the first data cell and
        // merge vertically (e.g. home management summary). VTable skips column
        // customRender for merged cells, so the merge item must draw the lock
        // icon itself — otherwise the lock button disappears (ticket 71100732).
        if (_sr === 0 && !_showHeader) {
            var _row0Lock = false;
            for (var _lc = _sc; _lc <= _ec; _lc++) {
                var _li = window._lockInfoMap && window._lockInfoMap[_lc];
                if (_li && _li.showLock) { _row0Lock = true; break; }
            }
            if (_row0Lock) _item.customRender = buildCellRender();
            continue;
        }

        // Body merges: check if anchor cell has any overlay meta in records
        if (Array.isArray(options.records) && options.records.length > 0) {
            var _recIdx = _sr - (_showHeader ? 1 : 0); // VTable row → body record index
            if (_recIdx >= 0 && _recIdx < options.records.length) {
                var _meta = options.records[_recIdx]['__meta_' + _sc];
                if (_meta && (
                    _meta.classificationLinePosition ||
                    _meta.boxLineColor ||
                    _meta.isForbidden ||
                    _meta.floatIcon ||
                    _meta.extraText ||
                    // 树形/分类报表的展开箭头在锚点格 meta.icon 上；不带 customRender
                    // 时合并格只渲染纯文本，会丢失展开/收起图标（工单 71098727）。
                    _meta.icon
                )) {
                    _item.customRender = buildCellRender();
                }
            }
        }
    }
}

/**
 * Android mipmap PNG resources embedded as base64 data URLs.
 * Keyed by the 'name' field used in IconStyle and FloatIcon.
 * icon_lock / icon_unlock are also accessible here and via _pushLockIcon.
 */
var _androidImgMap = {
    'checkbox': 'data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6' +
        'JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAhGVYSWZNTQAqAAAACAAFARIAAwAAAAEA' +
        'AQAAARoABQAAAAEAAABKARsABQAAAAEAAABSASgAAwAAAAEAAgAAh2kABAAAAAEAAABaAAAAAAAAAEgA' +
        'AAABAAAASAAAAAEAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAHqADAAQAAAABAAAAHgAAAAA5e1oGAAAA' +
        'CXBIWXMAAAsTAAALEwEAmpwYAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4' +
        'bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNi4wLjAiPgogICA8cmRmOlJE' +
        'RiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgog' +
        'ICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJo' +
        'dHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8' +
        'L3RpZmY6T3JpZW50YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+Cjwv' +
        'eDp4bXBtZXRhPgoZXuEHAAAD2ElEQVRIDb1Xz08TQRTublsINDG2hMSjARITDjRpTCDoARIknrhBQkQv' +
        'HuXkxb+Agx48adREDyCJCje5IQkcjAFSWlp+xIQq9mgIrTG0DdB2/b7JvnWXlC3Q6iTT7cx77/ve/Hrz' +
        'RvOcUhYXF339/f1FipeXly81NDQMNjY2DhmGEUFtQ7uJsqOjo4Kmad9RY4eHhx/Rnu/p6flNmR2DbXvR' +
        '7A3+Byj7gKOVFxYWWlpbWx/6fL77aAePj4+/6br+BXUbNUP9crkcQu1E7fX7/e2wzxaLxTd7e3tPBwYG' +
        '9tHWCQt7g/pSHMRUIiGFiURi1Ov1PkO7CaDP8/n8dHd3d0IMK31XVlbCzc3NY3DqAbAKGP14JBJ5R107' +
        'tsPW9Ez1ra+vv0yn0wbIJ1dXV6+IInQ0VO/MzIyX3xP/rUHQBhhTxCCWzZ6j/1sIKK2NjY33Ozs7Rjwe' +
        'vyN9XCuSSfu0L3WoK/JYLHaPWMlk8oP02bnUNFBA76gYjUYH2SYIFJ1eUlCl0EYcIBYxZeQWnijAu1FO' +
        'jYwUCv4q+FXFgkFMYpODRsLp4e7d3Nzc55o6BFWhqysICbHJQS5aqWnkkeHuzWQyj9jZ19endjb/11oE' +
        'i9jkIJfCxDRc3tra+olN9YQd4mGthHZ7wSQHucipl0qlW1AK4sxNUxkH33HQ7QAX/S+YJkeQnBo8mEKk' +
        'uR4OhzuxGTAbzghzUbKTdoKNtd5GJIxyjSMMg6biuY/OSQKXtsImF5yI6AiHV9HYpsHs7KyLXW0iwSYX' +
        'iNswal8AkCrgDw8P14buYi3Y4Nvn7rbCm4tNXUUYrY7q8WFj5TD8ENFlOurKZIIJNnZ0C4gPeA3+4H1K' +
        'uUzHvyAWbHBdA2eaxDE0ek2yukWsCs4rbHDdgCymFwqFOSx4x9raWhecMM5y/VUAde0iJrHJQS5y6sgy' +
        'PsEqixxqjNaIpdbd7Ip2DqFgmhxZk1OlOROIYHnEVJVtcOedA9dVVbCITQ5ErgkaKAImZlAohEKhx+xc' +
        'WlqqG7FgEZsc5CKHdRtJIoB1UCkPlOqeCAi23FZW6oPr6lUqlfo/qQ9HjdFZG4qJWb2SPaY8xGICSR4W' +
        'O5d0WOuKxOzF7u4uE7Spi6S33EhMddzSW2ukpjdWQs81x/a3EvpcLvcWT5Ok8vKUHzx1ugKBwF2EYJXQ' +
        'IzyO456vmNA7iE1yDXFVHxkZKdmfMJC14AmTwhn8DOCv+P6iPsCDDIP43sQTpgNdGcT/19y9Z37CEEgK' +
        'd5790QbQ25iBIZCGQdSOBxyfNh6QHMAmjcgUh2Nz2Wx2HnbKKTuG4Mr3D7oj3z2PtBk/AAAAAElFTkSu' +
        'QmCC',
    'checkbox_hl': 'data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6' +
        'JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAhGVYSWZNTQAqAAAACAAFARIAAwAAAAEA' +
        'AQAAARoABQAAAAEAAABKARsABQAAAAEAAABSASgAAwAAAAEAAgAAh2kABAAAAAEAAABaAAAAAAAAAEgA' +
        'AAABAAAASAAAAAEAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAHqADAAQAAAABAAAAHgAAAAA5e1oGAAAA' +
        'CXBIWXMAAAsTAAALEwEAmpwYAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4' +
        'bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNi4wLjAiPgogICA8cmRmOlJE' +
        'RiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgog' +
        'ICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJo' +
        'dHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8' +
        'L3RpZmY6T3JpZW50YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+Cjwv' +
        'eDp4bXBtZXRhPgoZXuEHAAAFMUlEQVRIDb1X329URRSeH/duSyu0BQ0PUIwlBqMvNtHExDci8gLbbhui' +
        'aCwakQf/Ah/3kfgH+EA1AUMikXSXLT5YffCNGI2RF42JaRWrD0ZKC3Tb7t47d/y+2TvL3R+2FIiT7L1z' +
        'Z8583zlnzpw5K8UmzZ44oeXly8aLLE5OPi2S5KAV4qBNkj0cl0otSSHmhVLzwzMzv3rZ9rV+3L+xprPZ' +
        'YlGJYtFi0v509OjunX19J7WUY0qIUSnlHoVHoPCFFieJSKxrS4kQPxprK3fX1j57bm7uFhSUwJGyWMRU' +
        'a+sgzmq6WCi8B8IPerUeAYhYN0aYJLFCSjwazQFYq7RScofWYBJiw5gFKHB2uFyeplQWs7GKGmWaF1jI' +
        '5/f2BMG5HUGQr4GsliQmFVR8O0sy6zBmU0WcQj1K6R4osR7Hs7U4PjMyO/u3x/bLmsR+4pfjx5/qD4Iv' +
        'doXhs8tRRELKNPzqV239pgJ2KAz1nSj6uRrHx565evU3z8HlDpB7yiCipSR9LAhIGoFRe5mtuVok6BlN' +
        'DGIRk9jkcPEDUVrjXIeO/WtiogLBfEoatkA94Acsj2B5uAq37yuVxrhN5FLOfHQYSAiO/Eq9HmPikZBS' +
        'V2IRk9jkIGnKKQSPzFB///c4JSP1BOdj+3va7g9iMN64VWxJTimFQ7ewXK2+yKPm9pjnlEeG0Quh7QaS' +
        'Q848DCJaYcs0mdOmiE0OcnHMkTA5UAhueKgGi+IBRHLdmO9WjZnBsSKe4yd26soxDiqmQUyPMjnwm49s' +
        'S7XmK+1mZ+/1MRkN5HLBahT9gMTxEoC+TLObX6eQWASMHHWcGB2B+3e7jHQPp9nD3ghozkj0SjfnfMeR' +
        'InLvxPG1/eXyCzcKhTcCKafX4pgiTUeSg1yOE8n+ELRQTINZIfQT7BNT5HRkzGkq4OSEaF4aRCWpOy5R' +
        '9M2TpdLLvxcKb/ZpfTFyMeq864klOYhBTiWtfQIfxGhv1oWmteHwlSufINpPwn0x3MdIbZBjTwdh6e0o' +
        'moV7D98YH38Lx+YiXQqF0i1thSUXORVm6xDq1jRclezK5d7+o1A4f6BcvhQbcwyncJ25GIFUH2rs6eeY' +
        'G4N7p3qD4FPm9v8iJQm5yMnduwV3cqyb2QrWGOTtUyC/cKBSmRPGvIKb55+9vb05zE1jT18D6SkclQv3' +
        'QSrJRU7m1HkAWVhC4m7Gq9vIPDvDcIrk+yqVaxDK39zY+BDuPUNSnNvzW5ESGy6W5CJnwMoB/SXcp487' +
        'BWh7a2NQ8JYxOKNTf05MJPtLpXcg8u3i+Pi7oVIf49xu6l4PxzsbXDfJSSsFLoev4KojSOQMGp/mvLx/' +
        'u+3BvuqVWu0jK+V17PU5Ri82invVkQP8wvRtcEvpjTj+GtvzasBBWFqBBkeI7DRJJdtenFLL9boNtX6f' +
        'c4j0+7KUssSmZtCwwm+nJWskliuM1sYcp7o2kksQWv4A5vG6CmcGE2KTg1wcd9cibwtYfRaTgHLHN7Om' +
        'swt2n8k2cVBmHTCJTQ5XBLJ65TTUJtD/Wwg4vVCC8s3CjDXSQBCEUCZycw/xIAaxiElsB5VyNV3lC7Fs' +
        'scfKAb5gHLhY2IYOiDqbDCKzbVrsEdAVYvA9q0FcCodZIyFpBK5yaORmHjVX5LcrwG3iHH4GD8M1XEsM' +
        'YrVXmFzftJgfbN5y9rMFPQ8qkz+vNnjBE1FMMusxOTxwQU8Uto6/MP39r8PXk7hjn0ddNoi+avkLg+OJ' +
        'w7WC33W4ZeZutXpp239hGtSNZ9Z6jjzKP23/At83Dn/qya8oAAAAAElFTkSuQmCC',
    'collapsed_icon': 'data:image/png;base64,' +
        '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',
    'copy': 'data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAABgAAAAdCAMAAACHZFx5AAAAOVBMVEUAAABclfhdlvhdlvhdl/ddl/pd' +
        'lfhclvhelvldlvhclvhdlvddlvhgmPhgn/9dlvddlfddlvlhnv/LEddCAAAAE3RSTlMA/veSZV2bzU7h' +
        'v6hsJAzth3wVjGCWuAAAAFxJREFUKM/tyzkSgDAMBEGNwYjDNsf/HwuISOAiJqCTDaZWzIQTtJdKMFae' +
        'Eip1BJHYdM66nQFZuBuKhZkUHaW3QBCvof3D14JqPRxeAsWHjmg7QnAgW8gj3nAddg4pAxsYc/LMAAAA' +
        'AElFTkSuQmCC',
    'copy_disable': 'data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAABgAAAAdCAYAAACwuqxLAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAA' +
        'AAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAGKADAAQAAAABAAAAHQAA' +
        'AAAq1frdAAABUElEQVRIDWNkwALOnTu34v///8FYpIgR+sPIyHgFqLDZyMhoEwsxOkhRAzScDeg4E6Ce' +
        'jWfPnvVjJEUzMWqBhjOfP38+C0hPAlp2muoWgBwBteQXkP4JtgAY5pFAjg1QjpUYV6KrAbr0EVBsJjDM' +
        'X8PkgMHzG8RmBBreDjS8AiZBLg205AEXF5eehobGZ5AZMAtAkZwGlPwPxLlAiz6RYwFQXz4QG3/9+tUV' +
        'qH8dshksQAkhoMAPoPemIkuQwgaGginIAiYmJmF0fUzoAtTmj1pAMERHg2g0iAiGAEEFo6loBAQR1VsV' +
        'SGF2GcSmmQXACsycphYAq2BwpQ/KByAGy8WLF7lBNpIJ+KH6fqHrZwHadBRYnzr8+fPnA7Al8AddASE+' +
        'UD8jUD87UN1fYJ18Al09EzMzcxJQzQGgxH8g5iAVQw1/DDQjSV9f/yZQPwoAAIvueRLzQ2iDAAAAAElF' +
        'TkSuQmCC',
    'dot_delete': 'data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAA' +
        'AAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAADKADAAQAAAABAAAADAAA' +
        'AAATDPpdAAAArklEQVQoFZWSwQ3DIAxFazpFxannbBF1jNxaxK37IJJbx6gyAjdGqDqG+38EFxRVxIdY' +
        'fL9vsBw5lVBViTE+kO+QhiJnEVmcczOyUhN+QggXCC/AI89toLaiNnnvv4ad/8E0s1Fh5GytdRCebded' +
        '8zWl9OENfHNXkDUg64A9poGGQ0FDPuDIBtMvvQaygkG4sDfy7g5qM8ArFnjjDWB1olCLbWatMLptmgCE' +
        'rl/jB45LWqU1SD7pAAAAAElFTkSuQmCC',
    'dot_edit': 'data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAA' +
        'AAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAADKADAAQAAAABAAAADAAA' +
        'AAATDPpdAAAAu0lEQVQoFY2SvQ0CMQyFn90gRggNA7DFiTHo+KsQswAVCDrGQLcFA9BwIyAajF90h3S6' +
        'oFyK/Lx8thy/COphZjI6YGEfzCGYRNlwF8XlucFZRIyacBofLbxfuPq24DkxysEQs8daKmXmDMz4ggxZ' +
        'CXtbehmnRNaO5OWtNNbcuUoLZPX3wDTTVr0Z2lbyJ4W3Lo/VhLPKPvcNICtsVdjh5kH/PGjyldUWU6WD' +
        'NMXVsrlJrNE4stFpAn2/xheOuEYhimNlDAAAAABJRU5ErkJggg==',
    'dot_new': 'data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAA' +
        'AAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAADKADAAQAAAABAAAADAAA' +
        'AAATDPpdAAAAwUlEQVQoFY2SPRKCMBCF98XGG4iVB/AWjoXaYmnnz6Ec6SyhRQvGW3gAKzmCjax5wTSZ' +
        'KKQI2bcfm2UfkO9SVSSXYicqW3ueUgZwF0hWL9OTPavTuE2uxfj1bs6qMmMcLkBuw4HZPBbp07DyP5gv' +
        's1DLKDAq8702egyrxmIYHAx7jiWjmmXZkvvAKBCIZE2gdYbGja4TawGyhnPuyVtjJAPHmpR59csDX4xe' +
        '1Kv1nC0pTaHgk+HTG0cWPulu6vFrfAAi1ljwVHEc1QAAAABJRU5ErkJggg==',
    'dot_readonly': 'data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAJxJREFUKFNjZICC' +
        '////M35bwZ3C8J8hmYHhvzZEmPEqAyPDXK6Ir3MYGRn/g0VAxNe1XJL/f/5fwvCfwQlmAArNyLCPkZ0x' +
        'hjv423NGkMlfl3PtwakYppORYR935DcXkOLU///+z8JqMpogIxNjGuPXZVwn/v//b06UBkbGk4xfl3F+' +
        '/v+fgYc4DQxfyNFAqpNI9TTJwUpyxJGaNADIjGIntsQ9sQAAAABJRU5ErkJggg==',
    'dot_select': 'data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAA' +
        'AAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAADKADAAQAAAABAAAADAAA' +
        'AAATDPpdAAAAEUlEQVQoFWNgGAWjIUCdEAAAAkwAAe0H5NwAAAAASUVORK5CYII=',
    'dot_white': 'data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAA' +
        'AAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAADKADAAQAAAABAAAADAAA' +
        'AAATDPpdAAAAeklEQVQoFZVSyQ3AIAyDvrsAAzIWo/TPAkxC/6ldkUelpE0jmcPOxZHSMhHJQAU6MBe4' +
        'JpfV755BFOAAPKNW1JmZ35w1CX1ywsCSUasMYJ9R62xnorf9cSh/c26+ZisMGLZksoMBzZRssvHQ/66V' +
        'iRAUfzitvCp9fo0LsnBD7c30kvIAAAAASUVORK5CYII=',
    'down': 'data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAA' +
        'AAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIKADAAQAAAABAAAAIAAA' +
        'AACshmLzAAACL0lEQVRYCe1WQUvcQBR+L7vN5tZlD7XdepKCnjx4aPFS8NKe3ONCbxV0o7KrFQShP6D3' +
        '0lLJkoM/oB7twcuCp+6l0IMgLLQgui4isqIXg0n6DRjIhmxmEnpzA0Pee/N973vzJpOEaHQ99A5w1ga0' +
        'Wq18p9PZBb9QLBYr1WrVyZJLy0ISHIh/8X2/gvG23+9bWfNkKqDZbDYgvByIwn6P2Gbgp7mn3gLLst4w' +
        '8w+I5iJCHvyKaZp7kXiim6oAiE8h20+Mx3FZUdg14rO1Wu0wbj4uplyAbdslz/PaWPmLuESh2B/Yr9CJ' +
        'i1BsqKn0DGDlj1zX/a4gLoQmMHYFZ6hqaEKpAOC/YsyFeDLzNQDfZCAxLy0AT/c6cDWVZBHM4j03Eh50' +
        'pQWg7R8HKeqeCjcvS2cYxozjOE9luLh5Xdd7cfFRLNwB6XtgfNt/7jqUaQtyOvVOVvg0LBi1pc/A3S39' +
        'AulJlKjig3sO3FgSVnoKmOlTUoKkORWudAuEwLPPvuX76d4FELfP1nkpqUAxJ+2AAJUNqhNTS9gqF1Z1' +
        'AM6qIlYFRjRu+6W7G2oDnfwxYvqrGfSya/L/+xiJEk8W+VLL0Tw6cZVQ8rUOjKq4yKO0BYFgt8FHGlMV' +
        'RbhBLHT3chq9O66z8r+A4KYqQBC6a7wP0oawBy6mrdM1TvU3JPhKp2BA6N7BydjGyQj+C3d6H3ghDieL' +
        'SV9EwxJMTlPj6DeVsYJCqUzm6KszrFOjuKwD/wB91JZmmhjwCgAAAABJRU5ErkJggg==',
    'edit': 'data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAABgAAAAYBAMAAAASWSDLAAAAMFBMVEUAAABdlvdclvdtpP9el/ldlfdd' +
        'lvhcl/lclvhelvlttv9dlfhcl/hcl/lfmPtclfirjUb7AAAAD3RSTlMA5sgOTevNUr8uB96Qfz75rmcb' +
        'AAAAeklEQVQY05XQwQ1FQBSF4ZOQvLyltYWFAogKdKAEJVCDRoi6LLRAjNhxJjM5Y+vsvvyrexEXt10N' +
        'RAMak3DpClQXuh5uUZHDwK/aS2yvQCgQIRAKDgqEwkIoZIQLgg3CzCCMDMJ/Euy+wQS04Wz8dvsQv/ZA' +
        '3N1+Z/0Apxw4VNPmybMAAAAASUVORK5CYII=',
    'edit_disable': 'data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAA' +
        'AAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAGKADAAQAAAABAAAAGAAA' +
        'AADiNXWtAAABmElEQVRIDd2VzUrDQBSFHVPjKgGFPkJwVyFZ1J073VgqKD5DX6IUH0jwZyG6clkXTUO7' +
        '7CMURBJUiCTxHMlArCmZSVx5YZg7M3e+c3s7kxEbsCAITtI0HWZZ1hFCmJyrsHesX7iue18Wt1gs7CiK' +
        'brBmtiaTSS9JklsGAv4CkdeyTcU5xH1g/Fackz7hYRg+YtxF3FMLzoiLGJwjoyv6da0IB2NsWVZ/Ew7L' +
        'svxruG3bx47jhBTYQovRalue+QMAXbSxhBNIgUZWgB8A9ANOcCOBKngjARV4bQFVOAV4TLUsh3+fc2z8' +
        'VXMJm06nI1zeHS0BVThFAB+gayv/ySvw5+JRlFmv9rhfQkmgBH7ES7QKLBtXCgC+Lb8tADBzZTgFKwUA' +
        '30Mcb6g2XEnA87wZAveR+aFqWQiWpnSKchG5R6uvLJEWrST4fwh84pepvMMlBVg/hTtm4vmNWaI5nDa+' +
        'Hafrw/VWfN8/A3MXIjMBcB/fjWsiMLFE1+h1w35m3ibPMIyeoJOLDOF20PiE1jYkGUNgDsAljvfdF2h5' +
        '1d1gMHVuAAAAAElFTkSuQmCC',
    'expanded_icon': 'data:image/png;base64,' +
        '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' +
        'gg==',
    'icon_lock': 'data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAA' +
        'AAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIKADAAQAAAABAAAAIAAA' +
        'AACshmLzAAACaUlEQVRYCe1Wz4vTQBRukk1yqC6LaHXrBg+yIuuCCPoPeJLIevBcLBTSykL3sjfxtKwH' +
        '7wtSmlKQHqqHhTUHPSgInpaFgoKiVz2KKOJB0x/xG8mEoclMMhs8dQeGeX0/vvfNm5nXFApHY9YroMgW' +
        'oNPpHB+Px/eDILiF2HOYPuZHRVEeO47zCGsggylFwHXdK0j+BAmWOUle6Lp+p1arfeXYY2o1puEout3u' +
        'wmQyeQnzv+TY6W/Md/j9idn1jdFo1OdAJKozE/B9/x7KfiJEeWWa5lK9Xr/caDQuQr8C/Wdig3y93W7b' +
        'oV/qkolAq9XSgbQRon0pFou3q9XqN4oOEuQO2LQSILFJbWlrJgIAOY9phmBPK5XKz2lgVOM9dPuh/tK0' +
        'nfc7EwHs7AIFUFX1gMoJ61uiQwVO93q9+QR7TJWJAKKWaCTAf1B5eoXtO9XhzkQxVJe0ZiIA4MgPMved' +
        '0ztAEuHFRDFJialO2AeQS8HbXwfYXQSshkEfkCixCvAnjeks8YPPGyz9tOakEWfeKJfLWwB9CHuJ8TkF' +
        '2eJM9twJmZuDwUDxPO815MSRViYnMUpCiQ0IMdIInJHIxXNd5BmIPo2AKJbYSD+I9YS0INaeh8CuZVkl' +
        'MnHh9lhQGTkPgR3btv+QiYQ7MklZ3zwErlEgXLSrVJZd52QDGP8H6BEuvg9UHME2SDCm7GIeAnOaphlI' +
        'ruIbQNhPRHTyEChg9ycxhd1UlJzYchFAi34OjP9KgLxxtr0S0tHAuWf5xxP2ibRX8CzKdnhBiCE8AsMw' +
        'msPhUMNO15D/mCSHX7igHr6Sm5JxR+4zVoG/PZK5+yMLIkEAAAAASUVORK5CYII=',
    'icon_unlock': 'data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAA' +
        'AAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIKADAAQAAAABAAAAIAAA' +
        'AACshmLzAAACh0lEQVRYCe1WO2vbUBS2JbsNdaHOkIYkpHQotKRDp/YPJFPJksUZDB38pItLH0OhdHBK' +
        'xgyZCo5sQ4cEvGXND0imDIGEEih0yVD6wMpU/JL7HaFrrnWvpCtXWyIQ59zz+j4d3Vcsdv1c9Q7E/Rpg' +
        'GMbyYDB4FY/HnyFuejgc/oF+qOv6Vj6fP/LLVfVJCbRarRumaW6iyFuACjEgMYBvI51Ob2YyGdInfjRZ' +
        'ZrvdrgL4HQf+A6DHiP1J8bDreKsg+VqWH8YmfF2z2bzf6/W+AmCKvhTyRalU2oMOdajhtxQsy/oMECJ/' +
        'ifdBuVz+HQaUjxU6APAKgTtB71F8l8BpDGkVi8Ua1E+O/w5k2dEnEgIBgD92KvVSqVRdVlXTNIMjxeJl' +
        'oYE2gQAKP6QsyG/ZbLYtq4AuXMButx2E7XhZnIpNIICke5SIwmZAAUbOjg+I9XQn3B4A2xOTtdjtZ2P4' +
        'X0K/jd/RZbZJpEDAq0ij0Vjs9/sf4F/CS8vQDsWKiNVqtY9eeY7dBOH9QqGw4/4wgUAikXhESQD7y4pi' +
        'aaa73S7tfAvMFlaC8HMs4TnkVflcgQC22HM+gHSQWYWYGJzVQ7doyY4RkE1CFj+SSJwfDf5PoQ6MPUoE' +
        'xjK8B7RNd7zdck9UBN5gx5xNJpOLmGRncii5NQoCHZwV21Q+l8v9wmRryqHk1igI3KzX60+48k85PVCN' +
        'gkAMlxaDkLAfrECsB6JyAZEQQL2UU/MWV1tJjYrANG5ROibgjBIqFyRsRJwvjHoXt6MTJIQ+mFQJ0M3H' +
        '98HsV7kXCHWUfgFOvAOgj84GXyY+TjqQ3G4lAriAfEfyGpJP8VruIgrjS+R/QZcqCrHXIVesA/8AVBnO' +
        'jBS6GOwAAAAASUVORK5CYII=',
    'normal': 'data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAA' +
        'AAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIKADAAQAAAABAAAAIAAA' +
        'AACshmLzAAACAElEQVRYCe1Wv0vDQBQ2Wms3i4OKbmLB2UFxEVx0aseAUxViImIRQRD8A/wHFKUlg93t' +
        'qINLwEkXN0Eo6CSIiFRcSiCp3yspXEOSe4luJnC99/t79+767gYG0u+/V0BJWgDLsjLNZrMB/5F8Pl9S' +
        'VdVOEmswiRP5APyk0+mUMNZarVY1aZxECdRqtQqAt3ugoDcgO+jxcebYW1CtVlcVRbkG6JAPyAVfMgzj' +
        'yiePZGMlAPA5RLvDGA2KisS+IV/Sdf0xSB8kYydgmuaY67r3WPlsUCBB9gx6EZX4EGShJOsMYOXDjuNc' +
        'MsAJaAajQT6hqIKClQDsTzFWBD8ZuQyDM5kR6aUJ4HTvwU7nBPPZaJ6vT9zPShNA2Y/6XfgcxzcjC5fL' +
        '5eZt256U2QXps9nsW5A8lYkVkPaBer0+/ZstKJfLryKgn5aegXa7/QCncb8jh4fvO+wmomyl/wK01+Oo' +
        'AFE6jq90CwgAXY2u27i9wEQ73opKkHTSCngBdjFbHs2ZbmG0wzFkVYACcS8jlP0FDWjhTy8jSkDTtE8E' +
        'LoL8Ij7o867jIhecYnC3oIuHwE8gVAA5XUH/j4sE1+O8Bcg9VgLkgCRuMO0TLX5I6hC6WK8h8mefARGM' +
        'aNx051hx910I8AusfNNvw+GljSgsSKFQqOBlPAU9PcuNMLtUnlZAVoEfkd+kXPkzR3kAAAAASUVORK5C' +
        'YII=',
    'portal_icon': 'data:image/png;base64,' +
        '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' +
        'SUVORK5CYII=',
    'revert': 'data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAA' +
        'AAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIKADAAQAAAABAAAAIAAA' +
        'AACshmLzAAADT0lEQVRYCe1WX0iTURQ/5/vmzLQkwdDNGlHUWz0UvYoSBAlWSD6JFUVq2RYIoW8S0YsP' +
        '4SaVEBTUi0V/KAhBqIceBKEiH4JMaOLmrIcswUzXvtPvTr+18NvGvi99qTO2e3fPOb/zu+ee+4fov+TI' +
        'QEWvHKrslXBlSA7mMLWl1rJ5eYOyB/oBEfJRgvZms7Wry0jA1y+VhkFPSagE4ON6Cd2wGySbnyWBqntS' +
        'tDhPT4RoCzPN6C6qi5zmL9mA7OpWEBARTsToDoLvI6Y4DBqi7TxmN0AuvxUEPEG6gjVvUI6aUFs0wC9y' +
        'gTjRc7oziu5EwqBby2M90xf4Yrp+NfopAhVBqUbBDeFbgEBh1qgD62/YCcpCcTZo0lVKY+GT/CMbRooA' +
        '9vp7pH5nNuO8dUzfEGDAvY66J1o4ZuWfqgEEn7EycDQmVArcM9hR7zwhqbfCSmXAc012SZyG4bAJ1T+t' +
        'EzWRTt+tnHKNYd0KcHD5YHcYeEfRqon+xJI2xgL8KN0/RUANekNSiyIcVHUA4wdTfjrGjBV1IFVB2Z8Q' +
        'ug8iWzGxWdZpd6ydJ0zI1BKogeh5fo6Bs6oPhwa1JVXfiUT8PFLopmrM9CsmthGZuZqO9wcBpZgK8E00' +
        'PaoPEp1qa6q+Ewm3cRj+lxQG0nnE2yepYl9BQBm1BqgTjB+rPu6D/uQWVX8ciKeI+rCsH8CAgdloQlkS' +
        '6GY2ysuoCSReg7Ebe/qhLyTbTCc77asWjgvTXeWLzNaaGJYElHK0mef0QqoHiShIlC0Y1Gw62W01g4aV' +
        'L8p6h4mRkYAyiLRxVNOoDql7pum4mh0Kgn1KQjCVm1Aus5Opjfr5LXR1mfT5jCd0cmMXqEJcNP2yZsA0' +
        '+mvt0uGkGHw2MdeUAIqwZjnwmzUnoJ54CHpcBcZNO2QSyFkDpqHTdmE+eaqWqOO4GDekibcmS+DtlUYE' +
        'Xpq9UHDcz7MmgVXNgKdf1ss8daHwu9QJiM9oMdNlM7hqcc5Yy/brsnkuTq14E6lneV4C0AIg+3DiHYDj' +
        'hqQz00fchDXpN6Eaz5iBuUXqAGtbb0Ls8+RmV40SHGSDLo1OTbbz1NLI79+MBHShl0jdOZiiZvIUPOfh' +
        'EcEERhD8Nh4hg3ki/EPmvwAarfmkVuvpNQAAAABJRU5ErkJggg==',
    'revert': 'data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAA' +
        'AAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIKADAAQAAAABAAAAIAAA' +
        'AACshmLzAAADT0lEQVRYCe1WX0iTURQ/5/vmzLQkwdDNGlHUWz0UvYoSBAlWSD6JFUVq2RYIoW8S0YsP' +
        '4SaVEBTUi0V/KAhBqIceBKEiH4JMaOLmrIcswUzXvtPvTr+18NvGvi99qTO2e3fPOb/zu+ee+4fov+TI' +
        'QEWvHKrslXBlSA7mMLWl1rJ5eYOyB/oBEfJRgvZms7Wry0jA1y+VhkFPSagE4ON6Cd2wGySbnyWBqntS' +
        'tDhPT4RoCzPN6C6qi5zmL9mA7OpWEBARTsToDoLvI6Y4DBqi7TxmN0AuvxUEPEG6gjVvUI6aUFs0wC9y' +
        'gTjRc7oziu5EwqBby2M90xf4Yrp+NfopAhVBqUbBDeFbgEBh1qgD62/YCcpCcTZo0lVKY+GT/CMbRooA' +
        '9vp7pH5nNuO8dUzfEGDAvY66J1o4ZuWfqgEEn7EycDQmVArcM9hR7zwhqbfCSmXAc012SZyG4bAJ1T+t' +
        'EzWRTt+tnHKNYd0KcHD5YHcYeEfRqon+xJI2xgL8KN0/RUANekNSiyIcVHUA4wdTfjrGjBV1IFVB2Z8Q' +
        'ug8iWzGxWdZpd6ydJ0zI1BKogeh5fo6Bs6oPhwa1JVXfiUT8PFLopmrM9CsmthGZuZqO9wcBpZgK8E00' +
        'PaoPEp1qa6q+Ewm3cRj+lxQG0nnE2yepYl9BQBm1BqgTjB+rPu6D/uQWVX8ciKeI+rCsH8CAgdloQlkS' +
        '6GY2ysuoCSReg7Ebe/qhLyTbTCc77asWjgvTXeWLzNaaGJYElHK0mef0QqoHiShIlC0Y1Gw62W01g4aV' +
        'L8p6h4mRkYAyiLRxVNOoDql7pum4mh0Kgn1KQjCVm1Aus5Opjfr5LXR1mfT5jCd0cmMXqEJcNP2yZsA0' +
        '+mvt0uGkGHw2MdeUAIqwZjnwmzUnoJ54CHpcBcZNO2QSyFkDpqHTdmE+eaqWqOO4GDekibcmS+DtlUYE' +
        'Xpq9UHDcz7MmgVXNgKdf1ss8daHwu9QJiM9oMdNlM7hqcc5Yy/brsnkuTq14E6lneV4C0AIg+3DiHYDj' +
        'hqQz00fchDXpN6Eaz5iBuUXqAGtbb0Ls8+RmV40SHGSDLo1OTbbz1NLI79+MBHShl0jdOZiiZvIUPOfh' +
        'EcEERhD8Nh4hg3ki/EPmvwAarfmkVuvpNQAAAABJRU5ErkJggg==',
    'selected': 'data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAA' +
        'AAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIKADAAQAAAABAAAAIAAA' +
        'AACshmLzAAADoElEQVRYCcWXO2gUURSGz0zWZLORVcRAiIoWSQoVbRRSSMDCJuKihTaKvQERbAULwTaN' +
        'oAg2CjZaaBRtLCxEDFiJGMSkUAxRCIgu5mGiO/7fzNx1NvvIZBPJgdnZuY/z/ffcO/ee8SylnbwXtM7O' +
        '22ELrOAFtjvwrNsz66Z7YDalsimVjZlnj3JZe37/lLeQxrV8NDaBu+bn7XIpsNMi5Ru3jms9K/qe3c1m' +
        '7YqEfG3Up66A80+Dto/TdqlkdlHgDpzMqPV33Yu6FnUtxL1bFYINekbdZl0deg7NsxnfbHhXp129Nuj9' +
        'iksrbjUFMOq5WXsgP/20/qZWn3XNV3St/5BV1Q513hILUdfR9pydqBWNKgGF28G+P2ZPNOrtSJ7QEH7W' +
        'ZzWs2ajaHoWwjVaeTWZabHDkjPc22alCACOfnbPXwIuqGVfL3xUtkl3T/c8oCr1qmicaEpFrt4PJSGh8' +
        'kTHnhN3B3wu8Wjie8YEvBoRvGLAiqllZAAtOIvsJOyOPp8+1W9UdX/jENwxYziG6LA79hGo73q1izp3T' +
        'enfWxB6tCU3FjKaih6kII8B7DpzV3uyCqwU9sFUhDocY1eIbBqyQqb+eRt+qhTetwvwbyUn7qkUu6/8W' +
        'dprdPGQ28sls6KWZNrLQeEX3R1EoKgqdfry95tlk1hqe0YAGurRf5/4JhQGLAcP29adANTvcWpgbOfDp' +
        'ObPjz8wmZyo9l1li+xwsVLO91rIMalNaLfiHH9WdHQu2z6lGk8XqdrZNoXuh+OB4OUsLx49jwWaRhgLc' +
        'wZIE3RrQVqoThsXUSMRK4Ph3LNjha0hhvEj5W7YLr6J5ZD7riVgpHOdlVmCBr4cpCtvKpTxFxvyxiFhM' +
        'tUQ0A8ezY2kKvmTCTMasj/NcnCpzIh4eMetsjyLhGhGV5GqvteBc2+QdFgabRTjGA8lEPXMikpFoFg7D' +
        'sWD75HAUksk0sqUimhm5819mie2TQEpEkTSKbbKRJUW4TSZt2J1fGGHKJibscJs5die4XirZOQ6K8bDE' +
        'Na9979sUla8UTq9eDZRUzfftxuOz3lD4GpK9ckRSwZG5nAFuBo7vME8UK2TqORQQn8vDgMnhSKPW2vCJ' +
        'b0zQYZeWhQIoJHVW9EfJlXp1pZgJuqUyfOET3zBguY4VnHVNSlFEWFrMjkrmJFns3pRrwo1m6Z05x4fL' +
        'iEnLXehd24oIuEIisW4fJk7Eun6aORHcica6fJwmRcRC/svn+V+8qKUjrjaiPQAAAABJRU5ErkJggg==',
    'trash': 'data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAA' +
        'AAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAHKADAAQAAAABAAAAHAAA' +
        'AABkvfSiAAABoklEQVRIDe1Wu0oDQRS912T1DxSxsdfSL1BEzAMRSSUhVnaCj0awSSFYWdlZJVEQbHxF' +
        'CT7+wNI6nRBRP0AjuZ6rgezOzhCFZRHMwMLMOeeeu3NnsrlMjrFyJQP1Z9oGvUhCww5ZAGaiJzyHo4O0' +
        'tZfitwDZXiRtoGL1F9pBojUXb8OFaAjPBmL7wK/bNM6ELJRHMCUSNHue55ot2MSyFZlstehOY8FZE6IC' +
        '4bF8L97jA70T08dlgb2wwo2ky9JEZZIj49S/P8FNU6lbj3VwuiTXyDgdU9ab2HcY08b+UppMSW5x007N' +
        'd8qU5QLcSQgHppwFP7LhgTPUrwt+e1O41im/Qe5YEiKUEaY5P65zxZQrigS84LOguHr6YwIiP+Gfj+Xw' +
        'ChGNHyWMKNeXTS9hlNXslTTyavZK2ilpkbnFTFW0Dmcd9HummHKqMTnb2tnTmOJqgbMmpuvqEs/bcBf2' +
        'z7402rziPF5RDi9dkRlXWbrh7VhPvcyGOHSGuAQH+C9apRbV0GB187bz7eujXqYgdIZo0zcB7kLYMMW/' +
        'WDfUQ73MmE/dBn1MiIVtRgAAAABJRU5ErkJggg==',
    'trash_disable': 'data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAA' +
        'AAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAHKADAAQAAAABAAAAHAAA' +
        'AABkvfSiAAABgUlEQVRIDe1WS06EQBCliRGOoF6BFXAAt/42HmC8hdGF0cSbOLM2cTHD6M64h7DhCjpX' +
        'gAX4ivQY6O4aO2QyLqQT0l2vq+pRVf0TDtOKotgvy/KxaZorqBwyaiq8AjDzff8uCIJKnSR5zwQSJslu' +
        'uHkGPwB+XVVVg95oyxLKyBzXdS/CMFwwBD04TdMTAMu6riccoduz6AttGm3JyDSO41fpgi3BJsI+/ZYk' +
        'kWXZAuk725K/jW6EEMlOI0RgtJj+W0NNl1jeb2rcVGvgcwOeMPgzbF5UfW0fIs20lxz0qLH4yTlkbWGR' +
        'Dpyeqk6lfEnzqp+dLhr6kZGQKc9weEzp8NwxlmNK28TQaUGD7snTzRiHd3XWY6uUkkN8CYh7Tw2JfwB/' +
        'Xzv8rdfOUs4giqJz0xzwYxPOYVYRcsZD8L8nRF0+6c/zPNeuI9uI6MqSC21Fde7amWo4hcIt3pZzXKxd' +
        'XesxyFpdkD2pRhqh53kPeHXTNpjA8Eg1sJS/QDaFr3tV/xtop5RbzIDfwgAAAABJRU5ErkJggg==',
    'unselected': 'data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAA' +
        'AAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIKADAAQAAAABAAAAIAAA' +
        'AACshmLzAAADFklEQVRYCcWXT0hUURjFz71jOiq4iaCmFglBYBAIBbYQadHGaEiyFmW0a9embdEiajub' +
        'du2kP4sytInahrRIMHARCEFQC7MgghAcR9O5nXPn3WG00WZ88+fC+N67vnt+5373vft9z6DKdvGZa8/l' +
        'cRoOaePQ5wxSBkhpuAMW2bfIvnkYZLuSePv8klmrRpoaOzeC9+fzuFNwuEJSz853R/81WLIGT5JJ3KWR' +
        'HzuN2dbAjTeu4+tP3CoANwnulogxmONvirN9lwC+tXViUf3rK0htAAcZgUHncJ6/fvUzGssWyBzeh/sP' +
        'hs2q79vyp6IBzXolh0mGdsDrGExYi9vZq+bTlvEVL9OP3NFCAfdoZNSPB2Y6uzBSKRr/GEiPu+OczWvO' +
        '+hBn+8UkcPnVmJmpSPpP57nHbsBt4CmN9DIaC20JDL8cMx/Lh20yoJnnVjAbwaf3ABcmr5lf5QNqPR8Z' +
        'd3v/AC9oYkgmujpxsjwSXKJi05or7AGeOoYzceFSloa0GM1paYshVoRFyYAeOK25wq6ZPzxhaLw+TVrS' +
        'lLYYYgVlvwRR6D/TYbdtw6ndrnkQ3e6oZ6Kwjvd6O7gUR7QUPgJ6zwWnw4lGwWVK2mKI5Znss5x9u99k' +
        'dMFXTTc2sgWGmGLbaHvtobO5at/zOAbFEItR6BHb8iQtQXZOxRGuZWyJRbZVYvEGuL3WIhLnXm3lEbPP' +
        'KqvpQnt7HNFaxgaW2ExaRQMhsdQitNt7A0vs0ka02sG3s0mtxHJwljuTT6mJ3zjQJD4Ci0vwXQ+hN6B8' +
        '3iwDgSW2HsJ5gXkcbJaBwBLbcuWz3gArmaYZCCyyrQpImlhivu5XJdNoE2KIJabYlhlpTQWkwCqjGm0g' +
        'MMT0bAFVvdLRMp2NKmU2yoQv0VQnkuWZBPl9IMrLGYFVw6mMqrcJaUpbuoRmxIzOiyiVztyJZhiFXtVw' +
        '1z84FjH1adKSprTFECsob9r9WlqUypHCwkRxlmu0QLdDdD0b55nQWGlIS5oqy0PoK0YgdCoSLfswCSZa' +
        '+mkWTOioaLTk47TcRGSkIZ/nfwFTBpdpr8iQtQAAAABJRU5ErkJggg==',
    'unselected_disable': 'data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAA' +
        'AAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIKADAAQAAAABAAAAIAAA' +
        'AACshmLzAAACw0lEQVRYCcWXPYtaQRSGx+sniCuuTVjSiNqkSBdImbQJLKTef5F2IcXCtvsvtg4spE5K' +
        'IWVgERRslk0aFRXBb/M+4x25S1bNJt7rgfFexpnzvHPm69yY+UtbLpepZrP5drFYnOr9hbqd+AUP95RY' +
        'LHbred5NpVL5qvcJf+yy2K4GrVbr2XQ6/STomcrRrvb8L3hf5TqZTF6USqVf2/psFNBoNNICnmvEH+Ug' +
        'ixM5NOl02qRSKROPx41Ga32rjZnP52YymZjxeGwk2NbrZ6g2VxJzWa1Wx64y+HxUAKOWs88S8JrGmUzG' +
        '5HI5Cw123vSOmMFgYEajkW0iATWJ/vBYNP4QUK/XX6rDF8GfJxIJk8/n7cg3wbbVE4ler2dmsxnTcid/' +
        '78rl8o9gnwcC/JF/B06YC4UCHYPtn/wuX6bb7drpQYT8vgpGYu2dOddcfiPswI+Pj58M29ah0+k4ETWt' +
        'izduTaxWkXoKfA6csDPyfRs+8Q0DlvNvI0DotXqbqswWi8V/nnPndNOTNdFut/l7qN1UYSpsBNjnqsyy' +
        '2tlqYRm+YcDymcZTOFIqZ9Sy1cI2x4AJ2+N41csR6jhcwjYYsGDC9jjbgXLCRWWOBZsp4GKxx2tUAtjm' +
        'GGwWIbdaJOGHgwWm+mQtwF0sqybh/gZYVkC4tO3el0SAZMJwpUZlAdbPtQCu0KgswLr3dEPdAiaZiMoc' +
        'C7bWg3cDmEwmKnMs2J6fQPa5KAKhCU0LDFgafR82UzBRuYZIGhW2OQZM2CxCzuYLPYbkcKgLy/Dt54lD' +
        'n2msAHsvK3sFTA6nI3LvGvCJb0xzf+XSMiuASoXjUqVGAkkOt2/Dp5+c1mA5/+uckIpDJKXrCCCAsChU' +
        '76Xwjr1K+vQ/a4K++MAXPknLXejhYQ8isKpaR+IwHyZOxEE/zZwInqwLhTL6j9OgCN61NkL5PP8Nb/i8' +
        '77YR5j4AAAAASUVORK5CYII=',
    'up': 'data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAA' +
        'AAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIKADAAQAAAABAAAAIAAA' +
        'AACshmLzAAACLklEQVRYCe1Wv2sUURCezV32KvE4giarlXhgrRCwEW1MlSsDqS7CeSeSKIIg+AekPyPK' +
        'HVvketMkJEWaQKrYCBECkSsEISGICiEEjyX3xm8kgWWT92O3zb1m3puZ75vvzdt9u0SDcdk74GVtwMMN' +
        'zu9u0xIICqWAKjtTXpSFaygLSDDfvtICTIWJJn7vUysrTyYBQZPnmOlZrOjMaJNfx9bO09RHELzjx4pp' +
        'jZhyiSoqN0SVvRfeasJvXKYSECzwHaVoC8WvaliP/Dzd/zHr7Wji59zOR3Az5JLq04qhuJBfiU5oOWjx' +
        'yLlKGoeTgHstHj45pk/guK3hibtv8V9aEkzcqZs7Cdjv0Xvs/JGOJOnHm/EAmA9J/0Vrq4CxJr/EE1+/' +
        'CGzyAVMTrClHYlYBIHprI9HFXbB5HfjMny/Q3X5Eo2frNDbn00Ga/MuZa72IOp3OjSiKMh2B7/sH1Wp1' +
        'z9Ra6zPQ6/W+gOCaiUQXA/YnYtd1cfFb3wLP8+ZNBKaYC9Z6BFKghQGT9i4IG43GU5NAiVk7cEowC7tx' +
        'Oncxm0h67pLo1AEhCsOwpJT6zMzG7wHa/h0549j9LxcBrh2gWq32B8STID3UEaP4EWKTrsWFx1mAJIN4' +
        'F2YKhfqyTgwFgdP1et35X0DwqQQIACLWYV7JPD4g6g1iqf6GBO/8DMSLybzdbn/Ejv//F6L4Inb+JJnj' +
        'srZeRDqScrk81+12A8QLxWKxocsb+AcdsHXgH8ZvnY0u/j9+AAAAAElFTkSuQmCC'
};

/**
 * Icon name aliases used by the JS-facing IconStyle/FloatIcon API.
 * Android's Cell.Icon.update() maps these camelCase names to mipmap file names;
 * HarmonyOS uses the same base64 keys, so we resolve them here.
 */
var _iconNameAliasMap = {
    'expandedIcon': 'expanded_icon',
    'collapsedIcon': 'collapsed_icon',
    'selectedIcon': 'checkbox_hl',
    'unSelectIcon': 'checkbox'
};

/**
 * Check whether a string looks like an actual image URL/data URL.
 * Bare icon names like 'selectedIcon' should not be passed to VTable as src.
 */
function _isValidIconUrl(str) {
    if (!str || typeof str !== 'string') return false;
    var s = str.trim().toLowerCase();
    return s.indexOf('data:image/') === 0 ||
        s.indexOf('http://') === 0 ||
        s.indexOf('https://') === 0 ||
        s.indexOf('file://') === 0 ||
        s.indexOf('asset://') === 0 ||
        s.indexOf('hap://') === 0;
}

/**
 * Extract a bare icon name from any URI format.
 * Examples:
 *   'asset://up.png'                    → 'up'
 *   'hap://com.x/resources/rawfile/expanded_icon.png' → 'expanded_icon'
 *   'up'                                → 'up'
 */
function _nameFromUri(uri) {
    if (!uri) return '';
    // strip query string, then take the last path segment, then remove extension
    return uri.replace(/\?.*$/, '').replace(/^.*[\/\\]/, '').replace(/\.[^.]+$/, '');
}

/**
 * Resolve an android icon name to its base64 data URL string.
 * VTable's type:'image' element accepts URL strings via loadImage internally.
 */
var _androidImgCache = {};
function _resolveAndroidImg(name) {
    if (!name) return null;
    var trimmed = String(name).trim();
    if (_androidImgCache[trimmed]) return _androidImgCache[trimmed];
    // Apply JS-facing aliases first (e.g. expandedIcon → expanded_icon)
    var resolvedName = _iconNameAliasMap[trimmed] || trimmed;
    var b64 = _androidImgMap[resolvedName];
    if (!b64) {
        // Try common variants: lower-cased, extension stripped, lower-cased + stripped
        var variants = [
            resolvedName.toLowerCase(),
            _nameFromUri(resolvedName),
            _nameFromUri(resolvedName).toLowerCase()
        ];
        for (var _vi = 0; _vi < variants.length; _vi++) {
            var v = variants[_vi];
            if (v && v !== resolvedName && _androidImgMap[v]) {
                b64 = _androidImgMap[v];
                break;
            }
        }
    }
    if (!b64) {
        console.warn('[vtable_util] _resolveAndroidImg: no mapping for "' + trimmed + '"');
        return null;
    }
    _androidImgCache[trimmed] = b64;  // cache the data URL string directly
    return b64;
}

/**
 * Lock icon Image objects — loaded from Android mipmap PNG resources (base64 encoded).
 */
var _lockImgCache = null;
function _initLockIcons() {
    if (_lockImgCache) return;
    // Reuse from _androidImgMap so there's no duplicate storage
    _lockImgCache = {
        locked:   _androidImgMap['icon_lock'],
        unlocked: _androidImgMap['icon_unlock']
    };
}

/**
 * Push a lock icon element (type:'image') using data URL strings.
 */
function _pushLockIcon(els, lx, ly, iW, iH, isLocked) {
    if (!_lockImgCache) _initLockIcons();
    els.push({
        type: 'image',
        x: lx, y: ly, width: iW, height: iH,
        src: isLocked ? _lockImgCache.locked : _lockImgCache.unlocked,
        pickable: false
    });
}

// ===== 多指触控点击抑制（缺陷 71085412）=====
// 双指缩放时若 ArkUI 层 PinchGesture 未及时识别（快速捏合、提前抬指），
// 触摸序列会完整进入 WebView：VTable 先小幅平移（SCROLL），touchend 收尾时
// 整体位移小于点击阈值又被判定为点按，派发 CLICK_CELL 触发指标穿透。
// ArkTS 侧的 pinchInProgress 抑制依赖手势被识别，存在竞态漏网；
// 在 WebView 侧按触点计数从源头拦截：出现过 2 指及以上触控时，
// 多指期间与其结束后短窗口内不上抛 CLICK_CELL / DBLCLICK_CELL。
var _multiTouchActive = false;
var _multiTouchSuppressUntil = 0;
var MULTI_TOUCH_SUPPRESS_MS = 400;
// VTable 内部可能走 touch 或 pointer 事件，两套信号都监听（capture 阶段，
// 保证先于 VTable 在 canvas 上的处理器更新标志）。
var _activePointerIds = {};

function _mtTouchStart(e) {
    if (e.touches && e.touches.length >= 2) {
        _multiTouchActive = true;
    }
}
function _mtTouchEnd(e) {
    if (_multiTouchActive && e.touches && e.touches.length === 0) {
        _multiTouchActive = false;
        _multiTouchSuppressUntil = Date.now() + MULTI_TOUCH_SUPPRESS_MS;
    }
}
function _mtPointerDown(e) {
    if (e.pointerType && e.pointerType !== 'touch') return;
    _activePointerIds[e.pointerId] = true;
    if (Object.keys(_activePointerIds).length >= 2) {
        _multiTouchActive = true;
    }
}
function _mtPointerUp(e) {
    if (e.pointerType && e.pointerType !== 'touch') return;
    delete _activePointerIds[e.pointerId];
    if (_multiTouchActive && Object.keys(_activePointerIds).length === 0) {
        _multiTouchActive = false;
        _multiTouchSuppressUntil = Date.now() + MULTI_TOUCH_SUPPRESS_MS;
    }
}
window.addEventListener('touchstart', _mtTouchStart, true);
window.addEventListener('touchend', _mtTouchEnd, true);
window.addEventListener('touchcancel', _mtTouchEnd, true);
window.addEventListener('pointerdown', _mtPointerDown, true);
window.addEventListener('pointerup', _mtPointerUp, true);
window.addEventListener('pointercancel', _mtPointerUp, true);

function _isMultiTouchSuppressed() {
    return _multiTouchActive || Date.now() < _multiTouchSuppressUntil;
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
            if (_isMultiTouchSuppressed()) {
                console.log('[' + type + '] 多指触控期间/刚结束，忽略点击（防缩放误穿透，缺陷 71085412）');
                return;
            }
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
    // VTable's setFrozenColCount alone doesn't always refresh the frozen column layout.
    // Use updateOption to ensure the full option (including frozenColCount) is re-applied.
    window.tableInstance.options.frozenColCount = index;
    updateOption(window.tableInstance.options);
    console.log("=====> frozenToCol via updateOption", index)
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
/**
 * Determine whether a column needs customRender based on its header/body features.
 * Only columns with lock icons, classification lines, or body cells with
 * icon/progress/gradient/richText/overlays need customRender.
 */
function _shouldColumnHaveCustomRender(colIdx, columns, records) {
    var col = columns[colIdx];
    if (!col) return false;
    // Header features: lock icon, classification lines, cell icon (e.g. sort indicator),
    // or extra-text badge (e.g. fiscal-calendar tag)
    if (col.__lockInfo) return true;
    if (col.__headerMeta) {
        for (var hi = 0; hi < col.__headerMeta.length; hi++) {
            var hm = col.__headerMeta[hi];
            if (hm && (hm.classificationLinePosition > 0 || hm.icon || hm.extraText)) return true;
        }
    }
    // Body features: check all records for this column
    if (Array.isArray(records)) {
        for (var ri = 0; ri < records.length; ri++) {
            var meta = records[ri]['__meta_' + colIdx];
            if (meta && (
                meta.icon ||
                meta.progressStyle ||
                meta.gradient ||
                (meta.richText && meta.richText.length > 0) ||
                meta.isForbidden ||
                meta.boxLineColor ||
                (meta.classificationLinePosition && meta.classificationLinePosition > 0) ||
                meta.floatIcon ||
                meta.extraText
            )) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Attach a customRender function only to columns that actually need it.
 * Reduces per-cell function-call overhead for large datasets.
 */
function addCustomRenderToColumns(options) {
    var columns = options.columns;
    var records = options.records;
    if (!Array.isArray(columns)) return;
    var fn = buildCellRender();
    for (var i = 0; i < columns.length; i++) {
        if (_shouldColumnHaveCustomRender(i, columns, records)) {
            columns[i].customRender = fn;
            columns[i].headerCustomRender = fn;
        } else {
            // Explicitly remove any stale customRender from previous updateOption
            delete columns[i].customRender;
            delete columns[i].headerCustomRender;
        }
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

        // getRecordByCell returns null for header rows.
        // Use pre-extracted globals (_tableHeaderMeta, _lockInfoMap) to draw
        // classification lines and/or lock icons on header cells.
        // When showHeader=false, the first body row (VTable row 0) also displays
        // lock icons so that column locks are available regardless of frozenRows.
        var record = args.table.getRecordByCell(col, row);
        if (!record) {
            var headerCL = window._tableHeaderMeta && window._tableHeaderMeta[row + '_' + col];
            var lockInfo = window._lockInfoMap && window._lockInfoMap[col];
            // Header cell icon (e.g. management summary sort indicator up/down/normal).
            var hSortIcon = headerCL && headerCL.icon;
            // Header extra-text badge (e.g. fiscal-calendar tag on the dimension corner
            // cell). iOS/Android render it inline right after the title text.
            var hExtra = headerCL && headerCL.extraText;
            if (!headerCL && !lockInfo) return { renderDefault: true };

            var hElements = [];
            var hOwnsText = false; // true when we replace VTable's native header text

            if ((lockInfo && lockInfo.showLock) || hSortIcon || hExtra) {
                hOwnsText = true;
                // Draw header text + sort icon + lock icon (VTable's showFrozenIcon is disabled).
                var hStyle = {};
                try { hStyle = args.table.getCellStyle(col, row) || {}; } catch(e) {}
                var hFontSize = hStyle.fontSize || 14;
                var hColor = hStyle.color || '#222222';
                var hFontWeight = hStyle.fontWeight || 'normal';
                var hTextAlign = hStyle.textAlign || 'left';
                var hPad = hStyle.padding;
                var hPadH = Array.isArray(hPad) ? (hPad[1] || 12) : 12;
                var hCellValue = '';
                try { hCellValue = String(args.table.getCellValue(col, row) || ''); } catch(e) {}
                var hIsLocked = col < (args.table.frozenColCount || 0) || window.__allColsLocked === true;
                var hIconW = 13, hIconH = 14, hIconPad = 4;
                // Resolve sort icon source the same way as body icon cells:
                // prefer `name` (Android drawable name), fall back to iOS path.uri.
                var hSortW = 0, hSortH = 0, hSortPad = 4, hSortSrc = '';
                if (hSortIcon) {
                    hSortW = Number(hSortIcon.width) || 16;
                    hSortH = Number(hSortIcon.height) || 16;
                    if (hSortIcon.name) {
                        hSortSrc = _resolveAndroidImg(hSortIcon.name);
                        if (!hSortSrc && _isValidIconUrl(hSortIcon.name)) hSortSrc = hSortIcon.name;
                    } else if (hSortIcon.path && hSortIcon.path.uri) {
                        hSortSrc = _resolveAndroidImg(_nameFromUri(hSortIcon.path.uri));
                        if (!hSortSrc && _isValidIconUrl(hSortIcon.path.uri)) hSortSrc = hSortIcon.path.uri;
                    }
                    if (!hSortSrc) hSortW = 0; // icon unavailable — skip drawing it
                }
                var hShowLock = !!(lockInfo && lockInfo.showLock);
                // Badge dimensions (defaults mirror the body-cell extraText branch)
                var hEtPad = 2;
                var hEtW = 0, hEtH = 0;
                if (hExtra) {
                    var hEtBg0 = hExtra.backgroundStyle || {};
                    hEtW = Number(hEtBg0.width) || 16;
                    hEtH = Number(hEtBg0.height) || 14;
                }
                var hIconsW = (hSortW ? hSortW + hSortPad : 0) + (hShowLock ? hIconW + hIconPad : 0) + (hEtW ? hEtW + hEtPad : 0);
                // Use canvas measurement for accurate text width; cap at available space
                var hMaxTextW = Math.max(0, w - hPadH * 2 - hIconsW);
                var hMeasuredW = _measureTextWidth(hCellValue, hFontSize, hFontWeight);
                var hActualTextW = Math.min(hMeasuredW, hMaxTextW);
                var hTX = hPadH;
                if (hTextAlign === 'center') hTX = Math.max(hPadH, (w - hActualTextW - hIconsW) / 2);
                else if (hTextAlign === 'right') hTX = Math.max(hPadH, w - hPadH - hActualTextW - hIconsW);
                hElements.push({ type: 'text', x: hTX, y: h / 2, text: hCellValue,
                    fontSize: hFontSize, fill: hColor, fontWeight: hFontWeight,
                    textAlign: 'left', textBaseline: 'middle',
                    maxLineWidth: hActualTextW, autoWrapText: true, ellipsis: false,
                    lineHeight: hFontSize, pickable: false });
                var hCurX = hTX + hActualTextW;
                // Extra-text badge inline right after the title (isLeft → before it).
                if (hEtW) {
                    var hEtBg = hExtra.backgroundStyle || {};
                    var hEtTs = hExtra.style || {};
                    var hEtX, hEtTxtX;
                    // Lock icon is pinned to the right edge — badge must stay left of it.
                    var hEtMaxX = w - hEtW - (hShowLock ? hIconW + hIconPad : 0);
                    if (hExtra.isLeft) {
                        hEtX = Math.max(0, Math.min(Math.round(hTX), Math.round(hEtMaxX)));
                        hEtTxtX = hEtX + hEtW / 2;
                    } else {
                        hEtX = Math.max(0, Math.min(Math.round(hCurX + hEtPad), Math.round(hEtMaxX)));
                        hEtTxtX = hEtX + hEtW / 2;
                        hCurX = hEtX + hEtW;
                    }
                    var hEtY = Math.max(0, Math.round((h - hEtH) / 2));
                    hElements.push({
                        type: 'rect',
                        x: hEtX, y: hEtY, width: hEtW, height: hEtH,
                        fill: hEtBg.color || '#ff0000',
                        cornerRadius: hEtBg.radius || 2,
                        pickable: false
                    });
                    // +1 dy: VRender textBaseline 'middle' aligns the em-box center,
                    // which sits above the CJK glyph center — the character looks
                    // shifted up inside the badge without this correction.
                    hElements.push({
                        type: 'text',
                        x: hEtTxtX, y: hEtY + hEtH / 2 + 1,
                        text: hExtra.text || '',
                        fontSize: hEtTs.fontSize || 10,
                        fill: hEtTs.color || '#ffffff',
                        textAlign: 'center', textBaseline: 'middle',
                        lineHeight: hEtTs.fontSize || 10,
                        pickable: false
                    });
                }
                if (hSortW) {
                    hCurX += hSortPad;
                    var hRsW = Math.min(hSortW, Math.max(1, w));
                    var hRsH = Math.min(hSortH, Math.max(1, h));
                    var hRsX = Math.max(0, Math.min(Math.round(hCurX), Math.round(w - hRsW)));
                    var hRsY = Math.max(0, Math.min(Math.round((h - hSortH) / 2), Math.round(h - hRsH)));
                    hElements.push({ type: 'image', x: hRsX, y: hRsY, width: hRsW, height: hRsH,
                        src: hSortSrc, pickable: false });
                    hCurX += hSortW;
                }
                if (hShowLock) {
                    // Pin the lock icon to the cell's right edge instead of after the
                    // measured text: canvas measurement can under-estimate CJK width
                    // (VTable then renders the header text past the icon and covers it),
                    // and auto column width only measures text, so "text + 4px" could
                    // push the icon across the cell border into the next column.
                    // Pinned right and drawn after the text element, the icon stays
                    // visible and tappable regardless of text overflow.
                    _pushLockIcon(hElements, w - hPadH - hIconW, (h - hIconH) / 2, hIconW, hIconH, hIsLocked);
                }
            }

            // Draw classification lines on top (renderDefault:true keeps VTable's text when no lock)
            if (headerCL && headerCL.classificationLinePosition > 0) {
                var hClPos  = headerCL.classificationLinePosition;
                var hClColor = headerCL.classificationLineColor || '#9cb3c8';
                var hBgCover = '#FFFFFF';
                try { hBgCover = args.table.getCellStyle(col, row)?.bgColor || hBgCover; } catch(e) {}
                // Cover default 1px borders before drawing classification lines to avoid "double line"
                if (hClPos & 1) hElements.push({ type: 'rect', x: 0, y: 0, width: w, height: 1, fill: hBgCover, pickable: false });
                if (hClPos & 2) hElements.push({ type: 'rect', x: w-1, y: 0, width: 1, height: h, fill: hBgCover, pickable: false });
                if (hClPos & 4) hElements.push({ type: 'rect', x: 0, y: h-1, width: w, height: 1, fill: hBgCover, pickable: false });
                if (hClPos & 8) hElements.push({ type: 'rect', x: 0, y: 0, width: 1, height: h, fill: hBgCover, pickable: false });
                if (hClPos & 1) hElements.push({ type: 'line', points: [{ x: 0, y: 0 }, { x: w, y: 0 }], stroke: hClColor, lineWidth: 1, pickable: false });
                if (hClPos & 2) hElements.push({ type: 'line', points: [{ x: w, y: 0 }, { x: w, y: h }], stroke: hClColor, lineWidth: 1, pickable: false });
                if (hClPos & 4) hElements.push({ type: 'line', points: [{ x: 0, y: h }, { x: w, y: h }], stroke: hClColor, lineWidth: 1, pickable: false });
                if (hClPos & 8) hElements.push({ type: 'line', points: [{ x: 0, y: 0 }, { x: 0, y: h }], stroke: hClColor, lineWidth: 1, pickable: false });
            }

            if (hElements.length === 0) return { renderDefault: true };
            // renderDefault:false when we drew text + lock/sort icons (we replace VTable's text rendering).
            // renderDefault:true when only classification lines (VTable renders text natively).
            return { elements: hElements, renderDefault: !hOwnsText };
        }

        var meta = record['__meta_' + col];

        // First body row (when VTable header is hidden) may display lock icons.
        // This keeps column-lock buttons visible even when frozenRows=0.
        var showHeader = args.table.options.showHeader !== false;
        var isFirstBodyLockRow = !showHeader && row === 0;
        var bodyLockInfo = isFirstBodyLockRow ? (window._lockInfoMap && window._lockInfoMap[col]) : null;
        if (bodyLockInfo && bodyLockInfo.showLock) {
            var bStyle = {};
            try { bStyle = args.table.getCellStyle(col, row) || {}; } catch(e) {}
            var bPad = bStyle.padding;
            var bPadH = Array.isArray(bPad) ? (bPad[1] || 12) : 12;
            var bIconW = 13, bIconH = 14, bIconPad = 4;
            var bLockX = w - bPadH - bIconW;
            // Merged first-body-row cells span several rows (dimension title
            // merged with the first data cell) — keep the icon vertically
            // centered in the whole merged rect, matching the centered text.
            var bLockY = (h - bIconH) / 2;
            var bIsLocked = col < (args.table.frozenColCount || 0) || window.__allColsLocked === true;
            var bElements = [];
            // Take over the text rendering (renderDefault:false) and clamp it left
            // of the lock icon. The native text did not know about the icon, so long
            // dimension titles ran underneath it (缺陷 71108534: 锁定icon被名称遮挡).
            var bFontSize = bStyle.fontSize || 14;
            var bColor = bStyle.color || '#222222';
            var bFontWeight = bStyle.fontWeight || 'normal';
            var bTextAlign = bStyle.textAlign || 'left';
            var bValue = '';
            try { bValue = String(args.table.getCellValue(col, row) || ''); } catch(e) {}
            var bMaxTextW = Math.max(0, w - bPadH * 2 - bIconW - bIconPad);
            var bMeasuredW = _measureTextWidth(bValue, bFontSize, bFontWeight);
            var bActualTextW = Math.min(bMeasuredW, bMaxTextW);
            var bTX = bPadH;
            if (bTextAlign === 'center') bTX = Math.max(bPadH, (w - bActualTextW - bIconW - bIconPad) / 2);
            else if (bTextAlign === 'right') bTX = Math.max(bPadH, w - bPadH - bActualTextW - bIconW - bIconPad);
            bElements.push({ type: 'text', x: bTX, y: h / 2, text: bValue,
                fontSize: bFontSize, fill: bColor, fontWeight: bFontWeight,
                textAlign: 'left', textBaseline: 'middle',
                maxLineWidth: bActualTextW, autoWrapText: true, ellipsis: false,
                lineHeight: bFontSize, pickable: false });
            // Extra-text badge (e.g. fiscal-calendar tag) inline after the title,
            // clamped left of the lock icon. The generic meta branch below is
            // unreachable for this row, so it must be drawn here.
            var bMeta = record && record['__meta_' + col];
            var bExtra = bMeta && bMeta.extraText;
            if (bExtra) {
                var bEtBg = bExtra.backgroundStyle || {};
                var bEtTs = bExtra.style || {};
                var bEtW = Number(bEtBg.width) || 16;
                var bEtH = Number(bEtBg.height) || 14;
                var bEtMaxX = bLockX - bIconPad - bEtW;
                var bEtX = bExtra.isLeft
                    ? Math.max(0, Math.min(Math.round(bTX), Math.round(bEtMaxX)))
                    : Math.max(0, Math.min(Math.round(bTX + bActualTextW + 2), Math.round(bEtMaxX)));
                var bEtY = Math.max(0, Math.round((h - bEtH) / 2));
                bElements.push({
                    type: 'rect', x: bEtX, y: bEtY, width: bEtW, height: bEtH,
                    fill: bEtBg.color || '#ff0000', cornerRadius: bEtBg.radius || 2,
                    pickable: false
                });
                bElements.push({
                    type: 'text',
                    // +1 dy: CJK visual-center correction (see header badge branch)
                    x: bEtX + bEtW / 2, y: bEtY + bEtH / 2 + 1,
                    text: bExtra.text || '',
                    fontSize: bEtTs.fontSize || 10,
                    fill: bEtTs.color || '#ffffff',
                    textAlign: 'center', textBaseline: 'middle',
                    lineHeight: bEtTs.fontSize || 10,
                    pickable: false
                });
            }
            _pushLockIcon(bElements, bLockX, bLockY, bIconW, bIconH, bIsLocked);
            return { elements: bElements, renderDefault: false };
        }

        if (!meta) return { renderDefault: true };

        var hasBackground = !!(meta.gradient || meta.progressStyle);
        var hasOverlay = !!(
            meta.isForbidden ||
            meta.boxLineColor ||
            (meta.classificationLinePosition && meta.classificationLinePosition > 0) ||
            meta.floatIcon ||
            meta.extraText
        );
        var hasCustomText = !!(meta.icon || (meta.richText && meta.richText.length > 0) || meta.textPaddingLeft != null);

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
            // Determine if gradient is predominantly horizontal or vertical
            var gDX = (gEnd.x - gStart.x) * w;
            var gDY = (gEnd.y - gStart.y) * h;
            var gGradEls;
            if (Math.abs(gDX) >= Math.abs(gDY)) {
                // Horizontal gradient: use vertical strips
                gGradEls = _buildGradientRects(0, 0, w, h, 0, gColors);
            } else {
                // Vertical gradient: use horizontal strips (reuse function with transposed coords)
                var tmpEls = _buildGradientRects(0, 0, h, w, 0, gColors);
                gGradEls = [];
                for (var _tgi = 0; _tgi < tmpEls.length; _tgi++) {
                    var te = tmpEls[_tgi];
                    // swap x↔y, width↔height to draw horizontal strips
                    gGradEls.push({ type: 'rect', x: 0, y: te.x, width: w, height: te.width,
                        fill: te.fill, lineWidth: 0, pickable: false });
                }
            }
            for (var _ggi = 0; _ggi < gGradEls.length; _ggi++) elements.push(gGradEls[_ggi]);
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
                var pGradEls = _buildGradientRects(pStartX, pBarY, pW, pHeight, pRadius, ps.colors);
                for (var _pgr = 0; _pgr < pGradEls.length; _pgr++) elements.push(pGradEls[_pgr]);
            }

            // Ants dashed line — spans full cell height (0→h), ignores progress bar margin.
            // Drawn as short rect segments (lineDash not supported in HarmonyOS WebView canvas).
            if (ps.antsLineStyle && ps.antsLineStyle.lineRatio != null) {
                var al    = ps.antsLineStyle;
                var alX   = pMarginH + pBarW * al.lineRatio;
                var alColor    = al.color      || '#222222';
                var alLW       = al.lineWidth  || 1;
                var alPattern  = al.lineDashPattern || [4, 2];
                var alDash     = alPattern[0] || 4;
                var alGap      = alPattern[1] || 2;
                var alY        = 0;   // start at cell top
                var alEnd      = h;   // end at cell bottom
                while (alY < alEnd) {
                    var segEnd = Math.min(alY + alDash, alEnd);
                    elements.push({
                        type: 'rect',
                        x: alX - alLW / 2, y: alY,
                        width: alLW, height: segEnd - alY,
                        fill: alColor,
                        pickable: false
                    });
                    alY = segEnd + alGap;
                }
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
                // Rich text segments. '\n' inside a segment breaks the flow onto a new
                // line, matching Android/iOS where the summary cell is 'label:\nvalue'
                // (label on top, bold value below). Segments on the same line flow
                // horizontally.
                var flowLines = [];
                var flowSegs = [];
                var flowH = 0;
                var flushFlowLine = function () {
                    flowLines.push({ segs: flowSegs, height: flowH });
                    flowSegs = [];
                    flowH = 0;
                };
                for (var ri = 0; ri < meta.richText.length; ri++) {
                    var seg  = meta.richText[ri];
                    var rs   = seg.style || {};
                    var rFs  = rs.fontSize   || fontSize;
                    var rCol = rs.textColor  || textColor;
                    var rFw  = rs.isOverstriking ? 'bold' : fontWeight;
                    var pieces = String(seg.text == null ? '' : seg.text).split('\n');
                    for (var pi = 0; pi < pieces.length; pi++) {
                        if (pi > 0) {
                            flushFlowLine();
                        }
                        if (!pieces[pi]) continue;
                        flowSegs.push({ text: pieces[pi], st: rs, fs: rFs, col: rCol, fw: rFw });
                        flowH = Math.max(flowH, rFs);
                    }
                }
                flushFlowLine();

                // Vertically center the whole multi-line block (line height = fontSize,
                // same as the single-line customRender elements).
                var blockH = 0;
                for (var li = 0; li < flowLines.length; li++) blockH += flowLines[li].height;
                var flowY = textY - blockH / 2;
                var blockTop = flowY;
                var blockLeft = Infinity, blockRight = -Infinity;
                for (var ln = 0; ln < flowLines.length; ln++) {
                    var lineMeta = flowLines[ln];
                    var lineMidY = flowY + lineMeta.height / 2;
                    // Measure the whole line first so its start follows the cell's
                    // textAlign (single-segment text already honors anchor above;
                    // richText lines used to be hard-coded to the left padding).
                    var lineW = 0;
                    for (var si0 = 0; si0 < lineMeta.segs.length; si0++) {
                        lineW += _measureTextWidth(lineMeta.segs[si0].text, lineMeta.segs[si0].fs, lineMeta.segs[si0].fw) + 4;
                    }
                    if (lineMeta.segs.length > 0) lineW -= 4; // drop trailing gap
                    var curX;
                    if (anchor === 'center') curX = Math.max(padLeft, (w - lineW) / 2);
                    else if (anchor === 'right') curX = Math.max(padLeft, w - padRight - lineW);
                    else curX = padLeft;
                    blockLeft = Math.min(blockLeft, curX);
                    blockRight = Math.max(blockRight, curX + lineW);
                    for (var si = 0; si < lineMeta.segs.length; si++) {
                        var fs2 = lineMeta.segs[si];
                        var st2 = fs2.st;
                        var rW = _measureTextWidth(fs2.text, fs2.fs, fs2.fw);

                        if (st2.backgroundColor) {
                            var rPadH = st2.paddingHorizontal || fs2.fs * 0.4;
                            var rHt   = st2.height            || fs2.fs * 1.5;
                            elements.push({
                                type: 'rect',
                                x: curX - rPadH, y: lineMidY - rHt / 2,
                                width: rW + rPadH * 2, height: rHt,
                                fill: st2.backgroundColor,
                                cornerRadius: st2.borderRadius || 0,
                                stroke:    st2.borderColor,
                                lineWidth: st2.borderWidth || 0,
                                pickable: false
                            });
                        }
                        elements.push({
                            type: 'text',
                            x: curX, y: lineMidY,
                            text: fs2.text,
                            fontSize: fs2.fs, fill: fs2.col, fontWeight: fs2.fw,
                            textBaseline: 'middle',
                            textDecoration: st2.strikethrough ? 'line-through' : 'none',
                            maxLineWidth: Math.max(0, w - curX - padRight),
                            autoWrapText: true, ellipsis: false,
                            lineHeight: fs2.fs, pickable: false
                        });
                        curX += rW + 4;
                    }
                    flowY += lineMeta.height;
                }

                // iOS renders cell.icon alongside rich text as an independent view;
                // the richText branch above used to skip the icon entirely, losing
                // the status dot on the detail-table index column.
                if (meta.icon) {
                    var rtIcon = meta.icon;
                    var rtIW = rtIcon.width != null ? rtIcon.width : 16;
                    var rtIH = rtIcon.height != null ? rtIcon.height : 16;
                    var rtIPad = rtIcon.paddingHorizontal != null ? rtIcon.paddingHorizontal : 4;
                    var rtAlign = rtIcon.imageAlignment || 3;
                    var rtIconX;
                    if (rtAlign === 2) rtIconX = (w - rtIW) / 2;
                    else if (rtAlign === 1) rtIconX = blockLeft - rtIPad - rtIW;
                    else rtIconX = blockRight + rtIPad;
                    var rtSrc = '';
                    if (rtIcon.name) {
                        rtSrc = _resolveAndroidImg(rtIcon.name);
                        if (!rtSrc && _isValidIconUrl(rtIcon.name)) rtSrc = rtIcon.name;
                    } else if (rtIcon.path && rtIcon.path.uri) {
                        rtSrc = _resolveAndroidImg(_nameFromUri(rtIcon.path.uri));
                        if (!rtSrc && _isValidIconUrl(rtIcon.path.uri)) rtSrc = rtIcon.path.uri;
                    }
                    if (rtSrc) {
                        var rtRW = Math.min(rtIW, Math.max(1, w));
                        var rtRH = Math.min(rtIH, Math.max(1, h));
                        elements.push({
                            type: 'image',
                            x: Math.max(0, Math.min(Math.round(rtIconX), Math.round(w - rtRW))),
                            y: Math.max(0, Math.min(Math.round(blockTop + (blockH - rtRH) / 2), Math.round(h - rtRH))),
                            width: rtRW,
                            height: rtRH,
                            src: rtSrc,
                            pickable: false
                        });
                    }
                }

            } else if (meta.icon) {
                // Icon + text
                var icon     = meta.icon;
                var iW       = Number(icon.width)  || 16;
                var iH       = Number(icon.height) || 16;
                var iPad     = icon.paddingHorizontal != null ? icon.paddingHorizontal : 4;
                var iAlign   = icon.imageAlignment || 3; // 1=left, 2=center, 3=right(default)
                var iText    = meta.title || '';
                var measuredTextW = _measureTextWidth(iText, fontSize, fontWeight);
                var iY       = (h - iH) / 2;
                var iconX, tX, iconTextMaxW;
                if (iAlign === 2) {
                    // Center: icon horizontally centered, text follows its own alignment
                    iconX = (w - iW) / 2;
                    if (textAlign === 'center') tX = w / 2;
                    else if (textAlign === 'right') tX = w - padRight;
                    else tX = padLeft;
                    iconTextMaxW = maxLineWidth;
                } else {
                    iconTextMaxW = Math.max(0, maxLineWidth - iW - iPad);
                    var textBlockW = Math.min(measuredTextW, iconTextMaxW);
                    var iTotalW    = textBlockW + iW + iPad;
                    var iStartX;
                    if (textAlign === 'center') iStartX = (w - iTotalW) / 2;
                    else if (textAlign === 'right') iStartX = w - padRight - iTotalW;
                    else iStartX = padLeft;
                    if (iAlign === 1) { // icon left
                        iconX = iStartX;
                        tX    = iStartX + iW + iPad;
                    } else { // icon right (default)
                        tX    = iStartX;
                        iconX = iStartX + textBlockW + iPad;
                    }
                }
                var _iconSrc = '';
                // Harmony follows Android: prefer `name` over iOS `path.uri`.
                if (icon.name) {
                    _iconSrc = _resolveAndroidImg(icon.name);
                    if (!_iconSrc && _isValidIconUrl(icon.name)) {
                        _iconSrc = icon.name;
                    }
                } else if (icon.path && icon.path.uri) {
                    _iconSrc = _resolveAndroidImg(_nameFromUri(icon.path.uri));
                    if (!_iconSrc && _isValidIconUrl(icon.path.uri)) {
                        _iconSrc = icon.path.uri;
                    }
                }
                // Clamp icon position inside cell bounds; cap rendered size to cell size
                var _renderIW = Math.min(iW, Math.max(1, w));
                var _renderIH = Math.min(iH, Math.max(1, h));
                var _safeIconX = Math.max(0, Math.min(Math.round(iconX), Math.round(w - _renderIW)));
                var _safeIconY = Math.max(0, Math.min(Math.round(iY), Math.round(h - _renderIH)));
                elements.push({
                    type: 'text',
                    x: tX, y: textY,
                    text: iText,
                    fontSize: fontSize, fill: textColor, fontWeight: fontWeight,
                    textBaseline: 'middle',
                    maxLineWidth: iconTextMaxW,
                    autoWrapText: true,
                    ellipsis: false,
                    lineHeight: fontSize,
                    pickable: false
                });
                if (_iconSrc) {
                    elements.push({
                        type: 'image',
                        x: _safeIconX, y: _safeIconY, width: _renderIW, height: _renderIH,
                        src: _iconSrc,
                        pickable: false
                    });
                }

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
                    autoWrapText: true,
                    ellipsis: false,
                    lineHeight: fontSize,
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
            var _bgCover = meta.backgroundColor || args.table.getCellStyle(col, row)?.bgColor || '#FFFFFF';
            // Cover default 1px borders before drawing classification lines to avoid "double line"
            if (clPos & 1) elements.push({ type: 'rect', x: 0, y: 0, width: w, height: 1, fill: _bgCover, pickable: false });
            if (clPos & 2) elements.push({ type: 'rect', x: w-1, y: 0, width: 1, height: h, fill: _bgCover, pickable: false });
            if (clPos & 4) elements.push({ type: 'rect', x: 0, y: h-1, width: w, height: 1, fill: _bgCover, pickable: false });
            if (clPos & 8) elements.push({ type: 'rect', x: 0, y: 0, width: 1, height: h, fill: _bgCover, pickable: false });
            if (clPos & 1) elements.push({ type: 'line', points: [{ x: 0, y: 0 },   { x: w, y: 0 }],   stroke: clColor, lineWidth: 1, pickable: false });
            if (clPos & 2) elements.push({ type: 'line', points: [{ x: w, y: 0 },   { x: w, y: h }], stroke: clColor, lineWidth: 1, pickable: false });
            if (clPos & 4) elements.push({ type: 'line', points: [{ x: 0, y: h },   { x: w, y: h }], stroke: clColor, lineWidth: 1, pickable: false });
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
            // Vertically center the badge in the cell (was pinned to y=2, which
            // floated it above the title text — the fiscal tag on home report
            // cards renders through this body-cell branch, 缺陷 71108534).
            var etBY  = Math.round((h - etBH) / 2);
            elements.push({
                type: 'rect',
                x: etBX, y: etBY, width: etBW, height: etBH,
                fill: etBg.color || '#ff0000',
                cornerRadius: etBg.radius || 2,
                pickable: false
            });
            elements.push({
                type: 'text',
                // +1 dy: same CJK visual-center correction as the header badge
                // (textBaseline 'middle' aligns the em-box center, above the glyph center).
                x: etBX + etBW / 2, y: etBY + etBH / 2 + 1,
                text: et.text || '',
                fontSize: etTs.fontSize || 10,
                fill: etTs.color || '#ffffff',
                textAlign: 'center', textBaseline: 'middle',
                lineHeight: etTs.fontSize || 10,
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
            var _fiSrc = '';
            // Harmony follows Android: prefer `name` over iOS `path.uri`.
            if (fi.name) {
                _fiSrc = _resolveAndroidImg(fi.name);
                if (!_fiSrc && _isValidIconUrl(fi.name)) {
                    _fiSrc = fi.name;
                }
            } else if (fi.path && fi.path.uri) {
                var _fiUri = fi.path.uri;
                _fiSrc = _resolveAndroidImg(_nameFromUri(_fiUri));
                if (!_fiSrc && _isValidIconUrl(_fiUri)) {
                    _fiSrc = _fiUri;
                }
            }
            elements.push({
                type: 'image',
                x: fiX, y: fiY, width: fi.width || 16, height: fi.height || 16,
                src: _fiSrc,
                pickable: false
            });
        }

        // renderDefault: true  → VTable renders text first, our elements overlay on top
        // renderDefault: false → We rendered text ourselves (background cells), no double-draw
        return { elements: elements, renderDefault: !hasBackground && !hasCustomText };
    };
}

/**
 * Build the effective theme from the RN-supplied theme object and write it back
 * onto the option. Shared by initializeTable and updateOption so data updates
 * keep the same theme behavior.
 */
function _applyTheme(option) {
    // Preserve any custom theme styles supplied by the RN side (e.g. rowHeaderStyle,
    // rightFrozenStyle) while still forcing hover transparency and scroll-bar hidden.
    var customTheme = option.theme || {};
    var themePatch = {
        frozenColumnLine: {
            shadow: {
                width: 4,
                startColor: 'rgba(0,0,0,0.08)',
                endColor: 'transparent',
                // VTable's built-in themes default to "always", which paints a dark
                // band over the frozen-boundary separator even at scroll offset 0.
                // Tables with locked columns (e.g. home report cards) then show the
                // dimension separator in the wrong color. "scrolling" only shows the
                // shadow while the user is scrolling horizontally.
                visible: 'scrolling'
            }
        },
        scrollStyle: {
            visible: "none"
        },
        headerStyle: Object.assign({
            hover: { cellBgColor: 'transparent' }
        }, customTheme.headerStyle || {}),
        bodyStyle: Object.assign({
            hover: { cellBgColor: 'transparent' }
        }, customTheme.bodyStyle || {})
    };
    // Only add frozen styles when RN side provided them, so VTable defaults are
    // preserved otherwise.
    if (customTheme.rowHeaderStyle) themePatch.rowHeaderStyle = customTheme.rowHeaderStyle;
    if (customTheme.rightFrozenStyle) themePatch.rightFrozenStyle = customTheme.rightFrozenStyle;
    if (customTheme.bottomFrozenStyle) themePatch.bottomFrozenStyle = customTheme.bottomFrozenStyle;
    if (customTheme.cornerHeaderStyle) themePatch.cornerHeaderStyle = customTheme.cornerHeaderStyle;
    option.theme = VTable.themes.DEFAULT.extends(themePatch)
}

// ============================================================
// 冻结列维度文字 sticky（缺陷 71101165）
// 冻结列中跨行合并的维度单元格（如"蓝湖"），其文字由 VTable 原生渲染在
// 合并格垂直居中位置，垂直滚动时会随内容滚出可视区。iOS/Android 原生表格
// 让维度文字始终停留在可视区内。这里在 WebView 内叠一个 pointer-events:none
// 的 DOM 层：当原文字滚出可视区时，用单元格背景色矩形遮盖 VTable 的原文字，
// 并在 clamp 后的位置（贴 body 可视区上/下缘）按相同样式重绘文字。
// 坐标系均为 VTable canvas 的 CSS 像素（= vp），冻结列 x 固定，仅 y 随
// scrollTop 变化，因此每帧只需 DOM 更新，不触碰 VTable 渲染。
// ============================================================
var _stickyState = {
    candidates: [],   // [{ cellLeft, cellWidth, cellTopInContent, cellHeight, text, style, els }]
    overlay: null,
    headerH: 0,       // 冻结行（表头）总高 = body 可视区顶部
    // 无锁定列且列总宽超视口（可横向滚动，如管理总表 frozenAbility locked:false）时，
    // 维度列 x 随 scrollLeft 移动，overlay 需按横向滚动偏移并按 x 交集裁剪。
    xScrollable: false,
    pendingOptions: null, // canvas 布局未完成时挂起的 option，待 rAF 循环重试
    rafId: 0,
    running: false,
    lastScrollTop: -1,
    lastScrollLeft: -1,
    lastViewH: -1,
    lastViewW: -1,
};
// sticky 文字与 body 可视区上/下缘的最小间距（px）
var _STICKY_EDGE = 4;

/**
 * Resolve the text style of a merged cell's anchor: theme body/rowHeader style
 * (RN side keeps them identical so frozen columns don't change appearance)
 * overridden by the anchor cell's customCellStyleArrangement entry.
 */
function _stickyReadCellStyle(options, anchor) {
    var theme = options.theme || {};
    var base = theme.bodyStyle || theme.rowHeaderStyle || {};
    var padH = 12;
    if (Array.isArray(base.padding) && base.padding[1] != null) padH = base.padding[1];
    // 行高必须与 VTable 原生渲染一致：VTable 未显式传 lineHeight 时按
    // floor(1.2*fontSize) 计行高（vtable.min.js TextMetrics），且 clamp 到
    // 不小于 fontSize。overlay 若按 fontSize 计，多行长文本格的文字块高度
    // 会被低估，遮盖矩形盖不住原生文字 → 两份文字叠影。
    var fs = base.fontSize || 14;
    var lh = Number(base.lineHeight);
    if (!(lh > 0)) lh = Math.floor(fs * 1.2);
    lh = Math.max(Math.floor(lh), fs);
    var st = {
        fontSize: fs,
        lineHeight: lh,
        color: base.color || '#222222',
        bgColor: base.bgColor || '#ffffff',
        fontWeight: base.fontWeight || 'normal',
        textAlign: base.textAlign || 'left',
        padH: padH,
        // 列分割线颜色：cover 遮住原生格右缘 1px 分割线后需在 overlay 上补画
        // （缺陷 71269622：第一个维度列无列分割线）。
        borderColor: base.borderColor || '#e8e8e8',
    };
    var styleDefs = options.customCellStyle;
    var arrangement = options.customCellStyleArrangement;
    if (Array.isArray(styleDefs) && Array.isArray(arrangement)) {
        var defMap = {};
        for (var di = 0; di < styleDefs.length; di++) defMap[styleDefs[di].id] = styleDefs[di].style;
        for (var ai = 0; ai < arrangement.length; ai++) {
            var pos = arrangement[ai].cellPosition;
            if (pos && pos.col === anchor.col && pos.row === anchor.row) {
                var s = defMap[arrangement[ai].customStyleId != null ? arrangement[ai].customStyleId : arrangement[ai].styleId];
                if (s) {
                    if (s.fontSize != null) st.fontSize = s.fontSize;
                    var lh2 = Number(s.lineHeight);
                    if (lh2 > 0) st.lineHeight = Math.max(Math.floor(lh2), st.fontSize);
                    if (s.color != null) st.color = s.color;
                    if (s.bgColor != null) st.bgColor = s.bgColor;
                    if (s.fontWeight != null) st.fontWeight = s.fontWeight;
                    if (s.textAlign != null) st.textAlign = s.textAlign;
                    if (Array.isArray(s.padding) && s.padding[1] != null) st.padH = s.padding[1];
                }
                break;
            }
        }
    }
    return st;
}

/**
 * Create the overlay container (once) inside #tableContainer, above VTable's canvas.
 */
function _stickyEnsureOverlay() {
    if (_stickyState.overlay && _stickyState.overlay.parentNode) return;
    var container = document.getElementById('tableContainer');
    if (!container) { _stickyState.overlay = null; return; }
    if (getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
    }
    var ov = document.createElement('div');
    ov.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;' +
        'pointer-events:none;overflow:hidden;z-index:10;';
    container.appendChild(ov);
    _stickyState.overlay = ov;
}

/**
 * Lazily create the per-candidate cover + text elements.
 */
function _stickyEnsureEls(cand) {
    if (cand.els) return cand.els;
    _stickyEnsureOverlay();
    if (!_stickyState.overlay) return null;
    var cover = document.createElement('div');
    cover.style.cssText = 'position:absolute;display:none;';
    cover.style.background = cand.style.bgColor;
    var text = document.createElement('div');
    text.style.cssText = 'position:absolute;display:none;box-sizing:border-box;' +
        'white-space:pre-wrap;word-break:break-word;';
    _stickyState.overlay.appendChild(cover);
    _stickyState.overlay.appendChild(text);
    var els = { cover: cover, text: text, textH: 0, measuredW: null };
    // 展开/收起 icon 元素（缺陷 71269622）：与文字同层，src 延迟到显示时解析。
    if (cand.icon) {
        var iconEl = document.createElement('img');
        iconEl.style.cssText = 'position:absolute;display:none;pointer-events:none;';
        _stickyState.overlay.appendChild(iconEl);
        els.icon = iconEl;
    }
    cand.els = els;
    return cand.els;
}

/**
 * Hide all candidate elements and stop the rAF loop.
 */
function _stickyClear() {
    _stickyState.running = false;
    if (_stickyState.rafId) {
        cancelAnimationFrame(_stickyState.rafId);
        _stickyState.rafId = 0;
    }
    for (var i = 0; i < _stickyState.candidates.length; i++) {
        var els = _stickyState.candidates[i].els;
        if (els) {
            els.cover.style.display = 'none';
            els.text.style.display = 'none';
            if (els.icon) els.icon.style.display = 'none';
        }
    }
    _stickyState.candidates = [];
    _stickyState.lastScrollTop = -1;
    _stickyState.lastScrollLeft = -1;
    _stickyState.lastViewH = -1;
    _stickyState.lastViewW = -1;
}

/**
 * Drop cached text heights (e.g. after zoomIn/zoomOut changed theme fontSize)
 * and force a refresh on the next frame.
 */
function _stickyInvalidateText() {
    for (var i = 0; i < _stickyState.candidates.length; i++) {
        if (_stickyState.candidates[i].els) {
            _stickyState.candidates[i].els.textH = 0;
            _stickyState.candidates[i].els.measuredW = null;
        }
    }
    _stickyState.lastScrollTop = -1;
}

/**
 * Rebuild sticky metadata from the option being applied. Call AFTER the option
 * is live on the table instance (initializeTable / updateOption 末尾), so
 * tableInstance.frozenColCount reflects the effective frozen state.
 */
function _stickyRebuild(options) {
    _stickyClear();
    var inst = window.tableInstance;
    if (!inst) return;
    var mergeItems = options.customMergeCell;
    if (!Array.isArray(mergeItems) || mergeItems.length === 0) return;

    var frozenCols = inst.frozenColCount || 0;
    if (window.__allColsLocked === true) {
        // 全列锁定时 frozenColCount 被映射为 0 传给 VTable，但所有列视觉上都冻结。
        frozenCols = inst.colCount || (Array.isArray(options.columns) ? options.columns.length : 0);
    }
    var frozenRows = inst.frozenRowCount || 0;
    var cols = options.columns || [];
    // 冻结列 x 前缀和（ArkTS 已把测量列宽写入 columns[i].width）。
    var colPrefix = new Array(cols.length + 1);
    colPrefix[0] = 0;
    for (var c = 0; c < cols.length; c++) {
        var cw = cols[c] ? (cols[c].width != null ? cols[c].width : (cols[c].minWidth || 100)) : 100;
        colPrefix[c + 1] = colPrefix[c] + cw;
    }
    // 无锁定列（frozenCols=0，如列数少不超宽的分组明细报表 frozenCount=0）时，
    // 若列总宽不超过视口宽（无横向滚动），所有列视觉上本来就固定不动，
    // 维度列的垂直 sticky 依然应该生效（对齐 iOS/Android，缺陷 71101165）。
    // 列总宽超过视口（可横向滚动，如管理总表 frozenAbility locked:false）时，
    // iOS/Android 原生表格的合并大格文字同样跟随可视区（与列是否锁定无关），
    // 因此也生成候选，x 坐标随 scrollLeft 偏移（xScrollable，缺陷 71101165 复审）。
    var xScrollable = false;
    if (frozenCols <= 0) {
        var canvasW = (inst.canvas && inst.canvas.offsetWidth) || 0;
        if (canvasW > 0 && colPrefix[cols.length] <= canvasW + 1) {
            frozenCols = cols.length;
        } else if (canvasW > 0) {
            frozenCols = cols.length;
            xScrollable = true;
        } else {
            // WebView 初始布局未完成（canvas 宽度还是 0），挂起，待布局完成后
            // 由 rAF 循环重试（否则按误判的 frozenCols=0 静默放弃）。
            _stickyState.pendingOptions = options;
            _stickyState.running = true;
            _stickyState.rafId = requestAnimationFrame(_stickyLoop);
            return;
        }
    }
    if (frozenCols <= 0) return;

    // 行高前缀和。rowHeights 是 VTable 全局行高（showHeader 时含表头行）。
    // 内容区行 r（r >= frozenRows）距滚动内容顶部的偏移 = prefix[r] - prefix[frozenRows]。
    var rowH = Array.isArray(options.rowHeights) ? options.rowHeights : [];
    var defRowH = options.defaultRowHeight || 40;
    var rowLen = Math.max(rowH.length, inst.rowCount || 0);
    var prefix = new Array(rowLen + 1);
    prefix[0] = 0;
    for (var r = 0; r < rowLen; r++) {
        prefix[r + 1] = prefix[r] + (rowH[r] != null ? rowH[r] : defRowH);
    }
    var frozenH = prefix[Math.min(frozenRows, rowLen)];

    var candidates = [];
    for (var mi = 0; mi < mergeItems.length; mi++) {
        var item = mergeItems[mi];
        var range = item && item.range;
        if (!range || !range.start || !range.end) continue;
        var sr = range.start.row, er = range.end.row;
        var sc = range.start.col, ec = range.end.col;
        // 仅处理单列垂直合并的维度格：跨列合并（ec > sc）是汇总行（小计/总计）
        // 的横跨格，不是维度列，纳入后遮盖矩形会横跨多列盖住数据行。
        if (er <= sr || sc !== ec || sr < frozenRows || ec >= frozenCols || er >= rowLen) continue;
        var text = item.text != null ? String(item.text) : '';
        if (!text) continue;
        var x0 = colPrefix[Math.min(sc, cols.length)];
        var x1 = colPrefix[Math.min(ec + 1, cols.length)];
        // 锚点格 meta.icon（树形/分类报表的展开/收起箭头）：overlay 搬运文字时
        // 必须一并重绘 icon，否则大合并格的 icon 留在整格垂直中心（原生渲染，
        // 高于一屏时在视口外）永远不可见（缺陷 71269622：第一个维度未显示
        // 展开/收起图标）。行号 → records 下标与 _injectMergedCellRenders 一致。
        var candIcon = null;
        if (Array.isArray(options.records)) {
            var _sbShowHeader = options.showHeader !== false;
            var _sbRecIdx = sr - (_sbShowHeader ? 1 : 0);
            if (_sbRecIdx >= 0 && _sbRecIdx < options.records.length) {
                var _sbMeta = options.records[_sbRecIdx]['__meta_' + sc];
                if (_sbMeta && _sbMeta.icon) candIcon = _sbMeta.icon;
            }
        }
        candidates.push({
            sc: sc, sr: sr, ec: ec, er: er,
            cellLeft: x0,
            cellWidth: x1 - x0,
            cellTopInContent: prefix[sr] - frozenH,
            cellHeight: prefix[er + 1] - prefix[sr],
            firstRowH: rowH[sr] != null ? rowH[sr] : defRowH,
            text: text,
            icon: candIcon,
            style: _stickyReadCellStyle(options, range.start),
            els: null,
        });
    }
    if (candidates.length === 0) return;

    _stickyState.candidates = candidates;
    _stickyState.headerH = frozenH;
    _stickyState.xScrollable = xScrollable;
    _stickyEnsureOverlay();
    if (!_stickyState.overlay) { _stickyState.candidates = []; return; }
    console.log('[STICKY] rebuild candidates=' + candidates.length +
        ' frozenCols=' + frozenCols + ' frozenRows=' + frozenRows +
        ' xScrollable=' + xScrollable +
        ' sample="' + (candidates[0] ? String(candidates[0].text).slice(0, 8) : '') + '"');
    _stickyState.running = true;
    _stickyState.rafId = requestAnimationFrame(_stickyLoop);
}

/**
 * One update pass. Computes each candidate's sticky state at the current
 * scrollTop/scrollLeft and syncs its cover/text elements.
 */
function _stickyApply(scrollTop, scrollLeft, viewH, viewW) {
    if (viewH <= 0) return;
    var inst = window.tableInstance;
    var viewBottom = viewH;
    // body 视口顶 = 表头真实总高。优先 VTable API（真实行高），失败回退
    // rebuild 快照。快照按 options.rowHeights 前缀和计算，与 VTable 实际
    // 渲染的行位置存在偏差时，overlay 文字与 body 数据行错位（维度文字
    // 与第二列对不准）。
    var viewTop = _stickyState.headerH;
    try {
        var fhw = inst && inst.getFrozenRowsHeight && inst.getFrozenRowsHeight();
        if (isFinite(fhw) && fhw > 0) viewTop = fhw;
    } catch (e) {}
    var viewLeft = scrollLeft;
    for (var i = 0; i < _stickyState.candidates.length; i++) {
        var cand = _stickyState.candidates[i];
        var els = cand.els || _stickyEnsureEls(cand);
        if (!els) continue;
        var st = cand.style;
        // 合并格真实视口矩形：VTable 内部按真实行高 + 当前滚动偏移计算
        // （冻结行/列已处理），与 body 数据行天然同步。异常/无效时回退
        // rowHeights 快照路径。
        var cellTopView, cellBottomView, cellLeftView, cellW;
        var rect = null;
        try {
            rect = inst && inst.getCellRangeRelativeRect &&
                inst.getCellRangeRelativeRect({ start: { col: cand.sc, row: cand.sr }, end: { col: cand.ec, row: cand.er } });
        } catch (e) {}
        if (rect && isFinite(rect.top) && isFinite(rect.left) && isFinite(rect.width) && rect.height > 0) {
            cellTopView = rect.top;
            cellBottomView = rect.top + rect.height;
            cellLeftView = rect.left;
            cellW = rect.width;
        } else {
            cellTopView = _stickyState.headerH + cand.cellTopInContent - scrollTop;
            cellBottomView = cellTopView + cand.cellHeight;
            cellLeftView = cand.cellLeft - viewLeft;
            cellW = cand.cellWidth;
        }
        // 合并格与 body 可视区不相交 → 无需 sticky。
        if (cellBottomView <= viewTop + 0.5 || cellTopView >= viewBottom - 0.5 ||
            cellLeftView + cellW <= 0.5 || cellLeftView >= viewW - 0.5) {
            els.cover.style.display = 'none';
            els.text.style.display = 'none';
            if (els.icon) els.icon.style.display = 'none';
            continue;
        }
        // 首次显示前测量文字块高度（line-height 与 VTable 原生行高一致，
        // 见 _stickyReadCellStyle）。
        // xScrollable 时格宽可能被视口裁剪，交集宽变化须重测（换行数会变）。
        var visXLeft = Math.max(cellLeftView, 0);
        var visXRight = Math.min(cellLeftView + cellW, viewW);
        var visXW = visXRight - visXLeft;
        if (!els.textH || els.measuredW == null || Math.abs(els.measuredW - visXW) > 0.5) {
            var te = els.text;
            te.style.display = 'block';
            te.style.top = '-9999px';
            te.style.left = visXLeft + 'px';
            te.style.width = visXW + 'px';
            // 有 icon 时文字让出左侧 icon 位（对齐原生 iconTextMaxW = maxLineWidth - iW - iPad），
            // 换行数/块高测量才会与最终布局一致。
            te.style.padding = (cand.icon && st.textAlign === 'left')
                ? '0 ' + st.padH + 'px 0 ' + (st.padH + (Number(cand.icon.width) || 16) +
                    (cand.icon.paddingHorizontal != null ? cand.icon.paddingHorizontal : 4)) + 'px'
                : '0 ' + st.padH + 'px';
            te.style.fontSize = st.fontSize + 'px';
            te.style.lineHeight = st.lineHeight + 'px';
            te.style.color = st.color;
            te.style.fontWeight = st.fontWeight;
            te.style.textAlign = st.textAlign;
            te.textContent = cand.text;
            els.textH = te.offsetHeight;
            els.measuredW = visXW;
            te.style.display = 'none';
        }
        // 用户期望（对齐 iOS/Android 视觉）：维度文字始终垂直居中于
        // "合并格与 body 视口的可见交集"——格可见一半时文字在剩下一半的中间，
        // 格完全跨越视口时文字在视口中间。VTable 原生渲染在整个合并格的垂直
        // 中心，合并格高于一屏（如士大夫"蓝湖"跨 240 行）时文字永远在屏幕外
        // （缺陷 71101165），因此按交集居中重绘并遮盖原文字。
        var visTop = Math.max(cellTopView, viewTop);
        var visBottom = Math.min(cellBottomView, viewBottom);
        var centerY = (visTop + visBottom) / 2;
        // 原文字位置（整格垂直居中）。
        var origCenterY = (cellTopView + cellBottomView) / 2;
        // 原生文字块与 body 视口的可见高度。交给原生渲染的判据是"原生文字
        // 自身大部分在视口内且位置已接近期望位置"——格部分滚出时原生块
        // （在整格中心）可能已整体滚出视口（尤其高于一屏的合并大格），
        // 此时 handoff 会丢文字（既不在原生位置可见、overlay 又被隐藏）。
        // 交集高度不足也不再 handoff，统一走 overlay 并把文字 clamp 进
        // 视口（溢出部分被 overlay 的 overflow:hidden 裁掉，不丢字）。
        var origTop = origCenterY - els.textH / 2;
        var origBottom = origCenterY + els.textH / 2;
        var origVisible = Math.min(origBottom, viewBottom) - Math.max(origTop, viewTop);
        if (origVisible > els.textH * 0.6 &&
            Math.abs(origCenterY - centerY) < els.textH / 2 + 4) {
            // 原生文字大部分可见且已在期望位置附近 → 交给 VTable 原生渲染。
            els.cover.style.display = 'none';
            els.text.style.display = 'none';
            if (els.icon) els.icon.style.display = 'none';
            if (els.shown !== 0) {
                els.shown = 0;
                console.log('[STICKY] handoff "' + String(cand.text).slice(0, 8) + '" st=' + Math.round(scrollTop) + ' textH=' + els.textH + ' gap=' + Math.round(Math.abs(origCenterY - centerY)) + ' origVis=' + Math.round(origVisible));
            }
            continue;
        }
        // 遮盖整个"合并格与 body 视口的可见交集"：x 方向按交集裁剪后外扩
        // 2px（xScrollable 时格可能被横向滚出部分，斜体/粗体字形边缘可能
        // 超出行框），外扩后 clamp 到 [0, viewW] 防越出 overlay；y 方向不按
        // 估算的文字块高度遮盖——原生文字的行高/换行与 overlay 的 DOM 测量
        // 存在系统性差异（VTable canvas 换行 vs CSS word-break），按估算高度
        // 遮盖会露出原生文字的顶部/底部若干行，与 overlay 重绘文字叠成重影。
        // 交集是原生格内容可能出现的全部范围，整块盖住即与估算误差无关；
        // text 元素在 cover 之上，不受影响。
        var coverTop = Math.max(viewTop, cellTopView);
        var coverBottom = Math.min(viewBottom, cellBottomView);
        var coverLeft = Math.max(0, visXLeft - 2);
        var coverRight = Math.min(viewW, visXRight + 2);
        if (coverBottom - coverTop > 0 && coverRight - coverLeft > 0) {
            els.cover.style.display = 'block';
            els.cover.style.left = coverLeft + 'px';
            els.cover.style.width = (coverRight - coverLeft) + 'px';
            els.cover.style.top = coverTop + 'px';
            els.cover.style.height = (coverBottom - coverTop) + 'px';
            // cover 遮住原生格右缘的 1px 列分割线（x 外扩 +2px），在 cover 右缘
            // 补画同色分割线，否则维度列与数据列之间无线（缺陷 71269622）。
            els.cover.style.borderRight = '1px solid ' + st.borderColor;
        } else {
            els.cover.style.display = 'none';
        }
        els.text.style.display = 'block';
        els.text.style.left = visXLeft + 'px';
        els.text.style.width = visXW + 'px';
        // 文字中心对齐交集中心；交集高度不足（格只剩一小条可见）时整体
        // clamp 进 body 视口，溢出部分由 overlay 的 overflow:hidden 裁掉。
        var textTop = centerY - els.textH / 2;
        if (textTop < viewTop) textTop = viewTop;
        if (textTop + els.textH > viewBottom) textTop = viewBottom - els.textH;
        els.text.style.top = textTop + 'px';
        // 展开/收起 icon 跟随文字块重绘（缺陷 71269622）：原生 icon 画在整格
        // 垂直中心，高于一屏的合并格 icon 永远在视口外；overlay 只搬文字不画
        // icon 时维度格的展开/收起图标消失。布局对齐原生 customRender 的
        // imageAlignment=1（icon 在文字左侧，垂直与文字块居中），非 left 对齐
        // 的场景维持旧行为（不画），避免引入新错位。
        if (els.icon) {
            if (cand.icon && st.textAlign === 'left') {
                var _icW = Number(cand.icon.width) || 16;
                var _icH = Number(cand.icon.height) || 16;
                var _icSrc = els.iconSrc;
                if (!_icSrc) {
                    if (cand.icon.name) {
                        _icSrc = _resolveAndroidImg(cand.icon.name);
                        if (!_icSrc && _isValidIconUrl(cand.icon.name)) _icSrc = cand.icon.name;
                    } else if (cand.icon.path && cand.icon.path.uri) {
                        _icSrc = _resolveAndroidImg(_nameFromUri(cand.icon.path.uri));
                        if (!_icSrc && _isValidIconUrl(cand.icon.path.uri)) _icSrc = cand.icon.path.uri;
                    }
                    els.iconSrc = _icSrc || '';
                    if (els.iconSrc) els.icon.src = els.iconSrc;
                }
                if (els.iconSrc) {
                    els.icon.style.display = 'block';
                    els.icon.style.left = (visXLeft + st.padH) + 'px';
                    els.icon.style.top = (textTop + (els.textH - _icH) / 2) + 'px';
                    els.icon.style.width = _icW + 'px';
                    els.icon.style.height = _icH + 'px';
                    if (!els.iconShown) {
                        els.iconShown = 1;
                        console.log('[STICKY] icon overlay "' + String(cand.text).slice(0, 8) + '" src=' + (els.iconSrc.slice(0, 40)) + ' w=' + _icW);
                    }
                } else {
                    els.icon.style.display = 'none';
                }
            } else {
                els.icon.style.display = 'none';
            }
        }
        if (els.shown !== 1) {
            els.shown = 1;
            console.log('[STICKY] overlay "' + String(cand.text).slice(0, 8) + '" st=' + Math.round(scrollTop) + ' textH=' + els.textH +
                ' rectTop=' + Math.round(cellTopView) + ' rectH=' + Math.round(cellBottomView - cellTopView) +
                ' snapTop=' + Math.round(_stickyState.headerH + cand.cellTopInContent - scrollTop) + ' snapH=' + Math.round(cand.cellHeight) +
                ' vis=[' + Math.round(visTop) + ',' + Math.round(visBottom) + ']');
        }
    }
}

function _stickyLoop() {
    if (!_stickyState.running) return;
    var inst = window.tableInstance;
    if (!inst) { _stickyState.running = false; return; }
    // 消化挂起的 rebuild：canvas 布局完成后重试（见 _stickyRebuild 的 pending 分支）。
    if (_stickyState.pendingOptions) {
        if (inst.canvas && inst.canvas.offsetWidth > 0) {
            var po = _stickyState.pendingOptions;
            _stickyState.pendingOptions = null;
            _stickyRebuild(po);
            return;
        }
        _stickyState.rafId = requestAnimationFrame(_stickyLoop);
        return;
    }
    var scrollTop = 0;
    try { scrollTop = inst.getScrollTop() || 0; } catch (e) { scrollTop = _stickyState.lastScrollTop; }
    var scrollLeft = 0;
    if (_stickyState.xScrollable) {
        try { scrollLeft = inst.getScrollLeft() || 0; } catch (e) { scrollLeft = _stickyState.lastScrollLeft; }
    }
    var viewH = 0;
    try { viewH = (inst.canvas && inst.canvas.offsetHeight) || 0; } catch (e) {}
    var viewW = 0;
    try { viewW = (inst.canvas && inst.canvas.offsetWidth) || 0; } catch (e) {}
    if (scrollTop !== _stickyState.lastScrollTop || scrollLeft !== _stickyState.lastScrollLeft ||
        viewH !== _stickyState.lastViewH || viewW !== _stickyState.lastViewW) {
        _stickyState.lastScrollTop = scrollTop;
        _stickyState.lastScrollLeft = scrollLeft;
        _stickyState.lastViewH = viewH;
        _stickyState.lastViewW = viewW;
        _stickyApply(scrollTop, scrollLeft, viewH, viewW);
    }
    _stickyState.rafId = requestAnimationFrame(_stickyLoop);
}

function initializeTable(option) {

    optionTemp = option;
    // Pre-load lock icons (canvas→PNG) before any cell rendering.
    _initLockIcons();
    // Extract __lockInfo and __headerMeta from columns into globals BEFORE VTable
    // processes the option. VTable may transform/strip unknown column properties.
    _extractColumnMeta(option.columns);

    _applyTheme(option);

    const input_editor = new VTable.editors.InputEditor();
    VTable.register.editor('input-editor', input_editor);

    // Attach customRender to all columns before creating the table instance.
    // Functions are stripped by JSON.stringify in ArkTS, so we inject them here
    // inside the WebView where they can reference the live VRender primitives.
    _fixProgressStyleWidths(option);
    _injectMergedCellRenders(option);
    addCustomRenderToColumns(option);

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

    // Explicitly apply frozen counts; VTable's constructor may not always honor
    // frozenRowCount/frozenColCount from the initial option.
    if (option.frozenRowCount != null) {
        try {
            tableInstance.setFrozenRowCount(option.frozenRowCount);
        } catch (e) {
            console.error('[initializeTable] setFrozenRowCount failed:', e);
        }
    }
    if (option.frozenColCount != null) {
        try {
            option.frozenColCount = _applyAllColsLockedFlag(tableInstance.colCount, option.frozenColCount);
            tableInstance.setFrozenColCount(option.frozenColCount);
        } catch (e) {
            console.error('[initializeTable] setFrozenColCount failed:', e);
        }
    }

    // Apply precise row heights computed by ArkTS native measurement.
    // This avoids the unpredictable autoHeight behavior with merged cells.
    if (Array.isArray(option.rowHeights)) {
        option.rowHeights.forEach(function(height, rowIndex) {
            try {
                tableInstance.setRowHeight(rowIndex, height);
            } catch (e) {
                console.error('[initializeTable] setRowHeight failed:', rowIndex, height, e);
            }
        });
        // Baseline for the updateOption skip-default optimization: rows whose
        // height is unchanged AND equal to defaultRowHeight don't need an
        // explicit setRowHeight after updateOption re-created the records.
        window.__lastAppliedRowHeights = option.rowHeights.slice();
    }

    _fixPhantomHeaderRow(tableInstance, option);
    // 重建冻结列维度文字 sticky 元数据（option 已生效，frozen 计数为最终值）。
    _stickyRebuild(option);
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
    _stickyClear();
    window.tableInstance.release();
}

function clearSelected() {
    window.tableInstance.clearSelected();
}

/**
 * Workaround: @ohos/vtable may incorrectly render a phantom blank header row
 * when showHeader=false. Detect by comparing rowCount with records.length,
 * then force-hide any extra top rows by setting their height to 0.
 */
function _fixPhantomHeaderRow(tableInstance, options) {
    if (options.showHeader !== false) return;
    try {
        var expectedRows = options.records ? options.records.length : 0;
        var actualRows = tableInstance.rowCount;
        if (actualRows > expectedRows) {
            var phantomRows = actualRows - expectedRows;
            for (var i = 0; i < phantomRows; i++) {
                tableInstance.setRowHeight(i, 0);
            }
            tableInstance.resize();
        }
    } catch (e) {
        console.error('[_fixPhantomHeaderRow] failed:', e);
    }
}

function updateOption(options) {
    // Re-extract column metadata globals and re-attach customRender.
    _extractColumnMeta(options.columns);
    _fixProgressStyleWidths(options);
    _injectMergedCellRenders(options);
    addCustomRenderToColumns(options);
    // Re-apply the theme patch — the RN-supplied theme does not carry
    // frozenColumnLine, so without this the built-in "always" shadow would
    // come back after any data update.
    _applyTheme(options);

    // Apply frozenColCount/frozenRowCount explicitly; VTable's updateOption
    // sometimes ignores changes to frozen counts, so set them directly and
    // recreate cells to ensure the frozen layout is refreshed.
    var nextFrozenColCount = _applyAllColsLockedFlag(window.tableInstance.colCount, options.frozenColCount);
    options.frozenColCount = nextFrozenColCount;
    var currentFrozenColCount = window.tableInstance.frozenColCount;
    var frozenColChanged = nextFrozenColCount != null && nextFrozenColCount !== currentFrozenColCount;
    if (frozenColChanged) {
        try {
            window.tableInstance.setFrozenColCount(nextFrozenColCount);
        } catch (e) {
            console.error('[updateOption] setFrozenColCount failed:', e);
        }
    }

    var nextFrozenRowCount = options.frozenRowCount;
    var currentFrozenRowCount = window.tableInstance.frozenRowCount;
    var frozenRowChanged = nextFrozenRowCount != null && nextFrozenRowCount !== currentFrozenRowCount;
    if (frozenRowChanged) {
        try {
            window.tableInstance.setFrozenRowCount(nextFrozenRowCount);
        } catch (e) {
            console.error('[updateOption] setFrozenRowCount failed:', e);
        }
    }

    window.tableInstance.updateOption(options);

    // Force a full recreate if frozen columns/rows changed so the split line
    // and frozen cells are redrawn with the correct styles.
    // This MUST run BEFORE the rowHeights loop below: renderWithRecreateCells →
    // createSceneGraph() clears rowHeightsMap and rebuilds the scene tree from
    // defaultRowHeight, which would wipe heights set by a preceding
    // setRowHeight loop. The initial lock toggle (unlock/lock, e.g. home report
    // cards) always goes through this path — setting heights first and
    // recreating after collapsed wrapped cells back to one line (缺陷 71100902).
    if (frozenColChanged || frozenRowChanged) {
        try {
            window.tableInstance.renderWithRecreateCells();
        } catch (e) {
            console.error('[updateOption] renderWithRecreateCells failed:', e);
        }
    }

    // Apply precise row heights after option update — and after any
    // renderWithRecreateCells, mirroring initializeTable's order
    // (build → setRowHeight), so no later rebuild can discard them.
    // rowHeights now stays in sync with the spliced records (tree expand/
    // collapse), so the array can grow large. Skip rows whose height is both
    // unchanged from the last applied array AND equal to defaultRowHeight —
    // tableInstance.updateOption has already re-created those rows at the
    // default height, so re-setting thousands of them on every splice is
    // wasted work. Custom heights and changed rows are always re-applied.
    if (Array.isArray(options.rowHeights)) {
        var prevHeights = window.__lastAppliedRowHeights;
        var defH = options.defaultRowHeight;
        options.rowHeights.forEach(function(height, rowIndex) {
            if (prevHeights && prevHeights[rowIndex] === height && height === defH) {
                return;
            }
            try {
                window.tableInstance.setRowHeight(rowIndex, height);
            } catch (e) {
                console.error('[updateOption] setRowHeight failed:', rowIndex, height, e);
            }
        });
        window.__lastAppliedRowHeights = options.rowHeights.slice();
    }

    _fixPhantomHeaderRow(window.tableInstance, options);
    // 数据/行高/冻结状态已更新，重建 sticky 元数据并立即按当前滚动位置刷新。
    _stickyRebuild(options);
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
    _stickyInvalidateText();
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
    _stickyInvalidateText();
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