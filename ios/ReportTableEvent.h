//
//  ReportTableEvent.h
//  hecom-rn-reportTable
//
//  Created by ms on 2023/10/18.
//

#import "React/RCTEventEmitter.h"
#import "React/RCTBridgeModule.h"

@interface ReportTableEvent : RCTEventEmitter<RCTBridgeModule>

+ (void)tableDidLayout;

@end

