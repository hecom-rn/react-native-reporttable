package com.hecom.reporttable;

import android.text.TextUtils;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.fasterxml.jackson.core.type.TypeReference;
import com.google.gson.Gson;
import com.hecom.JacksonUtil;
import com.hecom.reporttable.form.core.SmartTable;
import com.hecom.reporttable.form.listener.OnTableChangeListener;
import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.table.ReportTableStore;
import com.hecom.reporttable.table.bean.CellConfig;
import com.hecom.reporttable.table.bean.ItemCommonStyleConfig;
import com.hecom.reporttable.table.bean.TableConfigBean;

import java.util.Map;


public class RNReportTableManager extends SimpleViewManager<SmartTable<String>> {
    private static final int COMMAND_SCROLL = 1;
    private ThemedReactContext mReactContext;

    @Override
    public String getName() {
        return "ReportTable";
    }

    @Override
    protected SmartTable<String> createViewInstance(final ThemedReactContext reactContext) {
        mReactContext = reactContext;
        final SmartTable<String> table = new SmartTable(reactContext);

        table.setZoom(true,2,0.5f);

        final OnTableChangeListener listener = table.getMatrixHelper().getOnTableChangeListener();

        table.getMatrixHelper().setOnTableChangeListener(new OnTableChangeListener() {
            @Override
            public void onTableChanged(float scale, float translateX, float translateY) {
                listener.onTableChanged(scale, translateX, translateY);
                WritableMap map = Arguments.createMap();
                map.putDouble("translateX", translateX);
                map.putDouble("translateY", translateY);
                map.putDouble("scale", scale);
                ((ReactContext) reactContext).getJSModule(RCTEventEmitter.class)
                        .receiveEvent(table.getId(), "onScroll", map);
            }
        });
        return table;
    }

    @ReactProp(name = "data")
    public void setData(SmartTable<String> view, ReadableMap dataSource) {
        ReportTableStore reportTableStore = view.getReportTableConfig();
        if (reportTableStore == null) {
            return;
        }

        String jsonData = "";
        int minHeight = 40;
        int minWidth = 50;
        int maxWidth = 120;
        int frozenRows = -1;
        int frozenColumns = -1;
        int textPaddingHorizontal = 12;
        String lineColor = "#000000";
        int frozenCount = 0;
        int frozenPoint = 0;
        int headerHeight = 0;
        int limitTableHeight = 0;
        String itemConfig = null;
        try {

            if (dataSource.hasKey("itemConfig")) {
                itemConfig = dataSource.getString("itemConfig");
            }

            if (dataSource.hasKey("frozenCount")) {
                frozenCount = dataSource.getInt("frozenCount");
            }

            if (dataSource.hasKey("frozenPoint")) {
                frozenPoint = dataSource.getInt("frozenPoint");
            }

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
            if (dataSource.hasKey("frozenRows")) {
                frozenRows = dataSource.getInt("frozenRows");
            }
            if (dataSource.hasKey("frozenColumns")) {
                frozenColumns = dataSource.getInt("frozenColumns");
            }

            if (dataSource.hasKey("headerHeight")) {
                headerHeight = transformDataType(dataSource.getDouble("headerHeight"));
            }

            if (dataSource.hasKey("limitTableHeight")) {
                limitTableHeight = transformDataType(dataSource.getDouble("limitTableHeight"));
            }

            TableConfigBean configBean = new TableConfigBean(minWidth, maxWidth, minHeight);
            headerHeight = dip2px(mReactContext, headerHeight);
            configBean.setHeaderHeight(headerHeight);
            int tableHeight = dip2px(mReactContext, limitTableHeight);
            configBean.setLimitTableHeight(tableHeight);
            if (frozenColumns != -1) {
                configBean.setFrozenColumns(frozenColumns);
            }
            if (frozenRows != -1) {
                configBean.setFrozenRows(frozenRows);
            }

            if (dataSource.hasKey("textPaddingHorizontal")) {
                textPaddingHorizontal = dataSource.getInt("textPaddingHorizontal");
            }

            if (dataSource.hasKey("lineColor")) {
                lineColor = dataSource.getString("lineColor");
            }
            if (dataSource.hasKey("columnsWidthMap")) {
                String columnsWidthMap = dataSource.getString("columnsWidthMap");
                if (!TextUtils.isEmpty(columnsWidthMap)) {
                    Map<Integer, CellConfig> columnConfigMap = JacksonUtil.decode(columnsWidthMap, new TypeReference<Map<Integer, CellConfig>>() {
                    });
                    for (Map.Entry<Integer, CellConfig> entry : columnConfigMap.entrySet()) {
                        CellConfig value = entry.getValue();
                        value.setMinWidth(DensityUtils.dp2px(mReactContext, value.getMinWidth()));
                        value.setMaxWidth(DensityUtils.dp2px(mReactContext, value.getMaxWidth()));
                    }
                    configBean.setColumnConfigMap(columnConfigMap);
                }
            }
            if(!TextUtils.isEmpty(itemConfig)){
                ItemCommonStyleConfig itemCommonStyleConfig = new Gson().fromJson(itemConfig, ItemCommonStyleConfig.class);
                configBean.setItemCommonStyleConfig(itemCommonStyleConfig);
                view.getConfig().setItemCommonStyleConfig(itemCommonStyleConfig);
            }
            configBean.setFrozenCount(frozenCount);
            configBean.setFrozenPoint(frozenPoint);

            configBean.setTextPaddingHorizontal(DensityUtils.dp2px(mReactContext, textPaddingHorizontal));
            configBean.setLineColor(lineColor);

            reportTableStore.setReportTableData(view, jsonData, configBean);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }


    @Nullable
    @Override
    public Map<String, Integer> getCommandsMap() {
        return MapBuilder.<String, Integer>builder().put("scrollTo", COMMAND_SCROLL).build();
    }

    @Override
    public void receiveCommand(@NonNull SmartTable<String> root, int commandId,
                               @Nullable ReadableArray args) {
        super.receiveCommand(root, commandId, args);
        switch (commandId) {
            case COMMAND_SCROLL:
                root.getMatrixHelper().flingTop(300);
                root.getMatrixHelper().flingLeft(300);
                break;
        }
    }

    @Nullable
    @Override
    public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
        return MapBuilder.<String, Object>builder()
                .put("onClickEvent", MapBuilder.of("registrationName", "onClickEvent"))
                .put("onScrollEnd", MapBuilder.of("registrationName", "onScrollEnd"))
                .put("onScroll", MapBuilder.of("registrationName", "onScroll"))
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

    public static int dip2px(ThemedReactContext context, float dpValue) {
        final float scale = context.getResources().getDisplayMetrics().density;
        int pxResult = (int) (dpValue * scale + 0.5f);
        return (int) (dpValue * scale + 0.5f);
    }
}
