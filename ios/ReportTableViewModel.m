//
//  ReportTableViewModel.m
//
//
//  Created by ms on 2019/11/22.
//

#import "ReportTableViewModel.h"
#import "ReportTableModel.h"
#import "ReportTableView.h"
#import <React/RCTConvert.h>
#import "ReportTableHeaderView.h"

@class SpreadsheetView;
@interface ReportTableViewModel();

@property (nonatomic, strong) ReportTableView * reportTableView;
@property (nonatomic, strong) NSMutableArray<NSArray<ItemModel *> *> *dataSource;
@property (nonatomic, strong) ReportTableModel *reportTableModel;
@property (nonatomic, strong) ReportTableHeaderScrollView *headerScrollView;
@property (nonatomic, assign) NSInteger propertyCount;
@property (nonatomic, weak) RCTBridge *bridge;
@property (nonatomic, strong) ReportTableHeaderView *headerView;
@property (nonatomic, assign) CGFloat dataHeight;

@end

@implementation ReportTableViewModel

- (NSMutableArray<NSArray<ItemModel *> *> *)dataSource{
    if (!_dataSource) {
        _dataSource = [NSMutableArray array];
    }
    return _dataSource;
}

- (ReportTableView *)reportTableView {
    if (!_reportTableView) {
        _reportTableView = [[ReportTableView alloc] init];
        [self addSubview:_reportTableView];
    }
    return _reportTableView;
}

- (ReportTableHeaderView *)headerView {
    if (!_headerView) {
        _headerView = [[ReportTableHeaderView alloc] initWithBridge:self.bridge];
    }
    return _headerView;
}

- (ReportTableHeaderScrollView *)headerScrollView {
    if (!_headerScrollView) {
        _headerScrollView = [[ReportTableHeaderScrollView alloc] init];
        _headerScrollView.showsHorizontalScrollIndicator = NO;
        _headerScrollView.showsVerticalScrollIndicator = NO;
        _headerScrollView.bounces = true;
        [self.reportTableView addSubview: _headerScrollView];
    }
    return _headerScrollView;
}


- (id)initWithBridge:(RCTBridge *)bridge {
    self = [super init];
    if (self) {
        self.bridge = bridge;
        self.reportTableModel = [[ReportTableModel alloc] init];
        self.propertyCount = 0;
    }
    return self;
}

- (NSMutableArray<ForzenRange *> *)generateMergeRange:(NSArray<NSArray<ItemModel *> *>*)dataSource {
    NSMutableArray<ForzenRange *> *frozenArray = [NSMutableArray array];
    for (int i = 0; i < dataSource.count; i++) { // i columnIndex
        NSArray *rowArr = dataSource[i];
        for (int j = 0; j < rowArr.count; j ++) { // j = rowIndex
             NSInteger sameRowLength = [self jungleSameLength:[self rowWithIndex:j columnIndex:i]];
             NSInteger samecolumnLength = [self jungleSameLength:[self columnWithIndex:j columnIndex:i]];
             ItemModel *model = dataSource[i][j];
             model.horCount = sameRowLength ;
             model.verCount = samecolumnLength;
             if (sameRowLength > 1 || samecolumnLength > 1) {
                ForzenRange *forzenRange = [[ForzenRange alloc] init];
                forzenRange.startX = i;
                forzenRange.startY = j;
                forzenRange.endX = i + samecolumnLength - 1;
                forzenRange.endY = j + sameRowLength - 1;
                [frozenArray addObject:forzenRange];
             }
        }
    }
    return frozenArray;
}

- (NSInteger)jungleSameLength:(NSArray<ItemModel *> *)arr {
    if (arr.count <= 1) {
        return arr.count;
    }
    ItemModel *model = arr[0];
    if (model.used && model.used == YES) {
        return 1;
    }
    NSInteger sameLenth = [self sameLength:arr andKeyIndex:model.keyIndex];
    return sameLenth;
}

- (NSInteger)sameLength:(NSArray<ItemModel *> *)arr andKeyIndex:(NSInteger)keyIndex{
    NSInteger sameLenth = 0;
    for (int i = 0; i< arr.count; i++) {
        ItemModel *model = arr[i];
        if (model.keyIndex == keyIndex) {
            sameLenth += 1;
            if (sameLenth > 1) {
                model.used = true;
            }
        } else {
            break;
        }
    }
    return sameLenth;
}

