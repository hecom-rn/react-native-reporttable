/**
 * RNReportTableViewManager.ets
 *
 * ViewManager for the RNReportTable Fabric component.
 * Handles prop updates, command dispatching, and lifecycle.
 */
import { ViewManager, RNComponentContext } from '@rnoh/react-native-openharmony/ts';

export interface RNReportTableProps {
  records: string;
  columns: string;
  theme: string;
  frozenColCount: number;
  frozenRowCount: number;
  lineColor: string;
  disableZoom: boolean;
  showBorder: boolean;
  permutable: boolean;
  frozenAbility: string;
  ignoreLocks: number[];
  doubleClickZoom: boolean;
  itemConfig: string;
  progressStyle: string;
  replenishColumnsWidthConfig: string;
}

export class RNReportTableViewManager extends ViewManager {
  getName(): string {
    return 'RNReportTable';
  }

  createView(ctx: RNComponentContext): ESObject {
    return new RNReportTableView(ctx);
  }
}

export class RNReportTableView {
  private ctx: RNComponentContext;
  private vtableInstance: ESObject = null;
  private currentProps: Partial<RNReportTableProps> = {};
  private currentScale: number = 1.0;
  private componentWidth: number = 0;
  private componentHeight: number = 0;

  constructor(ctx: RNComponentContext) {
    this.ctx = ctx;
  }

  /**
   * Called when the component is attached to the view hierarchy.
   * Creates the VTable instance inside the XComponent canvas.
   */
  onMount(): void {
    // VTable instance will be created after XComponent is ready
  }

  /**
   * Called when the component is removed.
   * Releases VTable resources.
   */
  onUnmount(): void {
    if (this.vtableInstance) {
      this.vtableInstance.release();
      this.vtableInstance = null;
    }
  }

  /**
   * Handle prop updates from JS side.
   */
  onPropsChanged(props: Partial<RNReportTableProps>): void {
    this.currentProps = { ...this.currentProps, ...props };
    this.updateVTable();
  }

  /**
   * Handle commands dispatched from JS (UIManager.dispatchViewManagerCommand).
   */
  onCommand(commandName: string, args: ESObject[]): void {
    switch (commandName) {
      case 'scrollTo':
        this.handleScrollTo(args);
        break;
      case 'scrollToBottom':
        this.handleScrollToBottom();
        break;
      case 'updateData':
        this.handleUpdateData(args);
        break;
      case 'spliceData':
        this.handleSpliceData(args);
        break;
    }
  }

  // ---- VTable initialization and updates ----

  /**
   * Initialize or update VTable with current props.
   */
  private updateVTable(): void {
    if (!this.vtableInstance) {
      return; // Wait for XComponent canvas ready
    }

    const props = this.currentProps;

    try {
      const records = JSON.parse(props.records || '[]');
      const columns = JSON.parse(props.columns || '[]');
      const theme = JSON.parse(props.theme || '{}');

      // Apply frozen configuration
      const option: ESObject = {
        records,
        columns,
        theme,
        frozenColCount: props.frozenColCount || 0,
        // frozenRowCount represents header row count for VTable
        autoWrapText: false,
        widthMode: 'standard',
        heightMode: 'standard',
      };

      this.vtableInstance.updateOption(option);
      this.reportContentSize();
    } catch (e) {
      console.error('[RNReportTable] Failed to update VTable:', e);
    }
  }

  /**
   * Called when the XComponent canvas is ready.
   * Creates the VTable ListTable instance.
   */
  onCanvasReady(canvas: ESObject): void {
    try {
      // Import and create VTable ListTable
      const vtable: ESObject = require('@ohos/vtable');
      const props = this.currentProps;

      const records: ESObject = JSON.parse(props.records || '[]');
      const columns: ESObject = JSON.parse(props.columns || '[]');
      const theme: ESObject = JSON.parse(props.theme || '{}');

      const option: ESObject = {
        records,
        columns,
        theme,
        frozenColCount: props.frozenColCount || 0,
        autoWrapText: false,
        widthMode: 'standard',
        heightMode: 'standard',
        canvas,
      };

      this.vtableInstance = new vtable.ListTable(option);

      // Register event listeners
      this.registerEvents();
      this.reportContentSize();
    } catch (e) {
      console.error('[RNReportTable] Failed to create VTable instance:', e);
    }
  }

  /**
   * Register VTable event listeners and emit events to JS.
   */
  private registerEvents(): void {
    if (!this.vtableInstance) return;

    // Click cell event
    this.vtableInstance.on('click_cell', (event: ESObject) => {
      const col: number = event.col;
      const row: number = event.row;
      const record: ESObject = this.vtableInstance.getRecordByCell(col, row);
      const keyIndex: number = record?.[`__meta_${col}`]?.keyIndex ?? 0;
      const rowCount: number = this.vtableInstance.rowCount || 0;
      const colCount: number = this.vtableInstance.colCount || 0;

      this.ctx.emitEvent('onClickEvent', {
        keyIndex,
        rowIndex: row,
        columnIndex: col,
        verticalCount: rowCount,
        horizontalCount: colCount,
      });
    });

    // Scroll event
    this.vtableInstance.on('scroll', (event: ESObject) => {
      const scrollLeft: number = event.scrollLeft ?? this.vtableInstance.getScrollLeft();
      const scrollTop: number = event.scrollTop ?? this.vtableInstance.getScrollTop();

      this.ctx.emitEvent('onScroll', {
        translateX: scrollLeft,
        translateY: scrollTop,
        scale: this.currentScale,
      });

      // Check scroll end (scrolled to bottom)
      this.checkScrollEnd(scrollTop);
    });
  }

