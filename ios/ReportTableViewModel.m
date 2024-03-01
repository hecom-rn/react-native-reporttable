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
            if (_headerView != nil && self.headerView.frame.size.height != headerViewSize.height) {
                // header 更新
                [self.headerView removeFromSuperview];
                _headerView = nil;
            }
            if (_headerView == nil) {
                [self.headerScrollView addSubview: self.headerView];
            }
            self.headerView.frame = CGRectMake(0, 0, headerViewSize.width, headerViewSize.height);
        }
        // 更新了heaher 要更新tableHight
//        CGRect tableRect = self.reportTableModel.tableRect;
//        tableRect.size.height = MIN(tableRect.size.height, self.dataHeight + headerViewSize.height);
//        self.reportTableView.frame = tableRect;
    }

    self.headerScrollView.contentSize = CGSizeMake(headerViewSize.width, 0);
    self.headerScrollView.frame = CGRectMake(0, 0, self.reportTableView.frame.size.width, headerViewSize.height);
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

- (void)setItemConfig:(NSDictionary *)itemConfig {
    ItemModel *model = [[ItemModel alloc] init];

    model.backgroundColor = [RCTConvert UIColor:[itemConfig objectForKey:@"backgroundColor"]];
    model.fontSize = [RCTConvert CGFloat:[itemConfig objectForKey:@"fontSize"]];
    model.textColor = [RCTConvert UIColor:[itemConfig objectForKey:@"textColor"]];
    model.textAlignment = [RCTConvert NSInteger:[itemConfig objectForKey:@"textAlignment"]];
    model.textPaddingHorizontal = [RCTConvert NSInteger:[itemConfig objectForKey:@"textPaddingHorizontal"]];
    
    model.splitLineColor = [RCTConvert UIColor:[itemConfig objectForKey:@"splitLineColor"]];
    model.classificationLineColor = [RCTConvert UIColor:[itemConfig objectForKey:@"classificationLineColor"]];
    model.isOverstriking = [RCTConvert BOOL:[itemConfig objectForKey:@"isOverstriking"]];
    
    self.reportTableModel.itemConfig = model;
    
    self.propertyCount += 1;
    [self reloadCheck];
}

