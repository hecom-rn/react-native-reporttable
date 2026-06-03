/**
 * ReportTableComponent.ets
 *
 * ArkTS UI component that renders a VTable.
 * Bridges RN props/events to @ohos/vtable.
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

      // Determine allowFrozenColCount for lock icon display
      let allowFrozenColCount: number = 0;
      if (permutable) {
        const columnsArr: Object[] = JSON.parse(columnsStr) as Object[];
        allowFrozenColCount = columnsArr.length;
      } else {
        const columnsArr: Object[] = JSON.parse(columnsStr) as Object[];
        for (let i: number = 0; i < columnsArr.length; i++) {
          const col: Record<string, Object> = columnsArr[i] as Record<string, Object>;
          if (col['__lockInfo'] !== undefined) {
            allowFrozenColCount = i + 1;
          }
        }
      }

      // Build option with all necessary configurations
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
        ',"autoWrapText":false' +
        ',"widthMode":"' + widthMode + '"' +
        ',"heightMode":"standard"' +
        ',"autoFillWidth":true' +
        ',"autoFillHeight":false' +
        ',"hover":{"disableHover":true}' +
        ',"select":{"disableSelect":true}' +
        ',"scrollBar":{"visible":"none"}' +
        ',"editor":""' +
        ',"editCellTrigger":"api"' +
        '}';
      const newOption: Record<string, Object> = JSON.parse(optionStr) as Record<string, Object>;

      // Store disableZoom state for gesture handling
      this.disableZoom = disableZoom;

      this.option = newOption;
      this.controller.updateOption(newOption);
    } catch (e) {
      console.error('[ReportTableComponent] updateVTable failed');
    }
  }

  private handleCommand(commandName: string, args: Object[]): void {
    if (commandName === 'scrollTo' && args.length >= 2) {
      const lineX: number = args[0] as number;
      const lineY: number = args[1] as number;
      this.controller.scrollToRow(lineY);
      this.controller.scrollToCol(lineX);
    } else if (commandName === 'scrollToBottom') {
      const recordsVal: Object | undefined = this.option['records'];
      if (recordsVal !== undefined) {
        const recordsArr: Object[] = recordsVal as Object[];
        if (recordsArr.length > 0) {
          this.controller.scrollToRow(recordsArr.length - 1);
        }
      }
    } else if (commandName === 'updateData' && args.length > 0) {
      try {
        const dataStr: string = args[0] as string;
        const dataObj: Record<string, Object> = JSON.parse(dataStr) as Record<string, Object>;
        this.controller.updateOption(dataObj);
      } catch (e) {
        console.error('[ReportTableComponent] updateData parse failed');
      }
    } else if (commandName === 'frozenToCol' && args.length > 0) {
      this.controller.frozenToCol(args[0] as number);
    }
  }

  private emitClickEvent(row: number, col: number): void {
    // Extract keyIndex from the record metadata if available
    let keyIndex: number = 0;
    const recordsVal: Object | undefined = this.option['records'];
    if (recordsVal !== undefined) {
      const recordsArr: Object[] = recordsVal as Object[];
      // VTable row includes header rows. Body rows start after frozenRowCount + 1 (header).
      const frozenRowCountVal: Object | undefined = this.option['frozenRowCount'];
      const headerOffset: number = 1 + ((frozenRowCountVal !== undefined) ? (frozenRowCountVal as number) : 0);
      const recordIdx: number = row - headerOffset;
      if (recordIdx >= 0 && recordIdx < recordsArr.length) {
        const record: Record<string, Object> = recordsArr[recordIdx] as Record<string, Object>;
        const metaKey: string = '__meta_' + col.toString();
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
      ',"rowIndex":' + row.toString() +
      ',"columnIndex":' + col.toString() +
      ',"verticalCount":1' +
      ',"horizontalCount":1}';
    this.ctx.rnInstance.emitComponentEvent(this.tag, 'topClickEvent', JSON.parse(payloadStr) as Object);
  }

  private emitScrollEvent(scrollLeft: number, scrollTop: number): void {
    const payloadStr: string = '{"translateX":' + scrollLeft.toString() +
      ',"translateY":' + scrollTop.toString() +
      ',"scale":' + this.currentZoom.toString() + '}';
    this.ctx.rnInstance.emitComponentEvent(this.tag, 'topScroll', JSON.parse(payloadStr) as Object);
  }

  private emitScrollEndEvent(scrollTop: number): void {
    const payloadStr: string = '{"isEnd":true,"scrollTop":' + scrollTop.toString() + '}';
    this.ctx.rnInstance.emitComponentEvent(this.tag, 'topScrollEnd', JSON.parse(payloadStr) as Object);
  }

  private emitContentSizeEvent(width: number, height: number): void {
    const payloadStr: string = '{"width":' + width.toString() + ',"height":' + height.toString() + '}';
    this.ctx.rnInstance.emitComponentEvent(this.tag, 'topContentSize', JSON.parse(payloadStr) as Object);
  }

  private getOnEvent(): VTableOnEvent {
    const self = this;
    const onEvent: VTableOnEvent = {
      onClickCell: (event: CellClickData): void => {
        self.emitClickEvent(event.row, event.col);
      },
      onScroll: (event: ScrollEventData): void => {
        self.emitScrollEvent(event.scrollLeft, event.scrollTop);
      },
      onScrollVerticalEnd: (event: ScrollEventData): void => {
        self.emitScrollEndEvent(event.scrollTop);
      },
      onInitialized: (): void => {
        // Compute content size from columns and records
        let totalWidth: number = 0;
        let totalHeight: number = 0;
        const columnsVal: Object | undefined = self.option['columns'];
        const recordsVal: Object | undefined = self.option['records'];
        if (columnsVal !== undefined) {
          const cols: Object[] = columnsVal as Object[];
          for (let i: number = 0; i < cols.length; i++) {
            const col: Record<string, Object> = cols[i] as Record<string, Object>;
            const w: Object | undefined = col['maxWidth'];
            if (w !== undefined) {
              totalWidth = totalWidth + (w as number);
            } else {
              totalWidth = totalWidth + 100;
            }
          }
        }
        if (recordsVal !== undefined) {
          const recs: Object[] = recordsVal as Object[];
          // Estimate: header(40) + each row(40)
          totalHeight = 40 + recs.length * 40;
        }
        self.emitContentSizeEvent(totalWidth, totalHeight);
      },
    };
    return onEvent;
  }

  private getInnerWidth(): number {
    if (this.componentWidth <= 0 || this.currentZoom <= 0) {
      return 0;
    }
    return this.componentWidth / this.currentZoom;
  }

  private getInnerHeight(): number {
    if (this.componentHeight <= 0 || this.currentZoom <= 0) {
      return 0;
    }
    return this.componentHeight / this.currentZoom;
  }

  build() {
    Column() {
      Stack({ alignContent: Alignment.TopStart }) {
        VTable({
          controller: this.controller,
          option: this.option,
          onEvent: this.getOnEvent(),
        })
      }
      .width(this.getInnerWidth())
      .height(this.getInnerHeight())
      .scale({ x: this.currentZoom, y: this.currentZoom, centerX: 0, centerY: 0 })
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
