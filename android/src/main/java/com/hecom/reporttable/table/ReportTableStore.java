package com.hecom.reporttable.table;

import android.content.Context;

import com.hecom.reporttable.form.core.SmartTable;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.form.data.table.ArrayTableData;
import com.hecom.reporttable.form.utils.DensityUtils;
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

    public ReportTableStore(Context context, SmartTable smartTable) {
        this.context = context;
        this.table = smartTable;
        this.mClickHandler = new ClickHandler(this.table);
        this.mLockHelper = new LockHelper(this.table);
        this.mClickHandler.setLocker(this.mLockHelper);
        table.getConfig().mLocker = this.mLockHelper;
    }

    private void setReportTableDataInMainThread(MergeResult mergeResult,
                                                final TableConfigBean configBean) {
        final ArrayTableData<String> rawTableData = (ArrayTableData<String>) table.getTableData();
        int minWidth = configBean.getMinWidth();
        int maxWidth = configBean.getMaxWidth();
        int minHeight = configBean.getMinHeight();
        try {
            final JsonTableBean[][] tabArr = reportTableData.getTabArr();
            table.getConfig().setTabArr(tabArr);
            final ArrayTableData<String> tableData = ArrayTableData.create("", null,
                    mergeResult.data, new CellDrawFormat(table.getContext(), mLockHelper));

            tableData.setMaxValues4Column(mergeResult.maxValues4Column);
            tableData.setMaxValues4Row(mergeResult.maxValues4Row);
            tableData.setWidthLimit(DensityUtils.dp2px(this.context, minWidth),
                    DensityUtils.dp2px(this.context, maxWidth), configBean.getColumnConfigMap());
            tableData.setMinHeight(DensityUtils.dp2px(this.context, minHeight));
            tableData.setUserCellRange(reportTableData.getMergeList());


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
            table.setTableData(tableData);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void setReportTableData(final String json,
                                   final TableConfigBean configBean) {
        if (json == null) {
            return;
        }

        try {
            if (reportTableData == null) {
                reportTableData = new ReportTableData();
            }

            //横竖屏切换
            boolean configChanged = this.configBean == null
                    || this.configBean.getMinWidth() != configBean.getMinWidth()
                    || this.configBean.getMaxWidth() != configBean.getMaxWidth();
            boolean contentChanged = !json.equals(this.jsonData);
            if (contentChanged) {
                this.jsonData = json;
                this.configBean = configBean;
                Runnable runnable = new Runnable() {
                    @Override
                    public void run() {

                        MergeResult mergeResult = reportTableData.mergeTable(json,
                                table.getConfig());
                        if (null == mergeResult) {
                            table.getIsNotifying().set(false);
                        } else {
                            setReportTableDataInMainThread(mergeResult, configBean);
                        }
                    }
                };
                if (contentChanged) table.getIsNotifying().set(true);
                table.getmExecutor().execute(runnable);
            } else if (configChanged) {
                this.configBean = configBean;
                ArrayTableData<String> tableData =
                        (ArrayTableData<String>) table.getTableData();
                tableData.setWidthLimit(DensityUtils.dp2px(this.context, configBean.getMinWidth()),
                        DensityUtils.dp2px(this.context, configBean.getMaxWidth()),
                        configBean.getColumnConfigMap());
                table.setTableData(tableData);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

