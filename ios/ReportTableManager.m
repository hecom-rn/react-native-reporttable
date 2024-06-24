//
//  ReportTableViewContorller.m
//
//
//  Created by ms on 2019/11/21.
//

#import "ReportTableManager.h"
#import <Foundation/Foundation.h>
#import "ReportTableViewModel.h"
#import <React/RCTComponent.h>
#import <React/RCTUIManager.h>

@interface ReportTableManager()

@end

@implementation ReportTableManager

RCT_EXPORT_VIEW_PROPERTY(size, CGSize)
RCT_EXPORT_VIEW_PROPERTY(headerViewSize, CGSize)
RCT_EXPORT_VIEW_PROPERTY(onClickEvent, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onScrollEnd, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onScroll, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onContentSize, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(data, NSArray)
RCT_EXPORT_VIEW_PROPERTY(minWidth, float)
RCT_EXPORT_VIEW_PROPERTY(maxWidth, float)
RCT_EXPORT_VIEW_PROPERTY(minHeight, float)
RCT_EXPORT_VIEW_PROPERTY(frozenColumns, int)
RCT_EXPORT_VIEW_PROPERTY(frozenRows, int)
RCT_EXPORT_VIEW_PROPERTY(lineColor, NSString)
RCT_EXPORT_VIEW_PROPERTY(itemConfig, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(columnsWidthMap, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(frozenCount, int)
RCT_EXPORT_VIEW_PROPERTY(frozenPoint, int)
RCT_EXPORT_VIEW_PROPERTY(permutable, BOOL)
RCT_EXPORT_VIEW_PROPERTY(disableZoom, BOOL)
RCT_EXPORT_VIEW_PROPERTY(showBorder, BOOL)

RCT_EXPORT_MODULE(ReportTableManager)

RCT_EXPORT_METHOD(scrollTo:(nonnull NSNumber*)reactTag lineX:(NSInteger)lineX lineY:(NSInteger)lineY offsetX :(float)offsetX offsetY :(float)offsetY animated:(BOOL)animated) {
    [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        ReportTableViewModel *view = viewRegistry[reactTag];
        if (!view || ![view isKindOfClass:[ReportTableViewModel class]]) {
            RCTLogError(@"Cannot find NativeView with tag #%@", reactTag);
            return;
        }
        [view scrollToLineX: lineX lineY: lineY offsetX: offsetX offsetY: offsetY animated: animated];
    }];
}

RCT_EXPORT_METHOD(updateData:(nonnull NSNumber*)reactTag data:(NSArray *)data withY:(NSInteger)y withX:(NSInteger)x) {
    [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        ReportTableViewModel *view = viewRegistry[reactTag];
        if (!view || ![view isKindOfClass:[ReportTableViewModel class]]) {
            RCTLogError(@"Cannot find NativeView with tag #%@", reactTag);
            return;
        }
        [view updateDataSource:data withY:y withX:x];
    }];
}

RCT_EXPORT_METHOD(scrollToBottom:(nonnull NSNumber*)reactTag) {
    [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        ReportTableViewModel *view = viewRegistry[reactTag];
        if (!view || ![view isKindOfClass:[ReportTableViewModel class]]) {
            RCTLogError(@"Cannot find NativeView with tag #%@", reactTag);
            return;
        }
        [view scrollToBottom];
    }];
}

- (UIView *)view
{
    return [[ReportTableViewModel alloc] initWithBridge: self.bridge];
}


@end
