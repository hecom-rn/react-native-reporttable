//
//  ReportTableView.m
//
//
//  Created by ms on 2019/11/21.
//

#import "ReportTableView.h"
#import <ZMJGanttChart/ZMJGanttChart.h>
#import "ReportTableCell.h"
#import "ReportTableModel.h"
#import "ReportTableHeaderView.h"
#import "UIView+Toast.h"
#import "ReportTableEvent.h"
#import "UIImage+ImageTag.h"

@interface ReportTableView () <SpreadsheetViewDelegate, SpreadsheetViewDataSource, UIScrollViewDelegate>

@property (nonatomic, strong) NSMutableArray<NSArray<ItemModel *> *> *dataSource;
@property (nonatomic, strong) NSMutableArray<ForzenRange *> *frozenArray;
@property (nonatomic, strong) NSMutableArray *cloumsHight;
@property (nonatomic, strong) NSMutableArray *rowsWidth;
@property (nonatomic, assign) BOOL isOnHeader;

@property (nonatomic, strong) UIView *containerView;

@end

@implementation ReportTableView

- (void)setHeaderScrollView:(ReportTableHeaderScrollView *)headerScrollView {
    self.spreadsheetView.tableHeaderView = headerScrollView;
    _headerScrollView = headerScrollView;
    self.headerScrollView.isUserScouce = false;
    self.spreadsheetView.tableView.scrollEnabled = true;
    [self sendSubviewToBack:_headerScrollView];
    self.isOnHeader = false;
}

- (instancetype)init
{
    self = [super init];
    if (self) {
        self.clipsToBounds = true;
        self.delegate = self;
        self.bounces = false;
        self.scrollEnabled = false;
        self.contentSize = CGSizeMake(0, 0);
        // maximumZoomScale minimumZoomScale 由ViewModel控制
        self.bouncesZoom = false;
        self.showsVerticalScrollIndicator = false;
        self.showsHorizontalScrollIndicator = false;
        self.backgroundColor = [UIColor whiteColor];
        
        self.containerView = [[UIView alloc] init];
        self.containerView.backgroundColor = [UIColor whiteColor];
        self.containerView.frame = self.bounds;
        self.containerView.userInteractionEnabled = false;
        self.containerView.layer.anchorPoint = CGPointMake(0, 0);
        [self addSubview: self.containerView];
        
        [self.spreadsheetView registerClass:[ReportTableCell class] forCellWithReuseIdentifier: [ReportTableCell description]];
        [self.spreadsheetView flashScrollIndicators];
    }
    return self;
}

- (void)setReportTableModel:(ReportTableModel *)reportTableModel{
    _reportTableModel = reportTableModel;
    self.dataSource = reportTableModel.dataSource;
    self.frozenArray = reportTableModel.frozenArray;
    self.cloumsHight = reportTableModel.cloumsHight;
    self.rowsWidth = reportTableModel.rowsWidth;
    
  
    CGFloat hairline = 1;
    self.spreadsheetView.intercellSpacing = CGSizeMake(hairline, hairline);
    self.spreadsheetView.gridStyle = [[GridStyle alloc] initWithStyle:GridStyle_solid width: hairline color: reportTableModel.lineColor];
    
    // 且在横向显示范围内显示完全的时候再显示，确保数据少时不显示border （业务要求
    NSNumber *width = [reportTableModel.rowsWidth valueForKeyPath:@"@sum.self"];
    if (reportTableModel.showBorder && [width floatValue] >= reportTableModel.tableRect.size.width * self.zoomScale) {
        self.spreadsheetView.layer.masksToBounds = YES;
        self.spreadsheetView.layer.borderColor = reportTableModel.lineColor.CGColor;
        self.spreadsheetView.layer.borderWidth = hairline;
    }
   
    [self.spreadsheetView reloadData];
    [self scrollViewDidZoom: self];
    [self setMergedCellsLabelOffset];
    [ReportTableEvent tableDidLayout]; // 回调完成回调
}

- (UIView *)viewForZoomingInScrollView:(UIScrollView *)scrollView {
    return self.containerView;
}

