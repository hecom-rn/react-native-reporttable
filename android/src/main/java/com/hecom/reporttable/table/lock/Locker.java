package com.hecom.reporttable.table.lock;

import com.hecom.reporttable.form.core.SmartTable;
import com.hecom.reporttable.form.data.CellInfo;

/**
 *
 * Created by kevin.bai on 2024/1/4.
 */
public abstract class Locker {
    SmartTable<String> table;

    protected int frozenColumns;

    public int getFrozenColumns() {
        return frozenColumns;
    }

    public void setFrozenColumns(int frozenColumns) {
        this.frozenColumns = frozenColumns;
    }

    protected int curFixedColumnIndex;

    public Locker(SmartTable<String> table) {
        this.table = table;
    }

    public void onClick(int row, int col){
        if (row == 0){
            this.updateLock(col);
        }
    }

    protected abstract void updateLock(int column);

    protected boolean needShowLock(CellInfo cellInfo){
        // TODO 改成接口由子类实现
        return false;
    }
}
