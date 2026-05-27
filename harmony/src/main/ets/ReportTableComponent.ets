/**
 * ReportTableComponent.ets
 *
 * ArkTS UI component that renders a VTable ListTable inside an XComponent.
 * Handles gesture recognition (pinch-to-zoom, double-tap) and bridges
 * RN props/events to VTable.
 */
import { ListTable } from '@ohos/vtable';
import { createHeaderCustomLayout } from './CustomCellLayout';

@Component
export struct ReportTableComponent {
  // Props from RN
  @Prop records: string = '[]';
  @Prop columns: string = '[]';
  @Prop theme: string = '{}';
  @Prop frozenColCount: number = 0;
  @Prop frozenRowCount: number = 1;
  @Prop lineColor: string = '#e8e8e8';
  @Prop disableZoom: boolean = false;
  @Prop showBorder: boolean = false;
  @Prop doubleClickZoom: boolean = true;
  @Prop itemConfig: string = '{}';
  @Prop progressStyle: string = '{}';

  // Internal state
  @State private currentScale: number = 1.0;
  private vtableInstance: ListTable | null = null;
  private componentWidth: number = 0;
  private componentHeight: number = 0;
  private xComponentId: string = 'vtable_canvas_' + Date.now();

  // Event callbacks (set by ViewManager)
  onClickEvent: (data: object) => void = () => {};
  onScroll: (data: object) => void = () => {};
  onScrollEnd: (data: object) => void = () => {};
  onContentSize: (data: object) => void = () => {};

  aboutToDisappear() {
    if (this.vtableInstance) {
      this.vtableInstance.release();
      this.vtableInstance = null;
    }
  }

  /**
   * Initialize VTable after XComponent canvas is ready.
   */
  private initVTable(context: CanvasRenderingContext2D): void {
    try {
      const parsedRecords = JSON.parse(this.records);
      const parsedColumns = JSON.parse(this.columns);
      const parsedTheme = JSON.parse(this.theme);

      // Build lock info map from columns' __lockInfo
      const columnLockInfoMap: any = {};
      for (let i = 0; i < parsedColumns.length; i++) {
        if (parsedColumns[i].__lockInfo) {
          columnLockInfoMap[i] = parsedColumns[i].__lockInfo;
        }
      }

      // Apply headerCustomLayout for columns with lock icons
      const hasLockIcons = Object.keys(columnLockInfoMap).length > 0;
      if (hasLockIcons) {
        const headerLayout = createHeaderCustomLayout(columnLockInfoMap, (col: number, locked: boolean) => {
          this.handleLockToggle(col, locked, columnLockInfoMap);
        });
        for (let i = 0; i < parsedColumns.length; i++) {
          if (columnLockInfoMap[i]) {
            parsedColumns[i].headerCustomLayout = headerLayout;
          }
        }
      }

      const option = {
        container: null, // XComponent mode
        records: parsedRecords,
        columns: parsedColumns,
        theme: parsedTheme,
        frozenColCount: this.frozenColCount,
        autoWrapText: false,
        widthMode: 'standard',
        heightMode: 'standard',
        canvasWidth: this.componentWidth,
        canvasHeight: this.componentHeight,
      };

      this.vtableInstance = new ListTable(option, context);
      this.registerVTableEvents();
      this.reportContentSize();
    } catch (e) {
      console.error('[ReportTableComponent] initVTable failed:', JSON.stringify(e));
    }
  }

  /**
   * Handle lock icon toggle.
   * When user taps a lock icon, update frozen column count and re-render.
   * Logic matches iOS: locking a column freezes all columns up to and including it.
   */
  private handleLockToggle(col: number, locked: boolean, columnLockInfoMap: any): void {
    if (!this.vtableInstance) return;

    // Update the lock state
    columnLockInfoMap[col].isLocked = locked;

    if (locked) {
      // Freeze up to this column (col is 0-based, frozenColCount includes the column itself)
      const newFrozenCount = Math.max(this.frozenColCount, col + 1);
      this.vtableInstance.frozenColCount = newFrozenCount;
    } else {
      // Unlocking: find the rightmost still-locked column to determine new freeze count
      let maxLocked = this.frozenColCount; // base frozen columns that are permanent
      for (const key of Object.keys(columnLockInfoMap)) {
        const idx = parseInt(key);
        if (columnLockInfoMap[key].isLocked && idx + 1 > maxLocked) {
          maxLocked = idx + 1;
        }
      }
      // If no column is locked, revert to base frozenColCount
      let anyLocked = false;
      for (const key of Object.keys(columnLockInfoMap)) {
        if (columnLockInfoMap[key].isLocked) {
          anyLocked = true;
          break;
        }
      }
      this.vtableInstance.frozenColCount = anyLocked ? maxLocked : this.frozenColCount;
    }

    // Re-render to update lock icon visual state
    this.vtableInstance.renderWithRecreateCells();
  }

