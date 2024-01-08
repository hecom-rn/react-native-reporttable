package com.hecom.reporttable.table.lock;

import com.hecom.reporttable.form.core.SmartTable;

/**
 * Created by kevin.bai on 2024/1/7.
 */
public class LockHelper extends Locker {
    Locker locker;

    public LockHelper(SmartTable<String> table) {
        super(table);
        locker = new CommonLock(table);
    }

    public void setPermutable(boolean permutable) {
        if (permutable) {
            locker = new PermutableLock(table);
            locker.setFrozenColumns(getFrozenColumns());
        }
    }

    @Override
    public void setFrozenColumns(int frozenColumns){
        super.setFrozenColumns(frozenColumns);
        locker.setFrozenColumns(frozenColumns);
    }

    @Override
    protected void updateLock(int column) {
        if (locker != null) {
            locker.updateLock(column);
        }
    }

    @Override
    protected boolean needShowLock(int col) {
        if (locker != null) {
            return locker.needShowLock(col);
        }
        return false;
    }

    @Override
    public int getRawCol(int col) {
        return locker.getRawCol(col);
    }

    public void setPoint(int point) {
        if (locker instanceof CommonLock) {
            ((CommonLock) locker).frozenPoint = point;
        }
    }

    public void setCount(int count) {
        if (locker instanceof CommonLock) {
            ((CommonLock) locker).frozenCount = count;
        }
    }
}
