//
//  ReportTableViewModel.h
//
//
//  Created by ms on 2019/11/22.
//

#import <Foundation/Foundation.h>
#import <React/RCTView.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTComponent.h>

@interface ReportTableViewModel: RCTView

/// Old-architecture initialiser (bridge-based). No-op bridge accepted in new arch.
- (id)initWithBridge:(nullable RCTBridge *)bridge;

/// Convenience initialiser used by the Fabric component view.
- (id)initWithFrame:(CGRect)frame;

// ---- Imperative commands ----
- (void)scrollToLineX:(NSInteger)lineX lineY:(NSInteger)lineY offsetX:(float)offsetX offsetY:(float)offsetY animated:(BOOL)animated;
- (void)updateDataSource:(NSArray *)data withY:(NSInteger)y withX:(NSInteger)x;
- (void)spliceData:(NSArray *)config;
- (void)scrollToBottom;

// ---- Property setters (called by Fabric component view) ----
- (void)setSize:(CGSize)size;
- (void)setHeaderViewSize:(CGSize)headerViewSize;
- (void)setData:(NSArray *)data;
- (void)setMinWidth:(float)minWidth;
- (void)setMaxWidth:(float)maxWidth;
- (void)setMinHeight:(float)minHeight;
- (void)setFrozenColumns:(NSInteger)frozenColumns;
- (void)setFrozenRows:(NSInteger)frozenRows;
- (void)setLineColor:(NSString *)lineColor;
- (void)setItemConfig:(NSDictionary *)itemConfig;
- (void)setColumnsWidthMap:(NSDictionary *)columnsWidthMap;
- (void)setFrozenAbility:(NSDictionary *)frozenAbility;
- (void)setReplenishColumnsWidthConfig:(NSDictionary *)config;
- (void)setIgnoreLocks:(NSArray *)ignoreLocks;
- (void)setPermutable:(BOOL)permutable;
- (void)setDisableZoom:(BOOL)disableZoom;
- (void)setShowBorder:(BOOL)showBorder;

/// Called by the Fabric component view to install the optional header view.
/// Accepts any UIView subclass (including Fabric's RCTViewComponentView).
- (void)mountHeaderView:(UIView *)headerView;

/// Called by the Fabric component view when the header view is removed.
- (void)unmountHeaderView:(UIView *)headerView;

// ---- Event callbacks (wired up by Fabric component view) ----
@property (nonatomic, copy, nullable) RCTDirectEventBlock onClickEvent;
@property (nonatomic, copy, nullable) RCTDirectEventBlock onScrollEnd;
@property (nonatomic, copy, nullable) RCTDirectEventBlock onScroll;
@property (nonatomic, copy, nullable) RCTDirectEventBlock onContentSize;

@end