  /**
   * Check if scrolled to bottom and emit onScrollEnd event.
   */
  private checkScrollEnd(scrollTop: number): void {
    if (!this.vtableInstance) return;

    const allRowsHeight = this.vtableInstance.getAllRowsHeight();
    const viewHeight = this.componentHeight;
    const isEnd = scrollTop + viewHeight >= allRowsHeight - 1; // 1px tolerance

    this.ctx.emitEvent('onScrollEnd', { isEnd });
  }

  /**
   * Report content size (total width/height of all rows and columns).
   */
  private reportContentSize(): void {
    if (!this.vtableInstance) return;

    try {
      const width = this.vtableInstance.getAllColsWidth();
      const height = this.vtableInstance.getAllRowsHeight();
      this.ctx.emitEvent('onContentSize', { width, height });
    } catch (e) {
      // Ignore if not ready
    }
  }

  // ---- Command handlers ----

  /**
   * scrollTo command: [lineX, lineY, offsetX, offsetY, animated]
   */
  private handleScrollTo(args: ESObject[]): void {
    if (!this.vtableInstance) return;

    const lineX: number = (args[0] ?? 0) as number;
    const lineY: number = (args[1] ?? 0) as number;
    const offsetX: number = (args[2] ?? 0) as number;
    const offsetY: number = (args[3] ?? 0) as number;

    // Scroll to the specified cell first
    if (lineX >= 0 && lineY >= 0) {
      this.vtableInstance.scrollToCell({ col: lineX, row: lineY });
    }

    // Apply additional offset
    if (offsetX !== 0) {
      const currentLeft = this.vtableInstance.getScrollLeft();
      this.vtableInstance.setScrollLeft(currentLeft + offsetX);
    }
    if (offsetY !== 0) {
      const currentTop = this.vtableInstance.getScrollTop();
      this.vtableInstance.setScrollTop(currentTop + offsetY);
    }
  }

  /**
   * scrollToBottom command.
   */
  private handleScrollToBottom(): void {
    if (!this.vtableInstance) return;

    const allRowsHeight = this.vtableInstance.getAllRowsHeight();
    const viewHeight = this.componentHeight;
    const targetScrollTop = Math.max(0, allRowsHeight - viewHeight);
    this.vtableInstance.setScrollTop(targetScrollTop);
  }

  /**
   * updateData command: [jsonString]
   * JSON format: { startCol, startRow, values: string[][] }
   */
  private handleUpdateData(args: ESObject[]): void {
    if (!this.vtableInstance || !args[0]) return;

    try {
      const parsed: ESObject = JSON.parse(args[0] as string);
      const startCol: number = parsed.startCol;
      const startRow: number = parsed.startRow;
      const values: ESObject = parsed.values;
      this.vtableInstance.changeCellValues(startCol, startRow, values);
      this.reportContentSize();
    } catch (e) {
      console.error('[RNReportTable] updateData failed:', e);
    }
  }

  /**
   * spliceData command: [jsonString]
   * JSON format: [{ deleteIndices, addAtIndex, newRecords }]
   */
  private handleSpliceData(args: ESObject[]): void {
    if (!this.vtableInstance || !args[0]) return;

    try {
      const operations = JSON.parse(args[0]);
      for (const op of operations) {
        // Delete records first
        if (op.deleteIndices && op.deleteIndices.length > 0) {
          this.vtableInstance.deleteRecords(op.deleteIndices);
        }
        // Then add new records
        if (op.newRecords && op.newRecords.length > 0) {
          this.vtableInstance.addRecords(op.newRecords, op.addAtIndex);
        }
      }
      this.reportContentSize();
    } catch (e) {
      console.error('[RNReportTable] spliceData failed:', e);
    }
  }

  // ---- Gesture handling (Pinch-to-zoom) ----

  /**
   * Handle pinch gesture for zoom (VTable has no built-in zoom).
   * Scale the entire canvas via transform.
   */
  onPinchGesture(scale: number): void {
    if (this.currentProps.disableZoom) return;

    this.currentScale = Math.max(0.5, Math.min(3.0, scale));
    // Apply scale transform to the XComponent canvas
    // This is handled by the ArkTS UI component wrapping the XComponent
  }

  /**
   * Handle double-tap zoom toggle.
   */
  onDoubleTap(): void {
    if (this.currentProps.disableZoom) return;
    if (!this.currentProps.doubleClickZoom) return;

    this.currentScale = this.currentScale === 1.0 ? 1.5 : 1.0;
  }

  /**
   * Update component dimensions (called on layout change).
   */
  onLayoutChange(width: number, height: number): void {
    this.componentWidth = width;
    this.componentHeight = height;
  }
}