- (NSMutableArray *)rowWithIndex:(NSInteger)rowIndex columnIndex:(NSInteger)columnIndex {
    NSMutableArray<ItemModel *> *result = [NSMutableArray array];
    NSArray *arr = self.dataSource[columnIndex];
    for (NSInteger i = rowIndex; i <arr.count; i++) {
        ItemModel *model = arr[i];
        [result addObject:model];
    }
    return result;
}

- (NSMutableArray *)columnWithIndex:(NSInteger)rowIndex columnIndex:(NSInteger)columnIndex {
    NSMutableArray<ItemModel *> *result = [NSMutableArray array];
    for (NSInteger i = columnIndex; i <self.dataSource.count; i++) {
        NSArray *arr = self.dataSource[i];
        ItemModel *model = arr[rowIndex];
        [result addObject:model];
    }
    return result;
}

- (CGRect)getTextWidth:(NSString *)text withTextSize:(CGFloat)fontSize withMaxWith: (CGFloat)maxWidth{
    CGRect rect = [text boundingRectWithSize:CGSizeMake(maxWidth, CGFLOAT_MAX) options:NSStringDrawingUsesLineFragmentOrigin attributes:@{NSFontAttributeName:[UIFont systemFontOfSize:fontSize]} context:nil];
    return rect;
}

- (void)setData:(NSArray *)data {
    NSMutableArray *dataSource = [NSMutableArray arrayWithArray:data];
    if (self.reportTableModel.data.count > 0) {
        self.reportTableModel.data = dataSource; // update
        [self integratedDataSource];
    } else {
        self.reportTableModel.data = dataSource;
        self.propertyCount += 1;
        [self reloadCheck];
    }
}

- (void)setMinWidth:(float)minWidth {
    if (self.reportTableModel.minWidth != 0 && self.reportTableModel.minWidth != minWidth) {
        self.reportTableModel.minWidth = minWidth; // update
        [self integratedDataSource];
    } else {
        self.reportTableModel.minWidth = minWidth;
        self.propertyCount += 1;
        [self reloadCheck];
    }
}

- (void)setMaxWidth:(float)maxWidth {
    self.reportTableModel.maxWidth = maxWidth;
    self.propertyCount += 1;
    [self reloadCheck];
}

- (void)setMinHeight:(float)minHeight {
    self.reportTableModel.minHeight = minHeight;
    self.propertyCount += 1;
    [self reloadCheck];
}

- (void)setFrozenColumns:(NSInteger)frozenColumns {
    self.reportTableModel.frozenColumns = frozenColumns;
    self.propertyCount += 1;
    [self reloadCheck];
}

- (void)setFrozenRows:(NSInteger)frozenRows {
    self.reportTableModel.frozenRows = frozenRows;
    self.propertyCount += 1;
    [self reloadCheck];
}

- (void)setOnClickEvent:(RCTDirectEventBlock)onClickEvent {
    self.reportTableModel.onClickEvent = onClickEvent;
    self.propertyCount += 1;
    [self reloadCheck];
}

- (void)setSize:(CGSize)size {
    self.reportTableModel.tableRect = CGRectMake(0, 0, size.width, size.height);
    if (self.dataHeight) {
        CGSize headersize = CGSizeMake(0, 0);
        if (_headerView) {
            headersize.height = _headerView.frame.size.height;
        }
        CGRect tableRect = CGRectMake(0, 0, size.width, MIN(size.height, self.dataHeight + headersize.height));
        self.reportTableView.frame = tableRect;
        
        if (_headerView != nil ) {
            CGSize headerViewSize = self.headerView.frame.size;
            self.headerScrollView.frame = CGRectMake(0, 0, self.reportTableView.frame.size.width, headerViewSize.height);
        }
   
    } else {
        self.propertyCount += 1;
        [self reloadCheck];
    }
}

