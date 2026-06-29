package com.hecom.reporttable;

import android.graphics.Color;
import android.graphics.Paint;
import android.text.TextUtils;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.viewmanagers.ReportTableManagerDelegate;
import com.facebook.react.viewmanagers.ReportTableManagerInterface;
import com.hecom.reporttable.form.data.style.LineStyle;
import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.table.HecomTable;
import com.hecom.reporttable.table.bean.CellConfig;
import com.hecom.reporttable.table.bean.FrozenConfigItem;
import com.hecom.reporttable.table.bean.ProgressStyle;
import com.hecom.reporttable.table.bean.ReplenishColumnsWidthConfig;
import com.hecom.reporttable.table.bean.TableConfigBean;
import com.hecom.reporttable.table.format.HecomStyle;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

/**
 * Fabric-compatible ViewManager for ReportTable.
 * Registered via codegen under the name "ReportTable".
 * Implements ReportTableManagerInterface for proper Fabric ShadowNode integration,
 * which ensures Yoga layout correctly measures HecomTable via SmartTable.onMeasure.
 */
public class ReportTableManager extends SimpleViewManager<HecomTable>
        implements ReportTableManagerInterface<HecomTable> {

    private final ReportTableManagerDelegate<HecomTable, ReportTableManager> mDelegate =
            new ReportTableManagerDelegate<>(this);

    private ThemedReactContext mReactContext;

    // Cached config values (applied together with the data prop)
    private String mLastDataJson;
    private int mMinWidthDp = 50;
    private int mMaxWidthDp = 120;
    private int mMinHeightDp = 40;
    private Map<Integer, CellConfig> mColumnConfigMap;

    @NonNull
    @Override
    public String getName() {
        return "ReportTable";
    }

    @NonNull
    @Override
    protected HecomTable createViewInstance(@NonNull final ThemedReactContext reactContext) {
        GsonHelper.initGson(reactContext);
        mReactContext = reactContext;
        return new HecomTable(reactContext);
    }

    // -----------------------------------------------------------------------
    // Props
    // -----------------------------------------------------------------------

    @ReactProp(name = "data")
    public void setData(HecomTable view, @Nullable String jsonDataStr) {
        if (TextUtils.isEmpty(jsonDataStr)) {
            return;
        }
        mLastDataJson = jsonDataStr;
        applyData(view);
    }

    @ReactProp(name = "minWidth")
    public void setMinWidth(HecomTable view, float minWidthDp) {
        mMinWidthDp = (int) minWidthDp;
        if (mMinWidthDp <= 0) mMinWidthDp = 50;
        applyConfigUpdate(view);
    }

    @ReactProp(name = "maxWidth")
    public void setMaxWidth(HecomTable view, float maxWidthDp) {
        mMaxWidthDp = (int) maxWidthDp;
        if (mMaxWidthDp <= 0) mMaxWidthDp = 120;
        applyConfigUpdate(view);
    }

    @ReactProp(name = "minHeight")
    public void setMinHeight(HecomTable view, float minHeightDp) {
        mMinHeightDp = (int) minHeightDp;
        if (mMinHeightDp <= 0) mMinHeightDp = 40;
        applyConfigUpdate(view);
    }

    @ReactProp(name = "columnsWidthMap")
    public void setColumnsWidthMap(HecomTable view, @Nullable String columnsWidthMapJson) {
        if (TextUtils.isEmpty(columnsWidthMapJson)) {
            mColumnConfigMap = null;
        } else {
            try {
                mColumnConfigMap = GsonHelper.getGson()
                        .fromJson(columnsWidthMapJson,
                                new com.google.gson.reflect.TypeToken<Map<Integer, CellConfig>>() {
                                }.getType());
            } catch (Exception e) {
                e.printStackTrace();
                mColumnConfigMap = null;
            }
        }
        applyConfigUpdate(view);
    }

    @ReactProp(name = "frozenColumns")
    public void setFrozenColumns(HecomTable view, int frozenColumns) {
        view.getLockHelper().setFrozenColumns(frozenColumns);
    }

    @ReactProp(name = "frozenRows")
    public void setFrozenRows(HecomTable view, int frozenRows) {
        view.getConfig().setFixedLines(frozenRows);
    }

    @ReactProp(name = "frozenAbility")
    public void setFrozenAbility(HecomTable view, @Nullable String frozenAbilityJson) {
        if (TextUtils.isEmpty(frozenAbilityJson)) {
            return;
        }
        try {
            Map<String, FrozenConfigItem> rawMap = GsonHelper.getGson()
                    .fromJson(frozenAbilityJson,
                            new com.google.gson.reflect.TypeToken<Map<String, FrozenConfigItem>>() {
                            }.getType());
            if (rawMap != null) {
                Map<Integer, FrozenConfigItem> ability = new HashMap<>();
                for (Map.Entry<String, FrozenConfigItem> entry : rawMap.entrySet()) {
                    int column = Integer.parseInt(entry.getKey());
                    FrozenConfigItem config = entry.getValue();
                    config.setColumn(column);
                    ability.put(column, config);
                }
                view.getLockHelper().setAbility(ability);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @ReactProp(name = "permutable")
    public void setPermutable(HecomTable view, boolean permutable) {
        view.getLockHelper().setPermutable(permutable);
    }

    @ReactProp(name = "disableZoom")
    public void setDisableZoom(HecomTable view, boolean disableZoom) {
        view.setZoom(!disableZoom);
    }

    @ReactProp(name = "doubleClickZoom")
    public void setDoubleClickZoom(HecomTable view, boolean doubleClickZoom) {
        view.setDoubleClickZoom(doubleClickZoom);
    }

    @ReactProp(name = "lineColor")
    public void setLineColor(HecomTable view, @Nullable String lineColor) {
        if (TextUtils.isEmpty(lineColor)) {
            return;
        }
        LineStyle lineStyle = new LineStyle();
        lineStyle.setColor(Color.parseColor(lineColor));
        view.getConfig().setContentGridStyle(lineStyle);
    }

    @ReactProp(name = "showBorder")
    public void setShowBorder(HecomTable view, boolean showBorder) {
        view.setShowBorder(showBorder);
    }

    @ReactProp(name = "ignoreLocks")
    public void setIgnoreLocks(HecomTable view, @Nullable ReadableArray ignoreLocks) {
        if (ignoreLocks == null) {
            return;
        }
        Set<Integer> ignore = new HashSet<>(ignoreLocks.size());
        for (int i = 0; i < ignoreLocks.size(); i++) {
            ignore.add(ignoreLocks.getInt(i));
        }
        view.getLockHelper().setIgnores(ignore);
    }

    @ReactProp(name = "itemConfig")
    public void setItemConfig(HecomTable view, @Nullable ReadableMap config) {
        if (config == null) {
            return;
        }
        HecomStyle style = new HecomStyle();
        if (config.hasKey("classificationLineColor")) {
            style.setLineColor(Color.parseColor(config.getString("classificationLineColor")));
        }
        if (config.hasKey("backgroundColor")) {
            style.setBackgroundColor(Color.parseColor(config.getString("backgroundColor")));
        }
        if (config.hasKey("textColor")) {
            style.setTextColor(Color.parseColor(config.getString("textColor")));
        }
        if (config.hasKey("fontSize")) {
            style.setTextSize(DensityUtils.dp2px(view.getContext(), config.getInt("fontSize")));
        }
        if (config.hasKey("textPaddingHorizontal")) {
            style.setPaddingHorizontal(DensityUtils.dp2px(view.getContext(),
                    config.getInt("textPaddingHorizontal")));
        }
        if (config.hasKey("textAlignment")) {
            int textAlignment = config.getInt("textAlignment");
            Paint.Align align = textAlignment == 1 ? Paint.Align.CENTER
                    : textAlignment == 2 ? Paint.Align.RIGHT : Paint.Align.LEFT;
            style.setAlign(align);
        }
        if (config.hasKey("isOverstriking")) {
            style.setOverstriking(config.getBoolean("isOverstriking"));
        }
        view.setHecomStyle(style);
        if (config.hasKey("progressStyle")) {
            setProgressStyle(view, config.getMap("progressStyle"));
        }
    }

    @ReactProp(name = "replenishColumnsWidthConfig")
    public void setReplenishColumnsWidthConfig(HecomTable view, @Nullable String replenishConfigJson) {
        if (TextUtils.isEmpty(replenishConfigJson)) {
            return;
        }
        try {
            ReplenishColumnsWidthConfig replenishConfig = GsonHelper.getGson()
                    .fromJson(replenishConfigJson, ReplenishColumnsWidthConfig.class);
            if (replenishConfig != null) {
                view.setReplenishConfig(replenishConfig);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @ReactProp(name = "size")
    public void setSize(HecomTable view, @Nullable ReadableMap size) {
        // Size is handled by the React layout system via style={width, height}
    }

    @ReactProp(name = "headerViewSize")
    public void setHeaderViewSize(HecomTable view, @Nullable ReadableMap size) {
        // Header view size is consumed by the JS wrapper
    }

    // -----------------------------------------------------------------------
    // Config helpers
    // -----------------------------------------------------------------------

    private TableConfigBean createConfigBean(HecomTable view) {
        return new TableConfigBean(
                DensityUtils.dp2px(view.getContext(), mMinWidthDp),
                DensityUtils.dp2px(view.getContext(), mMaxWidthDp),
                DensityUtils.dp2px(view.getContext(), mMinHeightDp),
                mColumnConfigMap);
    }

    private void applyData(HecomTable view) {
        if (mLastDataJson == null) {
            return;
        }
        view.setData(mLastDataJson, createConfigBean(view));
    }

    private void applyConfigUpdate(HecomTable view) {
        if (mLastDataJson != null) {
            view.setData(mLastDataJson, createConfigBean(view));
        }
    }

    // -----------------------------------------------------------------------
    // ProgressStyle helper
    // -----------------------------------------------------------------------

    private void setProgressStyle(HecomTable view, @Nullable ReadableMap config) {
        if (config == null) {
            return;
        }
        ProgressStyle style = new ProgressStyle();
        if (config.hasKey("colors")) {
            ReadableArray colors = config.getArray("colors");
            int[] colorArr = new int[colors.size()];
            for (int i = 0; i < colors.size(); i++) {
                colorArr[i] = Color.parseColor(colors.getString(i));
            }
            style.setColors(colorArr);
        }
        if (config.hasKey("height")) {
            style.setHeight(DensityUtils.dp2px(view.getContext(), (float) config.getDouble("height")));
        }
        if (config.hasKey("cornerRadius")) {
            style.setRadius(DensityUtils.dp2px(view.getContext(), (float) config.getDouble("cornerRadius")));
        }
        if (config.hasKey("marginHorizontal")) {
            style.setMarginHorizontal(DensityUtils.dp2px(view.getContext(),
                    (float) config.getDouble("marginHorizontal")));
        }
        if (config.hasKey("startRatio")) {
            style.setStartRatio((float) config.getDouble("startRatio"));
        }
        if (config.hasKey("endRatio")) {
            style.setEndRatio((float) config.getDouble("endRatio"));
        }
        if (config.hasKey("antsLineStyle")) {
            ReadableMap antsLineStyle = config.getMap("antsLineStyle");
            if (antsLineStyle != null) {
                ProgressStyle.AntsLineStyle antsStyle = new ProgressStyle.AntsLineStyle();
                if (antsLineStyle.hasKey("color")) {
                    antsStyle.setColor(Color.parseColor(antsLineStyle.getString("color")));
                }
                if (antsLineStyle.hasKey("lineWidth")) {
                    antsStyle.setWidth(DensityUtils.dp2px(view.getContext(),
                            (float) antsLineStyle.getDouble("lineWidth")));
                }
                if (antsLineStyle.hasKey("lineDashPattern")) {
                    ReadableArray pattern = antsLineStyle.getArray("lineDashPattern");
                    float[] patternArr = new float[pattern.size()];
                    for (int i = 0; i < pattern.size(); i++) {
                        patternArr[i] = DensityUtils.dp2px(view.getContext(), (float) pattern.getDouble(i));
                    }
                    antsStyle.setDashPattern(patternArr);
                }
                style.setAntsLineStyle(antsStyle);
            }
        }
        view.setProgressStyle(style);
    }

    // -----------------------------------------------------------------------
    // Fabric delegate
    // -----------------------------------------------------------------------

    @Override
    protected ViewManagerDelegate<HecomTable> getDelegate() {
        return mDelegate;
    }

    // -----------------------------------------------------------------------
    // Fabric codegen command methods (called by ReportTableManagerDelegate)
    // -----------------------------------------------------------------------

    @Override
    public void scrollTo(HecomTable view, int lineX, int lineY, float offsetX, float offsetY, boolean animated) {
        com.hecom.reporttable.form.data.TableInfo tableInfo = view.getTableData().getTableInfo();
        int duration = animated ? 300 : 0;
        if (lineY == 0) {
            view.getMatrixHelper().flingTop(duration, (int) offsetY);
        }
        if (lineX == 0) {
            view.getMatrixHelper().flingLeft(duration, (int) offsetX);
        }
        if (lineY > 0) {
            view.getMatrixHelper().flingToRow(tableInfo, lineY, (int) offsetY, duration);
        }
        if (lineX > 0) {
            view.getMatrixHelper().flingToColumn(tableInfo, lineX, (int) offsetX, duration);
        }
    }

    @Override
    public void updateData(HecomTable view, String data, int y, int x) {
        view.updateData(data, x, y);
    }

    @Override
    public void spliceData(HecomTable view, String config) {
        if (config == null || config.isEmpty()) {
            return;
        }
        try {
            HecomTable.SpliceItem[] items = GsonHelper.getGson()
                    .fromJson(config, HecomTable.SpliceItem[].class);
            if (items != null) {
                view.spliceDataArray(items);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void scrollToBottom(HecomTable view) {
        view.getMatrixHelper().flingBottom(300);
    }

    // -----------------------------------------------------------------------
    // Commands (Paper fallback via getCommandsMap / receiveCommand)
    // -----------------------------------------------------------------------

    @Nullable
    @Override
    public Map<String, Integer> getCommandsMap() {
        return MapBuilder.of(
                "scrollTo", 1,
                "scrollToBottom", 2,
                "updateData", 3,
                "spliceData", 4
        );
    }

    @Override
    public void receiveCommand(@NonNull HecomTable root, String commandId,
            @Nullable ReadableArray args) {
        switch (commandId) {
            case "scrollTo":
                handleScrollTo(root, args);
                break;
            case "scrollToBottom":
                handleScrollToBottom(root);
                break;
            case "updateData":
                handleUpdateData(root, args);
                break;
            case "spliceData":
                handleSpliceData(root, args);
                break;
        }
    }

    /**
     * Handle scrollTo command.
     * Fabric format (Codegen): [lineX, lineY, offsetX, offsetY, animated]
     * Paper format (legacy): [{lineX, lineY, offsetX, offsetY, animated}]
     */
    private void handleScrollTo(HecomTable root, @Nullable ReadableArray args) {
        if (args == null || args.size() == 0) {
            return;
        }
        com.hecom.reporttable.form.data.TableInfo tableInfo = root.getTableData().getTableInfo();
        int lineX, lineY, offsetX, offsetY, duration;

        if (args.size() >= 5 && args.getType(0) == ReadableType.Number) {
            lineX = args.getInt(0);
            lineY = args.getInt(1);
            offsetX = (int) args.getDouble(2);
            offsetY = (int) args.getDouble(3);
            boolean animated = args.getBoolean(4);
            duration = animated ? 300 : 0;
        } else if (args.getType(0) == ReadableType.Map) {
            ReadableMap map = args.getMap(0);
            if (map == null) return;
            lineX = map.getInt("lineX");
            lineY = map.getInt("lineY");
            offsetX = map.getInt("offsetX");
            offsetY = map.getInt("offsetY");
            boolean animated = map.getBoolean("animated");
            duration = animated ? 300 : 0;
        } else {
            return;
        }

        if (lineY == 0) {
            root.getMatrixHelper().flingTop(duration, offsetY);
        }
        if (lineX == 0) {
            root.getMatrixHelper().flingLeft(duration, offsetX);
        }
        if (lineY > 0) {
            root.getMatrixHelper().flingToRow(tableInfo, lineY, offsetY, duration);
        }
        if (lineX > 0) {
            root.getMatrixHelper().flingToColumn(tableInfo, lineX, offsetX, duration);
        }
    }

    private void handleScrollToBottom(HecomTable root) {
        root.getMatrixHelper().flingBottom(300);
    }

    /**
     * Handle updateData command.
     * Fabric format (Codegen): [dataJSON, y, x]
     * Paper format (legacy): [{data, x, y}]
     */
    private void handleUpdateData(HecomTable root, @Nullable ReadableArray args) {
        if (args == null || args.size() == 0) {
            return;
        }
        String data;
        int x, y;

        if (args.size() >= 3 && args.getType(0) == ReadableType.String) {
            data = args.getString(0);
            y = args.getInt(1);
            x = args.getInt(2);
        } else if (args.getType(0) == ReadableType.Map) {
            ReadableMap map = args.getMap(0);
            if (map == null) return;
            data = map.getString("data");
            x = map.getInt("x");
            y = map.getInt("y");
        } else {
            return;
        }

        root.updateData(data, x, y);
    }

    /**
     * Handle spliceData command.
     * Fabric format (Codegen): [configJSON]
     * Paper format (legacy): [[...spliceItems]]
     */
    private void handleSpliceData(HecomTable root, @Nullable ReadableArray args) {
        if (args == null || args.size() == 0) {
            return;
        }

        if (args.getType(0) == ReadableType.String) {
            String configJson = args.getString(0);
            try {
                HecomTable.SpliceItem[] items = GsonHelper.getGson()
                        .fromJson(configJson, HecomTable.SpliceItem[].class);
                if (items != null) {
                    root.spliceDataArray(items);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        } else if (args.getType(0) == ReadableType.Array) {
            ReadableArray array = args.getArray(0);
            if (array == null) return;
            HecomTable.SpliceItem[] spliceItems = new HecomTable.SpliceItem[array.size()];
            for (int i = 0; i < array.size(); ++i) {
                ReadableMap map = array.getMap(i);
                if (map == null) continue;
                String data = map.getString("data");
                int y = map.getInt("y");
                int l = map.getInt("l");
                HecomTable.SpliceItem item = new HecomTable.SpliceItem(data, y, l);
                spliceItems[i] = item;
            }
            root.spliceDataArray(spliceItems);
        }
    }

    // -----------------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------------

    @Nullable
    @Override
    public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
        return MapBuilder.<String, Object>builder()
                .put("topClickOnItem", MapBuilder.of("registrationName", "onClickEvent"))
                .put("topOnScrollEnd", MapBuilder.of("registrationName", "onScrollEnd"))
                .put("topOnScroll", MapBuilder.of("registrationName", "onScroll"))
                .put("topOnContentSize", MapBuilder.of("registrationName", "onContentSize"))
                .build();
    }
}
