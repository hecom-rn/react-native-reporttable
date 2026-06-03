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
  // Store customCellStyle arrangements for post-init re-application via customRender
  private pendingCustomStyles: Object[] = [];

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
        ',"autoWrapText":false' +
        ',"widthMode":"' + widthMode + '"' +
        ',"heightMode":"standard"' +
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

      // Store custom styles for post-init re-application via customRender API
      // This ensures styles are applied even if option-level customCellStyle has issues
      this.pendingCustomStyles = this.buildPendingCustomStyles(customCellStyleStr, customCellStyleArrangementStr);

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

  /**
   * Parse customCellStyle + arrangement into a list of {styleId, style, col, row} entries
   * for post-init application via controller.customRender().
   */
  private buildPendingCustomStyles(customCellStyleStr: string, arrangementStr: string): Object[] {
    const styles: Object[] = JSON.parse(customCellStyleStr) as Object[];
    const arrangements: Object[] = JSON.parse(arrangementStr) as Object[];
    if (styles.length === 0 || arrangements.length === 0) {
      return [];
    }

    // Build id → style map
    const styleMap: Record<string, Object> = {} as Record<string, Object>;
    for (let i: number = 0; i < styles.length; i++) {
      const entry: Record<string, Object> = styles[i] as Record<string, Object>;
      const id: string = entry['id'] as string;
      styleMap[id] = entry['style'] as Object;
    }

    // Build pending items: each has { id, style, col, row }
    const pending: Object[] = [];
    for (let i: number = 0; i < arrangements.length; i++) {
      const arr: Record<string, Object> = arrangements[i] as Record<string, Object>;
      const styleId: string = arr['customStyleId'] as string;
      const pos: Record<string, Object> = arr['cellPosition'] as Record<string, Object>;
      if (pos !== undefined && styleMap[styleId] !== undefined) {
        const item: Record<string, Object> = {} as Record<string, Object>;
        item['id'] = styleId as Object;
        item['style'] = styleMap[styleId] as Object;
        item['col'] = pos['col'] as Object;
        item['row'] = pos['row'] as Object;
        pending.push(item as Object);
      }
    }
    return pending;
  }

  /**
   * Apply pending custom styles via controller.customRender() after table init.
   * This is a fallback that ensures styles are applied even if option-level
   * customCellStyle/customCellStyleArrangement doesn't work in this VTable version.
   */
  private applyPendingCustomStyles(): void {
    if (this.pendingCustomStyles.length === 0) {
      return;
    }

    // Deduplicate: register each unique style once, then apply per cell
    const registered: Record<string, boolean> = {} as Record<string, boolean>;
    for (let i: number = 0; i < this.pendingCustomStyles.length; i++) {
      const item: Record<string, Object> = this.pendingCustomStyles[i] as Record<string, Object>;
      const id: string = item['id'] as string;
      const style: Record<string, Object> = item['style'] as Record<string, Object>;
      const col: number = item['col'] as number;
      const row: number = item['row'] as number;

      if (registered[id] === undefined) {
        // First time seeing this style id — register and apply in one call
        registered[id] = true;
      }
      // Apply style to single cell (startCol=endCol, startRow=endRow)
      this.controller.customRender(col, row, col, row, id, style);
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

        // Report accurate content size from scroll event data
        // scrollHeight/scrollWidth represent the actual total content dimensions
        if (event.scrollHeight > 0 || event.scrollWidth > 0) {
          const csPayload: string = '{"width":' + event.scrollWidth.toString() +
            ',"height":' + event.scrollHeight.toString() + '}';
          self.emitEvent('contentSize', JSON.parse(csPayload) as Object);
        }
      },
      onScrollVerticalEnd: (event: ScrollEventData): void => {
        const payloadStr: string = '{"isEnd":true}';
        self.emitEvent('scrollEnd', JSON.parse(payloadStr) as Object);
      },
      onInitialized: (): void => {
        // Apply custom cell styles via customRender API after table is fully initialized
        // This ensures styles work even if option-level customCellStyle has issues
        self.applyPendingCustomStyles();

        // Initial content size will be reported on first scroll event
        // Send a placeholder to indicate table is ready
        const payloadStr: string = '{"width":0,"height":0}';
        self.emitEvent('contentSize', JSON.parse(payloadStr) as Object);
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
