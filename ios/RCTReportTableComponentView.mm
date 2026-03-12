//
//  RCTReportTableComponentView.mm
//
//  Fabric (New Architecture) component view for ReportTable.
//  Registered under the name "ReportTable" to match the old architecture.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "RCTReportTableComponentView.h"
#import "ReportTableViewModel.h"
#import "ReportTableEvent.h"

#import <react/renderer/components/ReportTableSpec/ComponentDescriptors.h>
#import <react/renderer/components/ReportTableSpec/EventEmitters.h>
#import <react/renderer/components/ReportTableSpec/Props.h>
#import <react/renderer/components/ReportTableSpec/RCTComponentViewHelpers.h>

#import <React/RCTConvert.h>
#import <React/RCTFabricComponentsPlugins.h>

using namespace facebook::react;

// ---------------------------------------------------------------------------
// Forward-declare the generated command handler protocol (codegen output).
// ---------------------------------------------------------------------------
@interface RCTReportTableComponentView () <RCTReportTableViewProtocol>
@end

@implementation RCTReportTableComponentView {
    ReportTableViewModel *_viewModel;
}

// ---------------------------------------------------------------------------
#pragma mark - Initialisation
// ---------------------------------------------------------------------------

- (instancetype)initWithFrame:(CGRect)frame
{
    if (self = [super initWithFrame:frame]) {
        // The view model hosts all legacy UIKit logic; we hand it no bridge in
        // new-arch mode – it initialises itself via the default init path.
        _viewModel = [[ReportTableViewModel alloc] initWithFrame:frame];
        _viewModel.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
        self.contentView = _viewModel;
    }
    return self;
}

// ---------------------------------------------------------------------------
#pragma mark - Fabric lifecycle
// ---------------------------------------------------------------------------

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<ReportTableComponentDescriptor>();
}

// ---------------------------------------------------------------------------
#pragma mark - Props update
// ---------------------------------------------------------------------------

- (void)updateProps:(const Props::Shared &)props
           oldProps:(const Props::Shared &)oldProps
{
    const auto &newProps = *std::static_pointer_cast<const ReportTableProps>(props);

    // ---- size ----
    [_viewModel setSize:CGSizeMake(newProps.size.width, newProps.size.height)];

    // ---- headerViewSize ----
    [_viewModel setHeaderViewSize:CGSizeMake(newProps.headerViewSize.width, newProps.headerViewSize.height)];

    // ---- data (JSON string → NSArray) ----
    {
        NSString *dataStr = [NSString stringWithUTF8String:newProps.data.c_str()];
        NSArray *data = [self arrayFromJSONString:dataStr];
        if (data) {
            [_viewModel setData:data];
        }
    }

    // ---- minWidth ----
    [_viewModel setMinWidth:newProps.minWidth];

    // ---- maxWidth ----
    [_viewModel setMaxWidth:newProps.maxWidth];

    // ---- minHeight ----
    [_viewModel setMinHeight:newProps.minHeight];

    // ---- frozenColumns ----
    [_viewModel setFrozenColumns:newProps.frozenColumns];

    // ---- frozenRows ----
    [_viewModel setFrozenRows:newProps.frozenRows];

    // ---- lineColor ----
    [_viewModel setLineColor:[NSString stringWithUTF8String:newProps.lineColor.c_str()]];

    // ---- showBorder ----
    [_viewModel setShowBorder:newProps.showBorder];

    // ---- disableZoom ----
    [_viewModel setDisableZoom:newProps.disableZoom];

    // ---- permutable ----
    [_viewModel setPermutable:newProps.permutable];

    // ---- itemConfig ----
    [_viewModel setItemConfig:[self itemConfigFromProps:newProps.itemConfig]];

    // ---- columnsWidthMap (JSON string → NSDictionary) ----
    {
        NSString *jsonStr = [NSString stringWithUTF8String:newProps.columnsWidthMap.c_str()];
        NSDictionary *dict = [self dictionaryFromJSONString:jsonStr];
        [_viewModel setColumnsWidthMap:dict ?: @{}];
    }

    // ---- frozenAbility (JSON string → NSDictionary) ----
    {
        NSString *jsonStr = [NSString stringWithUTF8String:newProps.frozenAbility.c_str()];
        NSDictionary *dict = [self dictionaryFromJSONString:jsonStr];
        [_viewModel setFrozenAbility:dict ?: @{}];
    }

    // ---- replenishColumnsWidthConfig (JSON string → NSDictionary) ----
    {
        NSString *jsonStr = [NSString stringWithUTF8String:newProps.replenishColumnsWidthConfig.c_str()];
        NSDictionary *dict = [self dictionaryFromJSONString:jsonStr];
        [_viewModel setReplenishColumnsWidthConfig:dict ?: @{}];
    }

    // ---- ignoreLocks ----
    {
        NSMutableArray *ignoreLocks = [NSMutableArray array];
        for (auto val : newProps.ignoreLocks) {
            [ignoreLocks addObject:@(val)];
        }
        [_viewModel setIgnoreLocks:ignoreLocks];
    }

    // ---- events ----
    [self setupEventCallbacks];

    [super updateProps:props oldProps:oldProps];
}

