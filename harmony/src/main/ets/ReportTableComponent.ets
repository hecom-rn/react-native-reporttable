/**
 * ReportTableComponent.ets
 *
 * ArkTS UI component that renders a VTable.
 * Bridges RN props/events to @ohos/vtable.
 * Events use emitDeviceEvent (DeviceEventEmitter) since there's no C++ codegen.
 */
import { VTable, VTableController } from '@ohos/vtable';
import type { VTableOnEvent, CellClickData, ScrollEventData } from '@ohos/vtable';
import {
  RNOHContext,
  ViewDescriptorWrapperBase,
} from '@rnoh/react-native-openharmony/ts';
import measure from '@ohos.measure';

export const RN_REPORT_TABLE_NAME: string = 'RNReportTable';

interface CellPosition {
  col: number;
  row: number;
}

interface CellStyleArrangementItem {
  cellPosition: CellPosition;
  customStyleId: string;
}

interface CustomCellStyleItem {
  id: string;
  style: Record<string, Object>;
}

@Observed
export class ReportTableVTableController extends VTableController {
}

@Component
export struct ReportTableComponent {
  public static readonly NAME = RN_REPORT_TABLE_NAME;
  ctx: RNOHContext = {} as RNOHContext;
  tag: number = 0;

  @State controller: ReportTableVTableController = new ReportTableVTableController();
  @State option: Record<string, Object> = {} as Record<string, Object>;
  @State currentZoom: number = 1.0;
  @State componentWidth: number = 0;
  @State componentHeight: number = 0;
  private baseZoom: number = 1.0;
  private disableZoom: boolean = false;
  private unregisterDescriptorChangesListener: (() => void) | undefined = undefined;
  private cleanupCommandCallback: (() => void) | undefined = undefined;
  private currentRawProps: string = '{}';
  private cachedContentSize: string = '{}';
  private vtableInitialized: boolean = false;
  // Mutable option cache — updated by updateVTable/handleUpdateData/handleSpliceData.
  // NOT @State to avoid triggering VTable WebView re-init on every data update.
  private currentOption: Record<string, Object> = {} as Record<string, Object>;
  // Cached frozen row count received from props (total frozen rows, including
  // the VTable header row when showHeader=true).
  private currentFrozenRowCount: number = 0;
  // Cached column widths from native measurement — used for accurate lock threshold checks.
  private contentSizeColWidths: number[] = [];
  // Track the last frozenColCount received from props to distinguish JS-initiated changes
  // from native lock toggles. When props frozenColCount hasn't changed, preserve native state.
  private lastPropsFrozenColCount: number = 0;

  /**
   * Robust boolean parser.
   * RN props may arrive as native booleans, strings ("false"), or numbers.
   */
  private parseBoolean(value: Object | undefined, defaultValue: boolean): boolean {
    if (value === undefined || value === null) {
      return defaultValue;
    }
    if (typeof value === 'boolean') {
      return value as boolean;
    }
    if (typeof value === 'string') {
      const lower = (value as string).toLowerCase();
      return lower !== 'false' && lower !== '0' && lower !== '';
    }
    if (typeof value === 'number') {
      return (value as number) !== 0;
    }
    return !!value;
  }


  aboutToAppear(): void {
    this.subscribeToDescriptorChanges();
    this.registerCommandCallback();
    this.initFromDescriptor();
  }

  aboutToDisappear(): void {
    if (this.unregisterDescriptorChangesListener !== undefined) {
      this.unregisterDescriptorChangesListener();
    }
    if (this.cleanupCommandCallback !== undefined) {
      this.cleanupCommandCallback();
    }
    this.controller.release();
  }

  private subscribeToDescriptorChanges(): void {
    this.unregisterDescriptorChangesListener = this.ctx.descriptorRegistry.subscribeToDescriptorChanges(
      this.tag,
      (newDescriptor: object): void => {
        this.onDescriptorChanged(newDescriptor);
      }
    );
  }

  private registerCommandCallback(): void {
    this.cleanupCommandCallback = this.ctx.componentCommandReceiver.registerCommandCallback(
      this.tag,
      (commandName: string, args: Object[]): void => {
        this.handleCommand(commandName, args);
      }
    );
  }

  private initFromDescriptor(): void {
    const wrapper: ViewDescriptorWrapperBase | null =
      this.ctx.descriptorRegistry.findDescriptorWrapperByTag<ViewDescriptorWrapperBase>(this.tag);
    if (wrapper !== null) {
      this.onDescriptorChanged(wrapper as object);
    }
  }

  private onDescriptorChanged(descriptor: object): void {
    const descriptorStr: string = JSON.stringify(descriptor);
    const parsed: Record<string, Object> = JSON.parse(descriptorStr) as Record<string, Object>;
    const rawPropsObj: Object | undefined = parsed['rawProps'];
    if (rawPropsObj === undefined) {
      return;
    }
    const rawPropsStr: string = JSON.stringify(rawPropsObj);
    if (rawPropsStr === this.currentRawProps) {
      return;
    }
    this.currentRawProps = rawPropsStr;
    this.updateVTable(rawPropsStr);
  }

  /**
   * Emit the cached contentSize to the JS side (called from onInitialized and updateVTable).
   */
  private emitCachedContentSize(): void {
    if (this.cachedContentSize === '{}') {
      return;
    }
    const cs: Record<string, Object> = JSON.parse(this.cachedContentSize) as Record<string, Object>;
    const csW: number = (cs['width'] !== undefined) ? (cs['width'] as number) : 0;
    const csH: number = (cs['height'] !== undefined) ? (cs['height'] as number) : 0;
    if (csW > 0 || csH > 0) {
      const csPayload: string = '{"width":' + csW.toString() + ',"height":' + csH.toString() + '}';
      this.emitEvent('contentSize', JSON.parse(csPayload) as Object);
    }
  }

