import { webview } from "@kit.ArkWeb";
import { CellChangeEvent, CellClickData, CellSelectionData, ScrollEventData, VTableOnEvent } from "../interface";

export class VTableController {
  private controller?: webview.WebviewController;
  tableOnEvent: VTableOnEvent = {}
  private isInitialized = false;

  constructor(controller?: webview.WebviewController) {
    this.controller = controller;
  }

  // 初始化控制器
  initController(webviewController: webview.WebviewController) {
    this.controller = webviewController;
  }

  private checkInitialized(): boolean {
    if (!this.controller) {
      console.warn("Webview controller not initialized. Operation will be ignored.");
      return false;
    }
    return true;
  }

  emitCallback(msg?: string) {
    if (!this.checkInitialized() && msg == undefined) {
      return;
    }
    let event = JSON.parse(JSON.parse(msg!)) as Record<string, Object>;
    switch (event["type"]) {
      case "INITIALIZED":
        this.tableOnEvent.onInitialized?.();
        this.isInitialized = true;
        break;
      case "UPDATED":
        this.isInitialized && this.tableOnEvent.onUpdated?.();
        break;
      case "CLICK_CELL":
        if (this.isInitialized) {
          const data = JSON.parse(event["data"] as string) as CellClickData;
          this.tableOnEvent.onClickCell?.(data);
        }
        break;
      case "DBLCLICK_CELL":
        if (this.isInitialized) {
          const data = JSON.parse(event["data"] as string) as CellClickData;
          this.tableOnEvent.onDBClickCell?.(data);
        }
        break;
      case "SELECTED_CHANGED":
        if (this.isInitialized) {
          const data = JSON.parse(event["data"] as string) as CellSelectionData;
          this.tableOnEvent.onSelectedCell?.(data);
        }
        break;
      case "SCROLL":
        if (this.isInitialized) {
          const data = JSON.parse(event["data"] as string) as ScrollEventData;
          this.tableOnEvent.onScroll?.(data);
        }
        break;
      case "CHANGE_CELL_VALUE":
        if (this.isInitialized) {
          const data = JSON.parse(event["data"] as string) as CellChangeEvent;
          this.tableOnEvent.onChangeCellValue?.(data);
        }
        break;
      case "SELECTED_CLEAR":
        if (this.isInitialized) {
          this.tableOnEvent.onSelectedClear?.();
        }
        break;
      case "SCROLL_VERTICAL_END":
        if (this.isInitialized) {
          const data = JSON.parse(event["data"] as string) as ScrollEventData;
          this.tableOnEvent.onScrollVerticalEnd?.(data);
        }
        break;
      case "SCROLL_HORIZONTAL_END":
        if (this.isInitialized) {
          const data = JSON.parse(event["data"] as string) as ScrollEventData;
          this.tableOnEvent.onScrollHorizontalEnd?.(data);
        }
        break;
    }
  }

  // 初始化表格参数
  initTable(option: Record<string, Object | Record<string, Object>>) {
    console.log(`==========>option['resize']:`, JSON.stringify(option['resize']))
    if (!this.checkInitialized()) {
      return;
    }
    this.controller!.runJavaScript(`initializeTable(${JSON.stringify(option)})`)
      .catch((error: Error) => {
        console.error("Error initializing table:", error);
      })
  }

  // 冻结至列
  frozenToCol(index: number) {
    if (!this.checkInitialized()) {
      return;
    }
    this.controller!.runJavaScript(`frozenToCol(${index})`)
      .catch((error: Error) => {
        console.error("Error frozenToCol:", error);
      })
  }

  // 冻结至行
  frozenRow(index: number) {
    if (!this.checkInitialized()) {
      return;
    }
    this.controller!.runJavaScript(`frozenRow(${index})`)
      .catch((error: Error) => {
        console.error("Error frozenRow:", error);
      })
  }

  // 合并单元格
  mergeCell(startCol: number, startRow: number, endCol: number, endRow: number) {
    if (!this.checkInitialized()) {
      return;
    }
    this.controller!.runJavaScript(`mergeCell(${startCol},${startRow},${endCol},${endRow})`)
      .catch((error: Error) => {
        console.error("Error mergeCell:", error);
      })
  }

  // 取消合并单元格
  unmergeCells(startCol: number, startRow: number, endCol: number, endRow: number) {
    if (!this.checkInitialized()) {
      return;
    }
    this.controller!.runJavaScript(`unmergeCells(${startCol},${startRow},${endCol},${endRow})`)
      .catch((error: Error) => {
        console.error("Error mergeCell:", error);
      })
  }

