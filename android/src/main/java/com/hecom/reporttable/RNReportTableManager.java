package com.hecom.reporttable;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import android.text.TextUtils;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.fasterxml.jackson.core.type.TypeReference;
import com.hecom.JacksonUtil;
import com.hecom.reporttable.form.core.SmartTable;
import com.hecom.reporttable.form.data.TableInfo;
import com.hecom.reporttable.form.data.format.grid.IGridFormat;
import com.hecom.reporttable.form.listener.OnContentSizeChangeListener;
import com.hecom.reporttable.form.listener.OnTableChangeListener;
import com.hecom.reporttable.form.matrix.MatrixHelper;
import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.table.HecomGridFormat;
import com.hecom.reporttable.table.ReportTableStore;
import com.hecom.reporttable.table.bean.CellConfig;
import com.hecom.reporttable.table.bean.ItemCommonStyleConfig;
import com.hecom.reporttable.table.bean.TableConfigBean;
import com.hecom.reporttable.table.deserializer.ItemCommonStyleConfigDeserializer;

import java.util.Map;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;


public class RNReportTableManager extends SimpleViewManager<SmartTable<String>> {
    private ThemedReactContext mReactContext;
    private ReportTableStore store;
    private Gson mGson = new GsonBuilder()
            .registerTypeAdapter(ItemCommonStyleConfig.class,
                    new ItemCommonStyleConfigDeserializer())
            .create();

    @Override
    public String getName() {
        return "ReportTable";
    }

    @Override
    protected SmartTable<String> createViewInstance(final ThemedReactContext reactContext) {
        mReactContext = reactContext;
        final SmartTable<String> table = new SmartTable(reactContext);
        this.store = new ReportTableStore(reactContext, table);
        IGridFormat gridFormat = new HecomGridFormat(table);
        table.getConfig().setTableGridFormat(gridFormat);

        table.setZoom(true, 2, 0.5f);

        final OnTableChangeListener listener = table.getMatrixHelper().getOnTableChangeListener();

        table.getMatrixHelper().setOnTableChangeListener(new OnTableChangeListener() {
            @Override
            public void onTableChanged(float scale, float translateX, float translateY) {
                listener.onTableChanged(scale, translateX, translateY);
                WritableMap map = Arguments.createMap();
                map.putDouble("translateX", translateX);
                map.putDouble("translateY", translateY);
                map.putDouble("scale", scale);
                reactContext.getJSModule(RCTEventEmitter.class)
                        .receiveEvent(table.getId(), "onScroll", map);
                MatrixHelper mh = table.getMatrixHelper();
                boolean notBottom = (mh.getZoomRect().bottom - mh.getOriginalRect().bottom) > 0;
                if (!notBottom) {
                    (reactContext).getJSModule(RCTEventEmitter.class)
                            .receiveEvent(table.getId(), "onScrollEnd", null);
                }
            }
        });
        table.getMeasurer().setOnContentSizeChangeListener(new OnContentSizeChangeListener() {
            @Override
            public void onContentSizeChanged(float width, float height) {
                float widthDp = DensityUtils.px2dp(table.getContext(), width);
                float heightDp = DensityUtils.px2dp(table.getContext(), height);
                WritableMap map = Arguments.createMap();
                map.putDouble("width", widthDp);
                map.putDouble("height", heightDp);
                reactContext.getJSModule(RCTEventEmitter.class)
                        .receiveEvent(table.getId(), "onContentSize", map);
            }
        });
        return table;
    }

    @ReactProp(name = "disableZoom")
    public void setDisableZoom(SmartTable<String> view, boolean disableZoom) {
        view.setZoom(!disableZoom);
    }

    @ReactProp(name = "frozenRows")
    public void setFrozenRows(SmartTable<String> view, int frozenRows) {
        view.getConfig().setFixedLines(frozenRows);
    }

    @ReactProp(name = "frozenColumns")
    public void setFrozenColumns(SmartTable<String> view, int frozenColumns) {
        this.store.mLockHelper.setFrozenColumns(frozenColumns);
    }


    @ReactProp(name = "frozenPoint")
    public void setFrozenPoint(SmartTable<String> view, int frozenPoint) {
        store.mLockHelper.setPoint(frozenPoint);
    }


