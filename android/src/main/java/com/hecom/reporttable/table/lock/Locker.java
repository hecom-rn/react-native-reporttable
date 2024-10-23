package com.hecom.reporttable.table.lock;

import com.hecom.reporttable.table.HecomTable;

import java.util.Set;

/**
 * 内部行列数据从0开始，外部传入的相关属性从1开始 Created by kevin.bai on 2024/1/4.
 */
public abstract class Locker {
    HecomTable table;

    protected int frozenColumns;

    protected Set<Integer> ignores;

    public int getFrozenColumns() {
        return frozenColumns;
    }

    public void setFrozenColumns(int frozenColumns) {
        this.frozenColumns = frozenColumns;
    }

    public Set<Integer> getIgnores() {
        return ignores;
    }

    public void setIgnores(Set<Integer> ignores) {
        this.ignores = ignores;
    }

    protected boolean ignore(int col) {
        return this.ignores != null && this.ignores.contains(col + 1);
    }

    public Locker(HecomTable table) {
        this.table = table;
    }

    public void onClick(int row, int col) {
        if (row == 0 && !this.ignore(col)) {
            this.updateLock(col);
        }
    }

    /**
     * 更新数据后调用，根据锁定状态更新列排序
     */
    public void update() {

    }

    public boolean needShowLock(int row, int col) {
        if (row == 0 && !this.ignore(col)) {
            return this.needShowLock(col);
        }
        return false;
    }

    protected abstract void updateLock(int column);

    protected abstract boolean needShowLock(int col);

    public abstract int getRawCol(int col);
}
