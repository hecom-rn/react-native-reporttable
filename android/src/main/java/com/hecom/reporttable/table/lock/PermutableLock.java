package com.hecom.reporttable.table.lock;

import com.hecom.reporttable.TableUtil;
import com.hecom.reporttable.form.core.SmartTable;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.form.data.table.TableData;

import java.util.List;

/**
 * 可排列列锁定逻辑，permutable属性为true时使用此策略
 * Created by kevin.bai on 2024/1/4.
 */
public class PermutableLock extends Locker {

    List<Column> rawColumn;

    TableData<String> lastTableData;

    public PermutableLock(SmartTable<String> table) {
        super(table);
        this.lastTableData = table.getTableData();
    }

    @Override
    protected void updateLock(int col) {
        if (rawColumn == null || lastTableData != table.getTableData()){
            lastTableData = table.getTableData();
            rawColumn = lastTableData.getColumns();
        }


        List<Column> columns = table.getTableData().getColumns();

        int firstColumnMaxMerge = TableUtil.getFirstColumnMaxMerge(table.getTableData());
        int frozenIndex = frozenColumns;
        if (firstColumnMaxMerge > 0) {
            if (curFixedColumnIndex == -1 || col > curFixedColumnIndex) {
                //前面列全部锁定
                for (int i = 0; i <= firstColumnMaxMerge; i++) {
                    columns.get(i).setFixed(true);
                }
                curFixedColumnIndex = col;
            } else if (col < curFixedColumnIndex) {
                //后面列取消锁定
                for (int i = col + 1; i <= firstColumnMaxMerge; i++) {
                    columns.get(i).setFixed(false);
                }
                curFixedColumnIndex = col;
            } else {
                //全部列取消锁定
                for (int i = frozenIndex; i <= firstColumnMaxMerge; i++) {
                    columns.get(i).setFixed(false);
                }
                curFixedColumnIndex = -1;
            }
            return;
        }
        if (curFixedColumnIndex == -1 || col > curFixedColumnIndex) {
            //前面列全部锁定
            for (int i = 0; i <= col; i++) {
                columns.get(i).setFixed(true);
            }
            curFixedColumnIndex = col;
        } else if (col < curFixedColumnIndex) {
            //后面列取消锁定
            for (int i = col + 1; i <= curFixedColumnIndex; i++) {
                columns.get(i).setFixed(false);
            }
            curFixedColumnIndex = col;
        } else {
            //全部列取消锁定
            for (int i = frozenIndex; i <= col; i++) {
                columns.get(i).setFixed(false);
            }
            curFixedColumnIndex = -1;
        }
    }
}
