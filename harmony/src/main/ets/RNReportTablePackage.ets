/**
 * RNReportTablePackage.ets
 *
 * Package registration for the RNReportTable native component.
 */
import { ComponentBuilderContext, RNOHPackage } from '@rnoh/react-native-openharmony';
import type {
  DescriptorWrapperFactoryByDescriptorType,
  DescriptorWrapperFactoryByDescriptorTypeCtx,
} from '@rnoh/react-native-openharmony/ts';
import { buildRNReportTableComponent } from './RNReportTableComponentBuilder';
import { ReportTableComponent } from './ReportTableComponent';
import { RNReportTableDescriptor } from './RNReportTableDescriptor';

export class RNReportTablePackage extends RNOHPackage {
  createDescriptorWrapperFactoryByDescriptorType(
    _ctx: DescriptorWrapperFactoryByDescriptorTypeCtx
  ): DescriptorWrapperFactoryByDescriptorType {
    return {
      "RNReportTable": (ctx) => new RNReportTableDescriptor(ctx.descriptor),
    };
  }

  // RNOH 0.72+ uses WrappedBuilder-based registration. The @Builder
  // function must be wrapped via wrapBuilder and exposed under the same
  // component name used by the descriptor (ReportTableComponent.NAME
  // === 'RNReportTable'). Without this, RNOH never instantiates the
  // component and the legacy RNReportTableViewManager.createView path
  // is also no longer invoked.
  createWrappedCustomRNComponentBuilderByComponentNameMap(): Map<string, WrappedBuilder<[ComponentBuilderContext]>> {
    return new Map().set(
      ReportTableComponent.NAME,
      wrapBuilder(buildRNReportTableComponent)
    );
  }
}
