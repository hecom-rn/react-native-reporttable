package com.hecom.reporttable.table;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.content.Context;
import android.view.View;
import com.hecom.reporttable.form.core.SmartTable;
import com.hecom.reporttable.form.data.style.LineStyle;
import com.hecom.reporttable.form.data.table.ArrayTableData;
import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.form.utils.DrawUtils;
import com.hecom.reporttable.form.data.format.draw.IDrawFormat;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.table.bean.JsonTableBean;
import com.hecom.reporttable.form.core.TableConfig;
import com.hecom.reporttable.form.data.CellInfo;
import com.hecom.reporttable.table.bean.TableConfigBean;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import com.hecom.reporttable.form.data.format.bg.ICellBackgroundFormat;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;

public class ReportTableConfig {
    private SmartTable<String> table;
    private ReportTableData reportTableData = new ReportTableData();
    private String[][] dataArr;
    private Context context;
    private String defaultBorderColor = "#000000";
    private String defaultTextColor = "#000000";
    private String defaultBgColor = "#ffffff";
    private int defaultWidth = 50;
    private int defaultHeight = 30;
    private int strUnit = 10;
    private TableConfigBean configBean;
    private Map<Integer,Integer> columnMapWidth = new HashMap<>();

    public Map<Integer, Integer> getColumnMapWidth() {
        return columnMapWidth;
    }

    public SmartTable<String> getTable() {
        return table;
    }

    public SmartTable<String> createReportTable(Context context){
        this.context = context;
        table = new SmartTable<String>(context);
        LineStyle lineStyle = new LineStyle();
        lineStyle.setColor(Color.parseColor(defaultBorderColor));
        table.getConfig().setHorizontalPadding(0).setVerticalPadding(0)
                .setShowTableTitle(false).setShowColumnTitle(false).setShowXSequence(false).setShowYSequence(false)
                .setContentGridStyle(lineStyle);
        return table;
    }

    public void setReportTableData(View view,String json, TableConfigBean configBean){
        if(json == null){
            return;
        }
       SmartTable<String> table =  ((SmartTable<String>)view);
        this.configBean = configBean;
        int minWidth = configBean.getMinWidth();
        int minHeight = configBean.getMinHeight();

        try {
            if(reportTableData == null){
                reportTableData = new ReportTableData();
            }
            String[][] dataArr = reportTableData.mergeTable(json);
            final JsonTableBean[][] tabArr = reportTableData.getTabArr();
            final ArrayTableData<String> tableData = ArrayTableData.create("",null, dataArr,  null);
            tableData.setMinWidth( DensityUtils.dp2px(this.context,minWidth));
            tableData.setMinHeight( DensityUtils.dp2px(this.context,minHeight));
            tableData.setUserCellRange(reportTableData.getMergeList());
            table.getConfig().setContentCellBackgroundFormat(new ICellBackgroundFormat<CellInfo>() {
                @Override
                public void drawBackground(Canvas canvas, Rect rect, CellInfo cellInfo, Paint paint) {
                    JsonTableBean tableBean = tabArr[cellInfo.row][cellInfo.col];
                    String color = defaultBgColor;
                    if(tableBean != null && !"".equals(tableBean.getBackgroundColor()) && tableBean.getBackgroundColor() != null){
                        color = tableBean.getBackgroundColor();
                    }
                    DrawUtils.fillBackground(canvas,rect.left,rect.top,rect.right,rect.bottom,Color.parseColor(color), paint);
                }

                @Override
                public int getTextColor(CellInfo cellInfo) {
                    JsonTableBean tableBean = tabArr[cellInfo.row][cellInfo.col];
                    if(tableBean != null && !"".equals(tableBean.getTextColor()) && tableBean.getTextColor() != null){
                        return  Color.parseColor(tableBean.getTextColor());
                    }
                    return  Color.parseColor(defaultTextColor);
                }
            });
            final Context mContext = context;
            tableData.setOnItemClickListener(new ArrayTableData.OnItemClickListener<String>(){

                @Override
                public void onClick(Column<String> column, String value, String s, int col, int row) {
                    try {
                        JsonTableBean tableBean = tabArr[row][col];
                        int keyIndex = tableBean.getKeyIndex();
                        if( mContext != null){
                            WritableMap map = Arguments.createMap();
                            map.putInt("keyIndex", keyIndex);
                            map.putInt("rowIndex", row);
                            map.putInt("columnIndex", col);
                            ((ReactContext)mContext).getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("com.hecom.reporttable.clickData",map);
                        }
                    } catch (java.lang.Exception exception) {
                        exception.printStackTrace();
                        System.out.println("点击异常---"+exception);
                    }
                }
            });
            table.setTableData(tableData);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