  /**
   * Compute the total content size (width × height) of the table by measuring each cell's text
   * using the ArkTS native measure API — the same approach as iOS (NSString sizeWithAttributes)
   * and Android (Paint.measureText). Results are in vp.
   *
   * Algorithm:
   *   1. For each column: measure the single-line text width of every header/body cell.
   *      Effective column width = clamp(max measured, minWidth, maxWidth).
   *   2. For each row: compute line count = ceil(singleLineWidth / availableColWidth).
   *      Row height = max(lines × fontSize + (minHeight - fontSize - 3), minHeight)  — matches iOS exactly.
   *   3. Sum column widths (+ border lines) → contentWidth.
   *      Sum row heights (+ border lines) → contentHeight.
   */
  private computeContentSizeNative(
    columnsArr: Object[],
    recordsArr: Object[],
    itemConfigStr: string,
    showHeader: boolean
  ): string {
    try {
      let defaultFontSize: number = 14;
      let defaultPadH: number = 12;
      let minHeight: number = 40;
      try {
        const ic: Record<string, Object> = JSON.parse(itemConfigStr) as Record<string, Object>;
        if (ic['fontSize'] !== undefined) { defaultFontSize = ic['fontSize'] as number; }
        if (ic['textPaddingHorizontal'] !== undefined) { defaultPadH = ic['textPaddingHorizontal'] as number; }
        if (ic['__minHeight'] !== undefined) { minHeight = ic['__minHeight'] as number; }
      } catch (e2) {}

      // dpRatio converts the measureText px return value to vp (the unit used everywhere else)
      const dpRatio: number = vp2px(1);
      if (dpRatio <= 0) { return '{}'; }
      const borderPx: number = 1;
      const colCount: number = columnsArr.length;
      if (colCount === 0) { return '{}'; }

      // ── Step 1: effective column widths ─────────────────────────────────
      const colWidths: number[] = [];
      for (let c: number = 0; c < colCount; c++) {
        const col: Record<string, Object> = columnsArr[c] as Record<string, Object>;
        const minW: number = (col['minWidth'] !== undefined) ? (col['minWidth'] as number) : 50;
        const maxW: number = (col['maxWidth'] !== undefined) ? (col['maxWidth'] as number) : 120;
        // Hard floor: column must be at least 1vp wide to avoid zero-width collapse
        const safeMinW: number = minW > 0 ? minW : 50;
        const safeMaxW: number = maxW > safeMinW ? maxW : safeMinW;
        const colStyle: Record<string, Object> = (col['style'] !== undefined)
          ? (col['style'] as Record<string, Object>)
          : {} as Record<string, Object>;
        const colFontSize: number = (colStyle['fontSize'] !== undefined)
          ? (colStyle['fontSize'] as number) : defaultFontSize;
        const colPaddingVal: Object | undefined = colStyle['padding'];
        const colPadH: number = ((colPaddingVal !== undefined)
          && ((colPaddingVal as number[]).length > 1))
          ? (colPaddingVal as number[])[1] : defaultPadH;

        let maxContentW: number = 0;
        // Header title
        const headerTitle: string = (col['title'] !== undefined) ? (col['title'] as string) : '';
        let headerWVp: number = 0;
        if (headerTitle.length > 0) {
          // Pass fontSize as a number (in fp ≈ vp units). measureText returns px.
          const wPx: number = measure.measureText({ textContent: headerTitle, fontSize: colFontSize });
          // Fallback to char-width estimate when measureText returns 0 (font not loaded yet)
          headerWVp = wPx > 0 ? wPx / dpRatio : headerTitle.length * colFontSize * 0.65;
        }
        // Add lock icon width when this column has a lock icon (drawn via customRender).
        if (col['__lockInfo'] !== undefined) {
          headerWVp += 13 + 4; // lockIconWidth(13) + lockIconPadding(4)
        }
        if (headerWVp > 0 || (col['__lockInfo'] !== undefined)) {
          maxContentW = Math.max(maxContentW, headerWVp + colPadH * 2);
        }
        // Body cells
        for (let r: number = 0; r < recordsArr.length; r++) {
          const rec: Record<string, Object> = recordsArr[r] as Record<string, Object>;
          const metaKey: string = '__meta_' + c.toString();
          const metaVal: Object | undefined = rec[metaKey];
          const meta: Record<string, Object> = (metaVal !== undefined)
            ? (metaVal as Record<string, Object>) : {} as Record<string, Object>;
          const cellFontSize: number = (meta['fontSize'] !== undefined)
            ? (meta['fontSize'] as number) : defaultFontSize;
          const cellPadH: number = (meta['textPaddingHorizontal'] !== undefined)
            ? (meta['textPaddingHorizontal'] as number)
            : ((meta['textPaddingLeft'] !== undefined) ? (meta['textPaddingLeft'] as number) : defaultPadH);
          const cellText: string = (rec[c.toString()] !== undefined)
            ? (rec[c.toString()] as string) : '';
          let wVp: number = 0;
          if (cellText.length > 0) {
            const wPx: number = measure.measureText({ textContent: cellText, fontSize: cellFontSize });
            wVp = wPx > 0 ? wPx / dpRatio : cellText.length * cellFontSize * 0.65;
          }
          // Add icon width when the cell has an icon (rendered via customRender).
          const cellIconVal: Object | undefined = meta['icon'];
          let iconExtraW: number = 0;
          if (cellIconVal !== undefined) {
            const cellIconObj: Record<string, Object> = cellIconVal as Record<string, Object>;
            const iW: number = (cellIconObj['width'] !== undefined) ? (cellIconObj['width'] as number) : 16;
            const iPad: number = (cellIconObj['paddingHorizontal'] !== undefined) ? (cellIconObj['paddingHorizontal'] as number) : 4;
            iconExtraW = iW + iPad;
            wVp += iconExtraW;
          }
          if (wVp > 0 || iconExtraW > 0) {
            // iOS/Android add ~8px tolerant for measurement inaccuracy
            const tolerant: number = 8;
            maxContentW = Math.max(maxContentW, wVp + cellPadH * 2 + tolerant);
          }
        }
        colWidths.push(Math.max(safeMinW, Math.min(maxContentW > 0 ? maxContentW : safeMinW, safeMaxW)));
      }

      let contentWidth: number = borderPx;
      for (let c: number = 0; c < colCount; c++) {
        contentWidth += colWidths[c] + borderPx;
      }

      // ── Step 2: row heights from line counts ─────────────────────────────
      // iOS formula: rowHeight = max(lines × fontSize + (minHeight - fontSize - 3), minHeight)
      // where (minHeight - fontSize - 3) is the total vertical padding (top + bottom margin).
      const safeMinHeight: number = minHeight > 0 ? minHeight : 40;
      let contentHeight: number = borderPx;

      // Header row (only when showHeader=true)
      if (showHeader) {
        let maxHeaderH: number = safeMinHeight;
        for (let c: number = 0; c < colCount; c++) {
          const col: Record<string, Object> = columnsArr[c] as Record<string, Object>;
          const headerStyle: Record<string, Object> = (col['headerStyle'] !== undefined)
            ? (col['headerStyle'] as Record<string, Object>) : {} as Record<string, Object>;
          const fontSize: number = (headerStyle['fontSize'] !== undefined)
            ? (headerStyle['fontSize'] as number) : defaultFontSize;
          const padArrVal: Object | undefined = headerStyle['padding'];
          const padH: number = ((padArrVal !== undefined) && ((padArrVal as number[]).length > 1))
            ? (padArrVal as number[])[1] : defaultPadH;
          const title: string = (col['title'] !== undefined) ? (col['title'] as string) : '';
          if (title.length > 0) {
            const availW: number = Math.max(colWidths[c] - padH * 2, fontSize);
            const wPx: number = measure.measureText({ textContent: title, fontSize: fontSize });
            const wVp: number = wPx > 0 ? wPx / dpRatio : title.length * fontSize * 0.65;
            const lineCount: number = Math.max(1, Math.ceil(wVp / availW));
            // Match VTable rendering: lineHeight defaults to fontSize, and vertical
            // padding totals (minHeight - fontSize - 3) to match iOS row height formula.
            const lineHeight: number = fontSize;
            const vertPad: number = Math.max(0, safeMinHeight - fontSize - 3);
            const cellH: number = lineCount * lineHeight + vertPad;
            maxHeaderH = Math.max(maxHeaderH, cellH);
          }
        }
        contentHeight += maxHeaderH + borderPx;
      }

      // Body rows
      for (let r: number = 0; r < recordsArr.length; r++) {
        const rec: Record<string, Object> = recordsArr[r] as Record<string, Object>;
        let maxRowH: number = safeMinHeight;
        for (let c: number = 0; c < colCount; c++) {
          const metaKey: string = '__meta_' + c.toString();
          const metaVal: Object | undefined = rec[metaKey];
          const meta: Record<string, Object> = (metaVal !== undefined)
            ? (metaVal as Record<string, Object>) : {} as Record<string, Object>;
          const fontSize: number = (meta['fontSize'] !== undefined)
            ? (meta['fontSize'] as number) : defaultFontSize;
          const padH: number = (meta['textPaddingHorizontal'] !== undefined)
            ? (meta['textPaddingHorizontal'] as number)
            : ((meta['textPaddingLeft'] !== undefined)
              ? (meta['textPaddingLeft'] as number) : defaultPadH);
          const cellText: string = (rec[c.toString()] !== undefined)
            ? (rec[c.toString()] as string) : '';
          if (cellText.length > 0) {
            const wPx: number = measure.measureText({ textContent: cellText, fontSize: fontSize });
            const wVp: number = wPx > 0 ? wPx / dpRatio : cellText.length * fontSize * 0.65;
            // progressStyle cells never wrap — single line only.
            const hasProgressStyle: boolean = meta['progressStyle'] !== undefined;
            const lineCount: number = hasProgressStyle
              ? 1
              : Math.max(1, Math.ceil(wVp / Math.max(colWidths[c] - padH * 2, fontSize)));
            // Match VTable rendering: lineHeight defaults to fontSize, and vertical
            // padding totals (minHeight - fontSize - 3) to match iOS row height formula.
            const lineHeight: number = fontSize;
            const vertPad: number = Math.max(0, Math.max(0, safeMinHeight - fontSize - 3));
            const cellH: number = Math.max(lineCount * lineHeight + vertPad, safeMinHeight);
            maxRowH = Math.max(maxRowH, cellH);
          }
        }
        contentHeight += maxRowH + borderPx;
      }

      this.contentSizeColWidths = colWidths;
      return '{"width":' + Math.round(contentWidth).toString() +
        ',"height":' + Math.round(contentHeight).toString() + '}';
    } catch (e) {
      console.error('[ReportTableComponent] computeContentSizeNative error: ' + (e as Error).message);
      return '{}';
    }
  }

