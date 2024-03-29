package com.hecom.reporttable.table.lock;

import com.hecom.reporttable.TableUtil;
import com.hecom.reporttable.form.core.SmartTable;
import com.hecom.reporttable.form.data.column.Column;

import java.util.List;

/**
 * 普通列锁定逻辑，受frozenPoint、frozenCount影响 Created by kevin.bai on 2024/1/4.
 */
public class CommonLock extends Locker {

    public int frozenCount = 0;

    public int frozenPoint = 0;

    private int firstColMaxMerge = -1;

    private int curFixedColumnIndex;

    public CommonLock(SmartTable<String> table) {
        super(table);
    }

    private int getFirstColMaxMerge() {
        if (firstColMaxMerge == -1) {
            firstColMaxMerge = TableUtil.getFirstColumnMaxMerge(table.getTableData());
        }
        return firstColMaxMerge;
    }

    @Override
    protected void updateLock(int col) {
        List<Column> columns = table.getTableData().getColumns();

        int firstColumnMaxMerge = getFirstColMaxMerge();
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

    @Override
    public boolean needShowLock(int col) {
        boolean isLockItem;
        int firstColumnMaxMerge = getFirstColMaxMerge();
        if (frozenPoint > 0) {
            if (col == 0 && firstColumnMaxMerge > 0) {
                col = firstColumnMaxMerge;
            }
            isLockItem = col == frozenPoint - 1;
        } else if (frozenCount > 0) {
            isLockItem = col < frozenCount;
        } else {
            isLockItem = false;
        }
        return isLockItem;
    }

    @Override
    public int getRawCol(int col) {
        return col;
    }
}
