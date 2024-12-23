package com.hecom.reporttable.table.lock;

import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.table.HecomTable;
import com.hecom.reporttable.table.HecomTableData;
import com.hecom.reporttable.table.bean.Cell;

import java.util.Set;

/**
 * Created by kevin.bai on 2024/1/7.
 */
public class LockHelper extends Locker {
    Locker locker;

    public LockHelper(HecomTable table) {
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
    public void update() {
        locker.update();
    }

    @Override
    public void setFrozenColumns(int frozenColumns){
        super.setFrozenColumns(frozenColumns);
        locker.setFrozenColumns(frozenColumns);
    }

    @Override
    public void setIgnores(Set<Integer> ignores) {
        super.setIgnores(ignores);
        locker.setIgnores(ignores);
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

    public void reLock(HecomTableData newData) {
        final HecomTableData oldData = (HecomTableData) this.table.getTableData();
        int arrayColumnSize = newData.getColumns().size();
        for (int i = 0; i < getFrozenColumns() && i < arrayColumnSize; i++) {
            newData.getColumns().get(i).setFixed(true);
        }
        if (oldData != null) {
            for (int i = 0; i < arrayColumnSize; i++) {
                if (oldData.getArrayColumns() != null &&
                        oldData.getArrayColumns().size() > i) {
                    Column<Cell> column = oldData.getArrayColumns().get(i);
                    if (column.isFixed()) {
                        newData.getArrayColumns().get(i).setFixed(true);
                    }
                }
            }
        }
    }
}
