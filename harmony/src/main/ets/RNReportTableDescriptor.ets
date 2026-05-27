/**
 * RNReportTableDescriptor.ets
 *
 * Descriptor for the RNReportTable component.
 * Describes the native props, events, and commands that the JS side can interact with.
 */
import { ViewDescriptorWrapper } from '@rnoh/react-native-openharmony/ts';

export class RNReportTableDescriptor extends ViewDescriptorWrapper {
  // Props received from JS
  get records(): string {
    return this.rawProps?.records ?? '[]';
  }

  get columns(): string {
    return this.rawProps?.columns ?? '[]';
  }

  get theme(): string {
    return this.rawProps?.theme ?? '{}';
  }

  get frozenColCount(): number {
    return this.rawProps?.frozenColCount ?? 0;
  }

  get frozenRowCount(): number {
    return this.rawProps?.frozenRowCount ?? 1;
  }

  get lineColor(): string {
    return this.rawProps?.lineColor ?? '#e8e8e8';
  }

  get disableZoom(): boolean {
    return this.rawProps?.disableZoom ?? false;
  }

  get showBorder(): boolean {
    return this.rawProps?.showBorder ?? false;
  }

  get permutable(): boolean {
    return this.rawProps?.permutable ?? false;
  }

  get frozenAbility(): string {
    return this.rawProps?.frozenAbility ?? '{}';
  }

  get ignoreLocks(): number[] {
    return this.rawProps?.ignoreLocks ?? [];
  }

  get doubleClickZoom(): boolean {
    return this.rawProps?.doubleClickZoom ?? true;
  }

  get itemConfig(): string {
    return this.rawProps?.itemConfig ?? '{}';
  }

  get progressStyle(): string {
    return this.rawProps?.progressStyle ?? '{}';
  }

  get replenishColumnsWidthConfig(): string {
    return this.rawProps?.replenishColumnsWidthConfig ?? '{}';
  }
}