    @ReactProp(name = "frozenCount")
    public void setFrozenCount(SmartTable<String> view, int frozenCount) {
        store.mLockHelper.setCount(frozenCount);
    }

    @ReactProp(name = "permutable")
    public void setPermutable(SmartTable<String> view, boolean permutable) {
        this.store.mLockHelper.setPermutable(permutable);
    }


    @ReactProp(name = "data")
    public void setData(SmartTable<String> view, ReadableMap dataSource) {
        ReportTableStore reportTableStore = this.store;

        String jsonData = "";
        int minHeight = 40;
        int minWidth = 50;
        int maxWidth = 120;
        int textPaddingHorizontal = 12;
        String lineColor = "#000000";
        int headerHeight = 0;
        int limitTableHeight = 0;
        String itemConfig = null;
        try {

            if (dataSource.hasKey("itemConfig")) {
                itemConfig = dataSource.getString("itemConfig");
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

            if (dataSource.hasKey("headerHeight")) {
                headerHeight = transformDataType(dataSource.getDouble("headerHeight"));
            }

            if (dataSource.hasKey("limitTableHeight")) {
                limitTableHeight = transformDataType(dataSource.getDouble("limitTableHeight"));
            }

            if (dataSource.hasKey("doubleClickZoom")) {
                view.setDoubleClickZoom(dataSource.getBoolean("doubleClickZoom"));
            }

            TableConfigBean configBean = new TableConfigBean(minWidth, maxWidth, minHeight);
            headerHeight = dip2px(mReactContext, headerHeight);
            configBean.setHeaderHeight(headerHeight);
            int tableHeight = dip2px(mReactContext, limitTableHeight);
            configBean.setLimitTableHeight(tableHeight);

            if (dataSource.hasKey("textPaddingHorizontal")) {
                textPaddingHorizontal = dataSource.getInt("textPaddingHorizontal");
            }

            if (dataSource.hasKey("lineColor")) {
                lineColor = dataSource.getString("lineColor");
            }
            if (dataSource.hasKey("columnsWidthMap")) {
                String columnsWidthMap = dataSource.getString("columnsWidthMap");
                if (!TextUtils.isEmpty(columnsWidthMap)) {
                    Map<Integer, CellConfig> columnConfigMap = JacksonUtil.decode(columnsWidthMap
                            , new TypeReference<Map<Integer, CellConfig>>() {
                            });
                    for (Map.Entry<Integer, CellConfig> entry : columnConfigMap.entrySet()) {
                        CellConfig value = entry.getValue();
                        value.setMinWidth(DensityUtils.dp2px(mReactContext, value.getMinWidth()));
                        value.setMaxWidth(DensityUtils.dp2px(mReactContext, value.getMaxWidth()));
                    }
                    configBean.setColumnConfigMap(columnConfigMap);
                }
            }
            if (!TextUtils.isEmpty(itemConfig)) {
                ItemCommonStyleConfig itemCommonStyleConfig = mGson.fromJson(itemConfig,
                        ItemCommonStyleConfig.class);
                configBean.setItemCommonStyleConfig(itemCommonStyleConfig);
                view.getConfig().setItemCommonStyleConfig(itemCommonStyleConfig);
            }

            configBean.setTextPaddingHorizontal(DensityUtils.dp2px(mReactContext,
                    textPaddingHorizontal));
            configBean.setLineColor(lineColor);

            reportTableStore.setReportTableData(view, jsonData, configBean);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }


    @Override
    public void receiveCommand(@NonNull SmartTable<String> root, String commandId,
                               @Nullable ReadableArray args) {
        super.receiveCommand(root, commandId, args);
        switch (commandId) {
            case "scrollTo":
                processScrollTo(root, args);
                break;
            case "scrollToBottom":
                processScrollToBottom(root, args);
                break;
        }
    }

    private void processScrollTo(SmartTable<String> root, ReadableArray args) {
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


    private void processScrollToBottom(SmartTable<String> root, ReadableArray args) {
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

    public static int dip2px(ThemedReactContext context, float dpValue) {
        final float scale = context.getResources().getDisplayMetrics().density;
        int pxResult = (int) (dpValue * scale + 0.5f);
        return (int) (dpValue * scale + 0.5f);
    }
}