  private updateVTable(rawPropsStr: string): void {
    try {
      const rawProps: Record<string, Object> = JSON.parse(rawPropsStr) as Record<string, Object>;
      const recordsVal: Object | undefined = rawProps['records'];
      const columnsVal: Object | undefined = rawProps['columns'];
      const themeVal: Object | undefined = rawProps['theme'];
      const mergedCellsVal: Object | undefined = rawProps['mergedCells'];
      const customCellStyleVal: Object | undefined = rawProps['customCellStyle'];
      const customCellStyleArrangementVal: Object | undefined = rawProps['customCellStyleArrangement'];
      const widthModeVal: Object | undefined = rawProps['widthMode'];
      const frozenColCountVal: Object | undefined = rawProps['frozenColCount'];
      const frozenRowCountVal: Object | undefined = rawProps['frozenRowCount'];
      const disableZoomVal: Object | undefined = rawProps['disableZoom'];
      const permutableVal: Object | undefined = rawProps['permutable'];

      let recordsStr: string = (recordsVal !== undefined) ? (recordsVal as string) : '[]';
      const columnsStr: string = (columnsVal !== undefined) ? (columnsVal as string) : '[]';

      // If native layer has modified records (via spliceData/updateData) and the
      // incoming props records haven't caught up, preserve native records to avoid
      // flicker / row duplication.
      if (this.vtableInitialized) {
        const currentRecords: Object | undefined = this.currentOption['records'];
        if (currentRecords !== undefined) {
          try {
            const currentArr: Object[] = currentRecords as Object[];
            const propsArr: Object[] = JSON.parse(recordsStr) as Object[];
            if (currentArr.length !== propsArr.length) {
              recordsStr = JSON.stringify(currentArr);
            }
          } catch (_e) {}
        }
      }
      const themeStr: string = (themeVal !== undefined) ? (themeVal as string) : '{}';
      const mergedCellsStr: string = (mergedCellsVal !== undefined) ? (mergedCellsVal as string) : '[]';
      const customCellStyleStr: string = (customCellStyleVal !== undefined) ? (customCellStyleVal as string) : '[]';
      const customCellStyleArrangementStr: string = (customCellStyleArrangementVal !== undefined) ? (customCellStyleArrangementVal as string) : '[]';
      const widthMode: string = (widthModeVal !== undefined) ? (widthModeVal as string) : 'autoWidth';
      const frozenColCountFromProps: number = (frozenColCountVal !== undefined) ? (frozenColCountVal as number) : 0;
      let frozenColCount: number = frozenColCountFromProps;
      const frozenRowCount: number = (frozenRowCountVal !== undefined) ? (frozenRowCountVal as number) : 0;
      const disableZoom: boolean = this.parseBoolean(disableZoomVal, false);
      const permutable: boolean = this.parseBoolean(permutableVal, false);

      // Preserve native lock toggle state when props haven't explicitly changed frozenColCount.
      // This prevents JS re-renders (e.g. data updates) from resetting the user's lock selection.
      if (this.vtableInitialized) {
        if (frozenColCountFromProps === this.lastPropsFrozenColCount) {
          const currentFrozen: Object | undefined = this.currentOption['frozenColCount'];
          if (currentFrozen !== undefined) {
            frozenColCount = currentFrozen as number;
          }
        } else {
          // JS layer explicitly changed frozenColCount
          this.lastPropsFrozenColCount = frozenColCountFromProps;
        }
      } else {
        this.lastPropsFrozenColCount = frozenColCountFromProps;
      }

      // Parse columns and records for native contentSize measurement
      const columnsArr: Object[] = JSON.parse(columnsStr) as Object[];
      const recordsArrForSize: Object[] = JSON.parse(recordsStr) as Object[];
      const itemConfigPropVal: Object | undefined = rawProps['itemConfig'];
      const itemConfigStr: string = (itemConfigPropVal !== undefined)
        ? (itemConfigPropVal as string) : '{}';

      // Read showHeader from rawProps (if present) or fallback to itemConfig.__showHeader.
      // frozenRows=0 → showHeader=false (no header, data[0] is first body row).
      // frozenRows>0 → showHeader=true  (data[0] becomes the VTable header row).
      let showHeader: boolean = true;
      const showHeaderVal: Object | undefined = rawProps['showHeader'];
      if (showHeaderVal !== undefined) {
        showHeader = this.parseBoolean(showHeaderVal, true);
      } else {
        try {
          const icObj: Record<string, Object> = JSON.parse(itemConfigStr) as Record<string, Object>;
          if (icObj['__showHeader'] !== undefined) {
            showHeader = this.parseBoolean(icObj['__showHeader'], true);
          }
        } catch (_e) {}
      }

      // Compute contentSize using ArkTS native text measurement.
      // mirrors iOS (NSString sizeWithAttributes) and Android (Paint.measureText).
      this.cachedContentSize = this.computeContentSizeNative(columnsArr, recordsArrForSize, itemConfigStr, showHeader);

      // Read minHeight (vp) from itemConfig — used as VTable defaultRowHeight (CSS px = vp in WebView).
      let rowMinHeight: number = 40;
      try {
        const icObj: Record<string, Object> = JSON.parse(itemConfigStr) as Record<string, Object>;
        if (icObj['__minHeight'] !== undefined) { rowMinHeight = icObj['__minHeight'] as number; }
      } catch (_e) {}

      // If VTable is already initialized (i.e., this is a data update, not initial load),
      // emit contentSize immediately since onInitialized will not fire again.
      if (this.vtableInitialized) {
        this.emitCachedContentSize();
      }

      // allowFrozenColCount controls the max columns a user can freeze via UI.
      // We set it to the full column count so programmatic frozenToCol never hits the limit.
      const allowFrozenColCount: number = columnsArr.length;

      this.currentFrozenRowCount = frozenRowCount;

      // Build option JSON.
      // VTable's WebView uses CSS logical pixels, which equal vp. No unit conversion needed.
      // When showHeader=false, set defaultHeaderRowHeight=0 to prevent phantom blank header row.
      const defaultHeaderRowHeight: number = showHeader ? rowMinHeight : 0;
      const optionStr: string = '"records":' + recordsStr +
        ',"columns":' + columnsStr +
        ',"theme":' + themeStr +
        ',"customMergeCell":' + mergedCellsStr +
        ',"customCellStyle":' + customCellStyleStr +
        ',"customCellStyleArrangement":' + customCellStyleArrangementStr +
        ',"frozenColCount":' + frozenColCount.toString() +
        ',"frozenRowCount":' + frozenRowCount.toString() +
        ',"showHeader":' + (showHeader ? 'true' : 'false') +
        ',"allowFrozenColCount":' + allowFrozenColCount.toString() +
        ',"showFrozenIcon":false' +
        ',"defaultRowHeight":' + rowMinHeight.toString() +
        ',"defaultHeaderRowHeight":' + defaultHeaderRowHeight.toString() +
        ',"autoWrapText":true' +
        ',"widthMode":"' + widthMode + '"' +
        ',"heightMode":"autoHeight"' +
        ',"autoFillWidth":true' +
        ',"autoFillHeight":false' +
        ',"columnResizeMode":"none"' +
        ',"hover":{"disableHover":true}' +
        ',"select":{"disableSelect":true}' +
        ',"scrollBar":{"visible":"none","barWidth":0,"hoverOn":false}' +
        ',"editor":""' +
        ',"editCellTrigger":"api"';
      const newOption: Record<string, Object> = JSON.parse('{' + optionStr + '}') as Record<string, Object>;

      console.log('[ReportTableComponent] updateVTable showHeader=' + showHeader.toString() +
        ' frozenRows=' + frozenRowCount.toString() +
        ' recordsCount=' + recordsArrForSize.length.toString());

      this.disableZoom = disableZoom;
      // Cache option for command handlers (handleUpdateData, handleSpliceData, etc.)
      // without triggering a @State re-render.
      this.currentOption = newOption;

      if (!this.vtableInitialized) {
        // First render: set @State to give VTable its initial option.
        this.option = newOption;
      } else {
        // Data update: use controller directly — do NOT replace @State option reference,
        // as that would destroy and recreate the VTable WebView (causing flash → blank).
        this.controller.updateOption(newOption);
      }
    } catch (e) {
      console.error('[ReportTableComponent] updateVTable failed: ' + (e as Error).message);
    }
  }

