package com.hecom.reporttable.table;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.os.Handler;
import android.util.Log;
import android.view.View;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.hecom.reporttable.form.core.SmartTable;
import com.hecom.reporttable.form.core.TableConfig;
import com.hecom.reporttable.form.data.CellInfo;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.form.data.format.bg.ICellBackgroundFormat;
import com.hecom.reporttable.form.data.format.draw.TextDrawFormat;
import com.hecom.reporttable.form.data.style.LineStyle;
import com.hecom.reporttable.form.data.table.ArrayTableData;
import com.hecom.reporttable.form.data.table.TableData;
import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.form.utils.DrawUtils;
import com.hecom.reporttable.table.bean.JsonTableBean;
import com.hecom.reporttable.table.bean.TableConfigBean;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

public class ReportTableConfig implements TableConfig.OnScrollChangeListener {
    private SmartTable<String> table;
    private ReportTableData reportTableData = new ReportTableData();
    private Context context;
    private String defaultTextColor = "#000000";
    private String defaultBgColor = "#ffffff";
    private int defaultWidth = 50;
    private int defaultHeight = 30;
    private int strUnit = 10;
    private TableConfigBean configBean;
    private Map<Integer, Integer> columnMapWidth = new HashMap<>();

    private String jsonData;
    private String[][] dataArr;

    public Map<Integer, Integer> getColumnMapWidth() {
        return columnMapWidth;
    }

    public SmartTable<String> getTable() {
        return table;
    }

    private int frozenCount = 0;
    private int frozenPoint = 0;

    public void setFrozenCount(int frozenCount) {
        this.frozenCount = frozenCount;
    }

    public void setFrozenPoint(int frozenPoint) {
        this.frozenPoint = frozenPoint;
    }

    private boolean clickLockBt = false;

    public SmartTable<String> createReportTable(Context context) {
        this.context = context;
        table = new SmartTable<String>(context);
        table.getConfig().setHorizontalPadding(0).setVerticalPadding(0)
                .setShowTableTitle(false).setShowColumnTitle(false).setShowXSequence(false).setShowYSequence(false);
        return table;
    }

