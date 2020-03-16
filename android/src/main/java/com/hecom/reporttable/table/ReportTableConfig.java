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

public class ReportTableConfig {
    private SmartTable<String> table;
    private ReportTableData reportTableData = new ReportTableData();
    private String[][] dataArr;
    private Context context;
    private String defaultColor = "#000000";
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
        lineStyle.setColor(Color.parseColor(defaultColor));
        table.getConfig().setHorizontalPadding(0).setVerticalPadding(0)
                .setShowTableTitle(false).setShowColumnTitle(false).setShowXSequence(false).setShowYSequence(false)
                .setContentGridStyle(lineStyle);
        return table;
    }

    public void setReportTableData(View view,String json, TableConfigBean configBean){
        if(json == null){
            return;
        }
        this.configBean = configBean;
        final int columnHeight = configBean.getMinHeight();
        try {
            if(reportTableData == null){
                reportTableData = new ReportTableData();
            }
            String[][] dataArr = reportTableData.mergeTable(json);
            computeWidth(dataArr);
            final JsonTableBean[][] tabArr = reportTableData.getTabArr();
            final ArrayTableData<String> tableData = ArrayTableData.create("",null, dataArr,  new IDrawFormat<String>() {
                @Override
                public int measureWidth(Column<String> column, int position, TableConfig config) {
                    int width = defaultWidth;
                    if(columnMapWidth.containsKey(position)){
                        width = columnMapWidth.get(position);
                    }
                    return DensityUtils.dp2px(context,width);
                }

                @Override
                public int measureHeight(Column<String> column, int position, TableConfig config) {
                    return DensityUtils.dp2px(context,columnHeight);
                }

                @Override
                public void draw(Canvas c, Rect rect, CellInfo<String> cellInfo, TableConfig config) {
                    try {
                        if(cellInfo.data != null){
                            JsonTableBean tableBean = tabArr[cellInfo.row][cellInfo.col];
                            Paint paint = config.getPaint();
                            paint.setStyle(Paint.Style.FILL);
                            if(tableBean.getFontSize() > 0){
                                paint.setTextSize(DensityUtils.dp2px(context ,tableBean.getFontSize()));
                            }
                            if(!"".equals(tableBean.getBackgroundColor())){
                                DrawUtils.fillBackground(c,rect.left,rect.top,rect.right,rect.bottom,Color.parseColor(tableBean.getBackgroundColor()), paint);
                            }
                            if(!"".equals(tableBean.getTextColor())){
                                paint.setColor(Color.parseColor(tableBean.getTextColor()));
                            }
                            if(!"".equals(tableBean.getTitle())){
                                DrawUtils.drawSingleText(c,paint,rect,tableBean.getTitle());
                            }else{
                                DrawUtils.drawSingleText(c,paint,rect,"-");
                            }
                        }
                    } catch (java.lang.Exception exception) {
                        exception.printStackTrace();
                    }
                }
            });
            tableData.setUserCellRange(reportTableData.getMergeList());
            tableData.setOnItemClickListener(new ArrayTableData.OnItemClickListener<String>(){

                @Override
                public void onClick(Column<String> column, String value, String s, int col, int row) {
                                        
                }
            });
            ((SmartTable<String>)view).setTableData(tableData);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void computeWidth(String[][] strArr){
        if(columnMapWidth == null){
            columnMapWidth = new HashMap<>();
        }
        columnMapWidth.clear();
        for (int i = 0; i < strArr.length; i++) {
            String[] columnArr = strArr[i];
            int width = computeColumnWidth(this.configBean.getMinWidth(), columnArr);
            if(!columnMapWidth.containsKey(i)){
                columnMapWidth.put(i, width);
            }
        }
    }

    public int computeColumnWidth(int minWidth ,String[] jsonArr){
        int maxLen = minWidth;
        int maxWidth = this.configBean.getMaxWidth();
        try {
            for (int i = 0; i < jsonArr.length; i++) {
                if(jsonArr[i] != null){
                    int currentLen = jsonArr[i].length() * strUnit;
                    if(currentLen > maxLen ){
                        if(currentLen < maxWidth){
                            maxLen = currentLen;
                        }else{
                            maxLen = maxWidth;
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            return maxLen;
        }
        return maxLen;
    }
}
