//
//  ReportTableHeaderView.m
//  
//
//  Created by ms on 2019/11/27.
//

#import "ReportTableHeaderView.h"
#import <React/RCTBridge.h>
#import <React/RCTRootView.h>


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


@implementation ReportTableHeaderView

+ (id)createWithBridge:(RCTBridge *)bridge {
    RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                    moduleName:@"ReportTableHeaderView"
                                              initialProperties:@{}];
    [rootView setSizeFlexibility:RCTRootViewSizeFlexibilityHeight];
    return rootView;
}

@end
