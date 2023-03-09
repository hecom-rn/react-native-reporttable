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

@interface ReportTableView () <SpreadsheetViewDelegate, SpreadsheetViewDataSource, UIScrollViewDelegate>

@property (nonatomic, strong) NSMutableArray<NSArray<ItemModel *> *> *dataSource;
@property (nonatomic, strong) NSMutableArray<ForzenRange *> *frozenArray;
@property (nonatomic, strong) NSArray *cloumsHight;
@property (nonatomic, strong) NSArray *rowsWidth;
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
        self.maximumZoomScale = 2;
        self.minimumZoomScale = 0.5;
        self.bouncesZoom = false;
        self.showsVerticalScrollIndicator = false;
        self.showsHorizontalScrollIndicator = false;
        
        self.containerView = [[UIView alloc] init];
        self.containerView.frame = self.bounds;
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
    self.spreadsheetView.gridStyle = [[GridStyle alloc] initWithStyle:GridStyle_solid width: hairline color: [UIColor redColor]];
    
    [self.spreadsheetView reloadData];
    [self scrollViewDidZoom: self];
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
}


- (void)scrollToTop {
    if (_spreadsheetView) {
        [self.spreadsheetView setContentOffset:CGPointMake(0, 0) animated: true];
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
            ssv.onScroll = ^(NSDictionary *offset) {
                if (weak_self.reportTableModel.onScroll != nil) {
                    weak_self.reportTableModel.onScroll(offset);
                }
            };
            [self addSubview:ssv];
            ssv;
        });
    }
    return _spreadsheetView;
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
    ReportTableCell *cell = (ReportTableCell *)[spreadsheetView dequeueReusableCellWithReuseIdentifier:[ReportTableCell description] forIndexPath:indexPath];
    cell.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    [cell updateContentView: model.textPaddingHorizontal];
    if (model.iconStyle != nil) {
        cell.icon = model.iconStyle;
    }
    if (row == 0) {
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
    cell.contentView.backgroundColor = model.backgroundColor;
    cell.textPaddingHorizontal = model.textPaddingHorizontal;
    cell.label.text = model.title;
    cell.label.textColor = model.textColor;
    cell.label.textAlignment = model.textAlignment;
    cell.label.font = [UIFont boldSystemFontOfSize:model.fontSize];
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
            @"columnIndex": [NSNumber numberWithInteger:column],
            @"verticalCount": [NSNumber numberWithInteger:model.verCount],
            @"horizontalCount": [NSNumber numberWithInteger:model.horCount]
        });
    }
    if (row == 0) {
        NSInteger newFrozenColums = column + model.horCount;
        if (self.reportTableModel.frozenPoint > 0) {
            if (newFrozenColums == self.reportTableModel.frozenPoint) {
                self.reportTableModel.frozenColumns = self.reportTableModel.frozenColumns == self.reportTableModel.frozenPoint ? 0 : self.reportTableModel.frozenPoint;
                [self.spreadsheetView reloadData];
                [self scrollViewDidZoom: self];
            }
        } else if (self.reportTableModel.frozenCount >= newFrozenColums) {
            self.reportTableModel.frozenColumns = self.reportTableModel.frozenColumns == newFrozenColums ? 0 : newFrozenColums;
            [self.spreadsheetView reloadData];
            [self scrollViewDidZoom: self];
        }
    }
}

@end


