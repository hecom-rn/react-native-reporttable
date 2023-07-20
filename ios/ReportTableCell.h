//
//  ReportTableCell.h
//
//
//  Created by ms on 2019/11/22.
//

#import "UIKit/UIKit.h"
#import <ZMJGanttChart/ZMJGanttChart.h>

@class IconStyle;
@interface ReportTableCell : ZMJCell

@property (nonatomic, strong) UILabel *label;

@property (nonatomic, assign) NSInteger textPaddingHorizontal;
@property (nonatomic, assign) NSTextAlignment textAlignment;

@property (nonatomic, assign) BOOL isLocked;
@property (nonatomic, assign) BOOL isUnLocked;
@property (nonatomic, strong) IconStyle *icon;

@property (nonatomic, assign) BOOL isForbidden; // 覆盖禁用线
@property (nonatomic, strong) UIColor *lineColor;

@property (nonatomic, strong) UIImageView *lockImageView;
@property (nonatomic, strong) UIImageView *customImageView;

- (void)updateContentView:(NSInteger)textPaddingHorizontal;

@end
