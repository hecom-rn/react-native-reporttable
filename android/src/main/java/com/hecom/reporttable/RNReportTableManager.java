package com.hecom.reporttable;

import android.graphics.Color;
import android.view.View;

import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.view.ReactViewGroup;

import com.hecom.reporttable.form.core.SmartTable;
import com.hecom.reporttable.form.data.style.FontStyle;
import com.hecom.reporttable.form.utils.DensityUtils;

import java.util.ArrayList;
import java.util.List;
import com.facebook.react.BuildConfig;
import com.hecom.reporttable.table.ReportTableConfig;
import com.facebook.react.bridge.ReactMethod;
import com.hecom.reporttable.table.bean.TableConfigBean;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class RNReportTableManager extends SimpleViewManager<View> {
    private ThemedReactContext mReactContext;
    public static ReportTableConfig reportTableConfig = new ReportTableConfig();;
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
        if(reportTableConfig == null){
            return;
        }

        String jsonData = "";
        int minHeight = 40;
        int minWidth = 50;
        int maxWidth = 120;

        try {
            JSONObject object = new JSONObject(dataSource);
            if(object.has("data")){
                Object dataObj = object.get("data");
                jsonData = dataObj.toString();
            }
            if(object.has("minHeight")){
                minHeight = (int) object.get("minHeight");
            }
            if(object.has("minWidth")){
                minWidth = (int) object.get("minWidth");
            }
            if(object.has("maxWidth")){
                maxWidth = (int) object.get("maxWidth");
            }
            TableConfigBean configBean = new TableConfigBean(minWidth, maxWidth, minHeight);
            reportTableConfig.setReportTableData(view, jsonData, configBean);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }


    private void setConfig(String dataSource){
        String jsonData = "";
        int minHeight = 40;
        int minWidth = 50;
        int maxWidth = 120;

        try {
            JSONObject object = new JSONObject(dataSource);
            if(object.has("data")){
                Object dataObj = object.get("data");
                 jsonData = dataObj.toString();
            }
            if(object.has("minHeight")){
                 minHeight = (int) object.get("minHeight");
            }
            if(object.has("minWidth")){
                 minWidth = (int) object.get("minWidth");
            }
            if(object.has("maxWidth")){
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
