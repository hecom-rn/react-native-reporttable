package com.hecom.reporttable.table.lock;

import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.table.HecomTable;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

/**
 * 可排列列锁定逻辑，permutable属性为true时使用此策略 Created by kevin.bai on 2024/1/4.
 */
public class PermutableLock extends Locker {

    List<Integer> fixedColumn = new ArrayList<>();

    public PermutableLock(HecomTable table) {
        super(table);
    }

    @Override
    public int getRawCol(int col) {
        return table.getTableData().getColumns().get(col).getColumn();
    }

    private Column findColumn(List<Column> list, int col){
        for (Column column : list) {
            if (column.getColumn() == col) {
                return column;
            }
        }
        return null;
    }

    @Override
    public void update() {
        List<Column> rawColumns = table.getTableData().getColumns();
        List<Column> newColumns = new ArrayList<>(rawColumns.size());
        for (int i = 0; i < rawColumns.size(); i++) {
            if (i < frozenColumns) {
                newColumns.add(i, rawColumns.get(i));
            } else if (i < fixedColumn.size() + frozenColumns) {
                newColumns.add(i, findColumn(rawColumns, fixedColumn.get(i - frozenColumns)));
            }
        }
        List<Column> other = rawColumns.subList(frozenColumns, rawColumns.size());
        Collections.sort(other, new Comparator<Column>() {
            @Override
            public int compare(Column o1, Column o2) {
                return o1.getColumn() - o2.getColumn();
            }
        });
        for (Integer integer : fixedColumn) {
            other.remove(findColumn(rawColumns, integer));
        }
        newColumns.addAll(other);
        table.getTableData().setColumns(newColumns);
    }

    @Override
    protected void updateLock(int col) {
        Column column = table.getTableData().getColumns().get(col);
        if (column.isFixed()) {
            fixedColumn.remove((Object)column.getColumn());
        } else {
            fixedColumn.add(column.getColumn());
        }
        column.setFixed(!column.isFixed());
        update();
    }

    @Override
    protected boolean needShowLock(int col) {
        return col >= frozenColumns;
    }
}
