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

      // Parse columns to extract lock info for allowFrozenColCount
      const columnsArr: Object[] = JSON.parse(columnsStr) as Object[];
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

      // Build option JSON
      const optionStr: string = '{"records":' + recordsStr +
        ',"columns":' + columnsStr +
        ',"theme":' + themeStr +
        ',"customMergeCell":' + mergedCellsStr +
        ',"customCellStyle":' + customCellStyleStr +
        ',"customCellStyleArrangement":' + customCellStyleArrangementStr +
        ',"frozenColCount":' + frozenColCount.toString() +
        ',"frozenRowCount":' + frozenRowCount.toString() +
        ',"allowFrozenColCount":' + allowFrozenColCount.toString() +
        ',"showFrozenIcon":' + (allowFrozenColCount > 0 ? 'true' : 'false') +
        ',"autoWrapText":true' +
        ',"widthMode":"' + widthMode + '"' +
        ',"heightMode":"autoHeight"' +
        ',"autoFillWidth":true' +
        ',"autoFillHeight":false' +
        ',"hover":{"disableHover":true}' +
        ',"select":{"disableSelect":true}' +
        ',"scrollBar":{"visible":"none","barWidth":0,"hoverOn":false}' +
        ',"editor":""' +
        ',"editCellTrigger":"api"' +
        '}';
      const newOption: Record<string, Object> = JSON.parse(optionStr) as Record<string, Object>;

      // NOTE: customLayout/headerCustomLayout CANNOT work with @ohos/vtable
      // because VTable uses a WebView internally and functions can't be serialized to JSON.
      // Styling is handled via column `style` property and customCellStyle/customCellStyleArrangement.
      // Lock icons use VTable's native showFrozenIcon feature.

      this.disableZoom = disableZoom;
      this.option = newOption;
      this.controller.updateOption(newOption);
    } catch (e) {
      console.error('[ReportTableComponent] updateVTable failed: ' + (e as Error).message);
    }
  }

  private handleCommand(commandName: string, args: Object[]): void {
    if (commandName === 'scrollTo' && args.length >= 2) {
      const lineX: number = args[0] as number;
      const lineY: number = args[1] as number;
      // Negative values mean "keep current position"
      if (lineY >= 0) {
        this.controller.scrollToRow(lineY);
      }
      if (lineX >= 0) {
        this.controller.scrollToCol(lineX);
      }
    } else if (commandName === 'scrollToBottom') {
      const recordsVal: Object | undefined = this.option['records'];
      if (recordsVal !== undefined) {
        const recordsArr: Object[] = recordsVal as Object[];
        if (recordsArr.length > 0) {
          this.controller.scrollToRow(recordsArr.length - 1);
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

      const recordsVal: Object | undefined = this.option['records'];
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
      this.option['records'] = records as Object;
      this.controller.updateOption(this.option);
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
      const recordsVal: Object | undefined = this.option['records'];
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
      this.option['records'] = records as Object;
      this.controller.updateOption(this.option);
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
        // Extract keyIndex from record metadata
        let keyIndex: number = 0;
        const recordsVal: Object | undefined = self.option['records'];
        if (recordsVal !== undefined) {
          const recordsArr: Object[] = recordsVal as Object[];
          const frozenRowCountVal: Object | undefined = self.option['frozenRowCount'];
          const headerOffset: number = 1 + ((frozenRowCountVal !== undefined) ? (frozenRowCountVal as number) : 0);
          const recordIdx: number = event.row - headerOffset;
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
        // vtable_util.js overwrites the theme on init (sets frozenColumnLine.shadow.width=0).
        // Re-apply the frozen column shadow by updating the theme after initialization.
        const shadowPatchStr: string = '{"theme":{"frozenColumnLine":{"shadow":{"width":6,"startColor":"rgba(0,0,0,0.18)","endColor":"rgba(0,0,0,0)"}}}}';
        const shadowPatch: Record<string, Object> = JSON.parse(shadowPatchStr) as Record<string, Object>;
        self.controller.updateOption(shadowPatch);

        // Use VTable's actual scroll size after rendering
        const scrollHeight: number = self.controller.getScrollHeight();
        const scrollWidth: number = self.controller.getScrollWidth();

        const contentHeight: number = scrollHeight > 0 ? scrollHeight : 0;
        const contentWidth: number = scrollWidth > 0 ? scrollWidth : 0;

        if (contentHeight > 0 || contentWidth > 0) {
          const csPayload: string = '{"width":' + contentWidth.toString() +
            ',"height":' + contentHeight.toString() + '}';
          self.emitEvent('contentSize', JSON.parse(csPayload) as Object);
        }
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
    .gesture(
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
        .onActionEnd((): void => {
          // Zoom is already set during update
        })
    )
  }
}
