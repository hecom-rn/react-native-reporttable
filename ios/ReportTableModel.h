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
@end

@interface ItemModel: NSObject
@property (nonatomic, strong) NSString *title;
@property (nonatomic, assign) NSInteger keyIndex;
@property (nonatomic, strong) UIColor *backgroundColor;
@property (nonatomic, strong) UIColor *textColor;
@property (nonatomic, assign) BOOL used;
@property (nonatomic, assign) CGFloat fontSize;
@property (nonatomic, assign) BOOL isLeft;
@property (nonatomic, assign) NSInteger textPaddingHorizontal;
@property (nonatomic, assign) NSInteger horCount;
@property (nonatomic, assign) NSInteger verCount;
@property (nonatomic, strong) IconStyle *iconStyle;
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
@property (nonatomic, assign) NSInteger frozenColumns;
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
@end
