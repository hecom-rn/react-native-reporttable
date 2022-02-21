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

// 表格滑动到顶部
- (void)scrollToTop;

@end


