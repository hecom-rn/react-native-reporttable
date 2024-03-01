package com.hecom.reporttable.table.lock;

import com.hecom.reporttable.table.HecomTable;

/**
 * Created by kevin.bai on 2024/1/4.
 */
public abstract class Locker {
    HecomTable table;

    protected int frozenColumns;

    public int getFrozenColumns() {
        return frozenColumns;
    }

    public void setFrozenColumns(int frozenColumns) {
        this.frozenColumns = frozenColumns;
    }


    public Locker(HecomTable table) {
        this.table = table;
    }

    public void onClick(int row, int col) {
        if (row == 0) {
            this.updateLock(col);
        }
    }

    public boolean needShowLock(int row, int col) {
        if (row == 0) {
            return this.needShowLock(col);
        }
        return false;
    }

    protected abstract void updateLock(int column);

    protected abstract boolean needShowLock(int col);

    public abstract int getRawCol(int col);
}
