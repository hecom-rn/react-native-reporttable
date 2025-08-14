package com.hecom.reporttable.table.bean;

/**
 * Created by kevin.bai on 2025/8/11.
 */
public class FrozenConfigItem {
    private boolean locked;
    private int column;

    public boolean isLocked() {
        return locked;
    }

    public void setLocked(boolean locked) {
        this.locked = locked;
    }

    public int getColumn() {
        return column;
    }

    public void setColumn(int column) {
        this.column = column;
    }

}
