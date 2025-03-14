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
#import "UIImage+ImageTag.h"

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

- (ReportTableHeaderScrollView *)headerScrollView {
    if (!_headerScrollView) {
        _headerScrollView = [[ReportTableHeaderScrollView alloc] init];
        _headerScrollView.tag = 999999;
        _headerScrollView.showsHorizontalScrollIndicator = NO;
        _headerScrollView.showsVerticalScrollIndicator = NO;
        [self.reportTableView addSubview: _headerScrollView];
    }
    return _headerScrollView;
}


- (void)didAddSubview:(UIView *)subview {
    if ([subview isKindOfClass:[RCTView class]]) {
        [subview removeFromSuperview];
        self.headerView = subview;
        [self.headerScrollView addSubview: self.headerView];
    }
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
    NSInteger rowCount = dataSource[0].count;
    for (int i = 0; i < dataSource.count; i++) { // i columnIndex
        for (int j = 0; j < rowCount; j ++) { // j = rowIndex
             NSInteger sameRowLength = [self SameRowLength:i:j];
             NSInteger samecolumnLength = [self SameColumnLength:i:j];
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

- (NSInteger)SameRowLength:(NSInteger)columnIndex:(NSInteger)rowIndex {
    NSInteger rowCount = self.dataSource[0].count;
    NSInteger sameLenth = 0;
    NSInteger keyIndex = self.dataSource[columnIndex][rowIndex].keyIndex;
    for (int k = rowIndex; k < rowCount; k++) {
        ItemModel *model = self.dataSource[columnIndex][k];
        if (model.used && model.used == YES) {
            return MAX(sameLenth, 1);
        }
        if (model.keyIndex == keyIndex) {
            sameLenth += 1;
            if (sameLenth > 1) {
                model.used = true;
            }
        } else {
            return sameLenth;
        }
    }
    return sameLenth;
}

- (NSInteger)SameColumnLength:(NSInteger)columnIndex:(NSInteger)rowIndex {
    NSInteger columnCount = self.dataSource.count;
    NSInteger sameLenth = 0;
    NSInteger keyIndex = self.dataSource[columnIndex][rowIndex].keyIndex;
    for (int k = columnIndex; k < columnCount; k++) {
        ItemModel *model = self.dataSource[k][rowIndex];
        if (model.used && model.used == YES) {
            return MAX(sameLenth, 1);
        }
        if (model.keyIndex == keyIndex) {
            sameLenth += 1;
            if (sameLenth > 1) {
                model.used = true;
            }
        } else {
            return sameLenth;
        }
    }
    return sameLenth;
}

- (CGRect)getTextWidth:(NSString *)text withTextSize:(CGFloat)fontSize withMaxWith: (CGFloat)maxWidth{
    return [text boundingRectWithSize:CGSizeMake(maxWidth, CGFLOAT_MAX) options:NSStringDrawingUsesLineFragmentOrigin attributes:@{NSFontAttributeName:[UIFont systemFontOfSize:fontSize]} context:nil];
}

- (CGRect)getAttTextWidth:(NSAttributedString *)text withMaxWith: (CGFloat)maxWidth{
    return [text boundingRectWithSize:CGSizeMake(maxWidth, CGFLOAT_MAX) options:NSStringDrawingUsesLineFragmentOrigin context: nil];
}

- (void)setData:(NSArray *)data {
    NSMutableArray *dataSource = [NSMutableArray arrayWithArray:data];
    if (self.reportTableModel.data.count > 0) {
        self.reportTableModel.data = dataSource; // update
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
            [self integratedDataSource];
        });
    } else {
        self.reportTableModel.data = dataSource;
        self.propertyCount += 1;
        [self reloadCheck];
    }
}

- (void)setMinWidth:(float)minWidth {
    if (self.reportTableModel.minWidth != 0 && self.reportTableModel.minWidth != minWidth) {
        self.reportTableModel.minWidth = minWidth; // update
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
            [self integratedDataSource];
        });
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

- (void)setShowBorder:(BOOL)showBorder {
    self.reportTableModel.showBorder = showBorder;
    self.propertyCount += 1;
    [self reloadCheck];
}

- (void)setFrozenColumns:(NSInteger)frozenColumns {
    self.reportTableModel.frozenColumns = frozenColumns;
    self.reportTableModel.oriFrozenColumns = frozenColumns;
    self.propertyCount += 1;
    [self reloadCheck];
}

- (void)setReplenishColumnsWidthConfig:(NSDictionary *)replenishColumnsWidthConfig {
    self.reportTableModel.replenishColumnsWidthConfig = replenishColumnsWidthConfig;
    self.propertyCount += 1;
    [self reloadCheck];
}

- (void)setColumnsWidthMap:(NSDictionary *)columnsWidthMap {
    self.reportTableModel.columnsWidthMap = columnsWidthMap;
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

- (void)setOnContentSize:(RCTDirectEventBlock)onContentSize {
    self.reportTableModel.onContentSize = onContentSize;
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
        CGRect tableRect = CGRectMake(0, 0, size.width, size.height);
        self.reportTableView.frame = tableRect;
        [self.reportTableView scrollViewDidZoom: self.reportTableView];
        if (_headerView != nil ) {
            CGSize headerViewSize = self.headerView.frame.size;
            self.headerScrollView.frame = CGRectMake(0, 0, self.reportTableView.frame.size.width, headerViewSize.height);
        }
        if (self.reportTableModel.replenishColumnsWidthConfig != nil) {
            NSInteger showNumber = [self.reportTableModel.replenishColumnsWidthConfig objectForKey:@"showNumber"] ? [RCTConvert NSInteger:[self.reportTableModel.replenishColumnsWidthConfig objectForKey:@"showNumber"]] : 0;
            if (showNumber > 0) {
                [self integratedDataSource];
            }
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
            self.headerView.frame = CGRectMake(0, 0, headerViewSize.width, headerViewSize.height);
        }

    }
    self.headerScrollView.frame = CGRectMake(0, 0, self.reportTableView.frame.size.width, headerViewSize.height);
    
    BOOL canScroll = (self.dataHeight ?: 0) + self.headerScrollView.frame.size.height > self.reportTableModel.tableRect.size.height;
    self.headerScrollView.contentSize = CGSizeMake(headerViewSize.width, canScroll ? self.reportTableModel.tableRect.size.height : 0);
    
    self.reportTableView.headerScrollView = self.headerScrollView;
    [self.reportTableView scrollViewDidZoom: self.reportTableView];
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

- (void)setPermutable:(BOOL)permutable {
    self.reportTableModel.permutable = permutable;
    self.propertyCount += 1;
    [self reloadCheck];
}

- (void)setDisableZoom:(BOOL)disableZoom {
    if (disableZoom) {
        self.reportTableView.maximumZoomScale = 1;
        self.reportTableView.minimumZoomScale = 1;
    } else {
        self.reportTableView.maximumZoomScale = 2;
        self.reportTableView.minimumZoomScale = 0.5;
    }
    self.propertyCount += 1;
    [self reloadCheck];
}

- (void)setIgnoreLocks:(NSArray *)ignoreLocks {
    self.reportTableModel.ignoreLocks = ignoreLocks;
    self.propertyCount += 1;
    [self reloadCheck];
}

- (void)setLineColor:(NSString *)lineColor {
    self.reportTableModel.lineColor = [self colorFromHex: lineColor];
    self.propertyCount += 1;
    [self reloadCheck];
}

- (void)setFrozenCount:(NSInteger)frozenCount {
    self.reportTableModel.frozenCount = frozenCount;
    self.reportTableModel.frozenColumns = self.reportTableModel.oriFrozenColumns;
    self.propertyCount += 1;
    [self reloadCheck];
}

- (void)setFrozenPoint:(NSInteger)frozenPoint {
    self.reportTableModel.frozenPoint = frozenPoint;
    self.reportTableModel.frozenColumns = self.reportTableModel.oriFrozenColumns;
    self.propertyCount += 1;
    [self reloadCheck];
}

- (void)setItemConfig:(NSDictionary *)itemConfig {
    ItemModel *model = [[ItemModel alloc] init];

    model.backgroundColor = [self colorFromHex:[itemConfig objectForKey:@"backgroundColor"]];
    model.fontSize = [RCTConvert CGFloat:[itemConfig objectForKey:@"fontSize"]];
    model.textColor = [self colorFromHex:[itemConfig objectForKey:@"textColor"]];
    model.textAlignment = [RCTConvert NSInteger:[itemConfig objectForKey:@"textAlignment"]];
    model.textPaddingHorizontal = [RCTConvert NSInteger:[itemConfig objectForKey:@"textPaddingHorizontal"]];
    
    model.classificationLineColor = [self colorFromHex:[itemConfig objectForKey:@"classificationLineColor"]];
    model.isOverstriking = [RCTConvert BOOL:[itemConfig objectForKey:@"isOverstriking"]];
    NSDictionary *progressDic = [itemConfig objectForKey:@"progressStyle"] ? [RCTConvert NSDictionary:[itemConfig objectForKey:@"progressStyle"]] : nil;
    if (progressDic != nil) {
        ProgressStyle *progressStyle = [[ProgressStyle alloc] init];
        progressStyle.height = [[progressDic objectForKey:@"height"] floatValue];
        progressStyle.marginHorizontal = [[progressDic objectForKey:@"marginHorizontal"] floatValue];
        progressStyle.cornerRadius = [[progressDic objectForKey:@"cornerRadius"] floatValue];
        NSDictionary *antsLineDic = [progressDic objectForKey:@"antsLineStyle"] ? [RCTConvert NSDictionary:[progressDic objectForKey:@"antsLineStyle"]] : nil;
        if (antsLineDic != nil) {
            AntsLineStyle *antsLineStyle = [[AntsLineStyle alloc] init];
            antsLineStyle.lineWidth = [[antsLineDic objectForKey:@"lineWidth"] floatValue];
            antsLineStyle.color = [self colorFromHex: [antsLineDic objectForKey:@"color"]];
            antsLineStyle.lineDashPattern = [RCTConvert NSArray:[antsLineDic objectForKey:@"lineDashPattern"]];
            progressStyle.antsLineStyle = antsLineStyle;
        }
        model.progressStyle = progressStyle;
    }
    self.reportTableModel.itemConfig = model;
    self.propertyCount += 1;
    [self reloadCheck];
}

- (void)reloadCheck {
    if (self.propertyCount >= 22) {
        self.propertyCount = 0;
        [self integratedDataSource];
    }
}

- (void)updateDataSource:(NSArray<NSArray *> *)data withY:(NSInteger)y withX:(NSInteger)x {
    if (self.reportTableModel.data.count > 0) {
        NSMutableArray *arr = self.reportTableModel.data;
        NSArray *rowArr = (NSArray *)arr[0];
        for (int i = y; i < arr.count; i++) {
            if (data.count > i - y) {
                for (int j = x; j < rowArr.count; j++) {
                    if (data[i-y].count > j-x) {
                        arr[i][j] = (NSDictionary *)data[i-y][j-x];
                    } else {
                        continue;
                    }
                }
            } else {
                continue;
            }
        }
        [self integratedDataSource];
    }
}
- (void)spliceData:(NSArray *)config {
    NSMutableArray *arr = self.reportTableModel.data;
    for (int i = 0; i < config.count; i++) {
        NSArray *data = [config[i] objectForKey:@"data"];
        NSInteger l =  [RCTConvert NSInteger:[config[i] objectForKey:@"l"]];
        NSInteger y = [RCTConvert NSInteger: [config[i] objectForKey:@"y"]];
        if (self.reportTableModel.data.count > 0) {
            // 删除
            if (l > 0 && y < arr.count) {
                if (y + l > arr.count) {
                    l = arr.count - y;
                }
                NSRange range = NSMakeRange(y, l);
                [self.reportTableModel.data removeObjectsInRange:range];
            }
            // 插入
            if (data.count > 0 && y <= arr.count) {
                NSIndexSet *indexes = [NSIndexSet indexSetWithIndexesInRange:NSMakeRange(y, data.count)];
                [arr insertObjects:data atIndexes:indexes];
            }
        }
    }
    [self integratedDataSource];
}


- (void)scrollToLineX:(NSInteger)lineX lineY:(NSInteger)lineY offsetX:(float)offsetX offsetY:(float)offsetY animated:(BOOL)animated {
    [self.reportTableView scrollToLineX: lineX lineY: lineY offsetX: offsetX offsetY: offsetY animated: animated];
}

- (void)scrollToBottom {
    [self.reportTableView scrollToBottom];
}

- (void)integratedDataSource {
    NSMutableArray<NSArray *> *dataSource = [NSMutableArray arrayWithArray: self.reportTableModel.data];
    NSInteger rowCount = dataSource[0].count;
    NSMutableArray *cloumsHight = [NSMutableArray arrayWithCapacity: dataSource.count];
    NSMutableArray *rowsWidth = [NSMutableArray arrayWithCapacity: rowCount];
    CGFloat minHeight = self.reportTableModel.minHeight;
    [self.dataSource removeAllObjects]; // clear
    ItemModel *itemStyle = self.reportTableModel.itemConfig;
    for (int i = 0; i < dataSource.count; i++) {
        NSMutableArray *modelArr = [NSMutableArray arrayWithCapacity: rowCount];
        CGFloat columnHeigt = minHeight;
        NSMutableArray *mergeLen = [NSMutableArray arrayWithCapacity: rowCount]; // 对应index 会有多少个合并
        NSInteger curKeyIndex;
        NSInteger sameLenth = 1;
        for (int j = 0; j < dataSource[i].count; j ++) {
            NSDictionary *dir = dataSource[i][j];
            NSDictionary *columnWidthMap = [self.reportTableModel.columnsWidthMap objectForKey:[NSString stringWithFormat:@"%d", j]];
            CGFloat maxWidth = columnWidthMap ? [[columnWidthMap objectForKey:@"maxWidth"] floatValue] : self.reportTableModel.maxWidth;
            ItemModel *model = [self generateItemModel:dir WithmaxWidth: maxWidth - 2];// 2分割线, 注意
            model.columIndex = j;
            if (j == 0) {
                curKeyIndex = model.keyIndex;
            } else {
                if (curKeyIndex != model.keyIndex || j == rowCount - 1) {
                    if (j == rowCount - 1 && curKeyIndex == model.keyIndex) {
                        // 最后一个是合并的
                        sameLenth += 1;
                    }
                    for(int k = 0; k < sameLenth; k++) {
                       [mergeLen addObject:@(sameLenth)];
                    }
                    if (j == rowCount - 1 && curKeyIndex != model.keyIndex) {
                        // 但是最后一个不是横向合并的
                        [mergeLen addObject:@(1)];
                    }
                    sameLenth = 1;
                } else {
                    sameLenth += 1;
                }
            }
            curKeyIndex = model.keyIndex;
            [modelArr addObject: model];
        }
        for (int j = 0; j < dataSource[i].count; j ++) {
            NSDictionary *columnWidthMap = [self.reportTableModel.columnsWidthMap objectForKey:[NSString stringWithFormat:@"%d", j]];
            CGFloat minWidth = columnWidthMap ? [[columnWidthMap objectForKey:@"minWidth"] floatValue] : self.reportTableModel.minWidth;
            CGFloat maxWidth = columnWidthMap ? [[columnWidthMap objectForKey:@"maxWidth"] floatValue] : self.reportTableModel.maxWidth;
            CGFloat rowWith = minWidth;
            if (i == 0) {
                [rowsWidth addObject:[NSNumber numberWithFloat:rowWith]];
            }
            NSInteger mergeNum = mergeLen.count > j ? [mergeLen[j] intValue] : 1;
            ItemModel *model = modelArr[j];
            NSDictionary *dir = dataSource[i][j];
            BOOL showLock = false;
            if (i == 0 && ![self.reportTableModel.ignoreLocks containsObject: [NSNumber numberWithInt:j + 1]]) {
                if (self.reportTableModel.permutable) {
                    if (j >= self.reportTableModel.frozenColumns) {
                        showLock = true;
                    }
                } else {
                    if (self.reportTableModel.frozenPoint > 0 && j + 1 == self.reportTableModel.frozenPoint) {
                        showLock = true;
                    } else if (self.reportTableModel.frozenCount > 0 && j < self.reportTableModel.frozenCount) {
                        showLock = true;
                    } 
                }
            }
            CGFloat imageIconWidth = (showLock ? 13 : model.iconStyle != nil ? model.iconStyle.size.width + model.iconStyle.paddingHorizontal : 0);
            CGFloat exceptText = (model.textPaddingLeft ?: model.textPaddingHorizontal) + (model.textPaddingRight ?: model.textPaddingHorizontal)  + imageIconWidth + (model.extraText != nil ? model.extraText.backgroundStyle.width + 2 : 0) ; //margin
            CGFloat boundWidth = MAX(maxWidth, mergeNum * minWidth) - exceptText;
            CGRect textRect = [model.title isEqualToString:@"--"] ? CGRectMake(0, 0, 30, model.fontSize) : model.richText != nil ? [self getAttTextWidth:model.richText withMaxWith: boundWidth] : [self getTextWidth: model.title withTextSize: model.fontSize withMaxWith: boundWidth];
            CGFloat tolerant = textRect.size.width == 0 ? 0 : 8; // 额外的容错空间
            CGFloat contenWidth = textRect.size.width + tolerant + exceptText;
            if (contenWidth > mergeNum * minWidth || textRect.size.height > model.fontSize * 1.5) {
                BOOL useMerge = mergeNum > maxWidth/ minWidth; // 当横向有合并时，使用最小宽度来计算对应的高
                if (textRect.size.height < model.fontSize * 1.9) {
                   // minWidth < text < maxWidth
                    rowWith = useMerge ? maxWidth + tolerant : textRect.size.width + exceptText + tolerant;
                } else {
                   // 多行
                    rowWith = useMerge ? minWidth : model.richText != nil ? contenWidth : maxWidth;
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
                    NSNumber *apportionHeight = [dir objectForKey:@"apportionHeight"]; // 记录一下纵向合并
                    columnHeigt = MAX(columnHeigt, apportionHeight == nil ? textHeight : [apportionHeight floatValue]);
                }
            } else {
                rowWith = minWidth;
            }
            if ([rowsWidth[j] floatValue] < rowWith) {
                rowsWidth[j] = [NSNumber numberWithFloat:rowWith];
            }
        }
        [cloumsHight addObject:[NSNumber numberWithFloat:columnHeigt]];
        [self.dataSource addObject:modelArr];
    }
    // 再次更新列宽
    NSDictionary *dir = self.reportTableModel.replenishColumnsWidthConfig;
    if (dir != nil) {
        NSArray *ignoreColumns = [dir objectForKey:@"ignoreColumns"] ? [RCTConvert NSArray:[dir objectForKey:@"ignoreColumns"]] : @[];
        NSInteger showNumber = [dir objectForKey:@"showNumber"] ? [RCTConvert NSInteger:[dir objectForKey:@"showNumber"]] : 0;
        showNumber = MIN(showNumber, self.dataSource.count > 0 ? self.dataSource[0].count : 0); // 不能超过最大列数
        CGFloat padding = self.reportTableModel.itemConfig.textPaddingHorizontal * 2;
        CGFloat contentWidth = self.reportTableModel.tableRect.size.width;
        if (showNumber > 0) {
            CGFloat len = 1;
            CGFloat totalLen = 1;
            for (int i = 0; i < showNumber; i++) {
                BOOL ignore = [ignoreColumns containsObject:[NSNumber numberWithInteger:i + 1]];
                if (!ignore) {
                    len += [rowsWidth[i] floatValue];
                }
                totalLen += [rowsWidth[i] floatValue];
            }
            double sacle = (contentWidth - (totalLen - len)) / len;
            CGFloat minValue = 20;
            // 超出限制, 且还容的下
            if (totalLen > contentWidth && showNumber * (padding + minValue) < contentWidth) {
                CGFloat nextLen = 1;
                BOOL hasChange = NO;
                totalLen = 1;
                for (int i = 0; i < showNumber; i++) {
                    BOOL ignore = [ignoreColumns containsObject:[NSNumber numberWithInteger: i + 1]];
                    if (!ignore) {
                        CGFloat nextValue = floor([rowsWidth[i] floatValue] * sacle);
                        if (nextValue < padding + minValue) {
                            nextValue = padding + minValue;
                            hasChange = YES;
                        }
                        rowsWidth[i] = [NSNumber numberWithFloat: nextValue];
                    }
                    if (showNumber - 1 == i && !hasChange) {
                        CGFloat nextValue = contentWidth - totalLen;
                        rowsWidth[i] = [NSNumber numberWithFloat: nextValue];
                    }
                    totalLen += floor([rowsWidth[i] floatValue]);
                }
                if (hasChange) {
                    len = 1;
                    totalLen = 1;
                    for (int i = 0; i < showNumber; i++) {
                        BOOL ignore = [ignoreColumns containsObject:[NSNumber numberWithInteger:i + 1]];
                        CGFloat value =  [rowsWidth[i] floatValue];
                        if (!ignore && value != padding + minValue) {
                            len += value;
                        }
                        totalLen += value;
                    }
                    sacle = (contentWidth - (totalLen - len)) / len;
                    totalLen = 1;
                    for (int i = 0; i < showNumber; i++) {
                        BOOL ignore = [ignoreColumns containsObject:[NSNumber numberWithInteger: i + 1]];
                        CGFloat value =  [rowsWidth[i] floatValue];
                        if (!ignore && value != padding + minValue) {
                            CGFloat nextValue = floor(value * sacle);
                            rowsWidth[i] = [NSNumber numberWithFloat: nextValue];
                        }
                        if (showNumber - 1 == i) {
                            CGFloat nextValue = contentWidth - totalLen;
                            rowsWidth[i] = [NSNumber numberWithFloat: nextValue];
                        }
                        totalLen += floor([rowsWidth[i] floatValue]);
                    }
                }
                cloumsHight = [NSMutableArray arrayWithCapacity: dataSource.count];
                // 重新调整高度。 注意富文本标签会有问题
                for (int i = 0; i < dataSource.count; i++) {
                    CGFloat columnHeigt = minHeight;
                    NSMutableArray *mergeLen = [NSMutableArray arrayWithCapacity: rowCount]; // 对应index 会有多少个合并
                    NSInteger curKeyIndex = -1;
                    NSInteger sameLenth = 1;
                    for (int j = 0; j < dataSource[i].count; j ++) {
                        NSDictionary *dir = dataSource[i][j];
                        ItemModel *model = self.dataSource[i][j];
                        if (curKeyIndex != model.keyIndex || j == rowCount - 1) { // 已经到末尾了，处理了本次循环
                            for(int k = 0; k < sameLenth; k++) {
                               [mergeLen addObject:@(sameLenth)];
                            }
                            if (curKeyIndex != model.keyIndex) {
                                // 但是最后一个不是横向合并的，需要纠正为1
                                mergeLen[mergeLen.count - 1] = @(1);
                            }
                            sameLenth = 1;
                        } else {
                            sameLenth += 1;
                        }
                        curKeyIndex = model.keyIndex;
                    }
                    for (int j = 0; j < dataSource[i].count; j ++) {
                        CGFloat fixedRowWidth = [rowsWidth[j] floatValue]; // 取固定宽度
                        CGFloat minWidth = fixedRowWidth;
                        CGFloat maxWidth = fixedRowWidth;
                        NSInteger mergeNum = mergeLen.count > j ? [mergeLen[j] intValue] : 1;
                        ItemModel *model = self.dataSource[i][j];
                        NSDictionary *dir = dataSource[i][j];
                        BOOL showLock = false;
                        if (i == 0 && ![self.reportTableModel.ignoreLocks containsObject: [NSNumber numberWithInt:j + 1]]) {
                            if (self.reportTableModel.permutable) {
                                if (j >= self.reportTableModel.frozenColumns) {
                                    showLock = true;
                                }
                            } else {
                                if (self.reportTableModel.frozenPoint > 0 && j + 1 == self.reportTableModel.frozenPoint) {
                                    showLock = true;
                                } else if (self.reportTableModel.frozenCount > 0 && j < self.reportTableModel.frozenCount) {
                                    showLock = true;
                                }
                            }
                        }
                        CGFloat imageIconWidth = (showLock ? 13 : model.iconStyle != nil ? model.iconStyle.size.width + model.iconStyle.paddingHorizontal : 0);
                        CGFloat exceptText = (model.textPaddingLeft ?: model.textPaddingHorizontal) + (model.textPaddingRight ?: model.textPaddingHorizontal)  + imageIconWidth + (model.extraText != nil ? model.extraText.backgroundStyle.width + 2 : 0) ; //margin
                        CGFloat boundWidth = MAX(maxWidth, mergeNum * minWidth) - exceptText;
                        CGRect textRect = [model.title isEqualToString:@"--"] ? CGRectMake(0, 0, 30, model.fontSize) : model.richText != nil ? [self getAttTextWidth:model.richText withMaxWith: boundWidth] : [self getTextWidth: model.title withTextSize: model.fontSize withMaxWith: boundWidth - 8];
                        CGFloat tolerant = textRect.size.width == 0 ? 0 : 8; // 额外的容错空间
                        CGFloat contenWidth = textRect.size.width + tolerant + exceptText;
                        if (contenWidth > mergeNum * minWidth || textRect.size.height > model.fontSize * 1.5) {
                            BOOL useMerge = mergeNum > maxWidth/ minWidth; // 当横向有合并时，使用最小宽度来计算对应的高
                            if (textRect.size.height < model.fontSize * 1.9) {
                            } else {
                               // 多行
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
                                NSNumber *apportionHeight = [dir objectForKey:@"apportionHeight"]; // 记录一下纵向合并
                                columnHeigt = MAX(columnHeigt, apportionHeight == nil ? textHeight : [apportionHeight floatValue]);
                            }
                        }
                    }
                    [cloumsHight addObject:[NSNumber numberWithFloat:columnHeigt]];
                }
            }
        }
    }
    for (int i = 0; i < rowsWidth.count; i++) {
        rowsWidth[i] = [NSNumber numberWithFloat: floor([rowsWidth[i] floatValue]) - 1];
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

    if (self.reportTableModel.onContentSize != nil) {
        NSNumber *width = [rowsWidth valueForKeyPath:@"@sum.self"];
        NSNumber *height = [cloumsHight valueForKeyPath:@"@sum.self"];
        self.reportTableModel.onContentSize(@{@"width": @([width floatValue] + (rowsWidth.count + 1) * 1), @"height": @([height floatValue] + (cloumsHight.count + 1) * 1)});
    }
    self.reportTableView.frame = self.reportTableModel.tableRect;
    BOOL canScroll = self.dataHeight + self.headerScrollView.frame.size.height > self.reportTableModel.tableRect.size.height;
    self.headerScrollView.contentSize = CGSizeMake(self.headerScrollView.contentSize.width, canScroll ? self.reportTableModel.tableRect.size.height : 0);
    
    self.headerScrollView.frame = CGRectMake(0, 0, self.reportTableModel.tableRect.size.width, self.headerScrollView.frame.size.height);
    if (frozenArray.count > 0 && self.reportTableModel.permutable) {
        // 如果有合并的则让permutable失效
        self.reportTableModel.permutable = NO;
    }
    self.reportTableView.reportTableModel = self.reportTableModel;
    
}

- (ItemModel *)generateItemModel:(NSDictionary *)dir WithmaxWidth:(CGFloat)maxWidth {
    ItemModel *model = [[ItemModel alloc] init];
    model.itemConfig = self.reportTableModel.itemConfig;
    NSArray *keys = [dir allKeys];
    model.keyIndex = [RCTConvert NSInteger:[dir objectForKey:@"keyIndex"]];
    model.title = [RCTConvert NSString:[dir objectForKey:@"title"]];
    if ([keys containsObject: @"backgroundColor"]) {
        model.backgroundColor = [self colorFromHex:[dir objectForKey:@"backgroundColor"]];
    }
    if ([keys containsObject: @"fontSize"]) {
        model.fontSize = [RCTConvert CGFloat:[dir objectForKey:@"fontSize"]];
    }
    if ([keys containsObject: @"textColor"]) {
        model.textColor = [self colorFromHex:[dir objectForKey:@"textColor"]];
    }
    if ([keys containsObject: @"boxLineColor"]) {
        model.boxLineColor = [self colorFromHex:[dir objectForKey:@"boxLineColor"]];
    }
    model.textAlignment = model.itemConfig.textAlignment;
    if ([keys containsObject: @"textAlignment"]) {
        model.textAlignment = [RCTConvert NSInteger:[dir objectForKey:@"textAlignment"]];
    }
    if ([keys containsObject: @"classificationLinePosition"]) {
        model.classificationLinePosition = [RCTConvert NSInteger:[dir objectForKey:@"classificationLinePosition"]];
    }
    if ([keys containsObject: @"isForbidden"]) {
        model.isForbidden = [RCTConvert BOOL:[dir objectForKey:@"isForbidden"]];
    }

    model.classificationLineColor = model.itemConfig.classificationLineColor;
    if ([keys containsObject: @"classificationLineColor"]) {
        model.classificationLineColor = [self colorFromHex:[dir objectForKey:@"classificationLineColor"]];
    }
    if ([keys containsObject: @"textPaddingHorizontal"]) {
        model.textPaddingHorizontal = [RCTConvert NSInteger:[dir objectForKey:@"textPaddingHorizontal"]];
    }
    if ([keys containsObject: @"textPaddingLeft"]) {
        model.textPaddingLeft = [RCTConvert NSInteger:[dir objectForKey:@"textPaddingLeft"]];
    }
    if ([keys containsObject: @"textPaddingRight"]) {
        model.textPaddingRight = [RCTConvert NSInteger:[dir objectForKey:@"textPaddingRight"]];
    }
    if ([keys containsObject: @"isOverstriking"]) {
        model.isOverstriking = [RCTConvert BOOL:[dir objectForKey:@"isOverstriking"]];
    }
    NSDictionary *progressDic = [dir objectForKey:@"progressStyle"] ? [RCTConvert NSDictionary:[dir objectForKey:@"progressStyle"]] : nil;
    if (progressDic != nil) {
        ProgressStyle *defaultStyle = self.reportTableModel.itemConfig.progressStyle;
        ProgressStyle *progressStyle = [[ProgressStyle alloc] init];
        progressStyle.height = [[progressDic objectForKey:@"height"] floatValue] ?: defaultStyle.height;
        progressStyle.marginHorizontal = [[progressDic objectForKey:@"marginHorizontal"] floatValue]  ?: defaultStyle.marginHorizontal;
        progressStyle.startRatio = [[progressDic objectForKey:@"startRatio"] floatValue];
        progressStyle.endRatio = [[progressDic objectForKey:@"endRatio"] floatValue];
        progressStyle.cornerRadius = [[progressDic objectForKey:@"cornerRadius"] floatValue] ?: defaultStyle.cornerRadius;
        NSArray *arr = [progressDic objectForKey:@"colors"];
        NSMutableArray *colors = [NSMutableArray arrayWithCapacity: arr.count];
        for (NSString *str in arr) {
            [colors addObject:[self colorFromHex:str].CGColor];
        }
        progressStyle.colors = colors;
        NSDictionary *antsLineDic = [progressDic objectForKey:@"antsLineStyle"] ? [RCTConvert NSDictionary:[progressDic objectForKey:@"antsLineStyle"]] : nil;
        if (antsLineDic != nil) {
            AntsLineStyle *antsLineStyle = [[AntsLineStyle alloc] init];
            antsLineStyle.lineWidth = [[antsLineDic objectForKey:@"lineWidth"] floatValue] ?: defaultStyle.antsLineStyle.lineWidth;
            antsLineStyle.lineRatio = [[antsLineDic objectForKey:@"lineRatio"] floatValue];
            antsLineStyle.color = [self colorFromHex: [antsLineDic objectForKey:@"color"]] ?: defaultStyle.antsLineStyle.color;
            antsLineStyle.lineDashPattern = [RCTConvert NSArray:[antsLineDic objectForKey:@"lineDashPattern"]] ?: defaultStyle.antsLineStyle.lineDashPattern;
            progressStyle.antsLineStyle = antsLineStyle;
        }
        model.progressStyle = progressStyle;
    }
    NSDictionary *iconDic = [dir objectForKey:@"icon"] ? [RCTConvert NSDictionary:[dir objectForKey:@"icon"]] : nil;
    if (iconDic != nil) {
        IconStyle *icon = [[IconStyle alloc] init];
        icon.size = CGSizeMake([[iconDic objectForKey:@"width"] floatValue], [[iconDic objectForKey:@"height"] floatValue]);
        icon.path = [iconDic objectForKey:@"path"];
        icon.imageAlignment = [[iconDic objectForKey:@"imageAlignment"] integerValue];
        if ([iconDic objectForKey:@"paddingHorizontal"]) {
            icon.paddingHorizontal = [[iconDic objectForKey:@"paddingHorizontal"] floatValue];
        }
        model.iconStyle = icon;
    }
    NSDictionary *floatIconDic = [dir objectForKey:@"floatIcon"] ? [RCTConvert NSDictionary:[dir objectForKey:@"floatIcon"]] : nil;
    if (floatIconDic != nil) {
        FloatIconStyle *floatIcon = [[FloatIconStyle alloc] init];
        floatIcon.size = CGSizeMake([[floatIconDic objectForKey:@"width"] floatValue], [[floatIconDic objectForKey:@"height"] floatValue]);
        floatIcon.path = [floatIconDic objectForKey:@"path"];
        floatIcon.top = [[floatIconDic objectForKey:@"top"] floatValue];
        floatIcon.left = [[floatIconDic objectForKey:@"left"] floatValue];
        floatIcon.right = [[floatIconDic objectForKey:@"right"] floatValue];
        floatIcon.bottom = [[floatIconDic objectForKey:@"bottom"] floatValue];
        model.floatIcon = floatIcon;
    }
    NSDictionary *extraTextDic = [dir objectForKey:@"extraText"] ? [RCTConvert NSDictionary:[dir objectForKey:@"extraText"]] : nil;
    if (extraTextDic != nil) {
        ExtraText *text = [[ExtraText alloc] init];
        text.text = [extraTextDic objectForKey:@"text"];
        text.isLeft = [RCTConvert BOOL:[extraTextDic objectForKey:@"isLeft"]];
        NSDictionary *backgroundStyleDic = [extraTextDic objectForKey:@"backgroundStyle"];
        if (backgroundStyleDic) {
            ExtraTextBackGroundStyle *bgStyle = [[ExtraTextBackGroundStyle alloc] init];
            bgStyle.width = [[backgroundStyleDic objectForKey:@"width"] floatValue];
            bgStyle.height = [[backgroundStyleDic objectForKey:@"height"] floatValue];
            bgStyle.radius = [[backgroundStyleDic objectForKey:@"radius"] floatValue];
            bgStyle.color = [self colorFromHex: [backgroundStyleDic objectForKey:@"color"]];
            text.backgroundStyle = bgStyle;
        }
        NSDictionary *styleDic = [extraTextDic objectForKey:@"style"];
        if (styleDic) {
            ExtraTextStyle *style = [[ExtraTextStyle alloc] init];
            style.fontSize = [[styleDic objectForKey:@"fontSize"] floatValue];
            style.color = [self colorFromHex: [styleDic objectForKey:@"color"]];
            text.style = style;
        }
        model.extraText = text;
    }
    NSArray *richTextArr = [dir objectForKey:@"richText"] ? [RCTConvert NSArray:[dir objectForKey:@"richText"]] : nil;
    if (richTextArr && richTextArr.count > 0) {
        NSMutableAttributedString *attributedText = [[NSMutableAttributedString alloc] init];
        CGFloat tagTextWidth = 0;
        for (NSDictionary *richTextDic in richTextArr) {
            NSDictionary *style = [richTextDic objectForKey:@"style"];
            NSString *text = [RCTConvert NSString: [richTextDic objectForKey:@"text"]];
            NSRange range = NSMakeRange(attributedText.length, text.length);
            NSArray *textStyleKeys = style != nil ? [style allKeys] : @[];
            // basic
            BOOL isOverstriking = [textStyleKeys containsObject:@"isOverstriking"] ? [RCTConvert BOOL:[style objectForKey:@"isOverstriking"]] : model.isOverstriking;
            CGFloat fontSize = [textStyleKeys containsObject:@"fontSize"] ? [RCTConvert CGFloat:[style objectForKey:@"fontSize"]] : model.fontSize;
            UIFont *font = isOverstriking ? [UIFont boldSystemFontOfSize:fontSize] : [UIFont systemFontOfSize:fontSize];
            UIColor *textColor = [textStyleKeys containsObject:@"textColor"] ? [self colorFromHex: [style objectForKey:@"textColor"]] : model.textColor;
            
            // append
            CGFloat borderRadius = [textStyleKeys containsObject:@"borderRadius"] ? [RCTConvert CGFloat:[style objectForKey:@"borderRadius"]] : 0;
            CGFloat borderWidth = [textStyleKeys containsObject:@"borderWidth"] ? [RCTConvert CGFloat:[style objectForKey:@"borderWidth"]] : 0;
            UIColor *borderColor = [textStyleKeys containsObject:@"borderColor"] ? [self colorFromHex: [style objectForKey:@"borderColor"]] : nil;
            BOOL strikethrough = [textStyleKeys containsObject:@"strikethrough"] ? [RCTConvert BOOL:[style objectForKey:@"strikethrough"]] : false;
            CGFloat height = [textStyleKeys containsObject:@"height"] ? [RCTConvert CGFloat:[style objectForKey:@"height"]] : fontSize * 1.5;
            CGFloat paddingHorizontal = [textStyleKeys containsObject:@"paddingHorizontal"] ? [RCTConvert CGFloat:[style objectForKey:@"paddingHorizontal"]] : fontSize * 0.4;
            UIColor *backgroundColor = [textStyleKeys containsObject:@"backgroundColor"] ? [self colorFromHex: [style objectForKey:@"backgroundColor"]] : nil;
            NSString *lineBreakMode = [textStyleKeys containsObject:@"lineBreakMode"] ? [RCTConvert NSString:[style objectForKey:@"lineBreakMode"]] : @"default";
            
            CGFloat paddingWidth = (model.textPaddingLeft ?: model.textPaddingHorizontal) + (model.textPaddingRight ?: model.textPaddingHorizontal); // 基础padding
            CGFloat textWidth = [self getTextWidth:text withTextSize:fontSize withMaxWith:CGFLOAT_MAX].size.width;
            BOOL breakLine = (tagTextWidth + textWidth + 4) > (maxWidth - paddingHorizontal * 2 - paddingWidth); // 4 是与下一个的间距
            if (breakLine && [lineBreakMode isEqualToString:@"aLine"]) {
                text = [self truncateTextToFitWidth:text withFont:font maxWidth : maxWidth - paddingHorizontal * 2 - paddingWidth];
                textWidth =  [self getTextWidth:text withTextSize:fontSize withMaxWith:CGFLOAT_MAX].size.width;
                tagTextWidth = 0;
            }
            
            BOOL isEmpty = [attributedText.string isEqual:@""];
            if (borderColor != nil) {
                // 支持border
                TextBoderModel *labelStyle = [[TextBoderModel alloc] init];
                labelStyle.borderColor = borderColor;
                labelStyle.borderWidth = borderWidth;
                labelStyle.borderRadius = borderRadius;
                labelStyle.textWitdh = textWidth + paddingHorizontal * 2;
                labelStyle.paddingHor = paddingHorizontal;
                labelStyle.paddingVer = (height - fontSize) / 2;
                labelStyle.backgroundColor = backgroundColor;
                labelStyle.isOverstriking = isOverstriking;
                labelStyle.font = font;
                labelStyle.textColor = textColor;
                labelStyle.text = text;
                
                NSTextAttachment *attachment = [[NSTextAttachment alloc] init];
                UIImage *image = [UIImage imageWithBorder:labelStyle];
                attachment.image = image;
                // 自动使用 lineBreakMode aLine
                NSDictionary *attributes = @{
                    NSFontAttributeName: font,
                };
                NSMutableAttributedString *tagString = breakLine ? [[NSMutableAttributedString alloc] initWithString:isEmpty ? @"" : @"\n" attributes:attributes] : [[NSMutableAttributedString alloc] initWithString: tagTextWidth == 0 ? @"" : @" " attributes:attributes];
                [tagString appendAttributedString: [NSAttributedString attributedStringWithAttachment:attachment]];
                [attributedText appendAttributedString: tagString];
            } else if (backgroundColor != nil) {
                ExtraText *extraText = [[ExtraText alloc] init];
                extraText.text = text;
                
                ExtraTextBackGroundStyle *bgStyle = [[ExtraTextBackGroundStyle alloc] init];
                bgStyle.width = textWidth + paddingHorizontal * 2;
                bgStyle.height = height;
                bgStyle.radius = borderRadius;
                bgStyle.color = backgroundColor;
                extraText.backgroundStyle = bgStyle;
               
                ExtraTextStyle *style1 = [[ExtraTextStyle alloc] init];
                style1.fontSize = fontSize;
                style1.color = textColor;
                extraText.style = style1;
             
                NSTextAttachment *attachment = [[NSTextAttachment alloc] init];
                UIImage *image = [UIImage imageWithExtra:extraText];
                attachment.image = image;
                
                // 自动使用 lineBreakMode aLine
                NSDictionary *attributes = @{NSFontAttributeName: font};
                NSMutableAttributedString *tagString = breakLine ? [[NSMutableAttributedString alloc] initWithString:isEmpty ? @"" : @"\n"attributes:attributes] : [[NSMutableAttributedString alloc] initWithString: tagTextWidth == 0 ? @"" : @" " attributes:attributes];
                [tagString appendAttributedString: [NSAttributedString attributedStringWithAttachment:attachment]];
                [attributedText appendAttributedString: tagString];
            } else {
                [attributedText appendAttributedString: [[NSMutableAttributedString alloc] initWithString:text]];
                NSMutableDictionary *att = [NSMutableDictionary dictionaryWithDictionary:@{
                    NSForegroundColorAttributeName: textColor,
                    NSFontAttributeName: font
                }];
                if (strikethrough) {
                    att[NSStrikethroughStyleAttributeName] = @(NSUnderlineStyleSingle);
                }
                [attributedText addAttributes:att range:range];
            }
            tagTextWidth += textWidth + paddingHorizontal * 2 + 4;
        }
        model.richText = attributedText;
    }
    return  model;
}

- (NSString *)truncateTextToFitWidth:(NSString *)text withFont:(UIFont *)font maxWidth:(CGFloat)maxWidth {
    // 创建NSAttributedString
    CGSize size = [text boundingRectWithSize:CGSizeMake(CGFLOAT_MAX, CGFLOAT_MAX) options:NSStringDrawingUsesLineFragmentOrigin attributes:@{NSFontAttributeName:font} context:nil].size;
    
    // 如果宽度超过了限制
    if (size.width > maxWidth) {
        NSAttributedString *attributedString = [[NSAttributedString alloc] initWithString:text attributes:@{ NSFontAttributeName : font }];
        // 开始截取文本
        NSAttributedString *truncatedText;
        // 使用boundingRectWithSize:options:context来更精确地控制, 20 是...
        CGRect rect = [attributedString boundingRectWithSize:CGSizeMake(maxWidth, CGFLOAT_MAX)
                                                      options:(NSStringDrawingUsesLineFragmentOrigin | NSStringDrawingUsesFontLeading)
                                                    context:nil];
        // 获取实际显示的文本范围
        NSRange displayRange = NSMakeRange(0, rect.size.width / attributedString.size.width * attributedString.length);
        // 截取并添加省略号
        truncatedText = [attributedString attributedSubstringFromRange:displayRange];
        truncatedText = [NSString stringWithFormat:@"%@...", truncatedText.string];
        
        return truncatedText;
    }
    // 如果不需要截取直接返回原始文本
    return text;
}

- (UIColor *)colorFromHex:(NSString *)hexString {
    NSString *cleanString = [hexString stringByReplacingOccurrencesOfString:@"#" withString:@""];
    if ([cleanString length] != 6 && [cleanString length] != 8) return nil;
    if (cleanString.length == 6) {
        cleanString = [NSString stringWithFormat:@"FF%@", cleanString];
    }
    
    unsigned int a, r, g, b;
    NSRange range;
    range.length = 2;
    
    range.location = 0;
    [[NSScanner scannerWithString:[cleanString substringWithRange:range]] scanHexInt:&a];
    
    range.location = 2;
    [[NSScanner scannerWithString:[cleanString substringWithRange:range]] scanHexInt:&r];
    
    range.location = 4;
    [[NSScanner scannerWithString:[cleanString substringWithRange:range]] scanHexInt:&g];
    
    range.location = 6;
    [[NSScanner scannerWithString:[cleanString substringWithRange:range]] scanHexInt:&b];
    
    return [UIColor colorWithRed:r/255.0 green:g/255.0 blue:b/255.0 alpha:a/255.0];
}


@end