- (void)setHeaderViewSize:(CGSize)headerViewSize {
    // headerScrollView 只会初始化一次
    if (!_headerScrollView) {
        // 第一次初始化
        self.propertyCount += 1;
        if (headerViewSize.width == 0) {
            // donothing
        } else {
            self.headerView.frame = CGRectMake(0, 0, headerViewSize.width, headerViewSize.height);
            [self.headerScrollView addSubview: self.headerView];
        }
    } else {
        if (headerViewSize.width == 0) {
            // 当headerViewSize为0时，会移除headerView
            [self.headerView removeFromSuperview];
            self.headerView = nil;
        } else {
            if (_headerView == nil) {
                [self.headerScrollView addSubview: self.headerView];
            }
            self.headerView.frame = CGRectMake(0, 0, headerViewSize.width, headerViewSize.height);
        }
        // 更新了heaher 要更新tableHight
        CGRect tableRect = self.reportTableModel.tableRect;
        tableRect.size.height = MIN(tableRect.size.height, self.dataHeight + headerViewSize.height);
        self.reportTableView.frame = tableRect;
    }

    self.headerScrollView.contentSize = CGSizeMake(headerViewSize.width + 1, 0);
    self.headerScrollView.frame = CGRectMake(0, 0, self.reportTableView.frame.size.width, headerViewSize.height);
    self.reportTableView.headerScrollView = self.headerScrollView;
    
    [self reloadCheck];
}

- (void)setOnScrollEnd:(RCTDirectEventBlock)onScrollEnd {
    self.reportTableModel.onScrollEnd = onScrollEnd;
    self.propertyCount += 1;
    [self reloadCheck];
}

- (void)setOnScroll:(RCTDirectEventBlock)onScroll{
    self.reportTableModel.onScroll = onScroll;
    self.propertyCount += 1;
    [self reloadCheck];
}

- (void)setLineColor:(UIColor *)lineColor {
    self.reportTableModel.lineColor = lineColor;
    self.propertyCount += 1;
    [self reloadCheck];
}

- (void)setFrozenCount:(NSInteger)frozenCount {
    self.reportTableModel.frozenCount = frozenCount;
    self.propertyCount += 1;
    [self reloadCheck];
}

- (void)setFrozenPoint:(NSInteger)frozenPoint {
    self.reportTableModel.frozenPoint = frozenPoint;
    self.propertyCount += 1;
    [self reloadCheck];
}

- (void)reloadCheck {
    if (self.propertyCount >= 14) {
        self.propertyCount = 0;
        [self integratedDataSource];
    }
}

- (void)scrollToTop {
    [self.reportTableView scrollToTop];
}