// ---------------------------------------------------------------------------
#pragma mark - Event wiring
// ---------------------------------------------------------------------------

- (void)setupEventCallbacks
{
    __weak __typeof(self) weakSelf = self;

    _viewModel.onClickEvent = ^(NSDictionary *body) {
        __strong __typeof(weakSelf) strongSelf = weakSelf;
        if (!strongSelf) return;
        auto eventEmitter = std::dynamic_pointer_cast<const ReportTableEventEmitter>(strongSelf->_eventEmitter);
        if (eventEmitter) {
            ReportTableEventEmitter::OnClickEvent event{};
            event.keyIndex        = [body[@"keyIndex"] intValue];
            event.rowIndex        = [body[@"rowIndex"] intValue];
            event.columnIndex     = [body[@"columnIndex"] intValue];
            event.verticalCount   = [body[@"verticalCount"] intValue];
            event.horizontalCount = [body[@"horizontalCount"] intValue];
            eventEmitter->onClickEvent(event);
        }
    };

    _viewModel.onScrollEnd = ^(NSDictionary *body) {
        __strong __typeof(weakSelf) strongSelf = weakSelf;
        if (!strongSelf) return;
        auto eventEmitter = std::dynamic_pointer_cast<const ReportTableEventEmitter>(strongSelf->_eventEmitter);
        if (eventEmitter) {
            ReportTableEventEmitter::OnScrollEnd event{};
            event.offsetX = [body[@"offsetX"] doubleValue];
            event.offsetY = [body[@"offsetY"] doubleValue];
            eventEmitter->onScrollEnd(event);
        }
    };

    _viewModel.onScroll = ^(NSDictionary *body) {
        __strong __typeof(weakSelf) strongSelf = weakSelf;
        if (!strongSelf) return;
        auto eventEmitter = std::dynamic_pointer_cast<const ReportTableEventEmitter>(strongSelf->_eventEmitter);
        if (eventEmitter) {
            ReportTableEventEmitter::OnScroll event{};
            event.offsetX = [body[@"offsetX"] doubleValue];
            event.offsetY = [body[@"offsetY"] doubleValue];
            eventEmitter->onScroll(event);
        }
    };

    _viewModel.onContentSize = ^(NSDictionary *body) {
        __strong __typeof(weakSelf) strongSelf = weakSelf;
        if (!strongSelf) return;
        auto eventEmitter = std::dynamic_pointer_cast<const ReportTableEventEmitter>(strongSelf->_eventEmitter);
        if (eventEmitter) {
            ReportTableEventEmitter::OnContentSize event{};
            event.width  = [body[@"width"] doubleValue];
            event.height = [body[@"height"] doubleValue];
            eventEmitter->onContentSize(event);
        }
    };
}

// ---------------------------------------------------------------------------
#pragma mark - Commands
// ---------------------------------------------------------------------------

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
    RCTReportTableHandleCommand(self, commandName, args);
}

- (void)scrollTo:(int)lineX lineY:(int)lineY offsetX:(float)offsetX offsetY:(float)offsetY animated:(BOOL)animated
{
    [_viewModel scrollToLineX:lineX lineY:lineY offsetX:offsetX offsetY:offsetY animated:animated];
}

- (void)updateData:(NSString *)dataJSON y:(int)y x:(int)x
{
    NSArray *data = [self arrayFromJSONString:dataJSON];
    if (data) {
        [_viewModel updateDataSource:data withY:y withX:x];
    }
}

