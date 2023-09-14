//
//  ReportTableModel.h
//
//
//  Created by ms on 2019/11/22.
//

#import <Foundation/Foundation.h>
#import <React/RCTComponent.h>

@interface IconStyle: NSObject
@property (nonatomic, strong) id path;
@property (nonatomic, assign) CGSize size;
@property (nonatomic, assign) NSInteger imageAlignment; // 1左  2中  3右(默认)
@property (nonatomic, assign) CGFloat paddingHorizontal;
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
@property (nonatomic, assign) NSInteger keyIndex;
@property (nonatomic, strong) UIColor *backgroundColor;
@property (nonatomic, strong) UIColor *textColor;
@property (nonatomic, strong) UIColor *splitLineColor;
@property (nonatomic, assign) BOOL isOverstriking;
@property (nonatomic, strong) UIColor *classificationLineColor;
@property (nonatomic, assign) BOOL used;
@property (nonatomic, assign) BOOL isForbidden;
@property (nonatomic, assign) BOOL strikethrough;
@property (nonatomic, strong) UIColor *boxLineColor;
@property (nonatomic, strong) UIColor *asteriskColor;
@property (nonatomic, assign) CGFloat fontSize;
@property (nonatomic, assign) NSTextAlignment textAlignment;
@property (nonatomic, assign) NSInteger textPaddingHorizontal;
@property (nonatomic, assign) NSInteger horCount;
@property (nonatomic, assign) ClassificationLinePosition classificationLinePosition;
@property (nonatomic, assign) NSInteger verCount;
@property (nonatomic, strong) IconStyle *iconStyle;
@property (nonatomic, strong) ItemModel *itemConfig;
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
@property (nonatomic, strong) NSArray *cloumsHight;
@property (nonatomic, strong) NSArray *rowsWidth;
@property (nonatomic, assign) NSInteger frozenColumns; // 运行值
@property (nonatomic, assign) NSInteger oriFrozenColumns; // 初始值
@property (nonatomic, assign) NSInteger frozenRows;
@property (nonatomic, assign) float minWidth;
@property (nonatomic, assign) float maxWidth;
@property (nonatomic, assign) float minHeight;
@property (nonatomic, copy) RCTDirectEventBlock onClickEvent;
@property (nonatomic, copy) RCTDirectEventBlock onScrollEnd;
@property (nonatomic, copy) RCTDirectEventBlock onScroll;
@property (nonatomic, strong) UIColor *lineColor;
@property (nonatomic, assign) CGRect tableRect;
@property (nonatomic, assign) NSInteger frozenCount;
@property (nonatomic, assign) NSInteger frozenPoint;
@property (nonatomic, strong) ItemModel *itemConfig;
@property (nonatomic, strong) NSDictionary *columnsWidthMap;
@end