- (void)scrollViewDidZoom:(UIScrollView *)scrollView {
  
    UIView *contentView = self.spreadsheetView;
    
    CGFloat zoomScale = scrollView.zoomScale;
    contentView.transform = CGAffineTransformMakeScale(zoomScale, zoomScale);
    
    CGSize headerSize = self.headerScrollView.frame.size;
    self.spreadsheetView.tableView.contentInset = UIEdgeInsetsMake(headerSize.height / zoomScale, 0, 0, 0);
    
    // 调整contentView的位置和大小以保持子视图位置不变
    CGRect newFrame = contentView.frame;
    newFrame.origin.x = scrollView.contentInset.left;
    newFrame.origin.y = scrollView.contentInset.top;
    newFrame.size.width = self.reportTableModel.tableRect.size.width;
    newFrame.size.height = self.reportTableModel.tableRect.size.height;
    contentView.frame = newFrame;
}

- (void)scrollViewDidEndZooming:(UIScrollView *)scrollView withView:(UIView *)view atScale:(CGFloat)scale {
    // 修正headerView的层级
    [self sendSubviewToBack: self.headerScrollView];
    self.headerScrollView.isUserScouce = false;
    self.isOnHeader = false;
    [self setMergedCellsLabelOffset];
}

- (NSInteger)sumOfFirstN:(NSArray *)array n:(NSInteger)n {
    NSInteger sum = 0;
    for (NSInteger i = 0; i < n && i < array.count; i++) {
        sum += [array[i] integerValue];
    }
    return sum;
}


- (void)scrollToLineX:(NSInteger)lineX lineY:(NSInteger)lineY offsetX:(float)offsetX offsetY:(float)offsetY animated:(BOOL)animated {
    float x, y = 0;
    CGFloat hairline = 1;
    if (lineX >= 0) {
        y = [self sumOfFirstN:self.reportTableModel.cloumsHight n:lineX] + lineX * hairline;
    } else {
        y = self.spreadsheetView.contentOffset.y;
    }
    if (lineY >= 0) {
        x = [self sumOfFirstN:self.reportTableModel.rowsWidth n:lineY] + lineY * hairline;
    } else {
        x = self.spreadsheetView.contentOffset.x;
    }
    x += offsetX;
    y += offsetY;
    
    if (_spreadsheetView) {
        [self.spreadsheetView setContentOffset:CGPointMake(x, y) animated: animated];
    }
}

