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

@interface ReportTableViewModel();

@property (nonatomic, strong) ReportTableView * reportTableView;
@property (nonatomic, strong) NSMutableArray<NSArray<ReportTableModel *> *> *dataSource;
@property (nonatomic, strong) NSMutableArray<ForzenRange *> *frozenArray;

@end

@implementation ReportTableViewModel

- (NSMutableArray<NSArray<ReportTableModel *> *> *)dataSource{
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

- (ReportTableView *)reportTableView {
    if (!_reportTableView) {
        _reportTableView = [[ReportTableView alloc] init];
        _reportTableView.frame = self.bounds;
        [self addSubview:_reportTableView];
    }
    return _reportTableView;
}

- (instancetype)init
{
    self = [super init];
    if (self) {
     
    }
    return self;
}

- (void)generateMergeRange:(NSArray<NSArray<ReportTableModel *> *>*)dataSource {
    for (int i = 0; i < dataSource.count; i++) { // i colmnIndex
        NSArray *rowArr = dataSource[i];
        for (int j = 0; j < rowArr.count; j ++) { // j = rowIndex
             NSInteger sameRowLength = [self jungleSameLength:[self rowWithIndex:j colmnIndex:i]];
             NSInteger sameColmnLength = [self jungleSameLength:[self colmnWithIndex:j colmnIndex:i]];
             if (sameRowLength > 1 || sameColmnLength > 1) {
                ForzenRange *forzenRange = [[ForzenRange alloc] init];
                forzenRange.startX = i;
                forzenRange.startY = j;
                forzenRange.endX = i + sameColmnLength - 1;
                forzenRange.endY = j + sameRowLength - 1;
                [self.frozenArray addObject:forzenRange];
             }
        }
    }
}

- (NSInteger)jungleSameLength:(NSArray<ReportTableModel *> *)arr {
    if (arr.count <= 1) {
        return arr.count;
    }
    ReportTableModel *model = arr[0];
    if (model.used && model.used == YES) {
        return 1;
    }
    NSInteger sameLenth = [self sameLength:arr andKeyIndex:model.keyIndex];
    return sameLenth;
}

- (NSInteger)sameLength:(NSArray<ReportTableModel *> *)arr andKeyIndex:(NSInteger)keyIndex{
    NSInteger sameLenth = 0;
    for (int i = 0; i< arr.count; i++) {
        ReportTableModel *model = arr[i];
        if (model.keyIndex == keyIndex) {
            sameLenth += 1;
            if (sameLenth > 1) {
                model.used = true;
            }
        } else {
            break;
        }
    }
    return sameLenth;
}

- (NSMutableArray *)rowWithIndex:(NSInteger)rowIndex colmnIndex:(NSInteger)colmnIndex {
    NSMutableArray<ReportTableModel *> *result = [NSMutableArray array];
    NSArray *arr = self.dataSource[colmnIndex];
    for (NSInteger i = rowIndex; i <arr.count; i++) {
        ReportTableModel *model = arr[i];
        [result addObject:model];
    }
    return result;
}

- (NSMutableArray *)colmnWithIndex:(NSInteger)rowIndex colmnIndex:(NSInteger)colmnIndex {
    NSMutableArray<ReportTableModel *> *result = [NSMutableArray array];
    for (NSInteger i = colmnIndex; i <self.dataSource.count; i++) {
        NSArray *arr = self.dataSource[i];
        ReportTableModel *model = arr[rowIndex];
        [result addObject:model];
    }
    return result;
}


- (void)setData:(NSArray *)data {
    NSMutableArray *dataSource = [NSMutableArray arrayWithArray:data];
    for (int i = 0; i < dataSource.count; i++) {
        NSArray *rowArr = dataSource[i];
        NSMutableArray *modelArr = [NSMutableArray array];
        for (int j = 0; j < rowArr.count; j ++) {
            NSDictionary *dir = rowArr[j];
            ReportTableModel *model = [[ReportTableModel alloc] init];
            model.keyIndex = [RCTConvert NSInteger:[dir objectForKey:@"keyIndex"]];
            model.used = NO;
            [modelArr addObject:model];
        }
        [self.dataSource addObject:modelArr];
    }
    
    self.reportTableView.frozenArray = self.frozenArray;
    self.reportTableView.dataSource = self.dataSource;
}


@end
