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
    public void setCardData(View view, String jsonData) {
        if(reportTableConfig == null){
            return;
        }
        TableConfigBean configBean = new TableConfigBean(this.minWidth, this.maxWidth, this.minHeight);
        reportTableConfig.setReportTableData(view, jsonData, configBean);
    }

    @ReactProp(name = "minHeight")
    public void setMinHeight(View view, int minHeight) {
        this.minHeight = minHeight;
    }

    @ReactProp(name = "minWidth")
    public void setMinWidth(View view, int minWidth) {
        this.minWidth = minWidth;
    }

    @ReactProp(name = "maxWidth")
    public void setMaxWidth(View view, int maxWidth) {
        this.maxWidth = maxWidth;
    }
}
