import { CellChangeEvent, CellClickData, CellSelectionData, ScrollEventData } from "."

export interface VTableOnEvent {
  onInitialized?: () => void
  onUpdated?: () => void
  onClickCell?: (event: CellClickData) => void
  onDBClickCell?: (event: CellClickData) => void
  onSelectedCell?: (event: CellSelectionData) => void
  onSelectedClear?: () => void
  onScroll?: (event: ScrollEventData) => void
  onScrollHorizontalEnd?: (event: ScrollEventData) => void
  onScrollVerticalEnd?: (options: ScrollEventData) => void
  onChangeCellValue?: (event: CellChangeEvent) => void
}