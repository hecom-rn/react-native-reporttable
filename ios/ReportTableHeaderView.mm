//
//  ReportTableHeaderView.m
//  
//
//  Created by ms on 2019/11/27.
//

#import "ReportTableHeaderView.h"
#import <React/RCTBridge.h>
#import <React/RCTRootView.h>
#import <React/RCTRootViewDelegate.h>
#import <React/RCTViewManager.h>


@interface ReportTableHeaderScrollView () <UIScrollViewDelegate>
@end
@implementation ReportTableHeaderScrollView

- (instancetype)init
{
    self = [super init];
    if (self) {
        self.delegate = self;
        self.bounces = false;
        self.scrollsToTop = false;
        self.offset = 0;
    }
    return self;
}

- (void)scrollViewDidScroll:(UIScrollView *)scrollView {
    if (self.isUserScouce == true) {
        CGPoint offset = scrollView.contentOffset;
        offset.y = self.frame.size.height + self.offset;
        self.contentOffset = offset;
    }
}

@end


@interface ReportTableHeaderView () <RCTRootViewDelegate>

@end


@implementation ReportTableHeaderView
{
  RCTRootView *_resizableRootView;
}

- (id)initWithBridge:(RCTBridge *)bridge {

    _resizableRootView = [[RCTRootView alloc] initWithBridge:bridge
                                                moduleName:@"ReportTableHeaderView"
                                            initialProperties:@{}];
    [_resizableRootView setSizeFlexibility:RCTRootViewSizeFlexibilityHeight];
    _resizableRootView.delegate = self;
    return _resizableRootView;
}

- (NSArray<UIView<RCTComponent> *> *)reactSubviews
{
  // this is to avoid unregistering our RCTRootView when the component is removed from RN hierarchy
  (void)[super reactSubviews];
  return @[];
}

#pragma mark - RCTRootViewDelegate

- (void)rootViewDidChangeIntrinsicSize:(RCTRootView *)rootView
{
  CGRect newFrame = rootView.frame;
  newFrame.size = rootView.intrinsicContentSize;
  rootView.frame = newFrame;
}

@end
