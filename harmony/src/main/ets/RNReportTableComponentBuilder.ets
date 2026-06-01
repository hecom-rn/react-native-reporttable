/**
 * RNReportTableComponentBuilder.ets
 *
 * Builder that creates the ArkTS UI component from the Fabric descriptor.
 * This is the bridge between react-native-harmony's component system
 * and the actual ArkTS ReportTableComponent.
 */
import { ComponentBuilderContext } from '@rnoh/react-native-openharmony';
import { ReportTableComponent } from './ReportTableComponent';

@Builder
export function buildRNReportTableComponent(ctx: ComponentBuilderContext) {
  ReportTableComponent({
    ctx: ctx.rnComponentContext,
    tag: ctx.tag,
  })
}