  private handleCommand(commandName: string, args: Object[]): void {
    if (commandName === 'scrollTo' && args.length >= 2) {
      const lineX: number = args[0] as number;
      const lineY: number = args[1] as number;
      // const addr: Record<string, number> = {} as Record<string, number>;
      // addr['row'] = lineX;
      // addr['col'] = lineY;
      // this.controller.scrollToRowCol(addr);
      this.controller.scrollToRow(lineX);
      this.controller.scrollToCol(lineY);
    } else if (commandName === 'scrollToBottom') {
      const recordsVal: Object | undefined = this.currentOption['records'];
      const showHeader: boolean = this.parseBoolean(this.currentOption['showHeader'], true);
      if (recordsVal !== undefined) {
        const recordsArr: Object[] = recordsVal as Object[];
        if (recordsArr.length > 0) {
          // VTable global row: records[i] is at row (showHeader ? i+1 : i).
          const lastRow: number = showHeader ? recordsArr.length : recordsArr.length - 1;
          this.controller.scrollToRow(lastRow);
        }
      }
    } else if (commandName === 'updateData' && args.length > 0) {
      this.handleUpdateData(args);
    } else if (commandName === 'frozenToCol' && args.length > 0) {
      const fc: number = args[0] as number;
      this.currentOption['frozenColCount'] = fc;
      // Use updateOption instead of frozenToCol so the full option (including
      // frozenColCount) is re-applied. frozenToCol only mutates
      // window.tableInstance.options, which can use stale references.
      this.controller.updateOption(this.currentOption);
    } else if (commandName === 'spliceData' && args.length > 0) {
      this.handleSpliceData(args);
    }
  }

