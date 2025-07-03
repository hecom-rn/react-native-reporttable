//
//  ReportTableModel.m
//  DoubleConversion
//
//  Created by ms on 2019/11/22.
//

#import "ReportTableModel.h"

@implementation AntsLineStyle

@end

@implementation ProgressStyle

@end

@implementation GradientStyle

@end

@implementation FloatIconStyle

@end

@implementation ExtraTextBackGroundStyle

@end

@implementation ExtraTextStyle

@end

@implementation ExtraText

@end

@implementation TextBoderModel
@end

@implementation IconStyle
- (NSInteger)imageAlignment {
    if (!_imageAlignment) {
        return 3;
    }
    return _imageAlignment;
}

- (CGFloat)paddingHorizontal {
    if (!_paddingHorizontal) {
        return 4;
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

- (NSMutableArray<NSNumber *> *)permutedArr{
    if (!_permutedArr) {
        _permutedArr = [NSMutableArray array];
    }
    return _permutedArr;
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

- (NSInteger)oriFrozenColumns {
    if (!_oriFrozenColumns) {
        return 0;
    }
    return _oriFrozenColumns;
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

- (UIColor *)backgroundColor {
    if (!_backgroundColor) {
        return _itemConfig.backgroundColor;
    }
    return _backgroundColor;
}

- (CGFloat)fontSize {
    if (!_fontSize) {
        return _itemConfig.fontSize;
    }
    return _fontSize;
}

- (UIColor *)textColor {
    if (!_textColor) {
        return _itemConfig.textColor;
    }
    return _textColor;
}

- (NSInteger)textPaddingHorizontal {
    if (!_textPaddingHorizontal) {
        return _itemConfig.textPaddingHorizontal;
    }
    return _textPaddingHorizontal;
}

- (BOOL)isOverstriking {
    if (_isOverstriking == nil) {
        return _itemConfig.isOverstriking;
    }
    return _isOverstriking;
}

@end

@implementation ForzenRange

@end