- (void)spliceData:(NSString *)configJSON
{
    NSArray *config = [self arrayFromJSONString:configJSON];
    if (config) {
        [_viewModel spliceData:config];
    }
}

- (void)scrollToBottom
{
    [_viewModel scrollToBottom];
}

// ---------------------------------------------------------------------------
#pragma mark - Child view management (headerView)
// ---------------------------------------------------------------------------

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView
                          index:(NSInteger)index
{
    // The only valid child is the optional header view.
    // Use the dedicated mount method so any UIView subclass is accepted,
    // including Fabric's RCTViewComponentView (which is NOT an RCTView).
    [_viewModel mountHeaderView:(UIView *)childComponentView];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView
                            index:(NSInteger)index
{
    [_viewModel unmountHeaderView:(UIView *)childComponentView];
}

// ---------------------------------------------------------------------------
#pragma mark - Helpers
// ---------------------------------------------------------------------------

- (nullable NSArray *)arrayFromJSONString:(NSString *)jsonString
{
    if (!jsonString || jsonString.length == 0) return nil;
    NSData *data = [jsonString dataUsingEncoding:NSUTF8StringEncoding];
    if (!data) return nil;
    NSError *error = nil;
    id result = [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:&error];
    if (error || ![result isKindOfClass:[NSArray class]]) return nil;
    return (NSArray *)result;
}

- (nullable NSDictionary *)dictionaryFromJSONString:(NSString *)jsonString
{
    if (!jsonString || jsonString.length == 0) return nil;
    NSData *data = [jsonString dataUsingEncoding:NSUTF8StringEncoding];
    if (!data) return nil;
    NSError *error = nil;
    id result = [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:&error];
    if (error || ![result isKindOfClass:[NSDictionary class]]) return nil;
    return (NSDictionary *)result;
}

/**
 * Converts the codegen-generated ReportTableItemConfig C++ struct into
 * the NSDictionary format expected by -[ReportTableViewModel setItemConfig:].
 */
- (NSDictionary *)itemConfigFromProps:(const ReportTableItemConfigStruct &)cfg
{
    NSMutableDictionary *dict = [NSMutableDictionary dictionary];

    if (!cfg.backgroundColor.empty()) {
        dict[@"backgroundColor"] = [NSString stringWithUTF8String:cfg.backgroundColor.c_str()];
    }
    dict[@"fontSize"]              = @(cfg.fontSize);
    if (!cfg.textColor.empty()) {
        dict[@"textColor"] = [NSString stringWithUTF8String:cfg.textColor.c_str()];
    }
    dict[@"textAlignment"]         = @(cfg.textAlignment);
    dict[@"textPaddingHorizontal"] = @(cfg.textPaddingHorizontal);
    if (!cfg.classificationLineColor.empty()) {
        dict[@"classificationLineColor"] = [NSString stringWithUTF8String:cfg.classificationLineColor.c_str()];
    }
    dict[@"isOverstriking"] = @(cfg.isOverstriking);

    // progressStyle
    const auto &ps = cfg.progressStyle;
    NSMutableDictionary *progressDict = [NSMutableDictionary dictionary];
    progressDict[@"height"]           = @(ps.height);
    progressDict[@"cornerRadius"]     = @(ps.cornerRadius);
    progressDict[@"marginHorizontal"] = @(ps.marginHorizontal);

    // antsLineStyle
    const auto &als = ps.antsLineStyle;
    NSMutableDictionary *antsDict = [NSMutableDictionary dictionary];
    if (!als.color.empty()) {
        antsDict[@"color"] = [NSString stringWithUTF8String:als.color.c_str()];
    }
    antsDict[@"lineWidth"] = @(als.lineWidth);
    NSMutableArray *dashPattern = [NSMutableArray array];
    for (auto v : als.lineDashPattern) {
        [dashPattern addObject:@(v)];
    }
    if (dashPattern.count > 0) {
        antsDict[@"lineDashPattern"] = dashPattern;
    }
    progressDict[@"antsLineStyle"] = antsDict;
    dict[@"progressStyle"] = progressDict;

    return [dict copy];
}

@end

// ---------------------------------------------------------------------------
// Register this component with Fabric's component registry.
// ---------------------------------------------------------------------------
Class<RCTComponentViewProtocol> ReportTableCls(void)
{
    return RCTReportTableComponentView.class;
}

#endif // RCT_NEW_ARCH_ENABLED