- (void)scrollToBottom {
    if (_spreadsheetView) {
        float x = self.spreadsheetView.contentOffset.x;
        float y = MAX(0, self.spreadsheetView.contentSize.height - self.spreadsheetView.frame.size.height / self.zoomScale);
        [self.spreadsheetView setContentOffset:CGPointMake(x, y) animated: true];
    }
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event {
    if (self.isZooming) {
        return [super hitTest:point withEvent:event];
    }
    BOOL isOnHeader = point.y < (self.headerScrollView.frame.size.height - self.headerScrollView.contentOffset.y) && self.spreadsheetView.contentOffset.y <= 0;
    if (isOnHeader == YES && self.isOnHeader == false) {
        self.headerScrollView.isUserScouce = true;
        self.headerScrollView.offset = self.spreadsheetView.contentOffset.y * self.zoomScale;
        [self.headerScrollView scrollViewDidScroll: self.headerScrollView];
        self.spreadsheetView.tableView.scrollEnabled = false;
        [self bringSubviewToFront: self.headerScrollView];
        self.isOnHeader = isOnHeader;
    } else if (isOnHeader == false && self.isOnHeader == true) {
        self.headerScrollView.isUserScouce = false;
        self.spreadsheetView.tableView.scrollEnabled = true;
        [self sendSubviewToBack: self.headerScrollView];
        self.isOnHeader = isOnHeader;
    } else {
        self.isOnHeader = !isOnHeader;
    }
    return [super hitTest:point withEvent:event];
}

- (SpreadsheetView *)spreadsheetView {
    if (!_spreadsheetView) {
        _spreadsheetView = ({
            SpreadsheetView *ssv = [SpreadsheetView new];
            ssv.showsVerticalScrollIndicator = false;
            ssv.showsHorizontalScrollIndicator = false;
            ssv.dataSource = self;
            ssv.delegate   = self;
            ssv.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
            ssv.frame = self.bounds;
            ssv.bounces = false;
            __weak typeof(self)weak_self = self;
            ssv.onScrollEnd = ^(BOOL isOnEnd) {
                if (weak_self.reportTableModel.onScrollEnd != nil) {
                    weak_self.reportTableModel.onScrollEnd(@{@"isEnd": @YES});
                }
            };
            ssv.onScroll = ^(NSDictionary *object) {
                if (weak_self.reportTableModel.onScroll != nil) {
                    weak_self.reportTableModel.onScroll(object);
                }
                [weak_self setMergedCellsLabelOffset];
            };
            ssv.rowHeaderView.accessibilityIdentifier = [NSString stringWithFormat:@"testID_rowHeaderView"];
            ssv.cornerView.accessibilityIdentifier = [NSString stringWithFormat:@"testID_cornerView"];
            ssv.tableView.accessibilityIdentifier = [NSString stringWithFormat:@"testID_tableView"];
            ssv.columnHeaderView.accessibilityIdentifier = [NSString stringWithFormat:@"testID_columnHeaderView"];
            [self addSubview:ssv];
            ssv;
        });
    }
    return _spreadsheetView;
}
    
- (void)setMergedCellsLabelOffset {
    if (self.frozenArray.count > 0) {
        SpreadsheetView *ssv = self.spreadsheetView;
        // 取合并的cell
        [ssv.mergedCells enumerateObjectsUsingBlock:^(ZMJCellRange * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
            ReportTableCell *cell = [ssv cellForItemAt: [NSIndexPath indexPathWithRow: obj.from.row column: obj.from.column]];
            BOOL isLockRow = obj.from && obj.from.row <= self.reportTableModel.frozenRows;
            // cell 在显示池
            if (cell && cell.label != nil && !isLockRow) {
                CGFloat tableHeight = ssv.tableView.frame.size.height;
                CGRect rect = cell.frame;
                // label react 超出table Height
                if (rect.size.height > tableHeight) {
                    CGFloat offset = ssv.tableView.contentOffset.y;
                    CGFloat paddingV = 13; // 上下间距
                    CGFloat labelH = cell.label.frame.size.height + paddingV * 2;
                    // 在显示范围内
                    if (rect.origin.y - tableHeight <= offset && rect.origin.y + rect.size.height - paddingV >= offset) {
                        CGFloat halfH = rect.size.height / 2 - labelH / 2;
                        CGFloat y = offset - rect.origin.y - halfH; // 要偏离的距离
                        y = y >= 0 ? MIN(halfH, y) : MAX(-halfH, y); // 先偏移到两端
                        
                        BOOL isFull = offset >= rect.origin.y && offset <= rect.origin.y + rect.size.height - tableHeight;
                        CGFloat endH = rect.origin.y + rect.size.height - offset > labelH ? (rect.origin.y + rect.size.height - labelH - offset) : 0; //  剩余可见高度
                        BOOL isEnd = rect.size.height + rect.origin.y - offset > 0 && rect.size.height + rect.origin.y - offset < tableHeight;
                        CGFloat startH = MAX(0, tableHeight - rect.origin.y + offset - labelH);
                        CGFloat over = isFull ? (tableHeight - labelH) / 2 : isEnd ? endH / 2 : startH / 2; // 补的距离
                        y = y + over;
                        
                        cell.label.transform = CGAffineTransformMakeTranslation(0, y);
                    }
                } else {
                    // 缩放后影响了显示范围， 则恢复
                    if (cell.label.transform.ty != 0) {
                        cell.label.transform = CGAffineTransformMakeTranslation(0, 0);
                    }
                }
            }
        }];
    }
}


//MARK: DataSource
- (NSInteger)numberOfColumns:(SpreadsheetView *)spreadsheetView {
    if (self.dataSource.count > 0) {
        return self.dataSource[0].count;
    } else {
        return 0;
    }
}

- (NSInteger)numberOfRows:(SpreadsheetView *)spreadsheetView {
    return self.dataSource.count;
}

- (CGFloat)spreadsheetView:(SpreadsheetView *)spreadsheetView widthForColumn:(NSInteger)column {
    return [self.rowsWidth[column] floatValue];
}

- (CGFloat)spreadsheetView:(SpreadsheetView *)spreadsheetView heightForRow:(NSInteger)row {
    return [self.cloumsHight[row] floatValue];
}

- (NSInteger)frozenColumns:(SpreadsheetView *)spreadsheetView {
    return self.reportTableModel.frozenColumns;
}

- (NSInteger)frozenRows:(SpreadsheetView *)spreadsheetView {
    return self.reportTableModel.frozenRows;
}

- (NSArray<ZMJCellRange *> *)mergedCells:(SpreadsheetView *)spreadsheetView {
    NSMutableArray<ZMJCellRange *> *result = [NSMutableArray array];
    for (int i = 0; i < self.frozenArray.count; i++) {
        ForzenRange *rangeModel = self.frozenArray[i];
        [result addObject: [ZMJCellRange cellRangeFrom:[Location locationWithRow:rangeModel.startX column:rangeModel.startY]
                                                    to:[Location locationWithRow:rangeModel.endX column:rangeModel.endY]]];
    }
    return result.copy;
}

- (ZMJCell *)spreadsheetView:(SpreadsheetView *)spreadsheetView cellForItemAt:(NSIndexPath *)indexPath {
    NSInteger column = indexPath.column;
    NSInteger row = indexPath.row;

    ItemModel *model = self.dataSource[row][column];
    ReportTableCell *cell = (ReportTableCell *)[spreadsheetView dequeueReusableCellWithReuseIdentifier:[ReportTableCell description] forIndexPath: indexPath];
    cell.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    [cell updateContentView: model.textPaddingHorizontal];
    if (model.iconStyle != nil) {
        cell.icon = model.iconStyle;
    }
    if (row == 0) {
        if (self.reportTableModel.permutable) {
            if (column >= self.reportTableModel.oriFrozenColumns) {
                BOOL isLocked = self.reportTableModel.permutedArr.count + self.reportTableModel.oriFrozenColumns > column;
                cell.isLocked = isLocked;
            }
        } else {
            if (self.reportTableModel.frozenPoint > 0) {
                if (column == self.reportTableModel.frozenPoint - model.horCount) {
                    cell.isLocked = column == self.reportTableModel.frozenColumns - model.horCount;
                }
            } else if (self.reportTableModel.frozenCount > 0) {
                if (column < self.reportTableModel.frozenCount) {
                    cell.isLocked = column < self.reportTableModel.frozenColumns;
                }
            }
        }
    }
    cell.gridlines = nil;
    cell.contentView.accessibilityIdentifier = [NSString stringWithFormat:@"testID_%d_%d", row, column];
    if (ClassificationLinePositionTop & model.classificationLinePosition) {
        cell.gridlines.top = [GridStyle style:GridStyle_solid width:1 color: model.classificationLineColor];
    }
    if (ClassificationLinePositionLeft & model.classificationLinePosition) {
        cell.gridlines.left = [GridStyle style:GridStyle_solid width:1 color: model.classificationLineColor];
    }
    if (ClassificationLinePositionRight & model.classificationLinePosition) {
        cell.gridlines.right = [GridStyle style:GridStyle_solid width:1 color: model.classificationLineColor];
    }
    if (ClassificationLinePositionBottom & model.classificationLinePosition) {
        cell.gridlines.bottom = [GridStyle style:GridStyle_solid width:1 color: model.classificationLineColor];
    }
    cell.contentView.backgroundColor = model.backgroundColor;
    cell.textAlignment = model.textAlignment;
    cell.textPaddingHorizontal = model.textPaddingHorizontal;

    UIFont *font = model.isOverstriking || model.itemConfig.isOverstriking ? [UIFont boldSystemFontOfSize:model.fontSize] : [UIFont systemFontOfSize:model.fontSize];
    if (model.richText) {
        cell.label.attributedText = model.richText;
    } else if (model.extraText) {
        NSMutableAttributedString *attributedText = [[NSMutableAttributedString alloc] initWithString: model.title];
        NSRange range = NSMakeRange(0, model.title.length);
        [attributedText addAttribute:NSForegroundColorAttributeName value:model.textColor range:range];
        [attributedText addAttribute:NSFontAttributeName value:font range:range];
        NSTextAttachment *attachment = [[NSTextAttachment alloc] init];
        UIImage *image = [UIImage imageWithExtra:model.extraText];
        attachment.image = image;
        NSAttributedString *tagString = [NSAttributedString attributedStringWithAttachment:attachment];
        if (model.extraText.isLeft) {
            [attributedText insertAttributedString:tagString atIndex:0];
            [attributedText addAttribute:NSKernAttributeName value:@(2) range:NSMakeRange(0, 1)];
            [attributedText addAttribute:NSBaselineOffsetAttributeName value:@(-3) range:NSMakeRange(0, tagString.length)];
        } else {
            [attributedText insertAttributedString:tagString atIndex:model.title.length];
            [attributedText addAttribute:NSKernAttributeName value:@(2) range:NSMakeRange(MAX(model.title.length - 1, 0), 1)];
            [attributedText addAttribute:NSBaselineOffsetAttributeName value:@(-3) range:NSMakeRange(model.title.length, 1)];
        }
        cell.label.attributedText = attributedText;
        
    }  else {
        cell.label.text = model.title;
        cell.label.textColor = model.textColor;
        cell.label.font = font;
    }
    [cell hiddenLineView];
    [cell hiddenBoxView];
    if (model.isForbidden) {
        CGFloat x = [self.reportTableModel.rowsWidth[column] floatValue];
        CGFloat y = [self.reportTableModel.cloumsHight[row] floatValue];
        CGPoint point = CGPointMake(x, y);
        [cell drawLinePoint:point WithLineColor:self.reportTableModel.lineColor];
    } else if (model.boxLineColor != nil) {
        CGFloat x = [self.reportTableModel.rowsWidth[column] floatValue];
        CGFloat y = [self.reportTableModel.cloumsHight[row] floatValue];
        CGPoint point = CGPointMake(x, y);
        [cell drawBoxPoint:point WithLineColor: model.boxLineColor];
    }

    return cell;
}

/// Delegate
- (void)spreadsheetView:(SpreadsheetView *)spreadsheetView didSelectItemAt:(NSIndexPath *)indexPath {
    NSInteger column = indexPath.column;
    NSInteger row = indexPath.row;
    ItemModel *model = self.dataSource[row][column];
    if (self.reportTableModel.onClickEvent != nil) {
        self.reportTableModel.onClickEvent(@{
            @"keyIndex": [NSNumber numberWithInteger:model.keyIndex],
            @"rowIndex": [NSNumber numberWithInteger:row],
            @"columnIndex": [NSNumber numberWithInteger:model.columIndex], // 返回数据源的columnIndex，以为column可能会被permutable改变
            @"verticalCount": [NSNumber numberWithInteger:model.verCount],
            @"horizontalCount": [NSNumber numberWithInteger:model.horCount]
        });
    }
    if (row == 0) {
        if (self.reportTableModel.permutable) {
            if (column >= self.reportTableModel.oriFrozenColumns) {
                BOOL isLocked = self.reportTableModel.permutedArr.count + self.reportTableModel.oriFrozenColumns > column;
                if (isLocked) {
                    NSInteger fixIndex = column - self.reportTableModel.oriFrozenColumns;
                    NSNumber *oriColumn = self.reportTableModel.permutedArr[fixIndex];
                    NSArray *sortedArray = [self.reportTableModel.permutedArr sortedArrayUsingSelector:@selector(compare:)];
                    NSUInteger index = [sortedArray indexOfObject:oriColumn];
                    [self.reportTableModel.permutedArr removeObjectAtIndex:fixIndex];
                    NSInteger toColumn = [oriColumn integerValue] - index + self.reportTableModel.permutedArr.count;
                    [self changeColumn:column toColumn:toColumn inArray:self.dataSource];
                    [self changeColumn:column toColumn:toColumn inArray:self.rowsWidth];
                } else {
                    NSInteger columIndex = model.columIndex;
                    float frozenWidth = 0;
                    int frozenColumns = self.reportTableModel.oriFrozenColumns;
                    for (int j = 0; j < frozenColumns; j++) {
                        frozenWidth += [self.rowsWidth[j] floatValue];
                    }
                    NSInteger toColumn = self.reportTableModel.permutedArr.count + self.reportTableModel.oriFrozenColumns;
                    [self changeColumn:column toColumn: toColumn inArray:self.rowsWidth];
                    for (int i = frozenColumns; i < frozenColumns + self.reportTableModel.permutedArr.count + 1; i++) {
                        frozenWidth += [self.rowsWidth[i] floatValue];
                    }
                    if (frozenWidth * self.zoomScale > self.reportTableModel.tableRect.size.width - 40) {
                        [self hideAllToasts];
                        [self makeToast:@"请缩小表格或旋转屏幕后再锁定"];
                        // 撤回
                        [self changeColumn:toColumn toColumn:column inArray:self.rowsWidth];
                        return;
                    }
                    [self changeColumn:column toColumn:toColumn inArray:self.dataSource];
                    [self.reportTableModel.permutedArr addObject:@(columIndex)];
                }
                self.reportTableModel.frozenColumns = self.reportTableModel.permutedArr.count + self.reportTableModel.oriFrozenColumns;
                [self.spreadsheetView reloadData];
                [self scrollViewDidZoom: self];
            }
        } else {
            NSInteger newFrozenColums = column + model.horCount;
            if (self.reportTableModel.frozenPoint > 0) {
                if (newFrozenColums == self.reportTableModel.frozenPoint) {
                    BOOL willUnLock = self.reportTableModel.frozenColumns == self.reportTableModel.frozenPoint;
                    float frozenWidth = 0;
                    for (int i = 0; i < newFrozenColums; i++) {
                        frozenWidth += [self.rowsWidth[i] floatValue];
                    }
                    if (!willUnLock && frozenWidth * self.zoomScale > self.reportTableModel.tableRect.size.width - 40) {
                        [self hideAllToasts];
                        [self makeToast:@"请缩小表格或旋转屏幕后再锁定"];
                    } else {
                        self.reportTableModel.frozenColumns = willUnLock ? self.reportTableModel.oriFrozenColumns : self.reportTableModel.frozenPoint;
                        [self.spreadsheetView reloadData];
                        [self scrollViewDidZoom: self];
                    }
                }
            } else if (self.reportTableModel.frozenCount >= newFrozenColums) {
                self.reportTableModel.frozenColumns = self.reportTableModel.frozenColumns == newFrozenColums ? 0 : newFrozenColums;
                [self.spreadsheetView reloadData];
                [self scrollViewDidZoom: self];
            }
        }
    }
    // 注意有上面有return
}

- (void)spreadsheetViewDidLayout:(SpreadsheetView *)spreadsheetView {
    // 锁定，解除锁定时需要调用
    [self setMergedCellsLabelOffset];
}

- (void)changeColumn:(NSInteger)x toColumn:(NSInteger)y inArray:(NSMutableArray *)arr {
    if (x == y || arr.count == 0) {
        return;
    }
    if ([arr[0] isKindOfClass:[NSArray class]]) {
        for (int i = 0; i < arr.count; i++) {
            NSMutableArray *row = arr[i];
            if (x < row.count && y < row.count) {
                id obj = row[x];
                [row removeObjectAtIndex: x];
                [row insertObject:obj atIndex:y];
            }
        }
    } else {
        id obj = arr[x];
        [arr removeObjectAtIndex: x];
        [arr insertObject:obj atIndex:y];
    }
 
}

@end