  private handleUpdateData(args: Object[]): void {
    try {
      const dataStr: string = args[0] as string;
      const dataObj: Record<string, Object> = JSON.parse(dataStr) as Record<string, Object>;
      const startCol: number = (dataObj['startCol'] !== undefined) ? (dataObj['startCol'] as number) : 0;
      const startRow: number = (dataObj['startRow'] !== undefined) ? (dataObj['startRow'] as number) : 0;
      const values: Object[] = (dataObj['values'] !== undefined) ? (dataObj['values'] as Object[]) : [];

      const recordsVal: Object | undefined = this.currentOption['records'];
      if (recordsVal === undefined) {
        return;
      }
      const records: Object[] = recordsVal as Object[];

      // VTable records start after the header row when showHeader=true.
      const showHeader: boolean = this.parseBoolean(this.currentOption['showHeader'], true);
      const headerRows: number = showHeader ? 1 : 0;
      for (let rowIdx: number = 0; rowIdx < values.length; rowIdx++) {
        const rowValues: Object[] = values[rowIdx] as Object[];
        const recordIdx: number = startRow - headerRows + rowIdx;
        if (recordIdx < 0 || recordIdx >= records.length) {
          continue;
        }
        const record: Record<string, Object> = records[recordIdx] as Record<string, Object>;
        for (let colIdx: number = 0; colIdx < rowValues.length; colIdx++) {
          const fieldKey: string = (startCol + colIdx).toString();
          record[fieldKey] = rowValues[colIdx] as Object;
        }
      }

      // Re-render with updated records.
      // Use a new array reference so VTable detects the change.
      this.currentOption['records'] = [...records] as Object;
      this.controller.updateOption(this.currentOption);
    } catch (e) {
      console.error('[ReportTableComponent] updateData failed: ' + (e as Error).message);
    }
  }

