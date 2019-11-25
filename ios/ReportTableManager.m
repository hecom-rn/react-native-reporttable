//
//  ReportTableViewContorller.m
//
//
//  Created by ms on 2019/11/21.
//

#import "ReportTableManager.h"
#import <Foundation/Foundation.h>
#import "ReportTableView.h"
#import "ReportTableViewModel.h"
#import <React/RCTComponent.h>

@interface ReportTableManager()

@end

@implementation ReportTableManager

RCT_EXPORT_VIEW_PROPERTY(onClickEvent, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(data, NSArray)
RCT_EXPORT_VIEW_PROPERTY(minWidth, float)
RCT_EXPORT_VIEW_PROPERTY(maxWidth, float)
RCT_EXPORT_VIEW_PROPERTY(minHeight, float)
RCT_EXPORT_VIEW_PROPERTY(frozenColumns, int)
RCT_EXPORT_VIEW_PROPERTY(frozenRows, int)

RCT_EXPORT_MODULE(ReportTableManager)

- (UIView *)view
{
    return [[ReportTableViewModel alloc] init];
}


@end