  /**
   * Register VTable events and forward to RN.
   */
  private registerVTableEvents(): void {
    if (!this.vtableInstance) return;

    this.vtableInstance.on('click_cell', (event) => {
      const col = event.col;
      const row = event.row;
      const record = this.vtableInstance!.getRecordByCell(col, row);
      const meta = record?.[`__meta_${col}`];
      const keyIndex = meta?.keyIndex ?? 0;

      this.onClickEvent({
        keyIndex,
        rowIndex: row,
        columnIndex: col,
        verticalCount: this.vtableInstance!.rowCount ?? 0,
        horizontalCount: this.vtableInstance!.colCount ?? 0,
      });
    });

    this.vtableInstance.on('scroll', (event) => {
      const scrollLeft = this.vtableInstance!.getScrollLeft();
      const scrollTop = this.vtableInstance!.getScrollTop();

      this.onScroll({
        translateX: scrollLeft,
        translateY: scrollTop,
        scale: this.currentScale,
      });

      // Check if scrolled to bottom
      const allRowsHeight = this.vtableInstance!.getAllRowsHeight();
      const isEnd = scrollTop + this.componentHeight >= allRowsHeight - 1;
      this.onScrollEnd({ isEnd });
    });
  }

  /**
   * Report total content dimensions to RN.
   */
  private reportContentSize(): void {
    if (!this.vtableInstance) return;
    try {
      const width = this.vtableInstance.getAllColsWidth();
      const height = this.vtableInstance.getAllRowsHeight();
      this.onContentSize({ width, height });
    } catch (e) {
      // ignore
    }
  }

  /**
   * Update VTable when props change.
   */
  private updateVTableData(): void {
    if (!this.vtableInstance) return;

    try {
      const parsedRecords = JSON.parse(this.records);
      const parsedColumns = JSON.parse(this.columns);
      const parsedTheme = JSON.parse(this.theme);

      this.vtableInstance.updateColumns(parsedColumns);
      this.vtableInstance.setRecords(parsedRecords);
      this.vtableInstance.updateTheme(parsedTheme);

      // Update frozen columns
      if (this.frozenColCount >= 0) {
        this.vtableInstance.frozenColCount = this.frozenColCount;
        this.vtableInstance.renderWithRecreateCells();
      }

      this.reportContentSize();
    } catch (e) {
      console.error('[ReportTableComponent] updateVTableData failed:', JSON.stringify(e));
    }
  }

  // ---- Public methods for command handling ----

  scrollTo(lineX: number, lineY: number, offsetX: number, offsetY: number): void {
    if (!this.vtableInstance) return;

    if (lineX >= 0 && lineY >= 0) {
      this.vtableInstance.scrollToCell({ col: lineX, row: lineY });
    }
    if (offsetX !== 0) {
      const currentLeft = this.vtableInstance.getScrollLeft();
      this.vtableInstance.setScrollLeft(currentLeft + offsetX);
    }
    if (offsetY !== 0) {
      const currentTop = this.vtableInstance.getScrollTop();
      this.vtableInstance.setScrollTop(currentTop + offsetY);
    }
  }

  scrollToBottom(): void {
    if (!this.vtableInstance) return;
    const allRowsHeight = this.vtableInstance.getAllRowsHeight();
    const targetTop = Math.max(0, allRowsHeight - this.componentHeight);
    this.vtableInstance.setScrollTop(targetTop);
  }

  changeCellValues(startCol: number, startRow: number, values: string[][]): void {
    if (!this.vtableInstance) return;
    this.vtableInstance.changeCellValues(startCol, startRow, values);
    this.reportContentSize();
  }

  deleteRecords(indices: number[]): void {
    if (!this.vtableInstance) return;
    this.vtableInstance.deleteRecords(indices);
    this.reportContentSize();
  }

  addRecords(records: object[], index: number): void {
    if (!this.vtableInstance) return;
    this.vtableInstance.addRecords(records, index);
    this.reportContentSize();
  }

  build() {
    Stack() {
      XComponent({
        id: this.xComponentId,
        type: XComponentType.SURFACE,
      })
        .onLoad((context) => {
          this.initVTable(context as CanvasRenderingContext2D);
        })
        .width('100%')
        .height('100%')
    }
    .width('100%')
    .height('100%')
    .scale({ x: this.currentScale, y: this.currentScale })
    .gesture(
      GestureGroup(GestureMode.Exclusive,
        // Pinch-to-zoom gesture
        PinchGesture({ fingers: 2 })
          .onActionUpdate((event: GestureEvent) => {
            if (!this.disableZoom) {
              this.currentScale = Math.max(0.5, Math.min(3.0, event.scale));
            }
          })
          .onActionEnd(() => {
            // Emit scroll with current scale
            if (this.vtableInstance) {
              this.onScroll({
                translateX: this.vtableInstance.getScrollLeft(),
                translateY: this.vtableInstance.getScrollTop(),
                scale: this.currentScale,
              });
            }
          }),
        // Double-tap zoom toggle
        TapGesture({ count: 2 })
          .onAction(() => {
            if (!this.disableZoom && this.doubleClickZoom) {
              this.currentScale = this.currentScale === 1.0 ? 1.5 : 1.0;
              if (this.vtableInstance) {
                this.onScroll({
                  translateX: this.vtableInstance.getScrollLeft(),
                  translateY: this.vtableInstance.getScrollTop(),
                  scale: this.currentScale,
                });
              }
            }
          })
      )
    )
    .onAreaChange((oldArea, newArea) => {
      this.componentWidth = newArea.width as number;
      this.componentHeight = newArea.height as number;
      if (this.vtableInstance) {
        this.vtableInstance.setCanvasSize(this.componentWidth, this.componentHeight);
      }
    })
  }
}
