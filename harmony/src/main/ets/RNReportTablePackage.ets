/**
 * RNReportTablePackage.ets
 *
 * Package registration for the RNReportTable native component.
 */
import { RNOHPackage } from '@rnoh/react-native-openharmony';
import type {
  DescriptorWrapperFactoryByDescriptorType,
  DescriptorWrapperFactoryByDescriptorTypeCtx,
} from '@rnoh/react-native-openharmony/ts';
import { RNReportTableDescriptor } from './RNReportTableDescriptor';

export class RNReportTablePackage extends RNOHPackage {
  createDescriptorWrapperFactoryByDescriptorType(
    _ctx: DescriptorWrapperFactoryByDescriptorTypeCtx
  ): DescriptorWrapperFactoryByDescriptorType {
    return {
      "RNReportTable": (ctx) => new RNReportTableDescriptor(ctx.descriptor),
    };
  }
}