  // 自定义渲染
  customRender(startCol: number, startRow: number, endCol: number, endRow: number, id: string = 'default',
    style?: Record<string, Object>) {
    if (!this.checkInitialized()) {
      return;
    }
    const deStyle: Record<string, Object> = {
      "borderColor": "red",
      "borderLineWidth": 4,
      "fontSize": 20,
      "bgColor": "yellow",
    }
    const deStyleStr = JSON.stringify(deStyle)
    const styleStr = JSON.stringify(style)
    this.controller!.runJavaScript(`customRender(${startCol},${startRow},${endCol},${endRow},'${id}',${styleStr})`)
      .catch((error: Error) => {
        console.error("Error customRender:", error);
      })
    this.renderWithRecreateCells()
  }

  // 取消自定义渲染
  cancelCustomRender(startCol: number, startRow: number, endCol: number, endRow: number) {
    if (!this.checkInitialized()) {
      return;
    }
    this.controller!.runJavaScript(`customRenderRestore(${startCol},${startRow},${endCol},${endRow})`)
      .catch((error: Error) => {
        console.error("Error cancelCustomRender:", error);
      })
  }

  // 滚动至行
  scrollToRow(rowIndex: number) {
    if (!this.checkInitialized()) {
      return;
    }
    this.controller!.runJavaScript(`scrollToRow(${rowIndex})`)
      .catch((error: Error) => {
        console.error("Error scrollToRow:", error);
      })
  }

  // 滚动至列
  scrollToCol(colIndex: number) {
    if (!this.checkInitialized()) {
      return;
    }
    this.controller!.runJavaScript(`scrollToCol(${colIndex})`)
      .catch((error: Error) => {
        console.error("Error scrollToCol:", error);
      })
  }

  // 滚动至行列
  scrollToRowCol(cellAddr: Record<string, number>) {
    if (!this.checkInitialized()) {
      return;
    }
    this.controller!.runJavaScript(`scrollToRowCol(${JSON.stringify(cellAddr)})`)
      .catch((error: Error) => {
        console.error("Error scrollToRowCol:", error);
      })
  }

  // 设置行高
  setRowHeight(rowIndex: number, height: number) {
    if (!this.checkInitialized()) {
      return;
    }
    this.controller!.runJavaScript(`setRowHeight(${rowIndex},${height})`)
      .catch((error: Error) => {
        console.error("Error setRowHeight:", error);
      })
  }

  // 设置列宽
  setColWidth(colIndex: number, width: number) {
    if (!this.checkInitialized()) {
      return;
    }
    this.controller!.runJavaScript(`setColWidth(${colIndex},${width})`)
      .catch((error: Error) => {
        console.error("Error setColWidth:", error);
      })
  }

  // 更新列参数
  updateColumns(newColumns: Array<Record<string, Object>>) {
    if (!this.checkInitialized()) {
      return;
    }
    this.controller!.runJavaScript(`updateColumns(${JSON.stringify(newColumns)})`)
      .catch((error: Error) => {
        console.error("Error updateColumns:", error);
      })
  }

  // 修改分割线颜色
  setSplitLineColor(color: string[]) {
    if (!this.checkInitialized()) {
      return;
    }
    this.controller!.runJavaScript(`setSplitLineColor(${JSON.stringify(color)})`)
      .catch((error: Error) => {
        console.error("Error setSplitLineColor:", error);
      })
  }

  // 更新表格参数
  updateOption(option: Record<string, Object | Record<string, Object>>) {
    if (!this.checkInitialized()) {
      return;
    }
    this.controller!.runJavaScript(`updateOption(${JSON.stringify(option)})`)
      .catch((error: Error) => {
        console.error("Error updateOption:", error);
      })
  }

  setDiagonal(startCol: number, startRow: number, endCol: number, endRow: number) {
    if (!this.checkInitialized()) {
      return;
    }
    this.controller!.runJavaScript(`setDiagonal(${startCol},${startRow},${endCol},${endRow})`)
      .catch((error: Error) => {
        console.error("Error setDiagonal:", error);
      })
  }

  deleteDiagonal(startCol: number, startRow: number, endCol: number, endRow: number) {
    if (!this.checkInitialized()) {
      return;
    }
    this.controller!.runJavaScript(`deleteDiagonal(${startCol},${startRow},${endCol},${endRow})`)
      .catch((error: Error) => {
        console.error("Error deleteDiagonal:", error);
      })
  }

  renderWithRecreateCells() {
    if (!this.checkInitialized()) {
      return;
    }
    this.controller!.runJavaScript(`renderWithRecreateCells()`)
      .catch((error: Error) => {
        console.error("Error renderWithRecreateCells:", error);
      })
  }

  setZoom(isMagnify: boolean) {
    if (!this.checkInitialized()) {
      return;
    }
    try {
      if (isMagnify) {
        this.controller?.runJavaScript(`zoomIn()`)
        console.log("=====> setPixelRatio")
      } else {
        this.controller?.runJavaScript(`zoomOut()`)
      }
    } catch (error) {
      console.error("Error setZoom:", error);
    }
  }


  release() {
    if (!this.checkInitialized()) {
      return;
    }
    this.controller!.runJavaScript(`release()`)
      .catch((error: Error) => {
        console.error("Error release:", error);
      })
  }
}