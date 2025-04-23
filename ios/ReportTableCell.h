//
//  ReportTableCell.h
//
//
//  Created by ms on 2019/11/22.
//

#import "UIKit/UIKit.h"
#import <ZMJGanttChart/ZMJGanttChart.h>

@class IconStyle;
@class ProgressStyle;
@class FloatIconStyle;
@class GradientStyle;
@interface ReportTableCell : ZMJCell

@property (nonatomic, strong) UILabel *label;

@property (nonatomic, assign) NSTextAlignment textAlignment;

@property (nonatomic, assign) BOOL isLocked;
@property (nonatomic, assign) BOOL isUnLocked;
@property (nonatomic, strong) IconStyle *icon;

@property (nonatomic, assign) BOOL isForbidden; // 覆盖禁用线

@property (nonatomic, strong) UIImageView *lockImageView;
@property (nonatomic, strong) UIImageView *customImageView;
@property (nonatomic, strong) UIImageView *floatImageView;
@property (nonatomic, strong) FloatIconStyle *floatIcon;

- (void)updateContentView:(NSInteger)textPaddingHorizontal;

- (void)drawLinePoint:(CGPoint)point WithLineColor: (UIColor *)color;
- (void)hiddenLineView;

- (void)drawBoxPoint:(CGPoint)point WithLineColor: (UIColor *)color;
- (void)hiddenBoxView;

- (void)textStyle:(NSInteger)paddingLeft WithPaddingRight: (NSInteger)paddingRight;

- (void)hiddenProgressView;
- (void)setupProgressView:(ProgressStyle *)style WithRowWidth:(CGFloat)width Height:(CGFloat)height;

- (void)hiddenGradientView;
- (void)setupGradientView:(GradientStyle *)style WithRowWidth:(CGFloat)width Height:(CGFloat)height;

@end
