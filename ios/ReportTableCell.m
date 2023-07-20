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

@interface ReportTableCell()

@end

@implementation ReportTableCell

- (UILabel *)label {
    if (!_label) {
        _label = [UILabel new];
        _label.numberOfLines = 0;
    }
    return _label;
}


- (void)setTextPaddingHorizontal:(NSInteger)textPaddingHorizontal {
    CGFloat marginHor = textPaddingHorizontal;
    _textPaddingHorizontal = textPaddingHorizontal;
    [self.label mas_remakeConstraints:^(MASConstraintMaker *make) {
        float paddingHorizontal = _icon ? self.icon.paddingHorizontal : 4;
        float inconWidth = _icon ? self.icon.size.width : 13;
        float w = inconWidth + paddingHorizontal + marginHor;
        if (self.textAlignment == NSTextAlignmentRight) {
            if (self.icon.imageAlignment == 1) {
                make.right.equalTo(self.contentView.mas_right).offset(-marginHor);
                make.left.greaterThanOrEqualTo(self.contentView.mas_left).offset([self isSetupImageView] ? w : marginHor);
            } else {
                make.right.equalTo(self.contentView.mas_right).offset([self isSetupImageView] ? -w : -marginHor);
                make.left.greaterThanOrEqualTo(self.contentView.mas_left).offset(marginHor);
            }
        } else if (self.textAlignment == NSTextAlignmentCenter) {
            make.centerX.equalTo(self.contentView.mas_centerX);
            if (self.icon.imageAlignment == 1) {
                make.right.mas_lessThanOrEqualTo(self.contentView.mas_right).offset(-textPaddingHorizontal);
                make.left.mas_greaterThanOrEqualTo(self.contentView.mas_left).offset([self isSetupImageView] ? w : marginHor);
            } else {
                make.right.mas_lessThanOrEqualTo(self.contentView.mas_right).offset(-marginHor);
                make.left.mas_greaterThanOrEqualTo(self.contentView.mas_left).offset(textPaddingHorizontal);
            }
        } else {
            if (self.icon.imageAlignment == 1) {
                make.right.equalTo(self.contentView.mas_right).offset(-textPaddingHorizontal);
                make.left.equalTo(self.contentView.mas_left).offset([self isSetupImageView] ? w : marginHor);
            } else {
                if ([self isSetupImageView] ) {
                    make.right.mas_lessThanOrEqualTo(self.contentView.mas_right).offset(-w);
                } else {
                    make.right.equalTo(self.contentView.mas_right).offset(-marginHor);
                }
                make.left.equalTo(self.contentView.mas_left).offset(textPaddingHorizontal);
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
    dispatch_async(dispatch_get_main_queue(), ^{
        self.customImageView.image = [RCTConvert UIImage:icon.path];
    });
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

- (void)setIsForbidden:(BOOL)isForbidden {
    _isForbidden = isForbidden;
    if (isForbidden) {
        self.label.text = @"";
        self.backgroundColor = self.contentView.backgroundColor;
        self.contentView.backgroundColor = [UIColor clearColor];
    }
}


- (void)drawRect:(CGRect)rect {
    [super drawRect:rect];
    if (!self.isForbidden) {
        return;
    }
    
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



