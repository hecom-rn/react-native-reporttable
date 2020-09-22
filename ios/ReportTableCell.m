//
//  ReportTableCell.m
//  DoubleConversion
//
//  Created by ms on 2019/11/22.
//

#import "ReportTableCell.h"
#import "ReportTableView.h"
#import <Masonry/Masonry.h>
#import "ReportTableModel.h"
#import <React/RCTConvert.h>

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
    [self.label mas_makeConstraints:^(MASConstraintMaker *make) {
         make.right.equalTo(self.contentView.mas_right).offset([self isSetupImageView] ? - marginHor * 2 - 10 : - marginHor);
         make.left.equalTo(self.contentView.mas_left).offset(textPaddingHorizontal);
         make.centerY.equalTo(self.contentView.mas_centerY);
     }];
     [self.label layoutIfNeeded];
}

- (BOOL)isSetupImageView {
    return _lockImageView != nil || _customImageView != nil;
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
        }
        [self.label mas_updateConstraints:^(MASConstraintMaker *make) {
             make.right.equalTo(self.contentView.mas_right).offset(- textPaddingHorizontal);
        }];
        [self.label layoutIfNeeded];
    }
}

- (UIImageView *)lockImageView {
    if (!_lockImageView) {
        _lockImageView = [[UIImageView alloc] init];
        [self.contentView addSubview: _lockImageView];
        [_lockImageView mas_makeConstraints:^(MASConstraintMaker *make) {
            make.right.equalTo(self.contentView.mas_right).offset(-10);
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
            make.right.equalTo(self.contentView.mas_right).offset(-10);
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
        self.label.frame = self.bounds;
        self.label.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
        [self.contentView addSubview:self.label];
        self.label.translatesAutoresizingMaskIntoConstraints = false;
    }
    return self;
}
@end
