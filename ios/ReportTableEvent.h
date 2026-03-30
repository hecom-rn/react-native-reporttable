//
//  ReportTableEvent.h
//  hecom-rn-reportTable
//
//  Created by ms on 2023/10/18.
//

#import <React/RCTEventEmitter.h>
#import <React/RCTBridgeModule.h>

/// Global event emitter that works in both Old Architecture and New Architecture
/// (via the Fabric/TurboModule interop bridge).
@interface ReportTableEvent : RCTEventEmitter <RCTBridgeModule>

/// Post the tableDidLayout notification from any thread.
+ (void)tableDidLayout;

@end

