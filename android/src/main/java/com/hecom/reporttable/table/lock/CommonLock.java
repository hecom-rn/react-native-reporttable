package com.hecom.reporttable.table.lock;

import com.hecom.reporttable.form.data.CellRange;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.form.data.table.TableData;
import com.hecom.reporttable.table.HecomTable;
import com.hecom.reporttable.table.HecomTableData;
import com.hecom.reporttable.table.bean.FrozenConfigItem;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 普通列锁定逻辑，受frozenPoint、frozenCount影响 Created by kevin.bai on 2024/1/4.
 */
public class CommonLock extends Locker {

    private Map<Integer, FrozenConfigItem> ability = null;

    private Map<Integer, Integer> colMaxMergeMap = new HashMap<>();

    private int curFixedColumnIndex;

    private boolean needReLock = false;

    public void setAbility(Map<Integer, FrozenConfigItem> ability) {
        this.ability = ability;
        this.needReLock = true;
    }

    public CommonLock(HecomTable table) {
        super(table);
    }

    private int getFirstColMaxMerge(int col) {
        int colMaxMerge = colMaxMergeMap.containsKey(col) ? colMaxMergeMap.get(col) : -1;
        if (colMaxMerge == -1) {
            TableData tableData = table.getTableData();
            int maxColumn = -1;
            List<CellRange> list = tableData.getUserCellRange();
            for (int i = 0; i < list.size(); i++) {
                CellRange cellRange = list.get(i);
                if (cellRange.getFirstCol() == col && cellRange.getFirstRow() == 0 && cellRange.getLastCol() > 0) {
                    if (maxColumn < cellRange.getLastCol()) {
                        maxColumn = cellRange.getLastCol();
                    }
                }
            }
            colMaxMerge = maxColumn;
            colMaxMergeMap.put(col, colMaxMerge);
        }
        return colMaxMerge;
    }

    private void changeLock(List<Column> columns, int index, boolean lock) {
        columns.get(index).setFixed(lock);
    }

    @Override
    protected void updateLock(int col) {
        List<Column> columns = table.getTableData().getColumns();

        int firstColumnMaxMerge = getFirstColMaxMerge(col);
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
                for (int i = frozenColumns; i <= firstColumnMaxMerge; i++) {
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
            for (int i = frozenColumns; i <= col; i++) {
                this.changeLock(columns, i, false);
            }
            curFixedColumnIndex = -1;
        }
    }

    @Override
    public boolean needShowLock(int col) {
        if (ability == null) {
            return false;
        }
        return ability.get(col) != null;
    }

    @Override
    public int getRawCol(int col) {
        return col;
    }

    @Override
    public void reLock(HecomTableData newData) {
        if (ability != null && needReLock) {
            needReLock = false;
            List<CellRange> list = newData.getUserCellRange();
            // 当存在合并单元格时，ability中只包含最后一列的配置，需要补全前面列的配置
            for (int i = 0; i < list.size(); i++) {
                CellRange cellRange = list.get(i);
                if (cellRange.getFirstRow() == 0) {
                    FrozenConfigItem item = ability.get(cellRange.getLastCol());
                    if (item != null) {
                        for (int j = cellRange.getFirstCol(); j < cellRange.getLastCol(); j++) {
                            if (ability.get(j) == null) {
                                FrozenConfigItem newItem = new FrozenConfigItem();
                                newItem.setColumn(j);
                                newItem.setLocked(item.isLocked());
                                ability.put(j, newItem);
                            }
                        }
                    }
                }
            }
            for (FrozenConfigItem item : ability.values()) {
                for (int i = item.getColumn(); i >= frozenColumns; i--) {
                    newData.getColumns().get(i).setFixed(item.isLocked());
                }
            }
        }
    }
}
