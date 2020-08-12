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


@end

@implementation ReportTableView


- (void)setHeaderScrollView:(ReportTableHeaderScrollView *)headerScrollView {
    if (!_headerScrollView) {
        self.spreadsheetView.tableHeaderView = headerScrollView;
        
    }
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
        self.reportTableModel = [[ReportTableModel alloc] init];
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

    
    [self.spreadsheetView reloadData];
}

- (SpreadsheetView *)spreadsheetView {
    if (!_spreadsheetView) {
        _spreadsheetView = ({
            SpreadsheetView *ssv = [SpreadsheetView new];
            ssv.dataSource = self;
            ssv.delegate   = self;
            ssv.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
            ssv.frame = self.bounds;
            ssv.bounces = false;
            ssv.onScrollEnd = ^(BOOL isOnEnd) {
                if (self.reportTableModel.onScrollEnd != nil) {
                    self.reportTableModel.onScrollEnd(@{@"isEnd": @YES});
                }
            };
            __weak typeof(self)weak_self = self;
            ssv.overlayView.touchPoint = ^(CGPoint point) {
                BOOL isOnHeader = (point.y - ssv.overlayView.contentOffset.y) < (weak_self.headerScrollView.frame.size.height -  weak_self.headerScrollView.contentOffset.y) && ssv.contentOffset.y <= 0;
                if (isOnHeader == YES && weak_self.isOnHeader == false) {
                    weak_self.headerScrollView.offset = ssv.contentOffset.y;
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
    if (row == 0) {
        if (self.reportTableModel.frozenPoint > 0) {
            if (column + 1 == self.reportTableModel.frozenPoint) {
                cell.isUnLocked = column + 1 != self.reportTableModel.frozenColumns;
                cell.isLocked = column + 1 == self.reportTableModel.frozenColumns;
            }
        } else if ( self.reportTableModel.frozenCount > 0) {
            cell.isLocked = column < self.reportTableModel.frozenColumns && row == 0;
            cell.isUnLocked = column < self.reportTableModel.frozenCount && row == 0;
        }
    }
    cell.contentView.backgroundColor = model.backgroundColor;
    cell.textPaddingHorizontal = model.textPaddingHorizontal;
    cell.label.text = model.title;
    cell.label.textColor = model.textColor;
    cell.label.textAlignment = model.isLeft ? NSTextAlignmentLeft : NSTextAlignmentRight;
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
            }
        } else if (self.reportTableModel.frozenCount >= newFrozenColums) {
            self.reportTableModel.frozenColumns = self.reportTableModel.frozenColumns == newFrozenColums ? 0 : newFrozenColums;
            [self.spreadsheetView reloadData];
        }
    }
}

@end


