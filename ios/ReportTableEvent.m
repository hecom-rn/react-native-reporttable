//
//  ReportTableEvent.m
//  hecom-rn-reportTable
//
//  Created by ms on 2023/10/18.
//

#import "ReportTableEvent.h"

@implementation ReportTableEvent
RCT_EXPORT_MODULE()

static id _instace;
+ (instancetype)allocWithZone:(struct _NSZone *)zone {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        _instace = [super allocWithZone:zone];
    });
    return _instace;
}

- (void)tableDidLayout {
    [self sendEventWithName:@"tableDidLayout" body: @{}];
}

// 注册事件名称
- (NSArray<NSString *> *)supportedEvents
{
    return @[@"tableDidLayout"];
}

@end
