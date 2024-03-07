package com.hecom.reporttable.table;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.view.View;

import com.hecom.reporttable.form.core.SmartTable;
import com.hecom.reporttable.form.data.CellInfo;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.form.data.format.bg.ICellBackgroundFormat;
import com.hecom.reporttable.form.data.style.LineStyle;
import com.hecom.reporttable.form.data.table.ArrayTableData;
import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.form.utils.DrawUtils;
import com.hecom.reporttable.table.bean.ItemCommonStyleConfig;
import com.hecom.reporttable.table.bean.JsonTableBean;
import com.hecom.reporttable.table.bean.MergeResult;
import com.hecom.reporttable.table.bean.TableConfigBean;
import com.hecom.reporttable.table.lock.LockHelper;

public class ReportTableStore {
    private SmartTable<String> table;

    private ClickHandler mClickHandler;

    public LockHelper mLockHelper;
    private TableConfigBean configBean;

    private ReportTableData reportTableData = new ReportTableData();
    private Context context;

    private String jsonData;
    int TITLE_ICON_MARGIN_VALUE = 40;
    int CONTENT_ICON_MARGIN_VALUE = 40;
    int ICON_MARGIN = 4;

    public ReportTableStore(Context context, SmartTable smartTable) {
        this.context = context;
        TITLE_ICON_MARGIN_VALUE = DensityUtils.dp2px(context, 32);
        CONTENT_ICON_MARGIN_VALUE = DensityUtils.dp2px(context, 12);
        ICON_MARGIN = DensityUtils.dp2px(context, 4);
        this.table = smartTable;
        this.mClickHandler = new ClickHandler(this.table);
        this.mLockHelper = new LockHelper(this.table);
        this.mClickHandler.setLocker(this.mLockHelper);
        table.getConfig().mLocker = this.mLockHelper;
    }

    public void setReportTableDataInMainThread(final SmartTable table, MergeResult mergeResult,
                                               final TableConfigBean configBean) {
        final ArrayTableData<String> rawTableData = (ArrayTableData<String>) table.getTableData();
        int minWidth = configBean.getMinWidth();
        int maxWidth = configBean.getMaxWidth();
        int minHeight = configBean.getMinHeight();
        try {
            final JsonTableBean[][] tabArr = reportTableData.getTabArr();
            table.getConfig().setTabArr(tabArr);
            final ArrayTableData<String> tableData = ArrayTableData.create("", null,
                    mergeResult.data, new CellDrawFormat(table.getContext(), configBean, mLockHelper));

            tableData.setMaxValues4Column(mergeResult.maxValues4Column);
            tableData.setMaxValues4Row(mergeResult.maxValues4Row);
            tableData.setWidthLimit(DensityUtils.dp2px(this.context, minWidth),
                    DensityUtils.dp2px(this.context, maxWidth), configBean.getColumnConfigMap());
            tableData.setMinHeight(DensityUtils.dp2px(this.context, minHeight));
            tableData.setUserCellRange(reportTableData.getMergeList());
            table.getConfig().setContentCellBackgroundFormat(new ICellBackgroundFormat<CellInfo>() {
                @Override
                public void drawBackground(Canvas canvas, Rect rect, CellInfo cellInfo,
                                           Paint paint) {
                    JsonTableBean tableBean = table.getConfig().getCell(cellInfo.row,cellInfo.col);
                    String color = ItemCommonStyleConfig.DEFAULT_BACKGROUND_COLOR;
                    if (tableBean != null) {
                        String backgroundColor = tableBean.getBackgroundColor();
                        color = backgroundColor;
                    }
                    DrawUtils.fillBackground(canvas, rect.left, rect.top, rect.right, rect.bottom
                            , Color
                                    .parseColor(color), paint);
                }

                @Override
                public int getTextColor(CellInfo cellInfo) {
                    JsonTableBean tableBean = table.getConfig().getCell(cellInfo.row,cellInfo.col);
                    if (tableBean != null) {
                        String textColor = tableBean.getTextColor();
                        return Color.parseColor(textColor);
                    }
                    return Color.parseColor(ItemCommonStyleConfig.DEFALUT_TEXT_COLOR);
                }
            });

            tableData.setOnItemClickListener(this.mClickHandler);


            int arrayColumnSize = tableData.getColumns().size();
            for (int i = 0; i < this.mLockHelper.getFrozenColumns() && i < arrayColumnSize; i++) {
                tableData.getColumns().get(i).setFixed(true);
            }

            if (rawTableData != null) {
                for (int i = 0; i < arrayColumnSize; i++) {
                    if (rawTableData.getArrayColumns() != null &&
                            rawTableData.getArrayColumns().size() > i) {
                        Column column = rawTableData.getArrayColumns().get(i);
                        if (column.isFixed() && arrayColumnSize > i) {
                            tableData.getArrayColumns().get(i).setFixed(true);
                        }
                    }
                }
            }

            LineStyle lineStyle = new LineStyle();
            lineStyle.setColor(Color.parseColor(configBean.getLineColor()));
            table.getConfig().setContentGridStyle(lineStyle);

            table.getConfig().setTextLeftOffset(configBean.getTextPaddingHorizontal());
            table.getConfig().setTextRightOffset(configBean.getTextPaddingHorizontal());
            table.getMeasurer().setAddTableHeight(configBean.getHeaderHeight());
            table.getMeasurer().setLimitTableHeight(configBean.getLimitTableHeight());
            table.setTableData(tableData);
            mLockHelper.update();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void setReportTableData(final View view, final String json,
                                   final TableConfigBean configBean) {
        if (json == null) {
            return;
        }

        try {
            if (reportTableData == null) {
                reportTableData = new ReportTableData();
            }

            final ReportTableStore config = this;
            //横竖屏切换
            boolean configChanged = config.configBean == null
                    || config.configBean.getMinWidth() != configBean.getMinWidth()
                    || config.configBean.getMaxWidth() != configBean.getMaxWidth();
            boolean contentChanged = !json.equals(config.jsonData);
            if (contentChanged) {
                config.jsonData = json;
                config.configBean = configBean;
                Runnable runnable = new Runnable() {
                    @Override
                    public void run() {

                        MergeResult mergeResult = reportTableData.mergeTable(json, configBean);
                        if (null == mergeResult) {
                            ((SmartTable<?>) view).getIsNotifying().set(false);
                        } else {
                            setReportTableDataInMainThread((SmartTable<?>) view, mergeResult,
                                    configBean);
                        }
                    }
                };
                if (contentChanged) ((SmartTable<?>) view).getIsNotifying().set(true);
                ((SmartTable<?>) view).getmExecutor().execute(runnable);
            } else if (configChanged) {
                config.configBean = configBean;
                ArrayTableData<String> tableData = (ArrayTableData<String>) table.getTableData();
                tableData.setWidthLimit(DensityUtils.dp2px(this.context, configBean.getMinWidth()),
                        DensityUtils.dp2px(this.context, configBean.getMaxWidth()),
                        configBean.getColumnConfigMap());
                ((SmartTable<String>) view).setTableData(tableData);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

