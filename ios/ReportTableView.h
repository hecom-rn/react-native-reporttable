//
//  ReportTableView.h
//  
//
//  Created by ms on 2019/11/22.
//

#import <UIKit/UIKit.h>

@class ReportTableModel, ForzenRangel, ReportTableHeaderScrollView;
@class SpreadsheetView;
@interface ReportTableView : UIScrollView

@property (nonatomic, strong) SpreadsheetView *spreadsheetView;
@property (nonatomic, strong) ReportTableModel *reportTableModel;
@property (nonatomic, strong) ReportTableHeaderScrollView *headerScrollView;

- (void)scrollToLineX:(NSInteger)lineX lineY:(NSInteger)lineY offsetX:(float)offsetX offsetY:(float)offsetY animated:(BOOL)animated;

- (void)scrollViewDidZoom:(UIScrollView *)scrollView;

- (void)scrollToBottom;

@end


