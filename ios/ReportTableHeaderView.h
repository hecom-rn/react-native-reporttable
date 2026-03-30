//
//  ReportTableHeaderView.h
//  
//
//  Created by ms on 2019/11/27.
//

#import <UIKit/UIKit.h>

typedef void (^EndDrag)(BOOL isEndeDrag);
@interface ReportTableHeaderScrollView: UIScrollView
@property (nonatomic, copy) EndDrag isEndeDrag;
@property (nonatomic, assign) BOOL isUserScouce;
@property (nonatomic, assign) CGFloat offset;

- (void)scrollViewDidScroll:(UIScrollView *)scrollView;

@end



