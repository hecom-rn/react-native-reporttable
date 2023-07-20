//
//  ReportTableViewModel.h
//
//
//  Created by ms on 2019/11/22.
//

#import <Foundation/Foundation.h>
#import <React/RCTView.h>
#import <React/RCTBridgeModule.h>

@interface ReportTableViewModel: RCTView

- (id)initWithBridge:(RCTBridge *)bridge;

- (void)scrollToLineX:(NSInteger)lineX lineY:(NSInteger)lineY offsetX:(float)offsetX offsetY:(float)offsetY animated:(BOOL)animated;

@end


