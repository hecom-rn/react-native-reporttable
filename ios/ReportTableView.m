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

@interface ReportTableView () <SpreadsheetViewDelegate, SpreadsheetViewDataSource>

@property (nonatomic, strong) SpreadsheetView *spreadsheetView;

@end

@implementation ReportTableView

- (instancetype)init
{
    self = [super init];
    if (self) {
     
        CGFloat hairline = 1 / [UIScreen mainScreen].scale;
         self.spreadsheetView.intercellSpacing = CGSizeMake(hairline, hairline);
         self.spreadsheetView.gridStyle = [[GridStyle alloc] initWithStyle:GridStyle_solid width:hairline color:[UIColor grayColor]];
         
         [self.spreadsheetView registerClass:[ReportTableCell class] forCellWithReuseIdentifier:[ReportTableCell description]];
         [self.spreadsheetView flashScrollIndicators];
    }
    return self;
}

- (void)setDataSource:(NSMutableArray<NSArray<ReportTableModel *> *> *)dataSource {
    _dataSource = dataSource;
    [self.spreadsheetView reloadData];
}

//- (NSMutableArray<NSArray<ReportTableModel *> *> *)dataSource{
//    if (!dataSource) {
//        _dataSource = [NSMutableArray array];
//        for (int i = 0; i <500; i ++) {
//            NSMutableArray *rowArr = [NSMutableArray array];
//            for (int j = 1 ; j < 7; j ++) {
//                ReportTableModel *model = [[ReportTableModel alloc] init];
//                model.keyIndex = j + i * 7;
//                [rowArr addObject:model];
//                if (i < 20 && i > 2 && j == 1) {
//                    model.keyIndex = 15;
//                }
//                if (i < 10 && i > 2 && (j == 2 || j == 3)) {
//                    model.keyIndex = 19;
//                }
//                if (i < 18 && i > 11 && j == 2) {
//                    model.keyIndex = 85;
//                }
//            }
//            [_dataSource addObject:rowArr];
//        }
//        _dataSource[0][1].keyIndex = 1;
//        return _dataSource;
//    }
//    return _dataSource;
//}



- (SpreadsheetView *)spreadsheetView {
    if (!_spreadsheetView) {
        _spreadsheetView = ({
            SpreadsheetView *ssv = [SpreadsheetView new];
            ssv.dataSource = self;
            ssv.delegate = self;
            ssv.frame = self.bounds;
            ssv.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
            [self addSubview:ssv];
            ssv;
        });
    }
    return _spreadsheetView;
}

//MARK: DataSource
- (NSInteger)numberOfColumns:(SpreadsheetView *)spreadsheetView {
    return self.dataSource.count;
}

- (NSInteger)numberOfRows:(SpreadsheetView *)spreadsheetView {
    return self.dataSource[0].count;
}

- (CGFloat)spreadsheetView:(SpreadsheetView *)spreadsheetView widthForColumn:(NSInteger)column {
    return 50;
}

- (CGFloat)spreadsheetView:(SpreadsheetView *)spreadsheetView heightForRow:(NSInteger)row {
    return 34.f;
}

//- (NSInteger)frozenColumns:(SpreadsheetView *)spreadsheetView {
//    return 3;
//}
//
//- (NSInteger)frozenRows:(SpreadsheetView *)spreadsheetView {
//    return 2;
//}

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
    NSInteger row    = indexPath.row;
    
    ReportTableModel *model = self.dataSource[row][column];
    
    ReportTableCell *cell = (ReportTableCell *)[spreadsheetView dequeueReusableCellWithReuseIdentifier:[ReportTableCell description] forIndexPath:indexPath];
    cell.label.text = [NSString stringWithFormat:@"%ld", model.keyIndex];
//    cell.gridlines.left  = [GridStyle borderStyleNone];
//    cell.gridlines.right = [GridStyle borderStyleNone];
    return cell;
}

/// Delegate
- (void)spreadsheetView:(SpreadsheetView *)spreadsheetView didSelectItemAt:(NSIndexPath *)indexPath {
    NSLog(@"Selected: (row: %ld, column: %ld)", (long)indexPath.row, (long)indexPath.column);
}

@end


