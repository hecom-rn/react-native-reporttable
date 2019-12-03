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
    }
    return self;
}

- (void)scrollViewDidScroll:(UIScrollView *)scrollView {
    if (self.isUserScouce == true) {
        CGPoint offset = scrollView.contentOffset;
        offset.y = 0;
        self.contentOffset = offset;
    }
}
- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView {
    if (self.isEndeDrag != nil) {
        self.isEndeDrag(true);
    }
}
@end


@interface ReportTableHeaderView () <RCTRootViewDelegate>

@end


@implementation ReportTableHeaderView
{
  RCTRootView *_resizableRootView;
  UITextView *_currentSizeTextView;
  BOOL _sizeUpdated;
}

- (id)initWithBridge:(RCTBridge *)bridge {
    self = [super init];
    if (self) {
         _sizeUpdated = NO;

         _resizableRootView = [[RCTRootView alloc] initWithBridge:bridge
                                                       moduleName:@"ReportTableHeaderView"
                                                initialProperties:@{}];

         [_resizableRootView setSizeFlexibility:RCTRootViewSizeFlexibilityHeight];
         _resizableRootView.delegate = self;
         [self addSubview:_resizableRootView];
    }
    return self;
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
  if (!_sizeUpdated) {
    _sizeUpdated = TRUE;
  }
  rootView.frame = newFrame;
}

@end
