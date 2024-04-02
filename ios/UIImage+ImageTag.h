//
//  ImageTag.h
//  hecom-rn-reportTable
//
//  Created by ms on 2023/11/27.
//

#import <UIKit/UIKit.h>
#import "ReportTableModel.h"

@interface UIImage (ImageTag)

+ (UIImage *)imageWithExtra:(ExtraText *)extraText;


+ (UIImage *)imageWithBorder:(TextBoderModel *)boderModel;

@end