    public void setReportTableDataInMainThread(final View view, String[][] dataArr, TableConfigBean configBean) {
        final ArrayTableData<String> rawTableData = (ArrayTableData<String>) table.getTableData();
        int minWidth = configBean.getMinWidth();
        int minHeight = configBean.getMinHeight();
        try {
//            if (reportTableData == null) {
//                reportTableData = new ReportTableData();
//            }
//            Log.e("ReportTableConfig", "setReportTableData mergeTable start = " + System.currentTimeMillis());
//            String[][] dataArr = reportTableData.mergeTable(json);
//            Log.e("ReportTableConfig", "setReportTableData mergeTable end = " + System.currentTimeMillis());
            final JsonTableBean[][] tabArr = reportTableData.getTabArr();
            table.setTabArr(tabArr);
            TextDrawFormat mTextDrawFormat = new TextDrawFormat<JsonTableBean>() {
                @Override
                public void setTextPaint(TableConfig config, CellInfo<JsonTableBean> cellInfo, Paint paint) {
                    super.setTextPaint(config, cellInfo, paint);
                    JsonTableBean tableBean = tabArr[cellInfo.row][cellInfo.col];
                    if (tableBean.isLeft()) {
                        paint.setTextAlign(Paint.Align.LEFT);
                    } else {
                        paint.setTextAlign(Paint.Align.RIGHT);
                    }
                }
            };
            final ArrayTableData<String> tableData = ArrayTableData.create("", null, dataArr, mTextDrawFormat);

            tableData.setMinWidth(DensityUtils.dp2px(this.context, minWidth));
            tableData.setMinHeight(DensityUtils.dp2px(this.context, minHeight));
            tableData.setUserCellRange(reportTableData.getMergeList());
            table.getConfig().setContentCellBackgroundFormat(new ICellBackgroundFormat<CellInfo>() {
                @Override
                public void drawBackground(Canvas canvas, Rect rect, CellInfo cellInfo, Paint paint) {
                    JsonTableBean tableBean = tabArr[cellInfo.row][cellInfo.col];
                    String color = defaultBgColor;
                    if (tableBean != null && !"".equals(tableBean.getBackgroundColor()) && tableBean
                            .getBackgroundColor() != null) {
                        color = tableBean.getBackgroundColor();
                    }
                    DrawUtils.fillBackground(canvas, rect.left, rect.top, rect.right, rect.bottom, Color
                            .parseColor(color), paint);
                }

                @Override
                public int getTextColor(CellInfo cellInfo) {
                    JsonTableBean tableBean = tabArr[cellInfo.row][cellInfo.col];
                    if (tableBean != null && !"".equals(tableBean.getTextColor()) && tableBean.getTextColor() != null) {
                        return Color.parseColor(tableBean.getTextColor());
                    }
                    return Color.parseColor(defaultTextColor);
                }
            });
            final Context mContext = context;
            tableData.setOnItemClickListener(new ArrayTableData.OnItemClickListener<String>() {

                @Override
                public void onClick(Column<String> column, String value, String s, int col, int row) {
                    if (clickLockBt) {
                        new Handler().postDelayed(new Runnable() {
                            @Override
                            public void run() {
                                table.setTableData(tableData);
                            }
                        }, 10);
                        return;
                    }
                    try {
                        JsonTableBean tableBean = tabArr[row][col];
                        int keyIndex = tableBean.getKeyIndex();
                        if (mContext != null) {
                            WritableMap map = Arguments.createMap();
                            map.putInt("keyIndex", keyIndex);
                            map.putInt("rowIndex", row);
                            map.putInt("columnIndex", col);
                            map.putString("textColor", tableBean.getTextColor());
                            ((ReactContext) mContext).getJSModule(RCTEventEmitter.class)
                                    .receiveEvent(view.getId(), "onClickEvent", map);
                        }
                    } catch (java.lang.Exception exception) {
                        exception.printStackTrace();
                        System.out.println("点击异常---" + exception);
                    }

                }
            });

            tableData.setOnResponseItemClickListener(new TableData.OnResponseItemClickListener() {
                @Override
                public boolean responseOnClick(Column column, String value, Object o, int col, int row) {
                    if (row == 0) {
                        int firstColumnMaxMerge = tableData.getFirstColumnMaxMerge();
                        if (frozenPoint > 0) {
                            if (col == 0 && firstColumnMaxMerge > 0) {
                                col = firstColumnMaxMerge;
                            }
                            if (col == frozenPoint - 1) {
                                clickLockBt = true;
                            } else if (col < frozenPoint - 1) {
                                clickLockBt = false;
                            } else {
                                clickLockBt = false;
                            }
                        } else {
                            if (frozenCount > 0) {
                                if (col < frozenCount) {
                                    clickLockBt = true;
                                } else {
                                    clickLockBt = false;
                                }
                            } else {
                                clickLockBt = false;
                            }
                        }
                    } else {
                        clickLockBt = false;
                    }
                    return clickLockBt;
                }
            });

            for (int i = 0; i < configBean.getFrozenColumns(); i++) {
                tableData.getArrayColumns().get(i).setFixed(true);
            }

            if (rawTableData != null) {
                tableData.setCurFixedColumnIndex(rawTableData.getCurFixedColumnIndex());
                for (int i = 0; i < tableData.getArrayColumns().size(); i++) {
                    if (rawTableData.getArrayColumns() != null &&
                            rawTableData.getArrayColumns().size() > i) {
                        Column column = rawTableData.getArrayColumns().get(i);
                        if (column.isFixed() && tableData.getArrayColumns().size() > i) {
                            tableData.getArrayColumns().get(i).setFixed(true);
                        }
                    }
                }
            }

            for (int i = 0; i < tableData.getArrayColumns().size(); i++) {
                tableData.getArrayColumns().get(i).setColumn(i, tableData.getArrayColumns().size());
            }

            LineStyle lineStyle = new LineStyle();
            lineStyle.setColor(Color.parseColor(configBean.getLineColor()));
            table.getConfig().setContentGridStyle(lineStyle);

            table.getConfig().setFixedLines(configBean.getFrozenRows(), this);
            table.getConfig().setTextLeftOffset(configBean.getTextPaddingHorizontal());
            table.getConfig().setTextRightOffset(configBean.getTextPaddingHorizontal());
            table.getMeasurer().setAddTableHeight(configBean.getHeaderHeight());
            table.getMeasurer().setLimitTableHeight(configBean.getLimitTableHeight());
            table.getConfig().setMinCellWidth(DensityUtils.dp2px(this.context, configBean.getMinWidth()));
            table.getConfig().setMaxCellWidth(DensityUtils.dp2px(this.context, configBean.getMaxWidth()));
            table.setTableData(tableData);
//            table.notifyDataChanged();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void setReportTableData(final View view, final String json, final TableConfigBean configBean) {
        if (json == null) {
            return;
        }
        final SmartTable<String> table = ((SmartTable<String>) view);
        final ArrayTableData<String> rawTableData = (ArrayTableData<String>) table.getTableData();
        this.configBean = configBean;
        int minWidth = configBean.getMinWidth();
        int minHeight = configBean.getMinHeight();

        try {
            if (reportTableData == null) {
                reportTableData = new ReportTableData();
            }
            final String[][] dataArr = this.dataArr;
            final String jsonData = this.jsonData;
            final ReportTableConfig config = this;
            Runnable runnable = new Runnable() {
                @Override
                public void run() {

                    Log.e("ReportTableConfig", "setReportTableData mergeTable start = " + System.currentTimeMillis());
                    if (json == null || !json.equals(jsonData)) {
                        String[][] dataArr = reportTableData.mergeTable(json);
                        config.jsonData = json;
                        config.dataArr = dataArr;
                    }
                    Log.e("ReportTableConfig", "setReportTableData mergeTable end = " + System.currentTimeMillis());
                    ((SmartTable<?>) view).getIsNotifying().set(false);
//                    view.post(new Runnable() {
//                        @Override
//                        public void run() {
                    setReportTableDataInMainThread(view, dataArr, configBean);
//                        }
//                    });
                }
            };
            ((SmartTable<?>) view).getIsNotifying().set(true);
            ((SmartTable<?>) view).getmExecutor().execute(runnable);

//            final JsonTableBean[][] tabArr = reportTableData.getTabArr();
//            table.setTabArr(tabArr);
//            TextDrawFormat mTextDrawFormat = new TextDrawFormat<JsonTableBean>() {
//                @Override
//                public void setTextPaint(TableConfig config, CellInfo<JsonTableBean> cellInfo, Paint paint) {
//                    super.setTextPaint(config, cellInfo, paint);
//                    JsonTableBean tableBean = tabArr[cellInfo.row][cellInfo.col];
//                    if (tableBean.isLeft()) {
//                        paint.setTextAlign(Paint.Align.LEFT);
//                    } else {
//                        paint.setTextAlign(Paint.Align.RIGHT);
//                    }
//                }
//            };
//            final ArrayTableData<String> tableData = ArrayTableData.create("", null, dataArr, mTextDrawFormat);
//
//            tableData.setMinWidth(DensityUtils.dp2px(this.context, minWidth));
//            tableData.setMinHeight(DensityUtils.dp2px(this.context, minHeight));
//            tableData.setUserCellRange(reportTableData.getMergeList());
//            table.getConfig().setContentCellBackgroundFormat(new ICellBackgroundFormat<CellInfo>() {
//                @Override
//                public void drawBackground(Canvas canvas, Rect rect, CellInfo cellInfo, Paint paint) {
//                    JsonTableBean tableBean = tabArr[cellInfo.row][cellInfo.col];
//                    String color = defaultBgColor;
//                    if (tableBean != null && !"".equals(tableBean.getBackgroundColor()) && tableBean
//                            .getBackgroundColor() != null) {
//                        color = tableBean.getBackgroundColor();
//                    }
//                    DrawUtils.fillBackground(canvas, rect.left, rect.top, rect.right, rect.bottom, Color
//                            .parseColor(color), paint);
//                }
//
//                @Override
//                public int getTextColor(CellInfo cellInfo) {
//                    JsonTableBean tableBean = tabArr[cellInfo.row][cellInfo.col];
//                    if (tableBean != null && !"".equals(tableBean.getTextColor()) && tableBean.getTextColor() != null) {
//                        return Color.parseColor(tableBean.getTextColor());
//                    }
//                    return Color.parseColor(defaultTextColor);
//                }
//            });
//            final Context mContext = context;
//            tableData.setOnItemClickListener(new ArrayTableData.OnItemClickListener<String>() {
//
//                @Override
//                public void onClick(Column<String> column, String value, String s, int col, int row) {
//                    if (clickLockBt) {
//                        new Handler().postDelayed(new Runnable() {
//                            @Override
//                            public void run() {
//                                table.setTableData(tableData);
//                            }
//                        }, 10);
//                        return;
//                    }
//                    try {
//                        JsonTableBean tableBean = tabArr[row][col];
//                        int keyIndex = tableBean.getKeyIndex();
//                        if (mContext != null) {
//                            WritableMap map = Arguments.createMap();
//                            map.putInt("keyIndex", keyIndex);
//                            map.putInt("rowIndex", row);
//                            map.putInt("columnIndex", col);
//                            map.putString("textColor", tableBean.getTextColor());
//                            ((ReactContext) mContext).getJSModule(RCTEventEmitter.class)
//                                    .receiveEvent(view.getId(), "onClickEvent", map);
//                        }
//                    } catch (java.lang.Exception exception) {
//                        exception.printStackTrace();
//                        System.out.println("点击异常---" + exception);
//                    }
//
//                }
//            });
//
//            tableData.setOnResponseItemClickListener(new TableData.OnResponseItemClickListener() {
//                @Override
//                public boolean responseOnClick(Column column, String value, Object o, int col, int row) {
//                    if (row == 0) {
//                        int firstColumnMaxMerge = tableData.getFirstColumnMaxMerge();
//                        if (frozenPoint > 0) {
//                            if (col == 0 && firstColumnMaxMerge > 0) {
//                                col = firstColumnMaxMerge;
//                            }
//                            if (col == frozenPoint - 1) {
//                                clickLockBt = true;
//                            } else if (col < frozenPoint - 1) {
//                                clickLockBt = false;
//                            } else {
//                                clickLockBt = false;
//                            }
//                        } else {
//                            if (frozenCount > 0) {
//                                if (col < frozenCount) {
//                                    clickLockBt = true;
//                                } else {
//                                    clickLockBt = false;
//                                }
//                            } else {
//                                clickLockBt = false;
//                            }
//                        }
//                    } else {
//                        clickLockBt = false;
//                    }
//                    return clickLockBt;
//                }
//            });
//
//            for (int i = 0; i < configBean.getFrozenColumns(); i++) {
//                tableData.getArrayColumns().get(i).setFixed(true);
//            }
//
//            if (rawTableData != null) {
//                tableData.setCurFixedColumnIndex(rawTableData.getCurFixedColumnIndex());
//                for (int i = 0; i < tableData.getArrayColumns().size(); i++) {
//                    if (rawTableData.getArrayColumns() != null &&
//                            rawTableData.getArrayColumns().size() > i) {
//                        Column column = rawTableData.getArrayColumns().get(i);
//                        if (column.isFixed() && tableData.getArrayColumns().size() > i) {
//                            tableData.getArrayColumns().get(i).setFixed(true);
//                        }
//                    }
//                }
//            }
//
//            for (int i = 0; i < tableData.getArrayColumns().size(); i++) {
//                tableData.getArrayColumns().get(i).setColumn(i, tableData.getArrayColumns().size());
//            }
//
//            LineStyle lineStyle = new LineStyle();
//            lineStyle.setColor(Color.parseColor(configBean.getLineColor()));
//            table.getConfig().setContentGridStyle(lineStyle);
//
//            table.getConfig().setFixedLines(configBean.getFrozenRows(), this);
//            table.getConfig().setTextLeftOffset(configBean.getTextPaddingHorizontal());
//            table.getConfig().setTextRightOffset(configBean.getTextPaddingHorizontal());
//            table.getMeasurer().setAddTableHeight(configBean.getHeaderHeight());
//            table.getMeasurer().setLimitTableHeight(configBean.getLimitTableHeight());
//            table.getConfig().setMinCellWidth(DensityUtils.dp2px(this.context, configBean.getMinWidth()));
//            table.getConfig().setMaxCellWidth(DensityUtils.dp2px(this.context, configBean.getMaxWidth()));
//            table.setTableData(tableData);
//            table.notifyDataChanged();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void showUnFixedArea() {
        //Toast.makeText(context, "showUnFixedArea", Toast.LENGTH_SHORT).show();
        // ((ReactContext)context).getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("com.hecom
        // .reporttable.showUnFixedArea",null);
    }

    @Override
    public void scrollToBottom() {
        // Toast.makeText(context, "滑动到底部", Toast.LENGTH_SHORT).show();
        ((ReactContext) context).getJSModule(RCTEventEmitter.class)
                .receiveEvent(table.getId(), "onScrollEnd", null);
    }
}
