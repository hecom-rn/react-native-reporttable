/**
 * RNReportTablePackage.ets
 *
 * Package registration for the RNReportTable native component.
 * Follows the react-native-harmony TurboModule/Fabric pattern.
 */
import { RNPackage, TurboModulesFactory } from '@rnoh/react-native-openharmony/ts';
import type {
  DescriptorWrapperFactoryByDescriptorTypeCtx,
  DescriptorWrapperFactoryByDescriptorType,
} from '@rnoh/react-native-openharmony/ts';
import { RNReportTableViewManager } from './RNReportTableViewManager';

export class RNReportTablePackage extends RNPackage {
  createDescriptorWrapperFactoryByDescriptorType(
    ctx: DescriptorWrapperFactoryByDescriptorTypeCtx
  ): DescriptorWrapperFactoryByDescriptorType {
    return {};
  }

  createViewManagers(): Array<any> {
    return [new RNReportTableViewManager()];
  }

  createTurboModulesFactory(): TurboModulesFactory | null {
    return null;
  }
}
