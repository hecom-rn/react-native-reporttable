//
//  ReportTableCell.h
//
//
//  Created by ms on 2019/11/22.
//

#import "UIKit/UIKit.h"
#import <ZMJGanttChart/ZMJGanttChart.h>

@interface ReportTableCell : ZMJCell

@property (nonatomic, strong) UILabel *label;

@property (nonatomic, assign) NSInteger textPaddingHorizontal;

@end
