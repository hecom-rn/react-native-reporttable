//
//  ReportTableView.h
//  
//
//  Created by ms on 2019/11/22.
//

#import <UIKit/UIKit.h>

@class ReportTableModel, ForzenRangel, ReportTableHeaderScrollView;
@interface ReportTableView : UIView

@property (nonatomic, strong) ReportTableModel *reportTableModel;
@property (nonatomic, strong) ReportTableHeaderScrollView *headerScrollView;

@end


