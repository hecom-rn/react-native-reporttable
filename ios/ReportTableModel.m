//
//  ReportTableModel.m
//  DoubleConversion
//
//  Created by ms on 2019/11/22.
//

#import "ReportTableModel.h"


@implementation ReportTableModel
- (NSMutableArray<NSArray<ItemModel *> *> *)dataSource{
    if (!_dataSource) {
        _dataSource = [NSMutableArray array];
    }
    return _dataSource;
}

- (NSMutableArray<ForzenRange *> *)frozenArray{
    if (!_frozenArray) {
        _frozenArray  = [NSMutableArray array];
        return _frozenArray;
    }
    return _frozenArray;
}

- (float)minWidth {
    if (!_minWidth) {
        return 60;
    }
    return _minWidth;
}

- (NSInteger)frozenColumns {
    if (!_frozenColumns) {
        return 0;
    }
    return _frozenColumns;
}

- (NSInteger)frozenRows {
    if (!_frozenRows) {
        return 0;
    }
    return _frozenRows;
}

@end


@implementation ItemModel
- (NSInteger)textPaddingHorizontal {
    if (!_textPaddingHorizontal) {
        return 6;
    }
    return _textPaddingHorizontal;
}
@end

@implementation ForzenRange

@end
