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
import org.json.JSONArray;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import javax.annotation.Nullable;

public class RNReportTableManager extends SimpleViewManager<View> {
    private ThemedReactContext mReactContext;
    public static ReportTableConfig reportTableConfig = new ReportTableConfig();

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
        int frozenCount = 0;
        int frozenPoint = 0;
        try {
            JSONObject object = new JSONObject(dataSource);

             if(object.has("frozenCount")){
                 frozenCount = (int) object.get("frozenCount");
             }

             if(object.has("frozenPoint")){
                 frozenPoint = (int) object.get("frozenPoint");
             }

            if (object.has("data")) {
                Object dataObj = object.get("data");
                jsonData = formatJson(dataObj.toString(), frozenCount, frozenPoint);
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
            reportTableConfig.getTable().getProvider().setFrozenCount(frozenCount);
            reportTableConfig.getTable().getProvider().setFrozenPoint(frozenPoint);
            reportTableConfig.setReportTableData(view, jsonData, configBean);
            reportTableConfig.setFrozenCount(frozenCount);
            reportTableConfig.setFrozenPoint(frozenPoint);
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



   public String formatJson(String json, int frozenCount, int frozenPoint){
           if(frozenCount == 0 && frozenPoint == 0) return json.toString();
           int changePoint = frozenPoint > 0 ? frozenPoint : frozenCount;
           List<String> list = new ArrayList<String>();
           try {
               JSONArray jsonArray = new JSONArray(json);
               JSONArray jsonArray1 =  (JSONArray) jsonArray.get(0);
               for (int i = 0; i < changePoint; i++) {
                   JSONObject object =  (JSONObject) jsonArray1.get(i);
                   if(object.has("item")){
                       JSONObject item = object.getJSONObject("item");
                       if(item.has("value")){
                           String value = item.getString("value");
                           if(value != null && value.length() > 8){
                               list.add(value);
                           }
                       }
                   }
               }
               for (int i = 0; i < list.size(); i++) {
                   String value = list.get(i);
                   String spaceWidth = "        ";
                   if(value.length() > 8){
                      int spaceNum = value.length() - 8;
                      int maxNum = 5;
                      if(spaceNum > maxNum){
                          spaceNum = maxNum;
                      }
                       for (int j = 0; j < spaceNum; j++) {
                           spaceWidth = spaceWidth + " ";
                       }
                   }
                   json = json.replace( value, value + spaceWidth );
               }
              return json;
           } catch (Exception e) {
               e.printStackTrace();
               System.out.println("异常：-----"+e.toString());
               return json;
           }
       }
}
