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


@interface ReportTableCell()
@property (strong, atomic) LineView *lineView;
@property (strong, atomic) BoxView *boxView;
@property (strong, atomic) CAGradientLayer *gradientLayer;
@end

@implementation ReportTableCell

- (UILabel *)label {
    if (!_label) {
        _label = [UILabel new];
        _label.numberOfLines = 0;
    }
    return _label;
}

- (void)setupProgressView:(ProgressStyle *)style WithRowWidth:(CGFloat)width Height:(CGFloat)height {
    CAGradientLayer *gradientLayer = [CAGradientLayer layer];
    CGFloat showWidth = width - 2 * style.marginHorizontal;
    CGRect frame = CGRectMake(style.marginHorizontal + showWidth * style.startRatio,
                              (height - style.height) / 2,
                              showWidth * (style.endRatio - style.startRatio),
                              style.height);
    gradientLayer.frame = frame;
    gradientLayer.cornerRadius = style.cornerRadius;
    gradientLayer.colors = style.colors;
    gradientLayer.startPoint = CGPointMake(0, 0.5);
    gradientLayer.endPoint = CGPointMake(1, 0.5);
    self.gradientLayer = gradientLayer;
    [self.contentView.layer addSublayer: gradientLayer];
}

- (void)hiddenProgressView {
    if (_gradientLayer != nil) {
        [_gradientLayer removeFromSuperlayer];
        _gradientLayer = nil;
    }
}

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



