//
//  ReportTableModel.h
//
//
//  Created by ms on 2019/11/22.
//

#import <Foundation/Foundation.h>
#import <React/RCTComponent.h>

@interface AntsLineStyle: NSObject
@property (nonatomic, strong) NSArray *lineDashPattern;
@property (nonatomic, assign) CGFloat lineWidth;
@property (nonatomic, strong) UIColor *color;
@property (nonatomic, assign) CGFloat lineRatio;
@end

@interface ProgressStyle: NSObject
@property (nonatomic, strong) NSArray *colors;
@property (nonatomic, assign) CGFloat height;
@property (nonatomic, assign) CGFloat marginHorizontal;
@property (nonatomic, assign) CGFloat startRatio;
@property (nonatomic, assign) CGFloat endRatio;
@property (nonatomic, assign) CGFloat cornerRadius;
@property (nonatomic, strong) AntsLineStyle *antsLineStyle;
@end


@interface IconStyle: NSObject
@property (nonatomic, strong) id path;
@property (nonatomic, assign) CGSize size;
@property (nonatomic, assign) NSInteger imageAlignment; // 1左  2中  3右(默认)
@property (nonatomic, assign) CGFloat paddingHorizontal;
@end

@interface GradientStyle: NSObject
@property (nonatomic, strong) NSArray *colors;
@property (nonatomic, assign) CGPoint startPoint;
@property (nonatomic, assign) CGPoint endPoint;
@end


@interface FloatIconStyle: NSObject
@property (nonatomic, strong) id path;
@property (nonatomic, assign) CGSize size;
@property (nonatomic, assign) CGFloat top;
@property (nonatomic, assign) CGFloat left;
@property (nonatomic, assign) CGFloat right;
@property (nonatomic, assign) CGFloat bottom;
@end


@interface ExtraTextBackGroundStyle: NSObject
@property (nonatomic, strong) UIColor *color;
@property (nonatomic, assign) CGFloat width;
@property (nonatomic, assign) CGFloat height;
@property (nonatomic, assign) CGFloat radius;
@end

@interface ExtraTextStyle: NSObject
@property (nonatomic, strong) UIColor *color;
@property (nonatomic, assign) CGFloat fontSize;
@end

@interface ExtraText: NSObject
@property (nonatomic, strong) NSString *text;
@property (nonatomic, strong) ExtraTextBackGroundStyle *backgroundStyle;
@property (nonatomic, strong) ExtraTextStyle *style;
@property (nonatomic, assign) BOOL isLeft;
@end


@interface TextBoderModel: NSObject
@property (nonatomic, strong) UIColor *borderColor;
@property (nonatomic, assign) CGFloat borderRadius;
@property (nonatomic, assign) CGFloat borderWidth;
@property (nonatomic, assign) CGFloat paddingVer;
@property (nonatomic, assign) CGFloat paddingHor;
@property (nonatomic, strong) UIColor *backgroundColor;
@property (nonatomic, assign) BOOL isOverstriking;
@property (nonatomic, strong) NSString *text;
@property (nonatomic, strong) UIFont *font;
@property (nonatomic, strong) UIColor *textColor;
@property (nonatomic, assign) CGFloat textWitdh;
@end


typedef NS_OPTIONS(NSUInteger, ClassificationLinePosition) {
    ClassificationLinePositionNone = 0,
    ClassificationLinePositionTop = 1 << 0,
    ClassificationLinePositionRight = 1 << 1,
    ClassificationLinePositionBottom = 1 << 2,
    ClassificationLinePositionLeft = 1 << 3
};


@interface ItemModel: NSObject
@property (nonatomic, strong) NSString *title;
@property (nonatomic, strong) NSAttributedString *richText;
@property (nonatomic, assign) NSInteger keyIndex;
@property (nonatomic, strong) UIColor *backgroundColor;
@property (nonatomic, strong) UIColor *textColor;
@property (nonatomic, assign) BOOL isOverstriking;
@property (nonatomic, strong) UIColor *classificationLineColor;
@property (nonatomic, assign) BOOL used;
@property (nonatomic, assign) BOOL isForbidden;
@property (nonatomic, strong) UIColor *boxLineColor;
@property (nonatomic, assign) CGFloat fontSize;
@property (nonatomic, assign) NSTextAlignment textAlignment;
@property (nonatomic, assign) NSInteger textPaddingHorizontal;
@property (nonatomic, assign) NSInteger textPaddingLeft;
@property (nonatomic, assign) NSInteger textPaddingRight;
@property (nonatomic, assign) NSInteger horCount;
@property (nonatomic, assign) ClassificationLinePosition classificationLinePosition;
@property (nonatomic, assign) NSInteger verCount;
@property (nonatomic, strong) IconStyle *iconStyle;
@property (nonatomic, strong) FloatIconStyle *floatIcon;
@property (nonatomic, strong) ItemModel *itemConfig;
@property (nonatomic, strong) ExtraText *extraText;
@property (nonatomic, strong) ProgressStyle *progressStyle;
@property (nonatomic, strong) GradientStyle *gradientStyle;
@property (nonatomic, assign) NSInteger columIndex;
@end

@interface ForzenRange: NSObject
@property (nonatomic, assign) NSInteger startX;
@property (nonatomic, assign) NSInteger startY;
@property (nonatomic, assign) NSInteger endX;
@property (nonatomic, assign) NSInteger endY;
@end


@interface ReportTableModel : NSObject
@property (nonatomic, strong) NSMutableArray<NSArray<ItemModel *> *> *dataSource;
@property (nonatomic, strong) NSMutableArray<NSArray<ItemModel *> *> *data;
@property (nonatomic, strong) NSMutableArray<ForzenRange *> *frozenArray;
@property (nonatomic, strong) NSMutableArray *cloumsHight;
@property (nonatomic, strong) NSMutableArray *rowsWidth;
@property (nonatomic, assign) NSInteger frozenColumns; // 运行值
@property (nonatomic, assign) NSInteger oriFrozenColumns; // 初始值
@property (nonatomic, assign) NSInteger frozenRows;
@property (nonatomic, assign) float minWidth;
@property (nonatomic, assign) float maxWidth;
@property (nonatomic, assign) float minHeight;
@property (nonatomic, assign) BOOL showBorder;
@property (nonatomic, copy) RCTDirectEventBlock onClickEvent;
@property (nonatomic, copy) RCTDirectEventBlock onScrollEnd;
@property (nonatomic, copy) RCTDirectEventBlock onScroll;
@property (nonatomic, copy) RCTDirectEventBlock onContentSize;
@property (nonatomic, strong) UIColor *lineColor;
@property (nonatomic, assign) CGRect tableRect;
@property (nonatomic, strong) ItemModel *itemConfig;
@property (nonatomic, strong) NSArray *ignoreLocks;
@property (nonatomic, strong) NSDictionary *replenishColumnsWidthConfig;
@property (nonatomic, strong) ProgressStyle *progressStyle;
@property (nonatomic, strong) NSDictionary *columnsWidthMap;
@property (nonatomic, strong) NSDictionary *frozenAbility;
/*
*  是可排列的，仅支持不包含合并单元格的表
*  开启后，每列表头显示锁定按钮🔒，锁定后可冻结指定列
*  开启后 frozenColumns生效
*  frozenColumns 不显示锁定按钮，始终冻结
*/
@property (nonatomic, assign) BOOL permutable;
@property (nonatomic, strong) NSMutableArray<NSNumber *> *permutedArr; // 冻结指定列arr
@end
