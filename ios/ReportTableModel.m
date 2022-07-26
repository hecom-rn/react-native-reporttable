//
//  ReportTableModel.m
//  DoubleConversion
//
//  Created by ms on 2019/11/22.
//

#import "ReportTableModel.h"


@implementation IconStyle
- (NSInteger)imageAlignment {
    if (!_imageAlignment) {
        return 3;
    }
    return _imageAlignment;
}

- (CGFloat)paddingHorizontal {
    if (!_paddingHorizontal) {
        return 10;
    }
    return _paddingHorizontal;
}
@end

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
        return 0;
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

- (NSInteger)frozenPoint {
    if (!_frozenPoint) {
          return 0;
    }
    return _frozenPoint;
}

@end


@implementation ItemModel
- (NSInteger)textPaddingHorizontal {
    if (!_textPaddingHorizontal) {
        return 6;
    }
    return _textPaddingHorizontal;
}

- (NSInteger)horCount {
    if (!_horCount) {
        return 1;
    }
    return _horCount;
}

- (NSInteger)verCount {
    if (!_verCount) {
        return 1;
    }
    return _verCount;
}

@end

@implementation ForzenRange

@end
