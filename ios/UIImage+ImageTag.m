//
//  ImageTag.m
//  hecom-rn-reportTable
//
//  Created by ms on 2023/11/27.
//

#import "UIImage+ImageTag.h"

@implementation UIImage (ImageTag)


///绘制带有文本、颜色、圆角的图片
+ (UIImage *)imageWithExtra:(ExtraText *)extraText{
    NSString *text = extraText.text;
    UIFont *font = [UIFont systemFontOfSize: extraText.style.fontSize];
    //返回使用指定字体所需要的边框大小
    CGSize textSize = CGSizeMake(extraText.backgroundStyle.width, extraText.backgroundStyle.height);
    CGRect imageFrame = {0, 0, textSize};
    //创建基于位图的图形上下文并使其成为当前上下文。
    UIGraphicsBeginImageContext(imageFrame.size);
    //返回当前图形上下文
    CGContextRef context = UIGraphicsGetCurrentContext();
    CGColorRef fillColor = extraText.backgroundStyle.color.CGColor;
    //使用CGColor设置图形上下文中的当前填充颜色
    CGContextSetFillColorWithColor(context, fillColor);
    //使用当前图形状态中的填充颜色绘制所提供矩形中包含的区域。
    CGContextFillRect(context, imageFrame);
    //根据当前基于位图的图形上下文的内容返回图像。
    UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
    //从堆栈顶部移除当前基于位图的图形上下文。
    UIGraphicsEndImageContext();
    //设置图片圆角
    UIImage *circleImage = [image setCornerRadius:extraText.backgroundStyle.radius];
    
    UIImage *textImage = [circleImage addText:text withFont:font withColor:extraText.style.color];

    return textImage;
}

///设置图片圆角
- (UIImage *)setCornerRadius:(CGFloat)cornerRadius {
    //创建一个临时渲染上下文，在这上面绘制原始图片
    UIGraphicsBeginImageContextWithOptions(self.size, NO, [[UIScreen mainScreen] scale]);
    //图片的框架矩形
    CGRect imageRect = {0, 0, self.size};
    //创建并返回用圆角矩形路径初始化的新UIBezierPath对象
    UIBezierPath *path = [UIBezierPath bezierPathWithRoundedRect:imageRect cornerRadius:cornerRadius];
    //将Path添加到上下文中
    CGContextAddPath(UIGraphicsGetCurrentContext(), path.CGPath);
    //裁剪上下文
    CGContextClip(UIGraphicsGetCurrentContext());
    //在指定的矩形中绘制整个图像，并根据需要进行缩放
    [self drawInRect:imageRect];
    //从当前环境当中得到重绘的图片
    UIImage *circleImag = UIGraphicsGetImageFromCurrentImageContext();
    //从堆栈顶部移除当前基于位图的图形上下文。
    UIGraphicsEndImageContext();
    //返回绘制的图片
    return circleImag;
}

///绘制指定字体的文本到图片中
- (UIImage *)addText:(NSString *)text withFont:(UIFont *)font withColor:(UIColor *)color {
    //  1.获取上下文
    UIGraphicsBeginImageContextWithOptions(self.size, NO, [[UIScreen mainScreen] scale]);
    //  2.绘制图片
    CGRect imageRect = {0, 0, self.size};
    //  在指定的矩形中绘制整个图像，并根据需要进行缩放
    [self drawInRect:imageRect];
    //  3.绘制文字
    CGRect textRect = CGRectInset(imageRect, 2.0, (self.size.height - font.lineHeight) / 2 - 0.5);
    //  段落样式布局对象
    NSMutableParagraphStyle *style = [[NSMutableParagraphStyle defaultParagraphStyle] mutableCopy];
    //  文字对齐方式
    style.alignment = NSTextAlignmentCenter;
    //  文字的属性
    NSDictionary *attributes = @{NSFontAttributeName: font,
                                 NSParagraphStyleAttributeName:style,
                                 NSForegroundColorAttributeName:color};
    //  将文字绘制上去
    [text drawInRect:textRect withAttributes:attributes];
    //  获取绘制到得图片
    UIImage *textImage = UIGraphicsGetImageFromCurrentImageContext();
    //  结束图片的绘制
    UIGraphicsEndImageContext();
    //  返回绘制的图片
    return textImage;
}

@end
