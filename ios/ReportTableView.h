//
//  ReportTableView.h
//  
//
//  Created by ms on 2019/11/22.
//

#import <UIKit/UIKit.h>

@class ReportTableModel, ForzenRange;
@interface ReportTableView : UIView

@property (nonatomic, strong) NSMutableArray<NSArray<ReportTableModel *> *> *dataSource;
@property (nonatomic, strong) NSMutableArray<ForzenRange *> *frozenArray;

@end


