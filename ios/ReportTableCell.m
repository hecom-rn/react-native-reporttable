//
//  ReportTableCell.m
//  DoubleConversion
//
//  Created by ms on 2019/11/22.
//

#import "ReportTableCell.h"
#import "ReportTableView.h"
#import <Masonry/Masonry.h>

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
         make.right.equalTo(self.contentView.mas_right).offset(_lockImageView != nil ? - marginHor * 2 - 10 : - marginHor);
         make.left.equalTo(self.contentView.mas_left).offset(textPaddingHorizontal);
         make.centerY.equalTo(self.contentView.mas_centerY);
     }];
     [self.label layoutIfNeeded];
}

- (void)setIsLocked:(BOOL)isLocked {
    if (isLocked == true) {
        self.lockImageView.image = [UIImage imageNamed: @"reportTableLock"];
    }
}

- (void)setIsUnLocked:(BOOL)isUnLocked {
     if (isUnLocked == true) {
         self.lockImageView.image = [UIImage imageNamed: @"reportTableUnLock"];
     }
}

- (void)updateContentView:(NSInteger)textPaddingHorizontal {
    if (_lockImageView) {
        [_lockImageView removeFromSuperview];
        _lockImageView = nil;
        [self.label mas_updateConstraints:^(MASConstraintMaker *make) {
             make.right.equalTo(self.contentView.mas_right).offset(_lockImageView != nil ? - textPaddingHorizontal * 2 - 10 : - textPaddingHorizontal);
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
