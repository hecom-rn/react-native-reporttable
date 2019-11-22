//
//  ReportTableModel.h
//
//
//  Created by ms on 2019/11/22.
//

#import <Foundation/Foundation.h>

@interface ItemModel : NSObject
@property (nonatomic, assign) NSInteger keyIndex;
@property (nonatomic, strong) UIColor *backgroundColor;
@property (nonatomic, strong) UIColor *textColor;
@property (nonatomic, assign) BOOL used;
@property (nonatomic, assign) CGFloat fontSize;
@end


@interface ForzenRange: NSObject
@property (nonatomic, assign) NSInteger startX;
@property (nonatomic, assign) NSInteger startY;
@property (nonatomic, assign) NSInteger endX;
@property (nonatomic, assign) NSInteger endY;
@end


@interface ReportTableModel : NSObject
@property (nonatomic, strong) NSMutableArray<NSArray<ItemModel *> *> *dataSource;
@property (nonatomic, strong) NSMutableArray<ForzenRange *> *frozenArray;
@property (nonatomic, strong) NSArray *cloumsHight;
@property (nonatomic, strong) NSArray *rowsWidth;
@property (nonatomic, assign) NSInteger frozenColumns;
@property (nonatomic, assign) NSInteger frozenRows;
@property (nonatomic, assign) float minWidth;
@property (nonatomic, assign) float maxWidth;
@property (nonatomic, assign) float minHeight;

@end