  private handleSpliceData(args: Object[]): void {
    try {
      const opsStr: string = args[0] as string;
      const operations: Object[] = JSON.parse(opsStr) as Object[];
      // Each operation has { deleteIndices, addAtIndex, newRecords }
      // VTable doesn't have native splice. Re-build the full option with updated records.
      const recordsVal: Object | undefined = this.currentOption['records'];
      if (recordsVal === undefined) {
        return;
      }
      const records: Object[] = recordsVal as Object[];

      // Parse current styles so we can adjust row indices after insert/delete.
      const customCellStyleVal: Object | undefined = this.currentOption['customCellStyle'];
      const customCellStyleArrangementVal: Object | undefined = this.currentOption['customCellStyleArrangement'];
      let customCellStyle: Object[] = (customCellStyleVal !== undefined) ? (customCellStyleVal as Object[]) : [];
      let customCellStyleArrangement: Object[] = (customCellStyleArrangementVal !== undefined) ? (customCellStyleArrangementVal as Object[]) : [];
      let nextStyleId: number = customCellStyle.length;

      // Column count is needed to build styles for newly inserted rows.
      const columnsVal: Object | undefined = this.currentOption['columns'];
      const columns: Object[] = (columnsVal !== undefined) ? (columnsVal as Object[]) : [];
      const colCount: number = columns.length;

      // VTable records start after the header row when showHeader=true.
      const showHeader: boolean = this.parseBoolean(this.currentOption['showHeader'], true);
      const headerRows: number = showHeader ? 1 : 0;

      for (let opIdx: number = 0; opIdx < operations.length; opIdx++) {
        const op: Record<string, Object> = operations[opIdx] as Record<string, Object>;
        const deleteIndices: Object[] = (op['deleteIndices'] !== undefined) ? (op['deleteIndices'] as Object[]) : [];
        const addAtIndex: number = (op['addAtIndex'] !== undefined) ? (op['addAtIndex'] as number) : 0;
        const newRecords: Object[] = (op['newRecords'] !== undefined) ? (op['newRecords'] as Object[]) : [];
        const beforeLen: number = records.length;
        const deleteCount: number = deleteIndices.length;

        // Delete rows (from high to low to preserve indices)
        const sortedDeleteIndices: number[] = [];
        for (let i: number = 0; i < deleteIndices.length; i++) {
          sortedDeleteIndices.push(deleteIndices[i] as number);
        }
        // Sort descending
        for (let i: number = 0; i < sortedDeleteIndices.length - 1; i++) {
          for (let j: number = i + 1; j < sortedDeleteIndices.length; j++) {
            if (sortedDeleteIndices[j] > sortedDeleteIndices[i]) {
              const tmp: number = sortedDeleteIndices[i];
              sortedDeleteIndices[i] = sortedDeleteIndices[j];
              sortedDeleteIndices[j] = tmp;
            }
          }
        }
        for (let i: number = 0; i < sortedDeleteIndices.length; i++) {
          const delIdx: number = sortedDeleteIndices[i];
          if (delIdx >= 0 && delIdx < records.length) {
            records.splice(delIdx, 1);
          }
        }

        // Insert new records at addAtIndex
        for (let i: number = 0; i < newRecords.length; i++) {
          const insertIdx: number = addAtIndex + i;
          if (insertIdx <= records.length) {
            records.splice(insertIdx, 0, newRecords[i]);
          } else {
            records.push(newRecords[i]);
          }
        }

        // ── Adjust customCellStyleArrangement row indices ───────────────────
        const netChange: number = newRecords.length - deleteCount;
        const deletedSet: Set<number> = new Set<number>();
        for (let i: number = 0; i < deleteIndices.length; i++) {
          // VTable row index = records index + headerRows
          deletedSet.add((deleteIndices[i] as number) + headerRows);
        }

        const adjustedArrangement: Object[] = [];
        for (let i: number = 0; i < customCellStyleArrangement.length; i++) {
          const item: Record<string, Object> = customCellStyleArrangement[i] as Record<string, Object>;
          const cellPosition: Record<string, number> = item['cellPosition'] as Record<string, number>;
          const row: number = cellPosition['row'];
          if (deletedSet.has(row)) {
            continue; // Remove styles for deleted rows
          }
          let newRow: number = row;
          // Offset rows whose records index is >= addAtIndex
          if (row - headerRows >= addAtIndex) {
            newRow = row + netChange;
          }
          const pos: CellPosition = { col: cellPosition['col'] as number, row: newRow };
          const arrangementItem: CellStyleArrangementItem = {
            cellPosition: pos,
            customStyleId: item['customStyleId'] as string,
          };
          adjustedArrangement.push(arrangementItem);
        }
        customCellStyleArrangement = adjustedArrangement;

        // ── Build styles for newly inserted rows ────────────────────────────
        for (let rowIdx: number = 0; rowIdx < newRecords.length; rowIdx++) {
          const record: Record<string, Object> = newRecords[rowIdx] as Record<string, Object>;
          const globalRow: number = addAtIndex + rowIdx + headerRows; // VTable row index
          for (let colIdx: number = 0; colIdx < colCount; colIdx++) {
            const metaKey: string = '__meta_' + colIdx.toString();
            const metaVal: Object | undefined = record[metaKey];
            if (metaVal === undefined) {
              continue;
            }
            const meta: Record<string, Object> = metaVal as Record<string, Object>;
            const cellStyle: Record<string, Object> = {};
            if (meta['backgroundColor'] !== undefined) {
              cellStyle['bgColor'] = meta['backgroundColor'];
            }
            if (meta['textColor'] !== undefined) {
              cellStyle['color'] = meta['textColor'];
            }
            if (meta['fontSize'] !== undefined) {
              cellStyle['fontSize'] = meta['fontSize'];
            }
            if (meta['fontWeight'] !== undefined) {
              cellStyle['fontWeight'] = meta['fontWeight'];
            }
            if (meta['textAlign'] !== undefined) {
              cellStyle['textAlign'] = meta['textAlign'];
            }
            if (meta['textPaddingHorizontal'] !== undefined) {
              cellStyle['padding'] = [0, meta['textPaddingHorizontal']];
            }
            if (Object.keys(cellStyle).length === 0) {
              continue;
            }
            const styleId: string = 'cs_' + nextStyleId.toString();
            nextStyleId++;
            const styleItem: CustomCellStyleItem = { id: styleId, style: cellStyle };
            customCellStyle.push(styleItem);
            const pos2: CellPosition = { col: colIdx, row: globalRow };
            const arrangementItem2: CellStyleArrangementItem = {
              cellPosition: pos2,
              customStyleId: styleId,
            };
            customCellStyleArrangement.push(arrangementItem2);
          }
        }

        console.log('[ReportTableComponent] spliceData op=' + opIdx + ': before=' + beforeLen +
          ' del=' + deleteIndices.length + ' add=' + newRecords.length + ' after=' + records.length);
      }

      // Update option with modified records/styles and re-render.
      // Create a new array reference so VTable detects the change.
      this.currentOption['records'] = [...records] as Object;
      this.currentOption['customCellStyle'] = customCellStyle;
      this.currentOption['customCellStyleArrangement'] = customCellStyleArrangement;
      this.controller.updateOption(this.currentOption);
    } catch (e) {
      console.error('[ReportTableComponent] spliceData failed: ' + (e as Error).message);
    }
  }

