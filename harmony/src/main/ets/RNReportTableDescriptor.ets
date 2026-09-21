/**
 * RNReportTableDescriptor.ets
 *
 * Descriptor wrapper for RNReportTable. Used by RNReportTablePackage to register
 * the component with RNOH's descriptor factory. Props are read directly from
 * rawProps in ReportTableComponent via subscribeToDescriptorChanges.
 */
import { ViewDescriptorWrapper } from '@rnoh/react-native-openharmony/ts';

export class RNReportTableDescriptor extends ViewDescriptorWrapper {
}
