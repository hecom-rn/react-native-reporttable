//
//  RCTReportTableComponentView.h
//
//  Fabric (New Architecture) component view for ReportTable.
//  Replaces ReportTableManager + ReportTableViewModel when RCT_NEW_ARCH_ENABLED is set.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTReportTableComponentView : RCTViewComponentView

@end

NS_ASSUME_NONNULL_END

#endif // RCT_NEW_ARCH_ENABLED