  private emitEvent(eventType: string, payload: Object): void {
    this.ctx.rnInstance.emitDeviceEvent(
      'RNReportTable_' + eventType + '_' + this.tag.toString(),
      payload
    );
  }

  private getOnEvent(): VTableOnEvent {
    const self = this;
    const onEvent: VTableOnEvent = {
      onClickCell: (event: CellClickData): void => {
        // --- Lock toggle detection: first row click on a lockable column ---
        const showHeader: boolean = self.parseBoolean(self.currentOption['showHeader'], true);
        // VTable ListTable has a single header row (row 0) when showHeader=true.
        // When showHeader=false, row 0 is the first body row and also displays lock
        // icons, so lock toggles must be handled there too.
        if (event.row === 0) {
          // This is a first-row cell click. Check if the column has a lock icon.
          // For merged first-row cells, event.col may be any column within the merge;
          // find the anchor (start.col of the merge range that contains this cell).
          const colsVal: Object | undefined = self.currentOption['columns'];
          if (colsVal !== undefined) {
            const cols: Object[] = colsVal as Object[];
            let effectiveCol: number = event.col;
            let horizontalSpan: number = 1;
            // Resolve anchor column and horizontal span for merged header cells
            const mergeCellsVal: Object | undefined = self.currentOption['customMergeCell'];
            if (mergeCellsVal !== undefined) {
              const merges: Object[] = mergeCellsVal as Object[];
              for (let _mi: number = 0; _mi < merges.length; _mi++) {
                const mrg: Record<string, Object> = merges[_mi] as Record<string, Object>;
                const rng: Record<string, Object> = mrg['range'] as Record<string, Object>;
                const rs: Record<string, Object> = rng['start'] as Record<string, Object>;
                const re: Record<string, Object> = rng['end'] as Record<string, Object>;
                const r0: number = rs['row'] as number;
                const r1: number = re['row'] as number;
                const c0: number = rs['col'] as number;
                const c1: number = re['col'] as number;
                if (r0 <= event.row && event.row <= r1 && c0 <= event.col && event.col <= c1) {
                  effectiveCol = c0;
                  horizontalSpan = c1 - c0 + 1;
                  break;
                }
              }
            }
            if (effectiveCol >= 0 && effectiveCol < cols.length) {
              const col: Record<string, Object> = cols[effectiveCol] as Record<string, Object>;
              if (col['__lockInfo'] !== undefined) {
                // Determine toggle direction from current frozenColCount.
                // targetCol is the column index AFTER the merge span (mirrors iOS newFrozenColums).
                const curFrozen: number = (self.currentOption['frozenColCount'] !== undefined)
                  ? (self.currentOption['frozenColCount'] as number) : 0;
                const targetCol: number = effectiveCol + horizontalSpan;
                const isLocked: boolean = targetCol <= curFrozen;

                let newFrozenColCount: number;
                if (isLocked) {
                  // Unlock: find the last column with __lockInfo that is before effectiveCol.
                  // This matches iOS behaviour where all columns >= clicked column are unlocked,
                  // then frozenColumns is recomputed from remaining locked columns.
                  let nextFrozen: number = 0;
                  for (let i: number = 0; i < effectiveCol; i++) {
                    const c: Record<string, Object> = cols[i] as Record<string, Object>;
                    if (c && c['__lockInfo'] !== undefined) {
                      nextFrozen = i + 1;
                    }
                  }
                  newFrozenColCount = nextFrozen;
                } else {
                  // Lock: check that scaled frozen width <= componentWidth - 40 (mirrors iOS)
                  // Use cached native-measured column widths when available for accuracy.
                  let totalFrozenWidth: number = 0;
                  for (let fi: number = 0; fi < targetCol; fi++) {
                    if (fi >= cols.length) break;
                    const fc: Record<string, Object> = cols[fi] as Record<string, Object>;
                    let fcW: number = 50;
                    if (self.contentSizeColWidths.length > fi && self.contentSizeColWidths[fi] > 0) {
                      fcW = self.contentSizeColWidths[fi];
                    } else if (fc['width'] !== undefined && typeof (fc['width'] as Object) === 'number') {
                      fcW = fc['width'] as number;
                    } else if (fc['minWidth'] !== undefined) {
                      fcW = fc['minWidth'] as number;
                    }
                    totalFrozenWidth += fcW;
                  }
                  const scaledFrozenWidth: number = totalFrozenWidth * self.currentZoom;
                  const tableWidth: number = self.componentWidth > 0 ? self.componentWidth : 360;
                  if (scaledFrozenWidth > tableWidth - 40) {
                    // Cannot freeze — notify JS layer (shows Toast)
                    const fp: string = '{"col":' + effectiveCol.toString() + '}';
                    self.emitEvent('lockFailed', JSON.parse(fp) as Object);
                    return;
                  }
                  newFrozenColCount = targetCol;
                }

                // Apply new frozen state directly — no JS roundtrip needed.
                // Use updateOption so VTable re-renders with the new frozenColCount.
                self.currentOption['frozenColCount'] = newFrozenColCount;
                self.controller.updateOption(self.currentOption);
                return; // Lock first-row click — don't emit regular clickEvent
              }
            }
          }
          // When showHeader=true, any other first-row click is a header click and
          // should not emit a data-cell clickEvent.
          // When showHeader=false, row 0 is a real data row; fall through to the
          // body-cell handling below so clickEvent is emitted normally.
          if (showHeader) {
            return;
          }
        }

        // --- Body cell click: extract keyIndex from record metadata ---
        // VTable row indices: row 0 is always the header row (showHeader=true).
        // Body rows start at row 1. Resolve merge cell: if clicked inside a merge
        // range, use the anchor cell's meta.
        let effectiveRow: number = event.row;
        let effectiveCol: number = event.col;
        let verticalCount: number = 1;
        let horizontalCount: number = 1;

        const mergeCellsVal: Object | undefined = self.currentOption['customMergeCell'];
        if (mergeCellsVal !== undefined) {
          const merges: Object[] = mergeCellsVal as Object[];
          for (let _mi: number = 0; _mi < merges.length; _mi++) {
            const mrg: Record<string, Object> = merges[_mi] as Record<string, Object>;
            const rng: Record<string, Object> = mrg['range'] as Record<string, Object>;
            const rs: Record<string, Object> = rng['start'] as Record<string, Object>;
            const re: Record<string, Object> = rng['end'] as Record<string, Object>;
            const r0: number = rs['row'] as number;
            const r1: number = re['row'] as number;
            const c0: number = rs['col'] as number;
            const c1: number = re['col'] as number;
            if (r0 <= event.row && event.row <= r1 && c0 <= event.col && event.col <= c1) {
              effectiveRow = r0;
              effectiveCol = c0;
              verticalCount = r1 - r0 + 1;
              horizontalCount = c1 - c0 + 1;
              break;
            }
          }
        }

        let keyIndex: number = 0;
        // records index: header row (when shown) is not part of the records array.
        const headerRows: number = showHeader ? 1 : 0;
        const recordIdx: number = effectiveRow - headerRows;
        const recordsVal: Object | undefined = self.currentOption['records'];
        if (recordsVal !== undefined) {
          const recordsArr: Object[] = recordsVal as Object[];
          if (recordIdx >= 0 && recordIdx < recordsArr.length) {
            const record: Record<string, Object> = recordsArr[recordIdx] as Record<string, Object>;
            const metaKey: string = '__meta_' + effectiveCol.toString();
            const metaVal: Object | undefined = record[metaKey];
            if (metaVal !== undefined) {
              const meta: Record<string, Object> = metaVal as Record<string, Object>;
              const ki: Object | undefined = meta['keyIndex'];
              if (ki !== undefined) {
                keyIndex = ki as number;
              }
            }
          }
        }

        const payloadStr: string = '{"keyIndex":' + keyIndex.toString() +
          ',"rowIndex":' + effectiveRow.toString() +
          ',"columnIndex":' + effectiveCol.toString() +
          ',"verticalCount":' + verticalCount.toString() +
          ',"horizontalCount":' + horizontalCount.toString() + '}';
        self.emitEvent('clickEvent', JSON.parse(payloadStr) as Object);
      },
      onScroll: (event: ScrollEventData): void => {
        const payloadStr: string = '{"translateX":' + event.scrollLeft.toString() +
          ',"translateY":' + event.scrollTop.toString() +
          ',"scale":' + self.currentZoom.toString() + '}';
        self.emitEvent('scroll', JSON.parse(payloadStr) as Object);
      },
      onScrollVerticalEnd: (event: ScrollEventData): void => {
        const payloadStr: string = '{"isEnd":true}';
        self.emitEvent('scrollEnd', JSON.parse(payloadStr) as Object);
      },
      onInitialized: (): void => {
        // Mark initialized so subsequent updateVTable calls emit contentSize directly.
        self.vtableInitialized = true;

        // Emit natively-measured contentSize. Listeners are ready by this point
        // (JS componentDidMount runs before VTable's WebView finishes loading).
        self.emitCachedContentSize();
      },
    };
    return onEvent;
  }

