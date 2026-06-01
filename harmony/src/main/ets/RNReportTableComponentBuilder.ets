/**
 * RNReportTableComponentBuilder.ets
 *
 * Builder that creates the ArkTS UI component from the Fabric descriptor.
 * This is the bridge between react-native-harmony's component system
 * and the actual ArkTS ReportTableComponent.
 */
import { ComponentBuilderContext } from '@rnoh/react-native-openharmony/ts';
import { ReportTableComponent, ReportTableVTableController } from './ReportTableComponent';

/**
 * Wrapper component that owns the @State controller so that
 * ReportTableComponent's @ObjectLink controller is satisfied.
 */
@Component
struct RNReportTableComponentWrapper {
  ctx!: ComponentBuilderContext;
  @State controller: ReportTableVTableController = new ReportTableVTableController();

  build() {
    ReportTableComponent({
      ctx: this.ctx.rnComponentContext,
      tag: this.ctx.tag,
      controller: this.controller,
    })
  }
}

@Builder
export function buildRNReportTableComponent(ctx: ComponentBuilderContext) {
  RNReportTableComponentWrapper({ ctx: ctx })
}
