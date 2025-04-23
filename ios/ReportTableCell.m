//
//  ReportTableCell.m
//  DoubleConversion
//
//  Created by ms on 2019/11/22.
//

#import "ReportTableCell.h"
#import <Masonry/Masonry.h>
#import "ReportTableModel.h"
#import <React/RCTConvert.h>

@interface BoxView : UIView
@property (strong, atomic) UIColor *lineColor;
@end

@implementation BoxView

- (void)drawRect:(CGRect)rect {
    [super drawRect:rect];
    
    // 获取当前绘制上下文
    CGContextRef context = UIGraphicsGetCurrentContext();
    
    // 设置线条颜色和宽度
    CGContextSetStrokeColorWithColor(context, self.lineColor.CGColor);
    CGContextSetLineWidth(context, 1.0);
    
    // 绘制线条
    CGContextMoveToPoint(context, 0, 0);
    CGContextAddLineToPoint(context, 0, rect.size.height);
    CGContextAddLineToPoint(context, rect.size.width, rect.size.height);
    CGContextAddLineToPoint(context, rect.size.width, 0);
    CGContextAddLineToPoint(context, 0, 0);
    CGContextStrokePath(context);
}

@end

@interface LineView : UIView
@property (strong, atomic) UIColor *lineColor;
@end

@implementation LineView

- (void)drawRect:(CGRect)rect {
    [super drawRect:rect];
    
    // 获取当前绘制上下文
    CGContextRef context = UIGraphicsGetCurrentContext();
    
    // 设置线条颜色和宽度
    CGContextSetStrokeColorWithColor(context, self.lineColor.CGColor);
    CGContextSetLineWidth(context, 1.0);
    
    // 绘制线条
    CGContextMoveToPoint(context, 0, 0);
    CGContextAddLineToPoint(context, rect.size.width, rect.size.height);
    CGContextStrokePath(context);
}

@end


@interface GradientView : UIView
@end

@implementation GradientView
- (instancetype)initWithFrame:(CGRect)frame
                       colors:(NSArray<UIColor *> *)colors
                   startPoint:(CGPoint)startPoint
                     endPoint:(CGPoint)endPoint {
    self = [super initWithFrame:frame];
    if (self) {
        // 创建CAGradientLayer实例
        CAGradientLayer *gradientLayer = [CAGradientLayer layer];
        
        // 设置渐变颜色
        NSMutableArray *cgColors = [NSMutableArray array];
        for (UIColor *color in colors) {
            [cgColors addObject:(id)color.CGColor];
        }
        // 设置渐变的颜色
        gradientLayer.colors = cgColors;
        // 设置渐变的方向（从左到右）
        gradientLayer.startPoint = startPoint;
        gradientLayer.endPoint = endPoint;
        // 设置渐变层的大小与视图一致
        gradientLayer.frame = self.bounds;
        // 将渐变层添加到视图的图层中
        [self.layer addSublayer:gradientLayer];
    }
    return self;
}

@end



@interface ReportTableCell()
@property (strong, atomic) LineView *lineView;
@property (strong, atomic) BoxView *boxView;
@property (strong, atomic) GradientView *gradientView;
@property (strong, atomic) CAGradientLayer *gradientLayer;
@property (strong, atomic) CAShapeLayer *shapeLayer;
@end

@implementation ReportTableCell

- (UILabel *)label {
    if (!_label) {
        _label = [UILabel new];
        _label.numberOfLines = 0;
        _label.layer.zPosition = 1;
    }
    return _label;
}
#pragma ProgressView
- (void)setupProgressView:(ProgressStyle *)style WithRowWidth:(CGFloat)width Height:(CGFloat)height {
    CAGradientLayer *gradientLayer = [CAGradientLayer layer];
    CGFloat showWidth = width - 2 * style.marginHorizontal;
    CGFloat lineWidth = style.antsLineStyle ? style.antsLineStyle.lineWidth : 0;
    BOOL isLeft = style.antsLineStyle ? style.antsLineStyle.lineRatio >= style.endRatio : false;
    CGRect frame = CGRectMake(style.marginHorizontal + showWidth * style.startRatio + (isLeft ? -lineWidth / 2 : lineWidth / 2),
                              (height - style.height) / 2,
                              showWidth * (style.endRatio - style.startRatio) + lineWidth / 2,
                              style.height);
    gradientLayer.frame = frame;
    gradientLayer.cornerRadius = style.cornerRadius;
    gradientLayer.colors = style.colors;
    gradientLayer.startPoint = CGPointMake(0, 0.5);
    gradientLayer.endPoint = CGPointMake(1, 0.5);
    self.gradientLayer = gradientLayer;
    [self.contentView.layer insertSublayer:gradientLayer atIndex: self.contentView.layer.sublayers.count];
    
    if (style.antsLineStyle) {
        CAShapeLayer *shapeLayer = [CAShapeLayer layer];
        shapeLayer.strokeColor = style.antsLineStyle.color.CGColor;
        shapeLayer.lineWidth = style.antsLineStyle.lineWidth;
        shapeLayer.lineDashPattern = style.antsLineStyle.lineDashPattern;
        UIBezierPath *path = [UIBezierPath bezierPath];
        CGFloat x = style.marginHorizontal + showWidth * style.antsLineStyle.lineRatio;
        [path moveToPoint:CGPointMake(x, 0)];
        [path addLineToPoint:CGPointMake(x, height)];
        shapeLayer.path = path.CGPath;
        self.shapeLayer = shapeLayer;
        [self.contentView.layer insertSublayer:shapeLayer atIndex: self.contentView.layer.sublayers.count];
    }
}

