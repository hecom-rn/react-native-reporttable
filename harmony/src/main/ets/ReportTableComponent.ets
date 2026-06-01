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
      const frozenColCountVal: Object | undefined = rawProps['frozenColCount'];

      const recordsStr: string = (recordsVal !== undefined) ? (recordsVal as string) : '[]';
      const columnsStr: string = (columnsVal !== undefined) ? (columnsVal as string) : '[]';
      const themeStr: string = (themeVal !== undefined) ? (themeVal as string) : '{}';
      const frozenColCount: number = (frozenColCountVal !== undefined) ? (frozenColCountVal as number) : 0;

      const optionStr: string = '{"records":' + recordsStr + ',"columns":' + columnsStr +
        ',"theme":' + themeStr + ',"frozenColCount":' + frozenColCount.toString() +
        ',"autoWrapText":false,"widthMode":"standard","heightMode":"standard"}';
      const newOption: Record<string, Object> = JSON.parse(optionStr) as Record<string, Object>;
      this.option = newOption;
      this.controller.updateOption(newOption);
    } catch (e) {
      console.error('[ReportTableComponent] updateVTable failed');
    }
  }

  private handleCommand(commandName: string, args: Object[]): void {
    if (commandName === 'scrollTo' && args.length >= 2) {
      // args: [lineX, lineY, offsetX, offsetY, animated]
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

  private getOnEvent(): VTableOnEvent {
    const tagVal: number = this.tag;
    const ctxRef: RNOHContext = this.ctx;
    const onEvent: VTableOnEvent = {
      onClickCell: (event: CellClickData): void => {
        const payloadStr: string = '{"keyIndex":0,"rowIndex":' + event.row.toString() +
          ',"columnIndex":' + event.col.toString() + '}';
        ctxRef.rnInstance.emitComponentEvent(tagVal, 'clickEvent', JSON.parse(payloadStr) as Object);
      },
      onScroll: (event: ScrollEventData): void => {
        const payloadStr: string = '{"translateX":' + event.scrollLeft.toString() +
          ',"translateY":' + event.scrollTop.toString() +
          ',"scrollHeight":' + event.scrollHeight.toString() +
          ',"scrollWidth":' + event.scrollWidth.toString() + '}';
        ctxRef.rnInstance.emitComponentEvent(tagVal, 'scroll', JSON.parse(payloadStr) as Object);
      },
      onScrollVerticalEnd: (event: ScrollEventData): void => {
        const payloadStr: string = '{"isEnd":true,"scrollTop":' + event.scrollTop.toString() + '}';
        ctxRef.rnInstance.emitComponentEvent(tagVal, 'scrollEnd', JSON.parse(payloadStr) as Object);
      },
      onInitialized: (): void => {
        ctxRef.rnInstance.emitComponentEvent(tagVal, 'contentSize', JSON.parse('{"width":0,"height":0}') as Object);
      },
    };
    return onEvent;
  }

  build() {
    Column() {
      VTable({
        controller: this.controller,
        option: this.option,
        onEvent: this.getOnEvent(),
      })
    }
    .width('100%')
    .height('100%')
  }
}
