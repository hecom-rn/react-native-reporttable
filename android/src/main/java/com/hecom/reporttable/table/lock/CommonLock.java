package com.hecom.reporttable.table.lock;

import com.hecom.reporttable.form.data.CellRange;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.form.data.table.TableData;
import com.hecom.reporttable.table.HecomTable;

import java.util.List;

/**
 * 普通列锁定逻辑，受frozenPoint、frozenCount影响 Created by kevin.bai on 2024/1/4.
 */
public class CommonLock extends Locker {

    public int frozenCount = 0;

    public int frozenPoint = 0;

    private int firstColMaxMerge = -1;

    private int curFixedColumnIndex;

    public CommonLock(HecomTable table) {
        super(table);
    }

    private int getFirstColMaxMerge() {
        if (firstColMaxMerge == -1) {
            TableData tableData = table.getTableData();
            int maxColumn = -1;
            List<CellRange> list = tableData.getUserCellRange();
            for (int i = 0; i < list.size(); i++) {
                CellRange cellRange = list.get(i);
                if (cellRange.getFirstCol() == 0 && cellRange.getFirstRow() == 0 && cellRange.getLastCol() > 0) {
                    if (maxColumn < cellRange.getLastCol()) {
                        maxColumn = cellRange.getLastCol();
                    }
                }
            }
            firstColMaxMerge = maxColumn;
        }
        return firstColMaxMerge;
    }

    private void changeLock(List<Column> columns, int index, boolean lock) {
        if (!this.ignore(index)) {
            columns.get(index).setFixed(lock);
        }
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
                    this.changeLock(columns, i, true);
                }
                curFixedColumnIndex = col;
            } else if (col < curFixedColumnIndex) {
                //后面列取消锁定
                for (int i = col + 1; i <= firstColumnMaxMerge; i++) {
                    this.changeLock(columns, i, false);
                }
                curFixedColumnIndex = col;
            } else {
                //全部列取消锁定
                for (int i = frozenIndex; i <= firstColumnMaxMerge; i++) {
                    this.changeLock(columns, i, false);
                }
                curFixedColumnIndex = -1;
            }
            return;
        }
        if (curFixedColumnIndex == -1 || col > curFixedColumnIndex) {
            //前面列全部锁定
            for (int i = 0; i <= col; i++) {
                this.changeLock(columns, i, true);
            }
            curFixedColumnIndex = col;
        } else if (col < curFixedColumnIndex) {
            //后面列取消锁定
            for (int i = col + 1; i <= curFixedColumnIndex; i++) {
                this.changeLock(columns, i, false);
            }
            curFixedColumnIndex = col;
        } else {
            //全部列取消锁定
            for (int i = frozenIndex; i <= col; i++) {
                this.changeLock(columns, i, false);
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
