//
//  ReportTableModel.h
//
//
//  Created by ms on 2019/11/22.
//

#import <Foundation/Foundation.h>

@interface ReportTableModel : NSObject

@property (nonatomic, assign) NSInteger keyIndex;
@property (nonatomic, assign) BOOL used;

@end


@interface ForzenRange: NSObject
@property (nonatomic, assign) NSInteger startX;
@property (nonatomic, assign) NSInteger startY;
@property (nonatomic, assign) NSInteger endX;
@property (nonatomic, assign) NSInteger endY;
@end


