/**
 * RNReportTableComponentBuilder.ets
 *
 * Builder that creates the ArkTS UI component from the Fabric descriptor.
 * This is the bridge between react-native-harmony's component system
 * and the actual ArkTS ReportTableComponent.
 */
import { ComponentBuilderContext, RNComponentContext } from '@rnoh/react-native-openharmony/ts';
import { ReportTableComponent } from './ReportTableComponent';

@Builder
export function buildRNReportTableComponent(ctx: ComponentBuilderContext) {
  ReportTableComponent({
    records: ctx.descriptor.rawProps?.records ?? '[]',
    columns: ctx.descriptor.rawProps?.columns ?? '[]',
    theme: ctx.descriptor.rawProps?.theme ?? '{}',
    frozenColCount: ctx.descriptor.rawProps?.frozenColCount ?? 0,
    frozenRowCount: ctx.descriptor.rawProps?.frozenRowCount ?? 1,
    lineColor: ctx.descriptor.rawProps?.lineColor ?? '#e8e8e8',
    disableZoom: ctx.descriptor.rawProps?.disableZoom ?? false,
    showBorder: ctx.descriptor.rawProps?.showBorder ?? false,
    doubleClickZoom: ctx.descriptor.rawProps?.doubleClickZoom ?? true,
    itemConfig: ctx.descriptor.rawProps?.itemConfig ?? '{}',
    progressStyle: ctx.descriptor.rawProps?.progressStyle ?? '{}',
  })
}