- (void)hiddenProgressView {
    if (_gradientLayer != nil) {
        [_gradientLayer removeFromSuperlayer];
        _gradientLayer = nil;
    }
    if (_shapeLayer != nil) {
        [_shapeLayer removeFromSuperlayer];
        _shapeLayer = nil;
    }
}
#pragma text
- (void)textStyle:(NSInteger)paddingLeft WithPaddingRight: (NSInteger)paddingRight {
    [self.label mas_remakeConstraints:^(MASConstraintMaker *make) {
        float iconPaddingHorizontal = _icon ? self.icon.paddingHorizontal : 4;
        float inconWidth = _icon ? self.icon.size.width : 13;
        float textLeft = inconWidth + iconPaddingHorizontal + paddingLeft;
        float textRight = inconWidth + iconPaddingHorizontal + paddingRight;
        self.label.textAlignment = self.textAlignment;
        if (self.textAlignment == NSTextAlignmentRight) {
            if (self.icon.imageAlignment == 1) {
                make.right.equalTo(self.contentView.mas_right).offset(-paddingRight);
                make.left.greaterThanOrEqualTo(self.contentView.mas_left).offset([self isSetupImageView] ? textLeft : paddingLeft);
            } else {
                make.right.equalTo(self.contentView.mas_right).offset([self isSetupImageView] ? -textRight : -paddingRight);
                make.left.greaterThanOrEqualTo(self.contentView.mas_left).offset(paddingLeft);
            }
        } else if (self.textAlignment == NSTextAlignmentCenter) {
            make.centerX.equalTo(self.contentView.mas_centerX);
            if (self.icon.imageAlignment == 1) {
                make.right.mas_lessThanOrEqualTo(self.contentView.mas_right).offset(-paddingRight);
                make.left.mas_greaterThanOrEqualTo(self.contentView.mas_left).offset([self isSetupImageView] ? textLeft : paddingLeft);
            } else {
                make.right.mas_lessThanOrEqualTo(self.contentView.mas_right).offset(-paddingRight);
                make.left.mas_greaterThanOrEqualTo(self.contentView.mas_left).offset(paddingLeft);
            }
        } else {
            if (self.icon.imageAlignment == 1) {
                make.right.equalTo(self.contentView.mas_right).offset(-paddingRight);
                make.left.equalTo(self.contentView.mas_left).offset([self isSetupImageView] ? textLeft : paddingLeft);
            } else {
                if ([self isSetupImageView] ) {
                    make.right.mas_lessThanOrEqualTo(self.contentView.mas_right).offset(-textRight);
                } else {
                    make.right.mas_lessThanOrEqualTo(self.contentView.mas_right).offset(-paddingRight);
                }
                make.left.equalTo(self.contentView.mas_left).offset(paddingLeft);
            }
        }
         make.centerY.equalTo(self.contentView.mas_centerY);
     }];
     self.label.transform = CGAffineTransformMakeTranslation(0, 0);
     [self.label layoutIfNeeded];
}

#pragma lockImage
- (BOOL)isSetupImageView {
    return _lockImageView != nil || _icon != nil;
}

- (NSBundle *)bundleForStrings
{
    NSBundle *bundle = [NSBundle bundleForClass:[self class]];
    NSURL *url = [bundle URLForResource:@"ReportTable" withExtension:@"bundle"];
    NSBundle *imageBundle = [NSBundle bundleWithURL:url];
    return imageBundle;
}

- (void)setIsLocked:(BOOL)isLocked {
    if (_customImageView != nil) {
        [_customImageView removeFromSuperview];
        _customImageView = nil;
        _icon = nil;
    }
    if (isLocked == true) {
        self.lockImageView.image = [UIImage imageWithContentsOfFile: [[self bundleForStrings] pathForResource:@"reportTableLock" ofType:@"png"]];
    } else {
        self.lockImageView.image = [UIImage imageWithContentsOfFile: [[self bundleForStrings] pathForResource:@"reportTableUnLock" ofType:@"png"]];
    }
}

