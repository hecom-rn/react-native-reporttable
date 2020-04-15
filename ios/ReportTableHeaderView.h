//
//  ReportTableHeaderView.h
//  
//
//  Created by ms on 2019/11/27.
//

#import <React/RCTView.h>
#import <React/RCTBridgeModule.h>

@interface ReportTableHeaderView: RCTView
- (id)initWithBridge:(RCTBridge *)bridge;
@end



typedef void (^EndDrag)(BOOL isEndeDrag);
@interface ReportTableHeaderScrollView: UIScrollView
@property (nonatomic, copy) EndDrag isEndeDrag;
@property (nonatomic, assign) BOOL isUserScouce;
@property (nonatomic, assign) CGFloat offset;

@end



