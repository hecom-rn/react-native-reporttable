//
//  ReportTableEvent.m
//  hecom-rn-reportTable
//
//  Created by ms on 2023/10/18.
//

#import "ReportTableEvent.h"

@implementation ReportTableEvent {
    bool hasListeners;
  }

RCT_EXPORT_MODULE()

// 在添加第一个监听函数时触发
- (void)startObserving
{
  hasListeners = YES;
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(tableDidLayout)
                                               name:@"event-emitted-tableDidLayout"
                                             object:nil];
}

- (void)stopObserving
{
  hasListeners = NO;
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}


+ (void)tableDidLayout
{
  [[NSNotificationCenter defaultCenter] postNotificationName:@"event-emitted-tableDidLayout"
                                                      object:self
                                                    userInfo:nil];
}

- (void)tableDidLayout {
    if (hasListeners) {
        [self sendEventWithName:@"tableDidLayout" body: @{}];
    }
}

// 注册事件名称
- (NSArray<NSString *> *)supportedEvents
{
    return @[@"tableDidLayout"];
}

@end