- (void)updateContentView:(NSInteger)textPaddingHorizontal {
    if ([self isSetupImageView]) {
        if (_lockImageView != nil) {
            [_lockImageView removeFromSuperview];
            _lockImageView = nil;
        }
        if (_customImageView != nil) {
            [_customImageView removeFromSuperview];
            _customImageView = nil;
            _icon = nil;
        }
    }
    if (_floatImageView != nil) {
        [_floatImageView removeFromSuperview];
        _floatImageView = nil;
    }
}

- (UIImageView *)lockImageView {
    if (!_lockImageView) {
        _lockImageView = [[UIImageView alloc] init];
        [self.contentView addSubview: _lockImageView];
        [_lockImageView mas_makeConstraints:^(MASConstraintMaker *make) {
            make.left.equalTo(self.label.mas_right).offset(4);
            make.centerY.equalTo(self.contentView.mas_centerY);
            make.height.mas_equalTo(14);
            make.width.mas_equalTo(13);
        }];
        [_lockImageView layoutIfNeeded];
    }
    return _lockImageView;
}

- (UIImageView *)customImageView {
    if (!_customImageView) {
        _customImageView = [[UIImageView alloc] init];
        [self.contentView addSubview: _customImageView];
        [_customImageView mas_makeConstraints:^(MASConstraintMaker *make) {
            if (self.icon.imageAlignment == 1) {
                make.right.equalTo(self.label.mas_left).offset(-self.icon.paddingHorizontal);
            } else if (self.icon.imageAlignment == 2) {
                make.centerX.equalTo(self.contentView.mas_centerX);
            } else {
                make.left.equalTo(self.label.mas_right).offset(self.icon.paddingHorizontal);
            }
            make.centerY.equalTo(self.contentView.mas_centerY);
            make.size.mas_equalTo(self.icon.size);
        }];
        [_customImageView layoutIfNeeded];
    }
    return _customImageView;
}

- (void)setIcon:(IconStyle *)icon {
    _icon = icon;
    self.customImageView.image = [RCTConvert UIImage:icon.path];
}

- (instancetype)initWithFrame:(CGRect)frame
{
    self = [super initWithFrame:frame];
    if (self) {
        self.label.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
        [self.contentView addSubview:self.label];
      
    }
    return self;
}

#pragma FloatIcon
- (void)setFloatIcon:(FloatIconStyle *)floatIcon {
    if (!_floatImageView) {
        _floatImageView = [[UIImageView alloc] init];
        _floatImageView.image = [RCTConvert UIImage: floatIcon.path];
        [self.contentView addSubview: _floatImageView];
        [_floatImageView mas_makeConstraints:^(MASConstraintMaker *make) {
            if (floatIcon.top) {
                make.top.equalTo(self.contentView).offset(floatIcon.top);
            }
            if (floatIcon.bottom) {
                make.bottom.equalTo(self.contentView).offset(-floatIcon.bottom);
            }
            if (floatIcon.left) {
                make.left.equalTo(self.contentView).offset(floatIcon.left);
            }
            if (floatIcon.right) {
                make.right.equalTo(self.contentView).offset(-floatIcon.right);
            }
            make.size.mas_equalTo(floatIcon.size);
        }];
        [_floatImageView layoutIfNeeded];
    }
}

#pragma GradientView
- (void)hiddenGradientView {
    if (_gradientView != nil) {
        [_gradientView removeFromSuperview];
        _gradientView = nil;
    }
}
- (void)setupGradientView:(GradientStyle *)style WithRowWidth:(CGFloat)width Height:(CGFloat)height {
    self.gradientView = [[GradientView alloc] initWithFrame:CGRectMake(0, 0, width, height) colors:style.colors startPoint:style.startPoint endPoint:style.endPoint];
    [self.contentView addSubview: self.gradientView];
}

#pragma ForbiddenLine
// ForbiddenLine
- (void)drawLinePoint:(CGPoint)point WithLineColor: (UIColor *)color {
    // 不能使用drawReact 会导致分割线闪动
    self.label.text = @"";
    self.lineView.frame = CGRectMake(0, 0, point.x, point.y);
    self.lineView.lineColor = color;
}

- (void)hiddenLineView {
    if (_lineView != nil) {
        [_lineView removeFromSuperview];
        _lineView = nil;
    }
}

- (LineView *)lineView {
    if (!_lineView) {
        _lineView = [[LineView alloc] init];
        _lineView.backgroundColor = [UIColor clearColor];
        [self.contentView addSubview:_lineView];
    }
    return _lineView;
}

// BoxLine
- (void)drawBoxPoint:(CGPoint)point WithLineColor: (UIColor *)color {
    self.boxView.frame = CGRectMake(0, 0, point.x, point.y);
    self.boxView.lineColor = color;
}

- (void)hiddenBoxView {
    if (_boxView != nil) {
        [_boxView removeFromSuperview];
        _boxView = nil;
    }
}

- (BoxView *)boxView {
    if (!_boxView) {
        _boxView = [[BoxView alloc] init];
        _boxView.backgroundColor = [UIColor clearColor];
        [self.contentView addSubview:_boxView];
    }
    return _boxView;
}

@end



