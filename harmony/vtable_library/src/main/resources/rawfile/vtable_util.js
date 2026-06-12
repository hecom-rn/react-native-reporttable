var h5Port;
var output = document.querySelector('.output');

// Global cell render metadata — populated in initializeTable/updateOption
window._tableHeaderMeta = {}; // { 'vtableRow_col': { classificationLinePosition, classificationLineColor } }
window._lockInfoMap = {};     // { colIndex: { showLock: bool } }

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
    for (var _mi = 0; _mi < mc.length; _mi++) {
        var _item = mc[_mi];
        if (!_item || !_item.range || !_item.range.start) continue;
        var _sr = _item.range.start.row;
        var _sc = _item.range.start.col;
        var _er = _item.range.end.row;
        var _ec = _item.range.end.col;

        // Header row merges: lock icon + classification lines
        if (_sr === 0) {
            var _hasLock = window._lockInfoMap && window._lockInfoMap[_sc];
            var _hasCL   = window._tableHeaderMeta && window._tableHeaderMeta['0_' + _sc];
            if (_hasLock || _hasCL) {
                var _fn = buildCellRender();
                _item.customRender = _fn;
                _item.headerCustomRender = _fn;
            }
            continue;
        }

        // Body merges: check if anchor cell has any overlay meta in records
        if (Array.isArray(options.records) && options.records.length > 0) {
            var _recIdx = _sr - 1; // body record index (VTable header is row 0)
            if (_recIdx >= 0 && _recIdx < options.records.length) {
                var _meta = options.records[_recIdx]['__meta_' + _sc];
                if (_meta && (
                    _meta.classificationLinePosition ||
                    _meta.boxLineColor ||
                    _meta.isForbidden ||
                    _meta.floatIcon ||
                    _meta.extraText
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
    'checkbox': 'data:image/png;base64,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',
    'checkbox_hl': 'data:image/png;base64,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',
    'collapsed_icon': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAAEgBckRAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAMKADAAQAAAABAAAAMAAAAADbN2wMAAAFL0lEQVRoBe2Zy2tcVRjAM8kkTRoiztj6mGYeSYaMEYWCGlR8gMaiLqwK/g3iyoWrLqwKYtZuBDeu3LlQQTDWByg2BYX6ajApSWYmGSJpkbHGZoJ5jL/v9p7Lmfue8V5NJQcO3znf+d733O9899xEF210dLQpsKW5IqHobqHSJtYCnDkN7yHfT1QCEWcheKBFTFfXtG1um8L1rkK5GgHS6ajiCIamVcGEUIyNjT3jHlgfdiuEQjMyMjJpN9g+d9VQKpWGHIRKq+eCIrDBnlQqdSidTg/V6/V525pjivD1hKjf3t7+w7HqRGwuLy8PuvrgpL2GEfNbouRFqOP/GUOhUOjXpckYM07puBYN3d3djfHx8WOKAOKLzWbzZTUX2MJAFBI7Ozu1YrF4P8RXWG+Wy+UjngyyIEx7e3uzSD7PuKQTyzhpR8hcmNzwgmsxyYtIx8fHkMlkDoumdvaSblnYcSWpNqpfYMJKs9N1tFftQoLmbT+EIIH2ddd9JETinkA2YapSqfwuY7cG3bfg76WfJcwP2mk8FcgzyefzEz09PXWEiKIJFFlZCNyvCLuVXvN7fp4KxJJqtfoLIMG7dxR4SRTR/qL30eXVuk0Qfs1XgWJcXFy8zDgh6YQMcQrBr6q1IBhKgRJCiLYYhxYufLHvIlGwKZqiblaqEME8vAogL+OI26SRN1HwJoJfohsJKgIls729vU8sLCxsSNFTQWAc1neh5AbZRflEIvHs0tLShxFYbonA8CaJdMbYRVELt7RQDv4r21RTGP3wf+oBSa3ALng9TMCGh4cHoH3bi9Y1RGTM92A4TVl9zotR8AhP9/X1Sap50YvOVQHpWE6mOuXUfVgnZ4KjoTyL8N9kAYPudhCYCFcFsoaSNEBOrdtRUhOcagi/E+Ur5rzEeXFerdmhpwIhREkGsEQ/hpK64PiWeAjhP8sYy7PQXJSxV/NVIEwIKAJ+pN+IkgZp5WvBE54jWN7imeDtLVCBMKDkOOAbulGBDwwMDM3Pzxvxl3W/FkqBCECJhOYNhB+am5v700+ovpbUJ0FjqvlXgmjs66E9sDOGnR8oCIyUESJVYgRSt0+waSjo7+8vR6nEuHu4ZsxbUlVI6S0leNStyrtTUHWRKHmfHkv5ErXlyKvSn8eB7yRCUtSpD/pL5LIXGo3GmbW1tVhK1k6dkS1CljpBtnoHGTebcqbFgatMjIp0a2trcL8ZbndYHGHPi83SjJfAKqf3u/Fisc3Gw7FnUlEaZztwIM7ohpF93T+BtuohMtZnRGXKjMyXpLWT7RRfbhE1750/Zu1hc/0T8vtTbrRuuLaeAEX0aYRsmIIe5bzYwKnvzWskN/meOIrzW+D9ybyLVMZfIc+/5snksiDnQFPh8dw4mdXcC/LhdhxnzrB+VKMp7+7uPsbdWFnDOYbUGUWM/IKFnLa4zgE6xTXABQ3nOdRt7sgBJdnDmMvcGp7gSuwHRScQpfdg+AyG3qThQzmt0RvDyBxQgrPZbIbPqM8xcELhgFcx9mmcSQI/YG4dmIwvQDvFN8a6Rh96qDvQ1kvspWF1dXWNtTtyuVwqmUx+yliKw0HZKhhvsTE/x/xJtqr88oikReKAsmRlZUW+nifNeuUjxkbGwvAZXtbnarVaQ9FGBSN1QBll1iuPq3mcsK00Gqchnco+cKDTyEXFd/AEoopkp3LkCcwqZu06QaH2HbTZOKv+HMuN5/VyI6GCWuVnzV3WMWmWtXI78QhdLkT1o18x/ZdQbkmkvvoKw6flV5YY8zffr7uBpE3ZHQAAAABJRU5ErkJggg==',
    'copy': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAdCAMAAACHZFx5AAAAOVBMVEUAAABclfhdlvhdlvhdl/ddl/pdlfhclvhelvldlvhclvhdlvddlvhgmPhgn/9dlvddlfddlvlhnv/LEddCAAAAE3RSTlMA/veSZV2bzU7hv6hsJAzth3wVjGCWuAAAAFxJREFUKM/tyzkSgDAMBEGNwYjDNsf/HwuISOAiJqCTDaZWzIQTtJdKMFaeEip1BJHYdM66nQFZuBuKhZkUHaW3QBCvof3D14JqPRxeAsWHjmg7QnAgW8gj3nAddg4pAxsYc/LMAAAAAElFTkSuQmCC',
    'copy_disable': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAdCAYAAACwuqxLAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAGKADAAQAAAABAAAAHQAAAAAq1frdAAABUElEQVRIDWNkwALOnTu34v///8FYpIgR+sPIyHgFqLDZyMhoEwsxOkhRAzScDeg4E6CejWfPnvVjJEUzMWqBhjOfP38+C0hPAlp2muoWgBwBteQXkP4JtgAY5pFAjg1QjpUYV6KrAbr0EVBsJjDMX8PkgMHzG8RmBBreDjS8AiZBLg205AEXF5eehobGZ5AZMAtAkZwGlPwPxLlAiz6RYwFQXz4QG3/9+tUVqH8dshksQAkhoMAPoPemIkuQwgaGginIAiYmJmF0fUzoAtTmj1pAMERHg2g0iAiGAEEFo6loBAQR1VsVSGF2GcSmmQXACsycphYAq2BwpQ/KByAGy8WLF7lBNpIJ+KH6fqHrZwHadBRYnzr8+fPnA7Al8AddASE+UD8jUD87UN1fYJ18Al09EzMzcxJQzQGgxH8g5iAVQw1/DDQjSV9f/yZQPwoAAIvueRLzQ2iDAAAAAElFTkSuQmCC',
    'dot_delete': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAADKADAAQAAAABAAAADAAAAAATDPpdAAAArklEQVQoFZWSwQ3DIAxFazpFxannbBF1jNxaxK37IJJbx6gyAjdGqDqG+38EFxRVxIdYfL9vsBw5lVBViTE+kO+QhiJnEVmcczOyUhN+QggXCC/AI89toLaiNnnvv4ad/8E0s1Fh5GytdRCebded8zWl9OENfHNXkDUg64A9poGGQ0FDPuDIBtMvvQaygkG4sDfy7g5qM8ArFnjjDWB1olCLbWatMLptmgCErl/jB45LWqU1SD7pAAAAAElFTkSuQmCC',
    'dot_edit': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAADKADAAQAAAABAAAADAAAAAATDPpdAAAAu0lEQVQoFY2SvQ0CMQyFn90gRggNA7DFiTHo+KsQswAVCDrGQLcFA9BwIyAajF90h3S6oFyK/Lx8thy/COphZjI6YGEfzCGYRNlwF8XlucFZRIyacBofLbxfuPq24DkxysEQs8daKmXmDMz4ggxZCXtbehmnRNaO5OWtNNbcuUoLZPX3wDTTVr0Z2lbyJ4W3Lo/VhLPKPvcNICtsVdjh5kH/PGjyldUWU6WDNMXVsrlJrNE4stFpAn2/xheOuEYhimNlDAAAAABJRU5ErkJggg==',
    'dot_new': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAADKADAAQAAAABAAAADAAAAAATDPpdAAAAwUlEQVQoFY2SPRKCMBCF98XGG4iVB/AWjoXaYmnnz6Ec6SyhRQvGW3gAKzmCjax5wTSZKKQI2bcfm2UfkO9SVSSXYicqW3ueUgZwF0hWL9OTPavTuE2uxfj1bs6qMmMcLkBuw4HZPBbp07DyP5gvs1DLKDAq8702egyrxmIYHAx7jiWjmmXZkvvAKBCIZE2gdYbGja4TawGyhnPuyVtjJAPHmpR59csDX4xe1Kv1nC0pTaHgk+HTG0cWPulu6vFrfAAi1ljwVHEc1QAAAABJRU5ErkJggg==',
    'dot_readonly': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAJxJREFUKFNjZICC////M35bwZ3C8J8hmYHhvzZEmPEqAyPDXK6Ir3MYGRn/g0VAxNe1XJL/f/5fwvCfwQlmAArNyLCPkZ0xhjv423NGkMlfl3PtwakYppORYR935DcXkOLU///+z8JqMpogIxNjGuPXZVwn/v//b06UBkbGk4xfl3F+/v+fgYc4DQxfyNFAqpNI9TTJwUpyxJGaNADIjGIntsQ9sQAAAABJRU5ErkJggg==',
    'dot_select': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAADKADAAQAAAABAAAADAAAAAATDPpdAAAAEUlEQVQoFWNgGAWjIUCdEAAAAkwAAe0H5NwAAAAASUVORK5CYII=',
    'dot_white': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAADKADAAQAAAABAAAADAAAAAATDPpdAAAAeklEQVQoFZVSyQ3AIAyDvrsAAzIWo/TPAkxC/6ldkUelpE0jmcPOxZHSMhHJQAU6MBe4JpfV755BFOAAPKNW1JmZ35w1CX1ywsCSUasMYJ9R62xnorf9cSh/c26+ZisMGLZksoMBzZRssvHQ/66ViRAUfzitvCp9fo0LsnBD7c30kvIAAAAASUVORK5CYII=',
    'down': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIKADAAQAAAABAAAAIAAAAACshmLzAAACL0lEQVRYCe1WQUvcQBR+L7vN5tZlD7XdepKCnjx4aPFS8NKe3ONCbxV0o7KrFQShP6D30lLJkoM/oB7twcuCp+6l0IMgLLQgui4isqIXg0n6DRjIhmxmEnpzA0Pee/N973vzJpOEaHQ99A5w1ga0Wq18p9PZBb9QLBYr1WrVyZJLy0ISHIh/8X2/gvG23+9bWfNkKqDZbDYgvByIwn6P2Gbgp7mn3gLLst4w8w+I5iJCHvyKaZp7kXiim6oAiE8h20+Mx3FZUdg14rO1Wu0wbj4uplyAbdslz/PaWPmLuESh2B/Yr9CJi1BsqKn0DGDlj1zX/a4gLoQmMHYFZ6hqaEKpAOC/YsyFeDLzNQDfZCAxLy0AT/c6cDWVZBHM4j03Eh50pQWg7R8HKeqeCjcvS2cYxozjOE9luLh5Xdd7cfFRLNwB6XtgfNt/7jqUaQtyOvVOVvg0LBi1pc/A3S39AulJlKjig3sO3FgSVnoKmOlTUoKkORWudAuEwLPPvuX76d4FELfP1nkpqUAxJ+2AAJUNqhNTS9gqF1Z1AM6qIlYFRjRu+6W7G2oDnfwxYvqrGfSya/L/+xiJEk8W+VLL0Tw6cZVQ8rUOjKq4yKO0BYFgt8FHGlMVRbhBLHT3chq9O66z8r+A4KYqQBC6a7wP0oawBy6mrdM1TvU3JPhKp2BA6N7BydjGyQj+C3d6H3ghDieLSV9EwxJMTlPj6DeVsYJCqUzm6KszrFOjuKwD/wB91JZmmhjwCgAAAABJRU5ErkJggg==',
    'edit': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYBAMAAAASWSDLAAAAMFBMVEUAAABdlvdclvdtpP9el/ldlfddlvhcl/lclvhelvlttv9dlfhcl/hcl/lfmPtclfirjUb7AAAAD3RSTlMA5sgOTevNUr8uB96Qfz75rmcbAAAAeklEQVQY05XQwQ1FQBSF4ZOQvLyltYWFAogKdKAEJVCDRoi6LLRAjNhxJjM5Y+vsvvyrexEXt10NRAMak3DpClQXuh5uUZHDwK/aS2yvQCgQIRAKDgqEwkIoZIQLgg3CzCCMDMJ/Euy+wQS04Wz8dvsQv/ZA3N1+Z/0Apxw4VNPmybMAAAAASUVORK5CYII=',
    'edit_disable': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAGKADAAQAAAABAAAAGAAAAADiNXWtAAABmElEQVRIDd2VzUrDQBSFHVPjKgGFPkJwVyFZ1J073VgqKD5DX6IUH0jwZyG6clkXTUO77CMURBJUiCTxHMlArCmZSVx5YZg7M3e+c3s7kxEbsCAITtI0HWZZ1hFCmJyrsHesX7iue18Wt1gs7CiKbrBmtiaTSS9JklsGAv4CkdeyTcU5xH1g/Fackz7hYRg+YtxF3FMLzoiLGJwjoyv6da0IB2NsWVZ/Ew7LsvxruG3bx47jhBTYQovRalue+QMAXbSxhBNIgUZWgB8A9ANOcCOBKngjARV4bQFVOAV4TLUsh3+fc2z8VXMJm06nI1zeHS0BVThFAB+gayv/ySvw5+JRlFmv9rhfQkmgBH7ES7QKLBtXCgC+Lb8tADBzZTgFKwUA30Mcb6g2XEnA87wZAveR+aFqWQiWpnSKchG5R6uvLJEWrST4fwh84pepvMMlBVg/hTtm4vmNWaI5nDa+Hafrw/VWfN8/A3MXIjMBcB/fjWsiMLFE1+h1w35m3ibPMIyeoJOLDOF20PiE1jYkGUNgDsAljvfdF2h51d1gMHVuAAAAAElFTkSuQmCC',
    'expanded_icon': 'data:image/png;base64,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',
    'icon_lock': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIKADAAQAAAABAAAAIAAAAACshmLzAAACaUlEQVRYCe1Wz4vTQBRukk1yqC6LaHXrBg+yIuuCCPoPeJLIevBcLBTSykL3sjfxtKwH7wtSmlKQHqqHhTUHPSgInpaFgoKiVz2KKOJB0x/xG8mEoclMMhs8dQeGeX0/vvfNm5nXFApHY9YroMgWoNPpHB+Px/eDILiF2HOYPuZHRVEeO47zCGsggylFwHXdK0j+BAmWOUle6Lp+p1arfeXYY2o1puEout3uwmQyeQnzv+TY6W/Md/j9idn1jdFo1OdAJKozE/B9/x7KfiJEeWWa5lK9Xr/caDQuQr8C/Wdig3y93W7boV/qkolAq9XSgbQRon0pFou3q9XqN4oOEuQO2LQSILFJbWlrJgIAOY9phmBPK5XKz2lgVOM9dPuh/tK0nfc7EwHs7AIFUFX1gMoJ61uiQwVO93q9+QR7TJWJAKKWaCTAf1B5eoXtO9XhzkQxVJe0ZiIA4MgPMved0ztAEuHFRDFJialO2AeQS8HbXwfYXQSshkEfkCixCvAnjeks8YPPGyz9tOakEWfeKJfLWwB9CHuJ8TkF2eJM9twJmZuDwUDxPO815MSRViYnMUpCiQ0IMdIInJHIxXNd5BmIPo2AKJbYSD+I9YS0INaeh8CuZVklMnHh9lhQGTkPgR3btv+QiYQ7MklZ3zwErlEgXLSrVJZd52QDGP8H6BEuvg9UHME2SDCm7GIeAnOaphlIruIbQNhPRHTyEChg9ycxhd1UlJzYchFAi34OjP9KgLxxtr0S0tHAuWf5xxP2ibRX8CzKdnhBiCE8AsMwmsPhUMNO15D/mCSHX7igHr6Sm5JxR+4zVoG/PZK5+yMLIkEAAAAASUVORK5CYII=',
    'icon_unlock': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIKADAAQAAAABAAAAIAAAAACshmLzAAACh0lEQVRYCe1WO2vbUBS2JbsNdaHOkIYkpHQotKRDp/YPJFPJksUZDB38pItLH0OhdHBKxgyZCo5sQ4cEvGXND0imDIGEEih0yVD6wMpU/JL7HaFrrnWvpCtXWyIQ59zz+j4d3Vcsdv1c9Q7E/RpgGMbyYDB4FY/HnyFuejgc/oF+qOv6Vj6fP/LLVfVJCbRarRumaW6iyFuACjEgMYBvI51Ob2YyGdInfjRZZrvdrgL4HQf+A6DHiP1J8bDreKsg+VqWH8YmfF2z2bzf6/W+AmCKvhTyRalU2oMOdajhtxQsy/oMECJ/ifdBuVz+HQaUjxU6APAKgTtB71F8l8BpDGkVi8Ua1E+O/w5k2dEnEgIBgD92KvVSqVRdVlXTNIMjxeJloYE2gQAKP6QsyG/ZbLYtq4AuXMButx2E7XhZnIpNIICke5SIwmZAAUbOjg+I9XQn3B4A2xOTtdjtZ2P4X0K/jd/RZbZJpEDAq0ij0Vjs9/sf4F/CS8vQDsWKiNVqtY9eeY7dBOH9QqGw4/4wgUAikXhESQD7y4piaaa73S7tfAvMFlaC8HMs4TnkVflcgQC22HM+gHSQWYWYGJzVQ7doyY4RkE1CFj+SSJwfDf5PoQ6MPUoExjK8B7RNd7zdck9UBN5gx5xNJpOLmGRncii5NQoCHZwV21Q+l8v9wmRryqHk1igI3KzX60+48k85PVCNgkAMlxaDkLAfrECsB6JyAZEQQL2UU/MWV1tJjYrANG5ROibgjBIqFyRsRJwvjHoXt6MTJIQ+mFQJ0M3H98HsV7kXCHWUfgFOvAOgj84GXyY+TjqQ3G4lAriAfEfyGpJP8VruIgrjS+R/QZcqCrHXIVesA/8AVBnOjBS6GOwAAAAASUVORK5CYII=',
    'normal': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIKADAAQAAAABAAAAIAAAAACshmLzAAACAElEQVRYCe1Wv0vDQBQ2Wms3i4OKbmLB2UFxEVx0aseAUxViImIRQRD8A/wHFKUlg93tqINLwEkXN0Eo6CSIiFRcSiCp3yspXEOSe4luJnC99/t79+767gYG0u+/V0BJWgDLsjLNZrMB/5F8Pl9SVdVOEmswiRP5APyk0+mUMNZarVY1aZxECdRqtQqAt3ugoDcgO+jxcebYW1CtVlcVRbkG6JAPyAVfMgzjyiePZGMlAPA5RLvDGA2KisS+IV/Sdf0xSB8kYydgmuaY67r3WPlsUCBB9gx6EZX4EGShJOsMYOXDjuNcMsAJaAajQT6hqIKClQDsTzFWBD8ZuQyDM5kR6aUJ4HTvwU7nBPPZaJ6vT9zPShNA2Y/6XfgcxzcjC5fL5eZt256U2QXps9nsW5A8lYkVkPaBer0+/ZstKJfLryKgn5aegXa7/QCncb8jh4fvO+wmomyl/wK01+OoAFE6jq90CwgAXY2u27i9wEQ73opKkHTSCngBdjFbHs2ZbmG0wzFkVYACcS8jlP0FDWjhTy8jSkDTtE8ELoL8Ij7o867jIhecYnC3oIuHwE8gVAA5XUH/j4sE1+O8Bcg9VgLkgCRuMO0TLX5I6hC6WK8h8mefARGMaNx051hx910I8AusfNNvw+GljSgsSKFQqOBlPAU9PcuNMLtUnlZAVoEfkd+kXPkzR3kAAAAASUVORK5CYII=',
    'portal_icon': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIKADAAQAAAABAAAAIAAAAACshmLzAAAE1klEQVRYCe2WW2xUVRSGO9POUCc1mUIqCMFAnKJcJCbCg0IijZUGKg8QmFBbZ9LSm0LUF8UYIPZBLooxkQbTaafNJISkbSgkQMQaaNIHNHILIaBSIxCjCWpTnABp51a/dTL7cM7hnOn4DDtZZ+291r/X+vf17IKCR724/s8EdHZ2LgS/PpPJVKKfdblcT01OTibQf9G+iD6Nr7elpeXffOPmRYDES0n0KUGr0VofkiWo/43NQ30G9cJs0ru0Iz6fr62uri4+FZGcBCRZJBLZQZCd2URXsUWoDzLKn1Xwvr4+bzweX87o38S/Bfs05I/CwsJwY2PjaYWz044EOjo6ZGQxAtagbyPbCHYEPWkXSNlisdiciYmJ7fR7W2zgW5qbm7uV36odCTDyXoIE6TBcXFy8IRwOj1o752ozgGr8/RAoRmqampp67fBuOyNr/nE2+aDX662aKjnJVkej0SeNsViikySuJM4dliYG5gWjX9UfItDV1bWEDm0AfkGC9fX14wpspwn8DPajJJtr9TP1Z91u90bssie+tPql/RABkreLnVKb53HaD96bTCZHJKC1MPVnIBfF/hqDWyd+ZniVaCkmAgBWMGWvYu+i4wUNkePD6Ctwb0KuQzZpBx0aGiqCwDC+UQa3nz5ylOVIa8VEAMA2rBmPx7Mv63dU2cAHBECCa07AioqKFAmfxy93xQKwx9E3Fd5EAMd8HMcaGhp+UwAnPTIyshX8YvGjrzrhxO73+3eT+E+pg5WTp98hJgIlJSVrcL4lwFylu7u7DP8nBkxOAsFg8C7YjxQeMrLBtWIiUFtbO8Za3ldOJ51KpfYwEr/y51oChWFPHQL3g7TR+gzIdGiFi2cBU3UTtglls9Oc9+fS6fRP2anUIAQ8RztFI83+CTstITmWg/keTIk63voMEGTF2NhYm11So42NOseYXHy0JfDLyErIzUPbFu4FIdqmkgtIJ0DgmZD4AJav2PZ+YLxBdQgZRs4/MGu1JHFuWWymJiT0IygOfQk4n3JTvQ+JX7n7XwyFQvdMPW0akF3PiAaUSwZAArmY8i76DNB5lvQiYGB8fDzfIFUqE/2/ZaN9odp2mkHuQS4afToBEs9UDuqtjE4Pruw2erXYSH6bWQuhHX/V3LLTgb6LmDa5TgCHEDglQZAbyEs8NNQrB5e5EDAA0fmCp7BiIXmWORb2xns4fchXRpBOgECXSktL3yBYVAIjtziSaSPYWCegNnpsn3N3DBp91npPT0858baT4zq+fqNfJ8Ad0CoJmUq5sf5B2uV1YwRb6lUE/JHA8mRzLMziE4lE4jCAafxh37H+tHQC2euyQB4fAD8ksJ+n1QkuntkO0d1FRUU11oBGLBvOw91yCNsyyLbbvQ/1Y2jsKHU6y7tgK/I7Uk2iK+i8C9Pu543Qz0AqSf5deXn5WvkzWgM4EqCji4fDQXQrneIE2c1T++upntrZfhvQ8qt+GjmObGYAtv8YRwJ00grHsZVgcr59kLhD/SBLNBAIBC6rEUlSRryQn9Tr1JvBLkJktJ+xsXfl2sxTEiBIAb/fuUznXqqbEI/YKPICGoVUhqRl1DU7bbkLvoHkDtb8EvWcJS8CKgL7QqZ0M0lWkXQpugztRssdIG/CM7SPMt3671b1faydZuA/ZhMrFLMPuT0AAAAASUVORK5CYII=',
    'revert': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIKADAAQAAAABAAAAIAAAAACshmLzAAADT0lEQVRYCe1WX0iTURQ/5/vmzLQkwdDNGlHUWz0UvYoSBAlWSD6JFUVq2RYIoW8S0YsP4SaVEBTUi0V/KAhBqIceBKEiH4JMaOLmrIcswUzXvtPvTr+18NvGvi99qTO2e3fPOb/zu+ee+4fov+TIQEWvHKrslXBlSA7mMLWl1rJ5eYOyB/oBEfJRgvZms7Wry0jA1y+VhkFPSagE4ON6Cd2wGySbnyWBqntStDhPT4RoCzPN6C6qi5zmL9mA7OpWEBARTsToDoLvI6Y4DBqi7TxmN0AuvxUEPEG6gjVvUI6aUFs0wC9ygTjRc7oziu5EwqBby2M90xf4Yrp+NfopAhVBqUbBDeFbgEBh1qgD62/YCcpCcTZo0lVKY+GT/CMbRooA9vp7pH5nNuO8dUzfEGDAvY66J1o4ZuWfqgEEn7EycDQmVArcM9hR7zwhqbfCSmXAc012SZyG4bAJ1T+tEzWRTt+tnHKNYd0KcHD5YHcYeEfRqon+xJI2xgL8KN0/RUANekNSiyIcVHUA4wdTfjrGjBV1IFVB2Z8Qug8iWzGxWdZpd6ydJ0zI1BKogeh5fo6Bs6oPhwa1JVXfiUT8PFLopmrM9CsmthGZuZqO9wcBpZgK8E00PaoPEp1qa6q+Ewm3cRj+lxQG0nnE2yepYl9BQBm1BqgTjB+rPu6D/uQWVX8ciKeI+rCsH8CAgdloQlkS6GY2ysuoCSReg7Ebe/qhLyTbTCc77asWjgvTXeWLzNaaGJYElHK0mef0QqoHiShIlC0Y1Gw62W01g4aVL8p6h4mRkYAyiLRxVNOoDql7pum4mh0Kgn1KQjCVm1Aus5Opjfr5LXR1mfT5jCd0cmMXqEJcNP2yZsA0+mvt0uGkGHw2MdeUAIqwZjnwmzUnoJ54CHpcBcZNO2QSyFkDpqHTdmE+eaqWqOO4GDekibcmS+DtlUYEXpq9UHDcz7MmgVXNgKdf1ss8daHwu9QJiM9oMdNlM7hqcc5Yy/brsnkuTq14E6lneV4C0AIg+3DiHYDjhqQz00fchDXpN6Eaz5iBuUXqAGtbb0Ls8+RmV40SHGSDLo1OTbbz1NLI79+MBHShl0jdOZiiZvIUPOfhEcEERhD8Nh4hg3ki/EPmvwAarfmkVuvpNQAAAABJRU5ErkJggg==',
    'selected': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIKADAAQAAAABAAAAIAAAAACshmLzAAADoElEQVRYCcWXO2gUURSGz0zWZLORVcRAiIoWSQoVbRRSSMDCJuKihTaKvQERbAULwTaNoAg2CjZaaBRtLCxEDFiJGMSkUAxRCIgu5mGiO/7fzNx1NvvIZBPJgdnZuY/z/ffcO/ee8SylnbwXtM7O22ELrOAFtjvwrNsz66Z7YDalsimVjZlnj3JZe37/lLeQxrV8NDaBu+bn7XIpsNMi5Ru3jms9K/qe3c1m7YqEfG3Up66A80+Dto/TdqlkdlHgDpzMqPV33Yu6FnUtxL1bFYINekbdZl0deg7NsxnfbHhXp129Nuj9iksrbjUFMOq5WXsgP/20/qZWn3XNV3St/5BV1Q513hILUdfR9pydqBWNKgGF28G+P2ZPNOrtSJ7QEH7WZzWs2ajaHoWwjVaeTWZabHDkjPc22alCACOfnbPXwIuqGVfL3xUtkl3T/c8oCr1qmicaEpFrt4PJSGh8kTHnhN3B3wu8Wjie8YEvBoRvGLAiqllZAAtOIvsJOyOPp8+1W9UdX/jENwxYziG6LA79hGo73q1izp3TenfWxB6tCU3FjKaih6kII8B7DpzV3uyCqwU9sFUhDocY1eIbBqyQqb+eRt+qhTetwvwbyUn7qkUu6/8WdprdPGQ28sls6KWZNrLQeEX3R1EoKgqdfry95tlk1hqe0YAGurRf5/4JhQGLAcP29adANTvcWpgbOfDpObPjz8wmZyo9l1li+xwsVLO91rIMalNaLfiHH9WdHQu2z6lGk8XqdrZNoXuh+OB4OUsLx49jwWaRhgLcwZIE3RrQVqoThsXUSMRK4Ph3LNjha0hhvEj5W7YLr6J5ZD7riVgpHOdlVmCBr4cpCtvKpTxFxvyxiFhMtUQ0A8ezY2kKvmTCTMasj/NcnCpzIh4eMetsjyLhGhGV5GqvteBc2+QdFgabRTjGA8lEPXMikpFoFg7DsWD75HAUksk0sqUimhm5819mie2TQEpEkTSKbbKRJUW4TSZt2J1fGGHKJibscJs5die4XirZOQ6K8bDENa9979sUla8UTq9eDZRUzfftxuOz3lD4GpK9ckRSwZG5nAFuBo7vME8UK2TqORQQn8vDgMnhSKPW2vCJb0zQYZeWhQIoJHVW9EfJlXp1pZgJuqUyfOET3zBguY4VnHVNSlFEWFrMjkrmJFns3pRrwo1m6Z05x4fLiEnLXehd24oIuEIisW4fJk7Eun6aORHcica6fJwmRcRC/svn+V+8qKUjrjaiPQAAAABJRU5ErkJggg==',
    'trash': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAHKADAAQAAAABAAAAHAAAAABkvfSiAAABoklEQVRIDe1Wu0oDQRS912T1DxSxsdfSL1BEzAMRSSUhVnaCj0awSSFYWdlZJVEQbHxFCT7+wNI6nRBRP0AjuZ6rgezOzhCFZRHMwMLMOeeeu3NnsrlMjrFyJQP1Z9oGvUhCww5ZAGaiJzyHo4O0tZfitwDZXiRtoGL1F9pBojUXb8OFaAjPBmL7wK/bNM6ELJRHMCUSNHue55ot2MSyFZlstehOY8FZE6IC4bF8L97jA70T08dlgb2wwo2ky9JEZZIj49S/P8FNU6lbj3VwuiTXyDgdU9ab2HcY08b+UppMSW5x007Nd8qU5QLcSQgHppwFP7LhgTPUrwt+e1O41im/Qe5YEiKUEaY5P65zxZQrigS84LOguHr6YwIiP+Gfj+XwChGNHyWMKNeXTS9hlNXslTTyavZK2ilpkbnFTFW0Dmcd9HummHKqMTnb2tnTmOJqgbMmpuvqEs/bcBf2z7402rziPF5RDi9dkRlXWbrh7VhPvcyGOHSGuAQH+C9apRbV0GB187bz7eujXqYgdIZo0zcB7kLYMMW/WDfUQ73MmE/dBn1MiIVtRgAAAABJRU5ErkJggg==',
    'trash_disable': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAHKADAAQAAAABAAAAHAAAAABkvfSiAAABgUlEQVRIDe1WS06EQBCliRGOoF6BFXAAt/42HmC8hdGF0cSbOLM2cTHD6M64h7DhCjpXgAX4ivQY6O4aO2QyLqQT0l2vq+pRVf0TDtOKotgvy/KxaZorqBwyaiq8AjDzff8uCIJKnSR5zwQSJsluuHkGPwB+XVVVg95oyxLKyBzXdS/CMFwwBD04TdMTAMu6riccoduz6AttGm3JyDSO41fpgi3BJsI+/ZYkkWXZAuk725K/jW6EEMlOI0RgtJj+W0NNl1jeb2rcVGvgcwOeMPgzbF5UfW0fIs20lxz0qLH4yTlkbWGRDpyeqk6lfEnzqp+dLhr6kZGQKc9weEzp8NwxlmNK28TQaUGD7snTzRiHd3XWY6uUkkN8CYh7Tw2JfwB/Xzv8rdfOUs4giqJz0xzwYxPOYVYRcsZD8L8nRF0+6c/zPNeuI9uI6MqSC21Fde7amWo4hcIt3pZzXKxdXesxyFpdkD2pRhqh53kPeHXTNpjA8Eg1sJS/QDaFr3tV/xtop5RbzIDfwgAAAABJRU5ErkJggg==',
    'unselected': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIKADAAQAAAABAAAAIAAAAACshmLzAAADFklEQVRYCcWXT0hUURjFz71jOiq4iaCmFglBYBAIBbYQadHGaEiyFmW0a9embdEiajubdu2kP4sytInahrRIMHARCEFQC7MgghAcR9O5nXPn3WG00WZ88+fC+N67vnt+5373vft9z6DKdvGZa8/lcRoOaePQ5wxSBkhpuAMW2bfIvnkYZLuSePv8klmrRpoaOzeC9+fzuFNwuEJSz853R/81WLIGT5JJ3KWRHzuN2dbAjTeu4+tP3CoANwnulogxmONvirN9lwC+tXViUf3rK0htAAcZgUHncJ6/fvUzGssWyBzeh/sPhs2q79vyp6IBzXolh0mGdsDrGExYi9vZq+bTlvEVL9OP3NFCAfdoZNSPB2Y6uzBSKRr/GEiPu+OczWvO+hBn+8UkcPnVmJmpSPpP57nHbsBt4CmN9DIaC20JDL8cMx/Lh20yoJnnVjAbwaf3ABcmr5lf5QNqPR8Zd3v/AC9oYkgmujpxsjwSXKJi05or7AGeOoYzceFSloa0GM1paYshVoRFyYAeOK25wq6ZPzxhaLw+TVrSlLYYYgVlvwRR6D/TYbdtw6ndrnkQ3e6oZ6Kwjvd6O7gUR7QUPgJ6zwWnw4lGwWVK2mKI5Znss5x9u99kdMFXTTc2sgWGmGLbaHvtobO5at/zOAbFEItR6BHb8iQtQXZOxRGuZWyJRbZVYvEGuL3WIhLnXm3lEbPPKqvpQnt7HNFaxgaW2ExaRQMhsdQitNt7A0vs0ka02sG3s0mtxHJwljuTT6mJ3zjQJD4Ci0vwXQ+hN6B83iwDgSW2HsJ5gXkcbJaBwBLbcuWz3gArmaYZCCyyrQpImlhivu5XJdNoE2KIJabYlhlpTQWkwCqjGm0gMMT0bAFVvdLRMp2NKmU2yoQv0VQnkuWZBPl9IMrLGYFVw6mMqrcJaUpbuoRmxIzOiyiVztyJZhiFXtVw1z84FjH1adKSprTFECsob9r9WlqUypHCwkRxlmu0QLdDdD0b55nQWGlIS5oqy0PoK0YgdCoSLfswCSZa+mkWTOioaLTk47TcRGSkIZ/nfwFTBpdpr8iQtQAAAABJRU5ErkJggg==',
    'unselected_disable': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIKADAAQAAAABAAAAIAAAAACshmLzAAACw0lEQVRYCcWXPYtaQRSGx+sniCuuTVjSiNqkSBdImbQJLKTef5F2IcXCtvsvtg4spE5KIWVgERRslk0aFRXBb/M+4x25S1bNJt7rgfFexpnzvHPm69yY+UtbLpepZrP5drFYnOr9hbqd+AUP95RYLHbred5NpVL5qvcJf+yy2K4GrVbr2XQ6/STomcrRrvb8L3hf5TqZTF6USqVf2/psFNBoNNICnmvEH+UgixM5NOl02qRSKROPx41Ga32rjZnP52YymZjxeGwk2NbrZ6g2VxJzWa1Wx64y+HxUAKOWs88S8JrGmUzG5HI5Cw123vSOmMFgYEajkW0iATWJ/vBYNP4QUK/XX6rDF8GfJxIJk8/n7cg3wbbVE4ler2dmsxnTcid/78rl8o9gnwcC/JF/B06YC4UCHYPtn/wuX6bb7drpQYT8vgpGYu2dOddcfiPswI+Pj58M29ah0+k4ETWtizduTaxWkXoKfA6csDPyfRs+8Q0DlvNvI0DotXqbqswWi8V/nnPndNOTNdFut/l7qN1UYSpsBNjnqsyy2tlqYRm+YcDymcZTOFIqZ9Sy1cI2x4AJ2+N41csR6jhcwjYYsGDC9jjbgXLCRWWOBZsp4GKxx2tUAtjmGGwWIbdaJOGHgwWm+mQtwF0sqybh/gZYVkC4tO3el0SAZMJwpUZlAdbPtQCu0KgswLr3dEPdAiaZiMocC7bWg3cDmEwmKnMs2J6fQPa5KAKhCU0LDFgafR82UzBRuYZIGhW2OQZM2CxCzuYLPYbkcKgLy/Dt54lDn2msAHsvK3sFTA6nI3LvGvCJb0xzf+XSMiuASoXjUqVGAkkOt2/Dp5+c1mA5/+uckIpDJKXrCCCAsChU76Xwjr1K+vQ/a4K++MAXPknLXejhYQ8isKpaR+IwHyZOxEE/zZwInqwLhTL6j9OgCN61NkL5PP8Nb/i877YR5j4AAAAASUVORK5CYII=',
    'up': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIKADAAQAAAABAAAAIAAAAACshmLzAAACLklEQVRYCe1Wv2sUURCezV32KvE4giarlXhgrRCwEW1MlSsDqS7CeSeSKIIg+AekPyPKHVvketMkJEWaQKrYCBECkSsEISGICiEEjyX3xm8kgWWT92O3zb1m3puZ75vvzdt9u0SDcdk74GVtwMMNzu9u0xIICqWAKjtTXpSFaygLSDDfvtICTIWJJn7vUysrTyYBQZPnmOlZrOjMaJNfx9bO09RHELzjx4ppjZhyiSoqN0SVvRfeasJvXKYSECzwHaVoC8WvaliP/Dzd/zHr7Wji59zOR3Az5JLq04qhuJBfiU5oOWjxyLlKGoeTgHstHj45pk/guK3hibtv8V9aEkzcqZs7Cdjv0Xvs/JGOJOnHm/EAmA9J/0Vrq4CxJr/EE1+/CGzyAVMTrClHYlYBIHprI9HFXbB5HfjMny/Q3X5Eo2frNDbn00Ga/MuZa72IOp3OjSiKMh2B7/sH1Wp1z9Ra6zPQ6/W+gOCaiUQXA/YnYtd1cfFb3wLP8+ZNBKaYC9Z6BFKghQGT9i4IG43GU5NAiVk7cEowC7txOncxm0h67pLo1AEhCsOwpJT6zMzG7wHa/h0549j9LxcBrh2gWq32B8STID3UEaP4EWKTrsWFx1mAJIN4F2YKhfqyTgwFgdP1et35X0DwqQQIACLWYV7JPD4g6g1iqf6GBO/8DMSLybzdbn/Ejv//F6L4Inb+JJnjsrZeRDqScrk81+12A8QLxWKxocsb+AcdsHXgH8ZvnY0u/j9+AAAAAElFTkSuQmCC',
};

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
    var b64 = _androidImgMap[trimmed];
    if (!b64) {
        // Try common variants: lower-cased, extension stripped, lower-cased + stripped
        var variants = [
            trimmed.toLowerCase(),
            _nameFromUri(trimmed),
            _nameFromUri(trimmed).toLowerCase()
        ];
        for (var _vi = 0; _vi < variants.length; _vi++) {
            var v = variants[_vi];
            if (v && v !== trimmed && _androidImgMap[v]) {
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
    // Header features: lock icon or classification lines
    if (col.__lockInfo) return true;
    if (col.__headerMeta) {
        for (var hi = 0; hi < col.__headerMeta.length; hi++) {
            var hm = col.__headerMeta[hi];
            if (hm && hm.classificationLinePosition > 0) return true;
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
        var record = args.table.getRecordByCell(col, row);
        if (!record) {
            var headerCL = window._tableHeaderMeta && window._tableHeaderMeta[row + '_' + col];
            var lockInfo = window._lockInfoMap && window._lockInfoMap[col];
            if (!headerCL && !lockInfo) return { renderDefault: true };

            var hElements = [];

            if (lockInfo && lockInfo.showLock) {
                // Draw header text + lock icon (VTable's showFrozenIcon is disabled).
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
                var hIsLocked = col < (args.table.frozenColCount || 0);
                var hIconW = 13, hIconH = 14, hIconPad = 4;
                // Use canvas measurement for accurate text width; cap at available space
                var hMaxTextW = Math.max(0, w - hPadH * 2 - hIconW - hIconPad);
                var hMeasuredW = _measureTextWidth(hCellValue, hFontSize, hFontWeight);
                var hActualTextW = Math.min(hMeasuredW, hMaxTextW);
                var hTX = hPadH;
                if (hTextAlign === 'center') hTX = Math.max(hPadH, (w - hActualTextW - hIconW - hIconPad) / 2);
                else if (hTextAlign === 'right') hTX = Math.max(hPadH, w - hPadH - hActualTextW - hIconW - hIconPad);
                var hLockX = hTX + hActualTextW + hIconPad;
                var hLockY = (h - hIconH) / 2;
                hElements.push({ type: 'text', x: hTX, y: h / 2, text: hCellValue,
                    fontSize: hFontSize, fill: hColor, fontWeight: hFontWeight,
                    textAlign: 'left', textBaseline: 'middle',
                    maxLineWidth: hActualTextW, ellipsis: '...', pickable: false });
                _pushLockIcon(hElements, hLockX, hLockY, hIconW, hIconH, hIsLocked);
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
            // renderDefault:false when we drew the lock icon (we replace VTable's text rendering).
            // renderDefault:true when only classification lines (VTable renders text natively).
            return { elements: hElements, renderDefault: !lockInfo || !lockInfo.showLock };
        }

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
                var iW       = Number(icon.width)  || 16;
                var iH       = Number(icon.height) || 16;
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
                var _iconSrc;
                var _iconInputName = '';
                if (icon.path && icon.path.uri) {
                    var _iUri = icon.path.uri;
                    _iconInputName = _nameFromUri(_iUri);
                    _iconSrc = _resolveAndroidImg(_iconInputName) || _iUri;
                } else {
                    _iconInputName = icon.name || '';
                    _iconSrc = _resolveAndroidImg(_iconInputName) || _iconInputName || '';
                }
                // Debug log for troubleshooting invisible icons
                console.log('[buildCellRender] icon col=' + col + ' input="' + _iconInputName +
                    '" src=' + (_iconSrc ? 'resolved' : 'EMPTY') + ' w=' + iW + ' h=' + iH +
                    ' x=' + Math.round(iconX) + ' y=' + Math.round(iY));
                // Clamp icon position inside cell bounds; cap rendered size to cell size
                var _renderIW = Math.min(iW, Math.max(1, w));
                var _renderIH = Math.min(iH, Math.max(1, h));
                var _safeIconX = Math.max(0, Math.min(Math.round(iconX), Math.round(w - _renderIW)));
                var _safeIconY = Math.max(0, Math.min(Math.round(iY), Math.round(h - _renderIH)));
                // Debug: log icon render info for troubleshooting invisible icons
                if (!_iconSrc) {
                    console.warn('[buildCellRender] icon src empty for col=' + col + ' name=' + (icon.name || ''));
                }
                elements.push({
                    type: 'text',
                    x: tX, y: textY,
                    text: iText,
                    fontSize: fontSize, fill: textColor, fontWeight: fontWeight,
                    textBaseline: 'middle',
                    maxLineWidth: Math.max(0, maxLineWidth - iW - iPad),
                    ellipsis: '...',
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
            var _fiSrc;
            if (fi.path && fi.path.uri) {
                var _fiUri = fi.path.uri;
                _fiSrc = _resolveAndroidImg(_nameFromUri(_fiUri)) || _fiUri;
            } else {
                _fiSrc = _resolveAndroidImg(fi.name) || fi.name || '';
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

function customIcon() {
}

/**
 * For columns containing cells with icons, measure the maximum content width
 * (text + icon + padding) via canvas and set an exact minWidth/maxWidth.
 * Mirrors _fixProgressStyleWidths.
 */
function _fixIconColumnWidths(options) {
    if (!Array.isArray(options.columns) || !Array.isArray(options.records)) return;
    for (var _ci = 0; _ci < options.columns.length; _ci++) {
        var _col = options.columns[_ci];
        if (!_col) continue;
        var _field = _col.field;
        var _maxW = 0;
        var _hasIcon = false;
        for (var _ri = 0; _ri < options.records.length; _ri++) {
            var _meta = options.records[_ri]['__meta_' + _ci];
            if (!_meta || !_meta.icon) continue;
            _hasIcon = true;
            var _icon = _meta.icon;
            var _iW = _icon.width || 16;
            var _iPad = _icon.paddingHorizontal != null ? _icon.paddingHorizontal : 4;
            var _text = String(options.records[_ri][_field] || '');
            // Use per-cell meta for accurate measurement (fontSize/padding may differ from header)
            var _fs = _meta.fontSize || _col.style?.fontSize || 14;
            var _fw = _meta.fontWeight || _col.style?.fontWeight || 'normal';
            var _padH = _meta.textPaddingHorizontal != null ? _meta.textPaddingHorizontal : 12;
            var _padL = _meta.textPaddingLeft != null ? _meta.textPaddingLeft : _padH;
            var _padR = _meta.textPaddingRight != null ? _meta.textPaddingRight : _padH;
            var _textW = _measureTextWidth(_text, _fs, _fw);
            var _totalW = _textW + _iW + _iPad + _padL + _padR + 8; // +8px tolerance
            if (_totalW > _maxW) _maxW = _totalW;
        }
        if (_hasIcon && _maxW > 0) {
            var _minW = _col.minWidth || 50;
            var _fixedW = Math.max(_minW, Math.ceil(_maxW) + 4);
            _col.width = _fixedW;
            _col.minWidth = _fixedW;
            _col.maxWidth = _fixedW;
        }
    }
}

/**
 * Ensure columns that show a lock icon in the header have enough minWidth to
 * display both the header title and the lock icon side-by-side.
 * Uses canvas.measureText() for accuracy.
 * Must be called AFTER _extractColumnMeta() so _lockInfoMap is populated.
 */
function _fixLockIconColumnWidths(options) {
    if (!Array.isArray(options.columns)) return;
    var LOCK_W = 13, LOCK_PAD = 4; // must match _pushLockIcon dims in buildCellRender
    for (var _li = 0; _li < options.columns.length; _li++) {
        if (!window._lockInfoMap || !window._lockInfoMap[_li]) continue;
        var _lcol = options.columns[_li];
        var _lhst = _lcol.headerStyle || _lcol.style || {};
        var _lFs  = _lhst.fontSize  || 14;
        var _lFw  = _lhst.fontWeight || 'normal';
        var _lPad = Array.isArray(_lhst.padding) ? (_lhst.padding[1] || 12) : (_lhst.padding || 12);
        var _lTitleW = _measureTextWidth(_lcol.title || '', _lFs, _lFw);
        var _lNeeded = Math.ceil(_lTitleW) + LOCK_PAD + LOCK_W + _lPad * 2 + 2;
        if (_lNeeded > (_lcol.minWidth || 0)) {
            _lcol.minWidth = _lNeeded;
        }
        // Also bump maxWidth so VTable auto-sizing can actually use this space
        if (_lcol.maxWidth && _lNeeded > _lcol.maxWidth) {
            _lcol.maxWidth = _lNeeded;
        }
    }
}

function initializeTable(option) {

    optionTemp = option;
    // Pre-load lock icons (canvas→PNG) before any cell rendering.
    _initLockIcons();
    // Extract __lockInfo and __headerMeta from columns into globals BEFORE VTable
    // processes the option. VTable may transform/strip unknown column properties.
    _extractColumnMeta(option.columns);

    // Preserve any custom theme styles supplied by the RN side (e.g. rowHeaderStyle,
    // rightFrozenStyle) while still forcing hover transparency and scroll-bar hidden.
    var customTheme = option.theme || {};
    var themePatch = {
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

    const input_editor = new VTable.editors.InputEditor();
    VTable.register.editor('input-editor', input_editor);

    // Attach customRender to all columns before creating the table instance.
    // Functions are stripped by JSON.stringify in ArkTS, so we inject them here
    // inside the WebView where they can reference the live VRender primitives.
    _fixProgressStyleWidths(option);
    _fixLockIconColumnWidths(option);
    _fixIconColumnWidths(option);
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
    // Re-extract column metadata globals and re-attach customRender.
    _extractColumnMeta(options.columns);
    _fixProgressStyleWidths(options);
    _fixLockIconColumnWidths(options);
    _fixIconColumnWidths(options);
    _injectMergedCellRenders(options);
    addCustomRenderToColumns(options);

    // Apply frozenColCount explicitly; VTable's updateOption sometimes ignores
    // changes to frozenColCount, so setFrozenColCount + renderWithRecreateCells
    // ensures the frozen layout is refreshed.
    var nextFrozenColCount = options.frozenColCount;
    var currentFrozenColCount = window.tableInstance.frozenColCount;
    if (nextFrozenColCount != null && nextFrozenColCount !== currentFrozenColCount) {
        try {
            window.tableInstance.setFrozenColCount(nextFrozenColCount);
        } catch (e) {
            console.error('[updateOption] setFrozenColCount failed:', e);
        }
    }

    window.tableInstance.updateOption(options);

    // Force a full recreate if frozen columns changed so the split line and
    // frozen cells are redrawn with the correct styles.
    if (nextFrozenColCount != null && nextFrozenColCount !== currentFrozenColCount) {
        try {
            window.tableInstance.renderWithRecreateCells();
        } catch (e) {
            console.error('[updateOption] renderWithRecreateCells failed:', e);
        }
    }
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