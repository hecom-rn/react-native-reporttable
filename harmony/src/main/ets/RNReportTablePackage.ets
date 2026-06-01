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
import { RN_REPORT_TABLE_NAME } from './ReportTableComponent';

export class RNReportTablePackage extends RNOHPackage {
  createDescriptorWrapperFactoryByDescriptorType(
    _ctx: DescriptorWrapperFactoryByDescriptorTypeCtx
  ): DescriptorWrapperFactoryByDescriptorType {
    return {
      [RN_REPORT_TABLE_NAME]: (ctx) => new RNReportTableDescriptor(ctx.descriptor),
    };
  }
}
