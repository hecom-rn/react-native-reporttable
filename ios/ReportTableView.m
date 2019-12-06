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

@property (nonatomic, strong) SpreadsheetView *spreadsheetView;
@property (nonatomic, strong) NSMutableArray<NSArray<ItemModel *> *> *dataSource;
@property (nonatomic, strong) NSMutableArray<ForzenRange *> *frozenArray;
@property (nonatomic, strong) NSArray *cloumsHight;
@property (nonatomic, strong) NSArray *rowsWidth;

@end

@implementation ReportTableView


- (void)setHeaderScrollView:(ReportTableHeaderScrollView *)headerScrollView {
    self.spreadsheetView.tableHeaderView = headerScrollView;
    _headerScrollView = headerScrollView;
    _headerScrollView.showsHorizontalScrollIndicator = NO;
    _headerScrollView.showsVerticalScrollIndicator = NO;
    __weak typeof(self)weak_self = self;
    _headerScrollView.isEndeDrag = ^(BOOL isEndeDrag) {
        weak_self.headerScrollView.isUserScouce = false;
        [weak_self sendSubviewToBack:weak_self.headerScrollView];
    };
    [self insertSubview:_headerScrollView atIndex:0];
}

- (instancetype)init
{
    self = [super init];
    if (self) {
        self.clipsToBounds = true;
        self.reportTableModel = [[ReportTableModel alloc] init];
        CGFloat hairline = 1 / [UIScreen mainScreen].scale;
        self.spreadsheetView.intercellSpacing = CGSizeMake(hairline, hairline);
        self.spreadsheetView.gridStyle = [[GridStyle alloc] initWithStyle:GridStyle_solid width: hairline color:[UIColor grayColor]];
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
            ssv.overlayView.touchOnHeader = ^(BOOL isTouchOnHeader) {
                if (isTouchOnHeader == YES) {
                    weak_self.headerScrollView.isUserScouce = true;
                    [weak_self bringSubviewToFront:weak_self.headerScrollView];
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
    return self.reportTableModel.frozenRows;;
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
    cell.contentView.backgroundColor = model.backgroundColor;
    cell.label.text = model.title;
    cell.label.textColor = model.textColor;
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
            @"columnIndex": [NSNumber numberWithInteger:column]
        });
    }
    NSLog(@"Selected: (row: %ld, column: %ld)", (long)indexPath.row, (long)indexPath.column);
}

@end


