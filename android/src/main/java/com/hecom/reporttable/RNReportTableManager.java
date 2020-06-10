package com.hecom.reporttable;

import android.view.View;

import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.hecom.reporttable.form.core.SmartTable;
import com.hecom.reporttable.table.ReportTableConfig;
import com.hecom.reporttable.table.bean.TableConfigBean;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Map;

import javax.annotation.Nullable;

public class RNReportTableManager extends SimpleViewManager<View> {
    private ThemedReactContext mReactContext;
    public static ReportTableConfig reportTableConfig = new ReportTableConfig();
    ;
    private int minWidth = 30;
    private int maxWidth = 50;
    private int minHeight = 30;

    @Override
    public String getName() {
        return "ReportTable";
    }

    @Override
    protected View createViewInstance(ThemedReactContext reactContext) {
        mReactContext = reactContext;
        SmartTable<String> table = reportTableConfig.createReportTable(reactContext);
        return table;
    }

    @ReactProp(name = "data")
    public void setData(View view, String dataSource) {
        if (reportTableConfig == null) {
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
        try {
            JSONObject object = new JSONObject(dataSource);
            if (object.has("data")) {
                Object dataObj = object.get("data");
                jsonData = dataObj.toString();
            }
            if (object.has("minHeight")) {
                minHeight = transformDataType(object.get("minHeight"));
            }
            if (object.has("minWidth")) {
                minWidth = transformDataType(object.get("minWidth"));
            }
            if (object.has("maxWidth")) {
                maxWidth = transformDataType(object.get("maxWidth"));
            }
            if (object.has("frozenRows")) {
                frozenRows = (int) object.get("frozenRows");
            }
            if (object.has("frozenColumns")) {
                frozenColumns = (int) object.get("frozenColumns");
            }
            TableConfigBean configBean = new TableConfigBean(minWidth, maxWidth, minHeight);
            if (frozenColumns != -1) {
                configBean.setFrozenColumns(frozenColumns);
            }
            if (frozenRows != -1) {
                configBean.setFrozenRows(frozenRows);
            }

            if(object.has("textPaddingHorizontal")){
                textPaddingHorizontal =  (int)object.get("textPaddingHorizontal");
            }

             if(object.has("lineColor")){
                lineColor =  (String)object.get("lineColor");
             }
            configBean.setTextPaddingHorizontal(textPaddingHorizontal);
            configBean.setLineColor(lineColor);
            reportTableConfig.setReportTableData(view, jsonData, configBean);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    @Nullable
    @Override
    public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
        return MapBuilder.<String, Object>builder()
                .put("onClickEvent", MapBuilder.of("registrationName", "onClickEvent"))
                .put("onScrollEnd", MapBuilder.of("registrationName", "onScrollEnd"))
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


    private void setConfig(String dataSource) {
        String jsonData = "";
        int minHeight = 40;
        int minWidth = 50;
        int maxWidth = 120;

        try {
            JSONObject object = new JSONObject(dataSource);
            if (object.has("data")) {
                Object dataObj = object.get("data");
                jsonData = dataObj.toString();
            }
            if (object.has("minHeight")) {
                minHeight = (int) object.get("minHeight");
            }
            if (object.has("minWidth")) {
                minWidth = (int) object.get("minWidth");
            }
            if (object.has("maxWidth")) {
                maxWidth = (int) object.get("maxWidth");
            }
//            if(object.has("frozenRows")){
//                frozenRows = (int) object.get("frozenRows");
//            }
//            if(object.has("frozenColumns")){
//                frozenColumns = (int) object.get("frozenColumns");
//            }
            TableConfigBean configBean = new TableConfigBean(minWidth, maxWidth, minHeight);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }
}
