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
@property (nonatomic, assign) CGFloat tableMaxHeight;
@property (nonatomic, assign) CGFloat tableMaxWidth;


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
        self.contentSize = CGSizeMake(0, 0);
        self.maximumZoomScale = 2;
        self.minimumZoomScale = 0.5;
        self.bouncesZoom = false;
        self.showsVerticalScrollIndicator = false;
        self.showsHorizontalScrollIndicator = false;
        
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
    
    self.tableMaxWidth = [[reportTableModel.rowsWidth valueForKeyPath:@"@sum.floatValue"] floatValue] + (reportTableModel.rowsWidth.count + 1) * hairline;
    self.tableMaxHeight = [[reportTableModel.cloumsHight valueForKeyPath:@"@sum.floatValue"] floatValue] + (reportTableModel.cloumsHight.count + 1) * hairline + self.headerScrollView.frame.size.height;
    
    self.spreadsheetView.intercellSpacing = CGSizeMake(hairline, hairline);
    self.spreadsheetView.gridStyle = [[GridStyle alloc] initWithStyle:GridStyle_solid width: hairline color: reportTableModel.lineColor];
    
    [self.spreadsheetView reloadData];
}

- (UIView *)viewForZoomingInScrollView:(UIScrollView *)scrollView {
    return self.spreadsheetView;
}

- (void)scrollViewDidZoom:(UIScrollView *)scrollView {
    CGFloat zoomScale = scrollView.zoomScale;
    CGFloat scale = MIN(1, zoomScale);
    CGSize size = self.reportTableModel.tableRect.size;
    CGSize headerSize = self.headerScrollView.frame.size;
    if (zoomScale == 0.5 || zoomScale == 1 || zoomScale == 2) {
        self.contentSize = CGSizeMake(0, 0);
        return;
    }

    CGRect rowRoiReact = self.spreadsheetView.rowHeaderView.frame;
    CGRect columnOriReact = self.spreadsheetView.columnHeaderView.frame;
    CGRect tableOriReact = self.spreadsheetView.tableView.frame;
    
    CGFloat x = columnOriReact.size.width == 1 ? MAX(0, tableOriReact.origin.x / zoomScale) : columnOriReact.size.width;
    CGFloat y = rowRoiReact.size.height == 1 ? tableOriReact.origin.y / zoomScale : rowRoiReact.size.height - 1;
    CGFloat width = MIN(self.tableMaxWidth, size.width / zoomScale);
    CGFloat height = size.height / zoomScale;
    CGFloat w = columnOriReact.size.width == 1 ? width : width - columnOriReact.size.width - 1;
    CGFloat h = rowRoiReact.size.height == 1 ? height : height - rowRoiReact.size.height - 1;
 
    self.spreadsheetView.tableView.contentInset = UIEdgeInsetsMake(headerSize.height / zoomScale, 0, 0, 0);
    
    self.spreadsheetView.frame = CGRectMake(0, 0, size.width, size.height);
    self.spreadsheetView.tableView.frame = CGRectMake(x, y, w, h);
    self.spreadsheetView.columnHeaderView.frame = CGRectMake(columnOriReact.origin.x, columnOriReact.origin.y, columnOriReact.size.width, columnOriReact.size.height / zoomScale);
    
    self.spreadsheetView.rowHeaderView.frame = CGRectMake(rowRoiReact.origin.x, rowRoiReact.origin.y, width, rowRoiReact.size.height);
    

    self.spreadsheetView.rowHeaderView.contentOffset = CGPointMake(self.spreadsheetView.rowHeaderView.contentOffset.x, MIN(0, self.spreadsheetView.tableView.contentOffset.y));
    self.contentSize = CGSizeMake(0, 0);
}

- (void)scrollToTop {
    if (_spreadsheetView) {
        [self.spreadsheetView setContentOffset:CGPointMake(0, 0) animated: true];
    }
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
            ssv.overlayView.touchPoint = ^(CGPoint point) {
                BOOL isOnHeader = (point.y - ssv.overlayView.contentOffset.y) < (weak_self.headerScrollView.frame.size.height -  weak_self.headerScrollView.contentOffset.y) && ssv.contentOffset.y <= 0;
                if (isOnHeader == YES && weak_self.isOnHeader == false) {
                    weak_self.headerScrollView.offset = ssv.contentOffset.y * self.zoomScale;
                    weak_self.headerScrollView.isUserScouce = true;
                    ssv.tableView.scrollEnabled = false;
                    [weak_self bringSubviewToFront:weak_self.headerScrollView];
                    weak_self.isOnHeader = isOnHeader;
                } else if (isOnHeader == false && weak_self.isOnHeader == true) {
                    weak_self.headerScrollView.isUserScouce = false;
                    weak_self.spreadsheetView.tableView.scrollEnabled = true;
                    [weak_self sendSubviewToBack:weak_self.headerScrollView];
                    weak_self.isOnHeader = isOnHeader;
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
    cell.label.textAlignment =  model.isCenter ? NSTextAlignmentCenter : model.isLeft ?  NSTextAlignmentLeft : NSTextAlignmentRight;
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