- (void)integratedDataSource {
    NSMutableArray *dataSource = [NSMutableArray arrayWithArray: self.reportTableModel.data];
    NSMutableArray *cloumsHight = [NSMutableArray array];
    NSMutableArray *rowsWidth = [NSMutableArray array];
    CGFloat minWidth = self.reportTableModel.minWidth; //margin
    CGFloat maxWidth = self.reportTableModel.maxWidth; //margin
    CGFloat minHeight = self.reportTableModel.minHeight;
    [self.dataSource removeAllObjects]; // clear
    
    for (int i = 0; i < dataSource.count; i++) {
       NSArray *rowArr = dataSource[i];
       NSMutableArray *modelArr = [NSMutableArray array];
       CGFloat rowWith = minWidth;
       CGFloat columnHeigt = minHeight;
       for (int j = 0; j < rowArr.count; j ++) {
           if (i == 0) {
               [rowsWidth addObject:[NSNumber numberWithFloat:minWidth]];
           }
           NSDictionary *dir = rowArr[j];
           ItemModel *model = [[ItemModel alloc] init];
           model.keyIndex = [RCTConvert NSInteger:[dir objectForKey:@"keyIndex"]];
           model.title = [RCTConvert NSString:[dir objectForKey:@"title"]];
           model.backgroundColor = [RCTConvert UIColor:[dir objectForKey:@"backgroundColor"]];
           model.fontSize = [RCTConvert CGFloat:[dir objectForKey:@"fontSize"]];
           model.textColor = [RCTConvert UIColor:[dir objectForKey:@"textColor"]];
           model.isLeft = [RCTConvert BOOL:[dir objectForKey:@"isLeft"]];
           model.isCenter = [RCTConvert BOOL:[dir objectForKey:@"isCenter"]];
           model.textPaddingHorizontal = [RCTConvert NSInteger:[dir objectForKey:@"textPaddingHorizontal"]];
           NSDictionary *iconDic = [RCTConvert NSDictionary:[dir objectForKey:@"icon"]];
           if (iconDic != nil) {
               IconStyle *icon = [[IconStyle alloc] init];
               icon.size = CGSizeMake([[iconDic objectForKey:@"width"] floatValue], [[iconDic objectForKey:@"height"] floatValue]);
               icon.path = [iconDic objectForKey:@"path"];
               icon.imageAlignment = [[iconDic objectForKey:@"imageAlignment"] integerValue];
               icon.paddingHorizontal = [[iconDic objectForKey:@"paddingHorizontal"] floatValue];
               model.iconStyle = icon;
           }
           BOOL isLock = false;
           if (i == 0) {
               if (self.reportTableModel.frozenPoint > 0 && j + 1 == self.reportTableModel.frozenPoint) {
                   isLock = true;
               } else if (self.reportTableModel.frozenCount > 0 && j < self.reportTableModel.frozenCount) {
                   isLock = true;
               }
           }
           CGFloat imageIconWidth = (isLock ? 13 + 10 : iconDic != nil ? model.iconStyle.size.width + model.iconStyle.paddingHorizontal : 0);
           CGFloat exceptText = 2 * model.textPaddingHorizontal + imageIconWidth; //margin
           CGRect textRect = [self getTextWidth: model.title withTextSize: model.fontSize withMaxWith: maxWidth - exceptText];
           // 不是一行
           if (textRect.size.width + 5 + exceptText > minWidth || textRect.size.height > model.fontSize + 5) {
               if (textRect.size.height < model.fontSize + 3) {
                   rowWith = textRect.size.width + exceptText + 5;
               } else {
                   rowWith = maxWidth;
                   CGFloat textHeight = textRect.size.height + (minHeight - model.fontSize - 3); // marginVer*2
                   int samekey = 1;
                   for (int k = i + 1; k < dataSource.count; k++) {
                       NSInteger nextKeyIndex = [RCTConvert NSInteger:[dataSource[k][j] objectForKey:@"keyIndex"]];
                       if (nextKeyIndex == model.keyIndex) {
                           samekey += 1;
                       } else {
                           break;
                       }
                   }
                   textHeight /= samekey;
                   for (int k = i + 1; k < samekey + i; k++) {
                       [dataSource[k][j] setObject: [NSNumber numberWithFloat: MAX(textHeight, minHeight)] forKey: @"apportionHeight"];
                   }
                   NSNumber *apportionHeight = [dir objectForKey:@"apportionHeight"];
                   columnHeigt = MAX(columnHeigt, apportionHeight == nil ? textHeight : [apportionHeight floatValue]);
               }
            } else {
               rowWith = minWidth;
            }
            if ([rowsWidth[j] floatValue] < rowWith) {
               rowsWidth[j] = [NSNumber numberWithFloat:rowWith];
            }
    
            [modelArr addObject:model];
        }
        [cloumsHight addObject:[NSNumber numberWithFloat:columnHeigt]];
        [self.dataSource addObject:modelArr];
    }
    for (int i = 0; i < rowsWidth.count; i++) {
        rowsWidth[i] = [NSNumber numberWithFloat: [rowsWidth[i] floatValue] - 1 - 1.0/rowsWidth.count];
    }
    NSMutableArray<ForzenRange *> *frozenArray = [self generateMergeRange:self.dataSource];
    self.reportTableModel.frozenArray = frozenArray;
    self.reportTableModel.dataSource = self.dataSource;
    self.reportTableModel.rowsWidth = rowsWidth;
    self.reportTableModel.cloumsHight = cloumsHight;
    
    CGFloat tableHeight = 1;
    for (int i = 0; i < cloumsHight.count; i++) {
        tableHeight += [cloumsHight[i] floatValue] + 1; // speHeight
    }
    self.dataHeight = tableHeight;
    
    if (_headerView) {
        // 更新 tableHeight
        CGSize headerSize = self.headerView.frame.size;
        tableHeight += headerSize.height;
    }
    CGRect temp = self.reportTableModel.tableRect;
    CGRect tableRect = CGRectMake(temp.origin.x, temp.origin.y, temp.size.width, temp.size.height);
    tableRect.size.height = MIN(tableRect.size.height, tableHeight);
    self.reportTableView.frame = tableRect;
    self.headerScrollView.frame = CGRectMake(0, 0, tableRect.size.width, self.headerScrollView.frame.size.height);
    
    self.reportTableView.reportTableModel = self.reportTableModel;
}

@end
