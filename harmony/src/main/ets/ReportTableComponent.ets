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
  // Extra frozen row count (NOT counting the column-title header row that VTable always has).
  // Used to compute the global VTable row index: globalRow = bodyRow + 1 + extraFrozenRows.
  private currentFrozenRowCount: number = 0;


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
    itemConfigStr: string
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
        if (headerTitle.length > 0) {
          // Pass fontSize as a number (in fp ≈ vp units). measureText returns px.
          const wPx: number = measure.measureText({ textContent: headerTitle, fontSize: colFontSize });
          // Fallback to char-width estimate when measureText returns 0 (font not loaded yet)
          let wVp: number = wPx > 0 ? wPx / dpRatio : headerTitle.length * colFontSize * 0.65;
          // Add lock icon width when this column has a lock icon (drawn via customRender).
          if (col['__lockInfo'] !== undefined) {
            wVp += 13 + 4; // lockIconWidth(13) + lockIconPadding(4)
          }
          maxContentW = Math.max(maxContentW, wVp + colPadH * 2);
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
          if (cellText.length > 0) {
            const wPx: number = measure.measureText({ textContent: cellText, fontSize: cellFontSize });
            let wVp: number = wPx > 0 ? wPx / dpRatio : cellText.length * cellFontSize * 0.65;
            // Add icon width when the cell has an icon (rendered via customRender).
            const cellIconVal: Object | undefined = meta['icon'];
            if (cellIconVal !== undefined) {
              const cellIconObj: Record<string, Object> = cellIconVal as Record<string, Object>;
              const iW: number = (cellIconObj['width'] !== undefined) ? (cellIconObj['width'] as number) : 16;
              const iPad: number = (cellIconObj['paddingHorizontal'] !== undefined) ? (cellIconObj['paddingHorizontal'] as number) : 4;
              wVp += iW + iPad;
            }
            maxContentW = Math.max(maxContentW, wVp + cellPadH * 2);
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

      // Header row
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
          // vertPad = top+bottom padding = minHeight - fontSize (constant regardless of line count)
          // So: 1 line → minHeight; N lines → (N-1)*fontSize + minHeight
          const vertPad: number = safeMinHeight - fontSize;
          const cellH: number = lineCount * fontSize + vertPad;
          maxHeaderH = Math.max(maxHeaderH, cellH);
        }
      }
      contentHeight += maxHeaderH + borderPx;

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
            // vertPad = top+bottom padding = minHeight - fontSize (constant regardless of line count)
            // So: 1 line → minHeight; N lines → (N-1)*fontSize + minHeight
            const vertPad: number = safeMinHeight - fontSize;
            const cellH: number = lineCount * fontSize + vertPad;
            maxRowH = Math.max(maxRowH, cellH);
          }
        }
        contentHeight += maxRowH + borderPx;
      }

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

      const recordsStr: string = (recordsVal !== undefined) ? (recordsVal as string) : '[]';
      const columnsStr: string = (columnsVal !== undefined) ? (columnsVal as string) : '[]';
      const themeStr: string = (themeVal !== undefined) ? (themeVal as string) : '{}';
      const mergedCellsStr: string = (mergedCellsVal !== undefined) ? (mergedCellsVal as string) : '[]';
      const customCellStyleStr: string = (customCellStyleVal !== undefined) ? (customCellStyleVal as string) : '[]';
      const customCellStyleArrangementStr: string = (customCellStyleArrangementVal !== undefined) ? (customCellStyleArrangementVal as string) : '[]';
      const widthMode: string = (widthModeVal !== undefined) ? (widthModeVal as string) : 'autoWidth';
      const frozenColCount: number = (frozenColCountVal !== undefined) ? (frozenColCountVal as number) : 0;
      const frozenRowCount: number = (frozenRowCountVal !== undefined) ? (frozenRowCountVal as number) : 0;
      const disableZoom: boolean = (disableZoomVal !== undefined) ? (disableZoomVal as boolean) : false;
      const permutable: boolean = (permutableVal !== undefined) ? (permutableVal as boolean) : false;

      // Parse columns and records for native contentSize measurement
      const columnsArr: Object[] = JSON.parse(columnsStr) as Object[];
      const recordsArrForSize: Object[] = JSON.parse(recordsStr) as Object[];
      const itemConfigPropVal: Object | undefined = rawProps['itemConfig'];
      const itemConfigStr: string = (itemConfigPropVal !== undefined)
        ? (itemConfigPropVal as string) : '{}';

      // Compute contentSize using ArkTS native text measurement.
      // mirrors iOS (NSString sizeWithAttributes) and Android (Paint.measureText).
      this.cachedContentSize = this.computeContentSizeNative(columnsArr, recordsArrForSize, itemConfigStr);

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

      let allowFrozenColCount: number = 0;

      for (let i: number = 0; i < columnsArr.length; i++) {
        const col: Record<string, Object> = columnsArr[i] as Record<string, Object>;
        if (col['__lockInfo'] !== undefined) {
          allowFrozenColCount = i + 1;
        }
      }

      if (permutable) {
        allowFrozenColCount = columnsArr.length;
      }

      this.currentFrozenRowCount = frozenRowCount;

      // Build option JSON.
      // VTable's WebView uses CSS logical pixels, which equal vp. No unit conversion needed.
      const optionStr: string = '"records":' + recordsStr +
        ',"columns":' + columnsStr +
        ',"theme":' + themeStr +
        ',"customMergeCell":' + mergedCellsStr +
        ',"customCellStyle":' + customCellStyleStr +
        ',"customCellStyleArrangement":' + customCellStyleArrangementStr +
        ',"frozenColCount":' + frozenColCount.toString() +
        ',"frozenRowCount":' + frozenRowCount.toString() +
        ',"allowFrozenColCount":' + allowFrozenColCount.toString() +
        ',"showFrozenIcon":' + (allowFrozenColCount > 0 ? 'true' : 'false') +
        ',"defaultRowHeight":' + rowMinHeight.toString() +
        ',"defaultHeaderRowHeight":' + rowMinHeight.toString() +
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

      // NOTE: customLayout/headerCustomLayout CANNOT work with @ohos/vtable
      // because VTable uses a WebView internally and functions can't be serialized to JSON.
      // Styling is handled via column `style` property and customCellStyle/customCellStyleArrangement.
      // Lock icons use VTable's native showFrozenIcon feature.

      this.disableZoom = disableZoom;
      // Cache option for command handlers (handleUpdateData, handleSpliceData, etc.)
      // without triggering a @State re-render.
      this.currentOption = newOption;

      if (!this.vtableInitialized) {
        // First render: set @State to give VTable its initial option.
        // Changing @State here is fine because VTable hasn't rendered yet.
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
      if (recordsVal !== undefined) {
        const recordsArr: Object[] = recordsVal as Object[];
        if (recordsArr.length > 0) {
          // Global row index of last body row = 1 (header) + currentFrozenRowCount + (records.length - 1).
          this.controller.scrollToRow(1 + this.currentFrozenRowCount + recordsArr.length - 1);
        }
      }
    } else if (commandName === 'updateData' && args.length > 0) {
      this.handleUpdateData(args);
    } else if (commandName === 'frozenToCol' && args.length > 0) {
      this.controller.frozenToCol(args[0] as number);
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

      // VTable records start after header row(s). startRow already includes frozenRows offset.
      // Record index = startRow - headerRows (1 for VTable built-in header)
      const headerRows: number = 1;
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

      // Re-render with updated records
      this.currentOption['records'] = records as Object;
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

      for (let opIdx: number = 0; opIdx < operations.length; opIdx++) {
        const op: Record<string, Object> = operations[opIdx] as Record<string, Object>;
        const deleteIndices: Object[] = (op['deleteIndices'] !== undefined) ? (op['deleteIndices'] as Object[]) : [];
        const addAtIndex: number = (op['addAtIndex'] !== undefined) ? (op['addAtIndex'] as number) : 0;
        const newRecords: Object[] = (op['newRecords'] !== undefined) ? (op['newRecords'] as Object[]) : [];

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
      }

      // Update option with modified records and re-render
      this.currentOption['records'] = records as Object;
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
        // --- Lock toggle detection: header row click on a lockable column ---
        const frozenRowCountV: Object | undefined = self.currentOption['frozenRowCount'];
        const headerRows: number = 1 + ((frozenRowCountV !== undefined) ? (frozenRowCountV as number) : 0);
        if (event.row < headerRows) {
          // This is a header cell click. Check if the column has a lock icon.
          const colsVal: Object | undefined = self.currentOption['columns'];
          if (colsVal !== undefined) {
            const cols: Object[] = colsVal as Object[];
            if (event.col >= 0 && event.col < cols.length) {
              const col: Record<string, Object> = cols[event.col] as Record<string, Object>;
              if (col['__lockInfo'] !== undefined) {
                // Determine toggle direction from current frozenColCount.
                const curFrozen: number = (self.currentOption['frozenColCount'] !== undefined)
                  ? (self.currentOption['frozenColCount'] as number) : 0;
                const isLocked: boolean = event.col < curFrozen;
                const newLocked: boolean = !isLocked;

                // If trying to lock (freeze), check that total frozen column width does not
                // exceed the visible component width (mirrors iOS behavior).
                if (newLocked) {
                  let totalFrozenWidth: number = 0;
                  for (let fi: number = 0; fi <= event.col; fi++) {
                    if (fi >= cols.length) break;
                    const fc: Record<string, Object> = cols[fi] as Record<string, Object>;
                    const fcMin: number = (fc['minWidth'] !== undefined) ? (fc['minWidth'] as number) : 50;
                    const fcMax: number = (fc['maxWidth'] !== undefined) ? (fc['maxWidth'] as number) : 120;
                    totalFrozenWidth += Math.min(fcMax, Math.max(fcMin, fcMin));
                  }
                  if (totalFrozenWidth >= self.componentWidth) {
                    // Cannot freeze — notify JS layer
                    const fp: string = '{"col":' + event.col.toString() + '}';
                    self.emitEvent('lockFailed', JSON.parse(fp) as Object);
                    return;
                  }
                }

                const lp: string = '{"col":' + event.col.toString() + ',"locked":' + (newLocked ? 'true' : 'false') + '}';
                self.emitEvent('lockToggle', JSON.parse(lp) as Object);
                return; // Lock header click — don't emit regular clickEvent
              }
            }
          }
          return; // Other header clicks — suppress clickEvent (not a data row)
        }

        // --- Body cell click: extract keyIndex from record metadata ---
        let keyIndex: number = 0;
        const recordsVal: Object | undefined = self.currentOption['records'];
        if (recordsVal !== undefined) {
          const recordsArr: Object[] = recordsVal as Object[];
          const recordIdx: number = event.row - headerRows;
          if (recordIdx >= 0 && recordIdx < recordsArr.length) {
            const record: Record<string, Object> = recordsArr[recordIdx] as Record<string, Object>;
            const metaKey: string = '__meta_' + event.col.toString();
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
          ',"rowIndex":' + event.row.toString() +
          ',"columnIndex":' + event.col.toString() +
          ',"verticalCount":1' +
          ',"horizontalCount":1}';
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