  build() {
    Stack({ alignContent: Alignment.TopStart }) {
      VTable({
        controller: this.controller,
        option: this.option,
        onEvent: this.getOnEvent(),
      })
        .width(this.componentWidth > 0 && this.currentZoom > 0
          ? this.componentWidth / this.currentZoom
          : '100%')
        .height(this.componentHeight > 0 && this.currentZoom > 0
          ? this.componentHeight / this.currentZoom
          : '100%')
        .scale({
          x: this.currentZoom,
          y: this.currentZoom,
          centerX: 0,
          centerY: 0
        })
        .position({ x: 0, y: 0 })

    }
    .width('100%')
    .height('100%')
    .clip(true)
    .onAreaChange((oldArea: Area, newArea: Area): void => {
      const w: number = newArea.width as number;
      const h: number = newArea.height as number;
      if (w > 0 && h > 0 && (w !== this.componentWidth || h !== this.componentHeight)) {
        this.componentWidth = w;
        this.componentHeight = h;
      }
    })
    // priorityGesture ensures the outer Stack always wins the pinch gesture before
    // the VTable WebView can claim it. When disableZoom=true the handler exits early
    // so currentZoom never changes; when false it applies the ArkTS scale transform.
    .priorityGesture(
      PinchGesture({ fingers: 2, distance: 1 })
        .onActionStart((): void => {
          this.baseZoom = this.currentZoom;
        })
        .onActionUpdate((event: GestureEvent): void => {
          if (this.disableZoom) {
            return;
          }
          let newZoom: number = this.baseZoom * event.scale;
          if (newZoom < 0.5) {
            newZoom = 0.5;
          }
          if (newZoom > 2.0) {
            newZoom = 2.0;
          }
          this.currentZoom = newZoom;
        })
        .onActionEnd((): void => {})
    )
  }
}