- (void)reloadCheck {
    if (self.propertyCount >= 20) {
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
        NSInteger curKeyIndex = -1;
        NSInteger sameLenth = 1;
        for (int j = 0; j < dataSource[i].count; j ++) {
            NSDictionary *dir = dataSource[i][j];
            ItemModel *model = [self generateItemModel: dir];
            model.columIndex = j;
            if (curKeyIndex != model.keyIndex || j == rowCount - 1) { // 已经到末尾了，处理了本次循环
                for(int k = 0; k < sameLenth; k++) {
                   [mergeLen addObject:@(sameLenth)];
                }
                if (j == rowCount - 1 && curKeyIndex != model.keyIndex) {
                    // 但是最后一个不是横向合并的，需要纠正为1
                    mergeLen[mergeLen.count - 1] = @(1);
                }
                sameLenth = 1;
            } else {
                sameLenth += 1;
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
            NSInteger mergeNum = [mergeLen[j] intValue];
            ItemModel *model = modelArr[j];
            NSDictionary *dir = dataSource[i][j];
            BOOL showLock = false;
            if (i == 0) {
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
            CGFloat exceptText = 2 * model.textPaddingHorizontal + imageIconWidth + (model.extraText != nil ? model.extraText.backgroundStyle.width + 2 : 0) ; //margin
            CGFloat boundWidth = MAX(maxWidth, mergeNum * minWidth) - exceptText;
            CGRect textRect = [model.title isEqualToString:@"--"] ? CGRectMake(0, 0, 30, model.fontSize) : model.richText != nil ? [self getAttTextWidth:model.richText withMaxWith: boundWidth] : [self getTextWidth: model.title withTextSize: model.fontSize withMaxWith: boundWidth];
            CGFloat tolerant = 8; // 额外的容错空间
            if (textRect.size.width + tolerant + exceptText > mergeNum * minWidth || textRect.size.height > model.fontSize * 1.5) {
                BOOL useMerge = mergeNum > maxWidth/ minWidth; // 当横向有合并时，使用最小宽度来计算对应的高
                if (textRect.size.height < model.fontSize * 1.9) {
                   // minWidth < text < maxWidth
                    rowWith = useMerge ? maxWidth + tolerant : textRect.size.width + exceptText + tolerant;
                } else {
                   // 多行
                    rowWith = useMerge ? minWidth : maxWidth;
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

    if (self.reportTableModel.onContentSize != nil) {
        NSNumber *width = [rowsWidth valueForKeyPath:@"@sum.self"];
        NSNumber *height = [cloumsHight valueForKeyPath:@"@sum.self"];
        self.reportTableModel.onContentSize(@{@"width": @([width floatValue] + (rowsWidth.count + 1) * 1), @"height": @([height floatValue] + (cloumsHight.count + 1) * 1)});
    }
    
    self.reportTableView.frame = self.reportTableModel.tableRect;
    self.headerScrollView.frame = CGRectMake(0, 0, self.reportTableModel.tableRect.size.width, self.headerScrollView.frame.size.height);
    if (frozenArray.count > 0 && self.reportTableModel.permutable) {
        // 如果有合并的则让permutable失效
        self.reportTableModel.permutable = NO;
    }
    self.reportTableView.reportTableModel = self.reportTableModel;
    
}

- (ItemModel *)generateItemModel:(NSDictionary *)dir {
    ItemModel *model = [[ItemModel alloc] init];
    model.itemConfig = self.reportTableModel.itemConfig;
    NSArray *keys = [dir allKeys];
    model.keyIndex = [RCTConvert NSInteger:[dir objectForKey:@"keyIndex"]];
    model.title = [RCTConvert NSString:[dir objectForKey:@"title"]];
    if ([keys containsObject: @"backgroundColor"]) {
        model.backgroundColor = [RCTConvert UIColor:[dir objectForKey:@"backgroundColor"]];
    }
    if ([keys containsObject: @"fontSize"]) {
        model.fontSize = [RCTConvert CGFloat:[dir objectForKey:@"fontSize"]];
    }
    if ([keys containsObject: @"textColor"]) {
        model.textColor = [RCTConvert UIColor:[dir objectForKey:@"textColor"]] ;
    }
    if ([keys containsObject: @"boxLineColor"]) {
        model.boxLineColor = [RCTConvert UIColor:[dir objectForKey:@"boxLineColor"]] ;
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
        model.classificationLineColor = [RCTConvert UIColor:[dir objectForKey:@"classificationLineColor"]];
    }
    if ([keys containsObject: @"textPaddingHorizontal"]) {
        model.textPaddingHorizontal = [RCTConvert NSInteger:[dir objectForKey:@"textPaddingHorizontal"]];
    }
    if ([keys containsObject: @"isOverstriking"]) {
        model.isOverstriking = [RCTConvert BOOL:[dir objectForKey:@"isOverstriking"]];
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
            bgStyle.color = [RCTConvert UIColor:[backgroundStyleDic objectForKey:@"color"]];
            text.backgroundStyle = bgStyle;
        }
        NSDictionary *styleDic = [extraTextDic objectForKey:@"style"];
        if (styleDic) {
            ExtraTextStyle *style = [[ExtraTextStyle alloc] init];
            style.fontSize = [[styleDic objectForKey:@"fontSize"] floatValue];
            style.color =  [RCTConvert UIColor:[styleDic objectForKey:@"color"]] ;
            text.style = style;
        }
        model.extraText = text;
    }
    NSArray *richTextArr = [dir objectForKey:@"richText"] ? [RCTConvert NSArray:[dir objectForKey:@"richText"]] : nil;
    if (richTextArr && richTextArr.count > 0) {
        NSMutableAttributedString *attributedText = [[NSMutableAttributedString alloc] init];
        for (NSDictionary *richTextDic in richTextArr) {
            NSDictionary *style = [richTextDic objectForKey:@"style"];
            NSString *text = [RCTConvert NSString: [richTextDic objectForKey:@"text"]];
            NSRange range = NSMakeRange(attributedText.length, text.length);
            [attributedText appendAttributedString: [[NSMutableAttributedString alloc] initWithString:text]];
            NSArray *textStyleKeys = style != nil ? [style allKeys] : @[];
            // basic
            BOOL isOverstriking = [textStyleKeys containsObject:@"isOverstriking"] ? [RCTConvert BOOL:[style objectForKey:@"isOverstriking"]] : model.isOverstriking;
            CGFloat fontSize = [textStyleKeys containsObject:@"fontSize"] ? [RCTConvert CGFloat:[style objectForKey:@"fontSize"]] : model.fontSize;
            UIFont *font = isOverstriking ? [UIFont boldSystemFontOfSize:fontSize] : [UIFont systemFontOfSize:fontSize];
            UIColor *textColor = [textStyleKeys containsObject:@"textColor"] ? [RCTConvert UIColor:[style objectForKey:@"textColor"]] : model.textColor;
            // append
            CGFloat borderRadius = [textStyleKeys containsObject:@"borderRadius"] ? [RCTConvert CGFloat:[style objectForKey:@"borderRadius"]] : 0;
            CGFloat borderWidth = [textStyleKeys containsObject:@"borderWidth"] ? [RCTConvert CGFloat:[style objectForKey:@"borderWidth"]] : 0;
            UIColor *borderColor = [textStyleKeys containsObject:@"borderColor"] ? [RCTConvert UIColor:[style objectForKey:@"borderColor"]] : nil;
            BOOL strikethrough = [textStyleKeys containsObject:@"strikethrough"] ? [RCTConvert BOOL:[style objectForKey:@"strikethrough"]] : false;
            if (borderColor != nil) {
                // 支持border
                TextBoderModel *labelStyle = [[TextBoderModel alloc] init];
                labelStyle.borderColor = borderColor;
                labelStyle.borderWidth = borderWidth;
                labelStyle.borderRadius = borderRadius;
                
                labelStyle.isOverstriking = isOverstriking;
                labelStyle.font = font;
                labelStyle.textColor = textColor;
                labelStyle.text = text;
                
                NSTextAttachment *attachment = [[NSTextAttachment alloc] init];
                UIImage *image = [UIImage imageWithBorder:labelStyle];
                attachment.image = image;
                // 不知道什么原因，导致显示的attachment底部有留白。 先往上偏移一下吧
                attachment.bounds = CGRectMake(0, -font.pointSize * 0.4, image.size.width, image.size.height);
                NSAttributedString *tagString = [NSAttributedString attributedStringWithAttachment:attachment];
                attributedText = [[NSMutableAttributedString alloc] initWithAttributedString:tagString];
            } else {
                NSMutableDictionary *att = [NSMutableDictionary dictionaryWithDictionary:@{
                    NSForegroundColorAttributeName: textColor,
                    NSFontAttributeName: font
                }];
                if (strikethrough) {
                    att[NSStrikethroughStyleAttributeName] = @(NSUnderlineStyleSingle);
                }
                [attributedText addAttributes:att range:range];
            }
        }
        model.richText = attributedText;
    }
    return  model;
}

@end
