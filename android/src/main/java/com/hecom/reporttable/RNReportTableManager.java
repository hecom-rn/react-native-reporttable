package com.hecom.reporttable;

import com.google.gson.reflect.TypeToken;

import android.graphics.Color;
import android.graphics.Paint;
import android.text.TextUtils;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.viewmanagers.ReportTableManagerDelegate;
import com.facebook.react.viewmanagers.ReportTableManagerInterface;
import com.hecom.reporttable.GsonHelper;
import com.hecom.reporttable.form.data.TableInfo;
import com.hecom.reporttable.form.data.style.LineStyle;
import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.table.HecomTable;
import com.hecom.reporttable.table.bean.CellConfig;
import com.hecom.reporttable.table.bean.FrozenConfigItem;
import com.hecom.reporttable.table.bean.ProgressStyle;
import com.hecom.reporttable.table.bean.ReplenishColumnsWidthConfig;
import com.hecom.reporttable.table.bean.TableConfigBean;
import com.hecom.reporttable.table.format.HecomStyle;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.WeakHashMap;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class RNReportTableManager extends SimpleViewManager<HecomTable>
        implements ReportTableManagerInterface<HecomTable> {
    private static final float DEFAULT_MIN_WIDTH_DP = 50f;
    private static final float DEFAULT_MAX_WIDTH_DP = 120f;
    private static final float DEFAULT_MIN_HEIGHT_DP = 40f;

    private final ViewManagerDelegate<HecomTable> mDelegate;
    private final Map<HecomTable, ViewState> mViewStates = new WeakHashMap<>();

    private static class ViewState {
        @Nullable
        String dataJson;
        @Nullable
        String columnsWidthMapJson;
        float minWidthDp = DEFAULT_MIN_WIDTH_DP;
        float maxWidthDp = DEFAULT_MAX_WIDTH_DP;
        float minHeightDp = DEFAULT_MIN_HEIGHT_DP;
    }

    public RNReportTableManager() {
        mDelegate = new ReportTableManagerDelegate<>(this);
    }

    @Nullable
    @Override
    protected ViewManagerDelegate<HecomTable> getDelegate() {
        return mDelegate;
    }

    @NonNull
    @Override
    public String getName() {
        return "ReportTable";
    }

    @NonNull
    @Override
    protected HecomTable createViewInstance(@NonNull final ThemedReactContext reactContext) {
        GsonHelper.initGson(reactContext);
        return new HecomTable(reactContext);
    }

    @Override
    public void onDropViewInstance(@NonNull HecomTable view) {
        super.onDropViewInstance(view);
        mViewStates.remove(view);
    }

    private ViewState getViewState(HecomTable view) {
        ViewState state = mViewStates.get(view);
        if (state == null) {
            state = new ViewState();
            mViewStates.put(view, state);
        }
        return state;
    }

    private void applyData(HecomTable view) {
        ViewState state = getViewState(view);
        if (TextUtils.isEmpty(state.dataJson)) {
            return;
        }

        int minWidthPx = DensityUtils.dp2px(view.getContext(), state.minWidthDp);
        int maxWidthPx = DensityUtils.dp2px(view.getContext(), state.maxWidthDp);
        int minHeightPx = DensityUtils.dp2px(view.getContext(), state.minHeightDp);
        TableConfigBean configBean = new TableConfigBean(minWidthPx, maxWidthPx, minHeightPx);
        if (!TextUtils.isEmpty(state.columnsWidthMapJson)) {
            try {
                Map<Integer, CellConfig> columnConfigMap = GsonHelper.getGson()
                        .fromJson(state.columnsWidthMapJson, new TypeToken<Map<Integer, CellConfig>>() {
                        }.getType());
                if (columnConfigMap != null) {
                    configBean.setColumnConfigMap(columnConfigMap);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        view.setData(state.dataJson, configBean);
    }

    private void setProgressStyle(HecomTable view, ReadableMap config) {
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
            style.setHeight(DensityUtils.dp2px(view.getContext(), (float) config.getDouble(
                    "height")));
        }
        if (config.hasKey("cornerRadius")) {
            style.setRadius(DensityUtils.dp2px(view.getContext(), (float) config.getDouble(
                    "cornerRadius")));
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
            ProgressStyle.AntsLineStyle antsStyle = new ProgressStyle.AntsLineStyle();
            if (antsLineStyle.hasKey("color")) {
                antsStyle.setColor(Color.parseColor(antsLineStyle.getString("color")));
            }
            if (antsLineStyle.hasKey("lineWidth")) {
                antsStyle.setWidth(DensityUtils.dp2px(view.getContext(),
                        (float) antsLineStyle.getDouble("lineWidth")));
            }
            if (antsLineStyle.hasKey("lineDashPattern")) {
                ReadableArray colors = antsLineStyle.getArray("lineDashPattern");
                float[] pattern = new float[colors.size()];
                for (int i = 0; i < colors.size(); i++) {
                    pattern[i] = DensityUtils.dp2px(view.getContext(), (float) colors.getDouble(i));
                }
                antsStyle.setDashPattern(pattern);
            }
            style.setAntsLineStyle(antsStyle);
        }
        view.setProgressStyle(style);
    }

    @ReactProp(name = "size")
    @Override
    public void setSize(HecomTable view, @Nullable ReadableMap size) {
        // Android wrapper controls outer layout; table has fixed intrinsic size
    }

    @ReactProp(name = "headerViewSize")
    @Override
    public void setHeaderViewSize(HecomTable view, @Nullable ReadableMap headerSize) {
        // Header rendering handled in JS wrapper on Android
    }

    @ReactProp(name = "showBorder", defaultBoolean = false)
    @Override
    public void setShowBorder(HecomTable view, boolean showBorder) {
        // Grid rendering already handled by HecomTable config
    }

    @ReactProp(name = "data")
    @Override
    public void setData(HecomTable view, @Nullable String dataJson) {
        ViewState state = getViewState(view);
        state.dataJson = TextUtils.isEmpty(dataJson) ? null : dataJson;
        applyData(view);
    }

    @ReactProp(name = "columnsWidthMap")
    @Override
    public void setColumnsWidthMap(HecomTable view, @Nullable String columnsWidthMap) {
        ViewState state = getViewState(view);
        state.columnsWidthMapJson = TextUtils.isEmpty(columnsWidthMap) ? null : columnsWidthMap;
        applyData(view);
    }

    @ReactProp(name = "minWidth", defaultFloat = DEFAULT_MIN_WIDTH_DP)
    @Override
    public void setMinWidth(HecomTable view, float minWidth) {
        ViewState state = getViewState(view);
        state.minWidthDp = minWidth;
        applyData(view);
    }

    @ReactProp(name = "maxWidth", defaultFloat = DEFAULT_MAX_WIDTH_DP)
    @Override
    public void setMaxWidth(HecomTable view, float maxWidth) {
        ViewState state = getViewState(view);
        state.maxWidthDp = maxWidth;
        applyData(view);
    }

    @ReactProp(name = "minHeight", defaultFloat = DEFAULT_MIN_HEIGHT_DP)
    @Override
    public void setMinHeight(HecomTable view, float minHeight) {
        ViewState state = getViewState(view);
        state.minHeightDp = minHeight;
        applyData(view);
    }

    @ReactProp(name = "replenishColumnsWidthConfig")
    @Override
    public void setReplenishColumnsWidthConfig(HecomTable view, @Nullable String configJson) {
        if (TextUtils.isEmpty(configJson)) {
            view.setReplenishConfig(null);
            return;
        }
        try {
            JSONObject config = new JSONObject(configJson);
            if (!config.has("showNumber")) {
                view.setReplenishConfig(null);
                return;
            }
            ReplenishColumnsWidthConfig replenishConfig = new ReplenishColumnsWidthConfig();
            replenishConfig.setShowNumber(config.optInt("showNumber", 0));
            JSONArray ignoreColumns = config.optJSONArray("ignoreColumns");
            if (ignoreColumns != null) {
                Set<Integer> ignore = new HashSet<>(ignoreColumns.length());
                for (int i = 0; i < ignoreColumns.length(); i++) {
                    ignore.add(ignoreColumns.optInt(i));
                }
                replenishConfig.setIgnoreColumns(ignore);
            }
            view.setReplenishConfig(replenishConfig);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void scrollTo(HecomTable view, double lineX, double lineY, double offsetX, double offsetY,
            boolean animated) {
        processScrollTo(view, (int) lineX, (int) lineY, (int) offsetX, (int) offsetY, animated);
    }

    @Override
    public void scrollToBottom(HecomTable view) {
        processScrollToBottom(view);
    }

    @Override
    public void updateData(HecomTable view, String data, double y, double x) {
        processUpdateData(view, data, (int) x, (int) y);
    }

    @Override
    public void spliceData(HecomTable view, String config) {
        processSpliceData(view, parseSpliceItemsJson(config));
    }

    @ReactProp(name = "ignoreLocks")
    @Override
    public void setIgnoreLocks(HecomTable view, @Nullable ReadableArray ignoreLocks) {
        Set<Integer> ignore = new HashSet<>();
        if (ignoreLocks != null) {
            for (int i = 0; i < ignoreLocks.size(); i++) {
                ignore.add(ignoreLocks.getInt(i));
            }
        }
        view.getLockHelper().setIgnores(ignore);
    }

    @ReactProp(name = "disableZoom")
    @Override
    public void setDisableZoom(HecomTable view, boolean disableZoom) {
        view.setZoom(!disableZoom);
    }

    @ReactProp(name = "frozenRows")
    @Override
    public void setFrozenRows(HecomTable view, int frozenRows) {
        view.getConfig().setFixedLines(frozenRows);
    }

    @ReactProp(name = "frozenColumns")
    @Override
    public void setFrozenColumns(HecomTable view, int frozenColumns) {
        view.getLockHelper().setFrozenColumns(frozenColumns);
    }

    @ReactProp(name = "frozenAbility")
    @Override
    public void setFrozenAbility(HecomTable view, @Nullable String frozenAbilityJson) {
        if (TextUtils.isEmpty(frozenAbilityJson)) {
            view.getLockHelper().setAbility(null);
            return;
        }
        try {
            JSONObject frozenAbility = new JSONObject(frozenAbilityJson);
            Map<Integer, FrozenConfigItem> ability = new HashMap<>();
            Iterator<String> iterator = frozenAbility.keys();
            while (iterator.hasNext()) {
                String key = iterator.next();
                FrozenConfigItem config = new FrozenConfigItem();
                try {
                    config.setColumn(Integer.parseInt(key));
                } catch (NumberFormatException e) {
                    continue;
                }
                JSONObject item = frozenAbility.optJSONObject(key);
                if (item != null && item.has("locked")) {
                    config.setLocked(item.optBoolean("locked"));
                }
                ability.put(config.getColumn(), config);
            }
            view.getLockHelper().setAbility(ability);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    @ReactProp(name = "permutable")
    @Override
    public void setPermutable(HecomTable view, boolean permutable) {
        view.getLockHelper().setPermutable(permutable);
    }

    @ReactProp(name = "doubleClickZoom", defaultBoolean = true)
    @Override
    public void setDoubleClickZoom(HecomTable view, boolean doubleClickZoom) {
        view.setDoubleClickZoom(doubleClickZoom);
    }

    @ReactProp(name = "lineColor")
    @Override
    public void setLineColor(HecomTable view, String lineColor) {
        if (TextUtils.isEmpty(lineColor)) {
            return;
        }
        LineStyle lineStyle = new LineStyle();
        lineStyle.setColor(Color.parseColor(lineColor));
        view.getConfig().setContentGridStyle(lineStyle);

    }

    @ReactProp(name = "itemConfig")
    @Override
    public void setItemConfig(HecomTable view, ReadableMap config) {
        if (config == null) {
            return;
        }
        HecomStyle style = new HecomStyle();
        // 颜色属性特殊处理，直接将字符串（#ffffff）转为int
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

    @Override
    public void receiveCommand(@NonNull HecomTable root, String commandId,
            @Nullable ReadableArray args) {
        super.receiveCommand(root, commandId, args);
        switch (commandId) {
            case "scrollTo":
                processScrollTo(root, args);
                break;
            case "scrollToBottom":
                processScrollToBottom(root);
                break;
            case "updateData":
                processUpdateData(root, args);
                break;
            case "spliceData":
                processSpliceData(root, args);
                break;
        }
    }

    private void processUpdateData(HecomTable root, ReadableArray args) {
        if (args == null || args.size() == 0) {
            return;
        }
        ReadableMap map = args.getMap(0);
        if (map == null) {
            return;
        }
        String data = map.hasKey("data") ? map.getString("data") : null;
        int x = map.hasKey("x") ? map.getInt("x") : 0;
        int y = map.hasKey("y") ? map.getInt("y") : 0;
        processUpdateData(root, data, x, y);
    }

    private void processUpdateData(HecomTable root, @Nullable String data, int x, int y) {
        if (TextUtils.isEmpty(data)) {
            return;
        }
        root.updateData(data, x, y);
    }

    private void processSpliceData(HecomTable root, ReadableArray args) {
        if (args == null || args.size() == 0) {
            return;
        }
        ReadableArray array = args.getArray(0);
        processSpliceData(root, parseReadableSpliceItems(array));
    }

    private void processSpliceData(HecomTable root, HecomTable.SpliceItem[] spliceItems) {
        if (spliceItems == null || spliceItems.length == 0) {
            return;
        }
        root.spliceDataArray(spliceItems);
    }

    private HecomTable.SpliceItem[] parseReadableSpliceItems(@Nullable ReadableArray array) {
        if (array == null || array.size() == 0) {
            return new HecomTable.SpliceItem[0];
        }
        List<HecomTable.SpliceItem> items = new ArrayList<>();
        for (int i = 0; i < array.size(); ++i) {
            ReadableMap map = array.getMap(i);
            if (map == null) {
                continue;
            }
            String data = map.hasKey("data") ? map.getString("data") : "";
            int y = map.hasKey("y") ? map.getInt("y") : 0;
            int l = map.hasKey("l") ? map.getInt("l") : 0;
            items.add(new HecomTable.SpliceItem(data, y, l));
        }
        return items.toArray(new HecomTable.SpliceItem[0]);
    }

    private HecomTable.SpliceItem[] parseSpliceItemsJson(@Nullable String json) {
        if (TextUtils.isEmpty(json)) {
            return new HecomTable.SpliceItem[0];
        }
        try {
            JSONArray array = new JSONArray(json);
            List<HecomTable.SpliceItem> items = new ArrayList<>(array.length());
            for (int i = 0; i < array.length(); i++) {
                JSONObject object = array.optJSONObject(i);
                if (object == null) {
                    continue;
                }
                String data = object.optString("data", "");
                int y = object.optInt("y", 0);
                int l = object.optInt("l", 0);
                items.add(new HecomTable.SpliceItem(data, y, l));
            }
            return items.toArray(new HecomTable.SpliceItem[0]);
        } catch (JSONException e) {
            e.printStackTrace();
            return new HecomTable.SpliceItem[0];
        }
    }

    private void processScrollTo(HecomTable root, ReadableArray args) {
        if (args == null || args.size() == 0) {
            return;
        }
        ReadableMap map = args.getMap(0);
        if (map == null) {
            return;
        }
        int lineX = map.hasKey("lineX") ? map.getInt("lineX") : 0;
        int lineY = map.hasKey("lineY") ? map.getInt("lineY") : 0;
        int offsetX = map.hasKey("offsetX") ? map.getInt("offsetX") : 0;
        int offsetY = map.hasKey("offsetY") ? map.getInt("offsetY") : 0;
        boolean animated = map.hasKey("animated") && map.getBoolean("animated");
        processScrollTo(root, lineX, lineY, offsetX, offsetY, animated);
    }

    private void processScrollTo(HecomTable root, int lineX, int lineY, int offsetX, int offsetY,
            boolean animated) {
        TableInfo tableInfo = root.getTableData().getTableInfo();
        int duration = animated ? 300 : 0;
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

    private void processScrollToBottom(HecomTable root) {
        root.getMatrixHelper().flingBottom(300);
    }

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
