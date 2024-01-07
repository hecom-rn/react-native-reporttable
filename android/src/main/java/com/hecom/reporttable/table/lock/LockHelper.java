package com.hecom.reporttable.table.lock;

import com.hecom.reporttable.form.core.SmartTable;

/**
 *
 * Created by kevin.bai on 2024/1/4.
 */
public abstract class LockHelper {
    SmartTable<String> table;

    protected int frozenColumns;

    public int getFrozenColumns() {
        return frozenColumns;
    }

    public void setFrozenColumns(int frozenColumns) {
        this.frozenColumns = frozenColumns;
    }

    public int getCurFixedColumnIndex() {
        return curFixedColumnIndex;
    }

    public void setCurFixedColumnIndex(int curFixedColumnIndex) {
        this.curFixedColumnIndex = curFixedColumnIndex;
    }

    protected int curFixedColumnIndex;

    public LockHelper(SmartTable<String> table) {
        this.table = table;
    }

    public abstract void updateLock(int column);
}
