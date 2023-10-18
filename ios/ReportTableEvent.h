//
//  ReportTableEvent.h
//  hecom-rn-reportTable
//
//  Created by ms on 2023/10/18.
//

#import "React/RCTEventEmitter.h"
#import "React/RCTBridgeModule.h"

NS_ASSUME_NONNULL_BEGIN

@interface ReportTableEvent : RCTEventEmitter<RCTBridgeModule>

- (void)tableDidLayout;

@end

NS_ASSUME_NONNULL_END
