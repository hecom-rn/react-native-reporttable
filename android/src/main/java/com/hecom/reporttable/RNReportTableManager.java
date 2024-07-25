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
import com.hecom.reporttable.form.data.TableInfo;
import com.hecom.reporttable.form.data.style.LineStyle;
import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.table.HecomTable;
import com.hecom.reporttable.table.bean.CellConfig;
import com.hecom.reporttable.table.bean.TableConfigBean;
import com.hecom.reporttable.table.format.HecomStyle;

import java.util.ArrayList;
import java.util.Map;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;


public class RNReportTableManager extends SimpleViewManager<HecomTable> {
    private ThemedReactContext mReactContext;

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

    @ReactProp(name = "disableZoom")
    public void setDisableZoom(HecomTable view, boolean disableZoom) {
        view.setZoom(!disableZoom);
    }

    @ReactProp(name = "frozenRows")
    public void setFrozenRows(HecomTable view, int frozenRows) {
        view.getConfig().setFixedLines(frozenRows);
    }

    @ReactProp(name = "frozenColumns")
    public void setFrozenColumns(HecomTable view, int frozenColumns) {
        view.getLockHelper().setFrozenColumns(frozenColumns);
    }


    @ReactProp(name = "frozenPoint")
    public void setFrozenPoint(HecomTable view, int frozenPoint) {
        view.getLockHelper().setPoint(frozenPoint);
    }


    @ReactProp(name = "frozenCount")
    public void setFrozenCount(HecomTable view, int frozenCount) {
        view.getLockHelper().setCount(frozenCount);
    }

    @ReactProp(name = "permutable")
    public void setPermutable(HecomTable view, boolean permutable) {
        view.getLockHelper().setPermutable(permutable);
    }

    @ReactProp(name = "doubleClickZoom")
    public void setDoubleClickZoom(HecomTable view, boolean doubleClickZoom) {
        view.setDoubleClickZoom(doubleClickZoom);
    }

    @ReactProp(name = "lineColor")
    public void setLineColor(HecomTable view, String lineColor) {
        LineStyle lineStyle = new LineStyle();
        lineStyle.setColor(Color.parseColor(lineColor));
        view.getConfig().setContentGridStyle(lineStyle);

    }

    @ReactProp(name = "itemConfig")
    public void setItemConfig(HecomTable view, ReadableMap config) {
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
            Paint.Align align = textAlignment == 1 ? Paint.Align.CENTER :
                    textAlignment == 2 ? Paint.Align.RIGHT : Paint.Align.LEFT;
            style.setAlign(align);
        }
        if (config.hasKey("isOverstriking")) {
            style.setOverstriking(config.getBoolean("isOverstriking"));
        }
        view.setHecomStyle(style);
    }


    @ReactProp(name = "data")
    public void setData(HecomTable view, ReadableMap dataSource) {

        String jsonData = "";
        int minHeight = 40;
        int minWidth = 50;
        int maxWidth = 120;
        try {

            if (dataSource.hasKey("data")) {
                jsonData = dataSource.getString("data");
            }

            if (dataSource.hasKey("minHeight")) {
                minHeight = transformDataType(dataSource.getDouble("minHeight"));
            }
            if (dataSource.hasKey("minWidth")) {
                minWidth = transformDataType(dataSource.getDouble("minWidth"));
            }
            if (dataSource.hasKey("maxWidth")) {
                maxWidth = transformDataType(dataSource.getDouble("maxWidth"));
            }
            TableConfigBean configBean = new TableConfigBean(DensityUtils.dp2px(mReactContext,
                    minWidth), DensityUtils.dp2px(mReactContext, maxWidth),
                    DensityUtils.dp2px(mReactContext, minHeight));
            if (dataSource.hasKey("columnsWidthMap")) {
                String columnsWidthMap = dataSource.getString("columnsWidthMap");
                if (!TextUtils.isEmpty(columnsWidthMap)) {
                    Map<Integer, CellConfig> columnConfigMap = GsonHelper.getGson()
                            .fromJson(columnsWidthMap, new TypeToken<Map<Integer, CellConfig>>() {
                            }.getType());
                    configBean.setColumnConfigMap(columnConfigMap);
                }
            }

            view.setData(jsonData, configBean);

        } catch (Exception e) {
            e.printStackTrace();
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
                processScrollToBottom(root, args);
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
        ReadableMap map = args.getMap(0);
        String data = map.getString("data");
        int x = map.getInt("x");
        int y = map.getInt("y");
        root.updateData(data, x, y);
    }

    private void processSpliceData(HecomTable root, ReadableArray args) {
        ReadableArray array = args.getArray(0);
        HecomTable.SpliceItem[] spliceItems = new HecomTable.SpliceItem[array.size()];
        for(int i = 0; i < array.size(); ++i) {
            ReadableMap map = array.getMap(i);
            String data = map.getString("data");
            int y = map.getInt("y");
            int l = map.getInt("l");
            HecomTable.SpliceItem item = new HecomTable.SpliceItem(data, y, l);
            spliceItems[i] = item;
        }
        root.spliceDataArray(spliceItems);

//        ReadableMap map = args.getMap(0);
//        String data = map.getString("data");
//        int y = map.getInt("y");
//        int l = map.getInt("l");
//        root.spliceData(data, y, l);
    }

    private void processScrollTo(HecomTable root, ReadableArray args) {
        //{ lineX: 0, lineY: 0, offsetX: 0, offsetY: 0, animated : true }
        TableInfo tableInfo = root.getTableData().getTableInfo();
        ReadableMap map = args.getMap(0);
        int lineX = map.getInt("lineX");
        int lineY = map.getInt("lineY");
        int offsetX = map.getInt("offsetX");
        int offsetY = map.getInt("offsetY");
        boolean animated = map.getBoolean("animated");
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


    private void processScrollToBottom(HecomTable root, ReadableArray args) {
        root.getMatrixHelper().flingBottom(300);
    }


    @Nullable
    @Override
    public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
        return MapBuilder.<String, Object>builder()
                .put("onClickEvent", MapBuilder.of("registrationName", "onClickEvent"))
                .put("onScrollEnd", MapBuilder.of("registrationName", "onScrollEnd"))
                .put("onScroll", MapBuilder.of("registrationName", "onScroll"))
                .put("onContentSize", MapBuilder.of("registrationName", "onContentSize"))
                .build();
    }

    private int transformDataType(Object data) {
        int result = 0;
        if (data instanceof Double) {
            result = (int) Math.round(((Double) data));
        } else if (data instanceof Float) {
            result = (int) Math.round(((Float) data));
        } else if (data instanceof Integer) {
            result = (int) data;
        }
        return result;
    }
}
