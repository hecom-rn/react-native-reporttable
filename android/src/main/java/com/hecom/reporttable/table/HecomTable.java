package com.hecom.reporttable.table;

import android.util.AttributeSet;
import android.util.SparseIntArray;
import android.view.ViewTreeObserver;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.hecom.reporttable.form.core.SmartTable;
import com.hecom.reporttable.form.data.CellRange;
import com.hecom.reporttable.form.data.column.Column;
import com.hecom.reporttable.form.data.table.ArrayTableData;
import com.hecom.reporttable.form.listener.OnMeasureListener;
import com.hecom.reporttable.form.listener.OnTableChangeListener;
import com.hecom.reporttable.form.matrix.MatrixHelper;
import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.table.bean.Cell;
import com.hecom.reporttable.table.bean.CellConfig;
import com.hecom.reporttable.table.bean.ProgressStyle;
import com.hecom.reporttable.table.bean.ReplenishColumnsWidthConfig;
import com.hecom.reporttable.table.bean.TableConfigBean;
import com.hecom.reporttable.table.format.BackgroundFormat;
import com.hecom.reporttable.table.format.CellDrawFormat;
import com.hecom.reporttable.table.format.HecomFormat;
import com.hecom.reporttable.table.format.HecomGridFormat;
import com.hecom.reporttable.table.format.HecomStyle;
import com.hecom.reporttable.table.format.ShadowDrawOver;
import com.hecom.reporttable.table.lock.LockHelper;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

/**
 * 基于SmartTable定制的表格组件
 * <p>
 * 针对SmartTable的设置代码尽量封装在这里
 * <p>
 */
public class HecomTable extends SmartTable<Cell> {
    private ClickHandler mClickHandler;

    public LockHelper mLockHelper;

    private TableConfigBean lastConfigBean;
    private String lastJson;

    private ReplenishColumnsWidthConfig replenishConfig;

    private ProgressStyle progressStyle;

    private boolean isTableLayoutReady = false;
    private boolean isContentLayoutReady = false;

    public static class SpliceItem {
        private String data;
        private int y;
        private int l;

        public SpliceItem(String data, int y, int l) {
            super();
            this.data = data;
            this.y = y;
            this.l = l;
        }

        public String getData() {
            return data;
        }

        public void setData(String data) {
            this.data = data;
        }

        public int getY() {
            return y;
        }

        public void setY(int y) {
            this.y = y;
        }

        public int getL() {
            return l;
        }

        public void setL(int l) {
            this.l = l;
        }
    }

    public HecomTable(ThemedReactContext context) {
        super(context);
        init(context);
    }

    public HecomTable(ThemedReactContext context, AttributeSet attrs) {
        super(context, attrs);
        init(context);
    }

    public HecomTable(ThemedReactContext context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init(context);
    }

    private void init(final ThemedReactContext context) {
        mClickHandler = new ClickHandler(this);
        mLockHelper = new LockHelper(this);
        mClickHandler.setLocker(mLockHelper);
        getConfig().setVerticalPadding(DensityUtils.dp2px(getContext(), 4))
                .setShowTableTitle(false).setShowColumnTitle(false).setShowXSequence(false)
                .setShowYSequence(false);
        getConfig().setTableGridFormat(new HecomGridFormat(this));
        getConfig().setContentCellBackgroundFormat(new BackgroundFormat(this));

        setZoom(true, 2, 0.5f);

        final OnTableChangeListener listener = getMatrixHelper().getOnTableChangeListener();

        getProvider().setDrawOver(new ShadowDrawOver(this));

        getMatrixHelper().setOnTableChangeListener(new OnTableChangeListener() {
            @Override
            public void onTableChanged(float scale, float translateX, float translateY) {
                listener.onTableChanged(scale, translateX, translateY);
                WritableMap map = Arguments.createMap();
                map.putDouble("translateX", translateX);
                map.putDouble("translateY", translateY);
                map.putDouble("scale", scale);
                context.getJSModule(RCTEventEmitter.class)
                        .receiveEvent(getId(), "onScroll", map);
                MatrixHelper mh = getMatrixHelper();
                boolean notBottom = (mh.getZoomRect().bottom - mh.getOriginalRect().bottom) > 0;
                if (!notBottom) {
                    (context).getJSModule(RCTEventEmitter.class)
                            .receiveEvent(getId(), "onScrollEnd", null);
                }
            }
        });
        getViewTreeObserver().addOnPreDrawListener(new ViewTreeObserver.OnPreDrawListener() {
            @Override
            public boolean onPreDraw() {
                getViewTreeObserver().removeOnPreDrawListener(this);
                HecomTable.this.isTableLayoutReady = true;
                if (HecomTable.this.needReLayout()) {
                    HecomTable.this.reLayout();
                }
                return true;
            }
        });
        getMeasurer().setOnMeasureListener(new OnMeasureListener() {
            @Override
            public void onContentSizeChanged(float width, float height) {
                float widthDp = DensityUtils.px2dp(getContext(), width);
                float heightDp = DensityUtils.px2dp(getContext(), height);
                WritableMap map = Arguments.createMap();
                map.putDouble("width", widthDp);
                map.putDouble("height", heightDp);
                context.getJSModule(RCTEventEmitter.class)
                        .receiveEvent(getId(), "onContentSize", map);
            }

            @Override
            public void onDidLayout() {
                HecomTable.this.isContentLayoutReady = true;
                if (HecomTable.this.needReLayout()) {
                    HecomTable.this.reLayout();
                } else {
                    HecomTable.this.resizeColumns.clear();
                }
                context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("tableDidLayout", "tableDidLayout");
            }
        });
    }

    private SparseIntArray resizeColumns = new SparseIntArray();

    /**
     * 是否需要重新调整列宽
     */
    private boolean needReLayout() {
        if (this.replenishConfig == null || this.replenishConfig.getShowNumber() == 0 || !isTableLayoutReady || !isContentLayoutReady) {
            return false;
        }
        int viewWidth = this.getMeasuredWidth();
        List<Column> columns = this.getTableData().getColumns();
        int columnWidth = 0;
        for (int col = 0; col < this.replenishConfig.getShowNumber() && col < columns.size(); col++) {
            columnWidth += columns.get(col).getComputeWidth();
        }
        return viewWidth > 0 && columnWidth > viewWidth;
    }

    private void reLayout() {
        int viewWidth = this.getMeasuredWidth();
        List<Column> columns = this.getTableData().getColumns();
        int totalColumn = Math.min(this.replenishConfig.getShowNumber(), columns.size());
        int columnTotalWidth = 0;
        int ignoreWidth = 0;
        for (int col = 0; col < totalColumn; col++) {
            columnTotalWidth += columns.get(col).getComputeWidth();
            this.resizeColumns.put(col, 0);
            if (this.replenishConfig.ignore(col)) {
                ignoreWidth += columns.get(col).getComputeWidth();
            }
        }
        for (int col = 0; col < totalColumn; col++) {
            if (this.replenishConfig.ignore(col)) {
                continue;
            }
            Column column = columns.get(col);
            int resizeWidth = (int) Math.floor(
                    column.getComputeWidth() -
                            (column.getComputeWidth() * 1f / (columnTotalWidth - ignoreWidth) * (columnTotalWidth - viewWidth))
            );
            this.resizeColumns.put(column.getColumn(), resizeWidth);
            if (resizeWidth < column.getMinWidth()) {
                column.setMinWidth(resizeWidth);
            }
            List<Cell> cells = column.getDatas();
            for (int i = 0; i < cells.size(); i++) {
                cells.get(i).setCache(null);
            }
        }
        notifyDataChanged();
    }

    private HecomStyle hecomStyle;

    public void setHecomStyle(HecomStyle hecomStyle) {
        this.hecomStyle = hecomStyle;
        getConfig().setContentStyle(hecomStyle);
        getConfig().setHorizontalPadding(hecomStyle.getPaddingHorizontal());
    }

    public HecomStyle getHecomStyle() {
        return hecomStyle;
    }

    public boolean hasResizeWidth(Column<Cell> column) {
        return this.resizeColumns.size() > column.getColumn() && this.resizeColumns.get(column.getColumn()) != 0;
    }

    public int getMaxColumnWidth(Column<Cell> column) {
        if (this.hasResizeWidth(column)) {
            return this.resizeColumns.get(column.getColumn());
        }
        CellConfig config = lastConfigBean.getColumnConfigMap().get(column.getColumn());
        if (config != null && config.getMaxWidth() > 0) {
            return config.getMaxWidth();
        }
        return lastConfigBean.getMaxWidth();
    }

    private void setDataInMainThread(String json,
                                     final TableConfigBean configBean) {
        try {
            final HecomTableData tableData = HecomTableData.create(json,

                    new HecomFormat(), new CellDrawFormat(this, mLockHelper));
            tableData.setLimit(configBean);
            tableData.setOnItemClickListener(mClickHandler);
            // reLock会调用getTableData，注意这里的调用顺序
            mLockHelper.reLock(tableData);
            setTableData(tableData);
            mLockHelper.update();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void updateData(String data, int x, int y) {
        HecomTableData tableData = (HecomTableData) getTableData();
        Cell[][] newData = ArrayTableData.transformColumnArray(HecomTableData.initData(data));
        List<Column> list = new ArrayList<>(tableData.getColumns());
        Collections.sort(list, new Comparator<Column>() {
            @Override
            public int compare(Column o1, Column o2) {
                return o1.getColumn() - o2.getColumn();
            }
        });

        for (int i = 0; i < newData.length; i++) {
            int col = i + y;
            for (int j = 0; j < newData[i].length; j++) {
                int row = j + x;
                Cell newCell = newData[i][j];
                Column column = list.get(col);
                if (row < column.getDatas().size() && col < list.size()) {
                    Cell cell = (Cell) column.getDatas().get(row);
                    cell.merge(newCell);
                }
            }
        }
        notifyDataChanged();
    }

    public void spliceDataArray(SpliceItem[] spliceItems) {
        HecomTableData tableData = (HecomTableData) getTableData();
        synchronized (tableData) {
            for (int i = 0; i < spliceItems.length; ++i) {
                SpliceItem item = spliceItems[i];
                this.spliceData(item.getData(), item.getY(), item.getL());
            }
            notifyDataChanged();
        }
    }

    public void spliceData(String data, int y, int l) {
        HecomTableData tableData = (HecomTableData) getTableData();
        Cell[][] newData = ArrayTableData.transformColumnArray(HecomTableData.initData(data));

        List<Column> list = new ArrayList<>(tableData.getColumns());
        Collections.sort(list, new Comparator<Column>() {
            @Override
            public int compare(Column o1, Column o2) {
                return o1.getColumn() - o2.getColumn();
            }
        });
        if (newData == null) {
            newData = new Cell[list.size()][];
            for (int i = 0; i < newData.length; ++i) {
                newData[i] = new Cell[0];
            }
        }
        for (int i = 0; i < newData.length; i++) {
            Column column = list.get(i);
            ArrayList<Cell> datas = new ArrayList<>(column.getDatas());
            for (int j = 0; j < l; j++) {
                datas.remove(y);
            }
            for (int j = 0; j < newData[i].length; j++) {
                int row = j + y;
                Cell newCell = newData[i][j];
                datas.add(row, newCell);
            }
            column.setDatas(Arrays.asList(datas.toArray()));
        }
        int tmpL = newData.length > 0 ? newData[0].length : 0;
        tableData.getTableInfo().setLineSize(tableData.getLineSize() + tmpL - l);
        Cell[][] tmpCellArrays = new Cell[list.size()][];
        for (int i = 0; i < list.size(); ++i) {
            int tmpSize = list.get(i).getDatas().size();
            Cell[] tmpArr = new Cell[tmpSize];
            for (int j = 0; j < tmpSize; ++j) {
                tmpArr[j] = (Cell) list.get(i).getDatas().get(j);
            }
            tmpCellArrays[i] = tmpArr;
        }
        tmpCellArrays = ArrayTableData.transformColumnArray(tmpCellArrays);
        ArrayList<CellRange> mergeList = new ArrayList<>();
        HecomTableData.mergeTable(tmpCellArrays, mergeList);
        for (int i = 0; i < list.size(); i++) {
            Column<Cell> column = list.get(i);
            List<int[]> ranges = new ArrayList<>();
            for (CellRange cellRange : mergeList) {
                if (cellRange.getFirstCol() == i && cellRange.getFirstRow() != cellRange.getLastRow()) {
                    ranges.add(new int[]{cellRange.getFirstRow(), cellRange.getLastRow()});
                }
            }
            column.setRanges(ranges);
        }
        tableData.setUserCellRange(mergeList);
    }

    public void setData(final String json,
                        final TableConfigBean configBean) {
        if (json == null) {
            return;
        }
        try {
            //横竖屏切换
            if (!json.equals(lastJson)) {
                lastJson = json;
                lastConfigBean = configBean;
                Runnable runnable = new Runnable() {
                    @Override
                    public void run() {
                        setDataInMainThread(json, configBean);
                    }
                };
                getIsNotifying().set(true);
                getmExecutor().execute(runnable);
            } else if (configChanged(configBean)) {
                lastConfigBean = configBean;
                HecomTableData tableData = (HecomTableData) getTableData();
                tableData.setLimit(configBean);
                setTableData(tableData);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private boolean configChanged(TableConfigBean configBean) {
        return lastConfigBean == null
                || lastConfigBean.getMinWidth() != configBean.getMinWidth()
                || lastConfigBean.getMaxWidth() != configBean.getMaxWidth();
    }

    public LockHelper getLockHelper() {
        return mLockHelper;
    }

    public void setReplenishConfig(ReplenishColumnsWidthConfig replenishConfig) {
        this.replenishConfig = replenishConfig;
    }

    private ProgressStyle createDefProgressStyle() {
        ProgressStyle style = new ProgressStyle();
        style.setColors(new int[]{0x00FF00, 0x00FFFF});
        style.setHeight(DensityUtils.dp2px(getContext(), 18));
        style.setRadius(DensityUtils.dp2px(getContext(), 4));
        style.setMarginHorizontal(DensityUtils.dp2px(getContext(), 5));
        ProgressStyle.AntsLineStyle antsLineStyle = new ProgressStyle.AntsLineStyle();
        antsLineStyle.setColor(0xF9F9F9);
        antsLineStyle.setWidth(DensityUtils.dp2px(getContext(), 1));
        antsLineStyle.setDashPattern(new float[]{DensityUtils.dp2px(getContext(), 2),
                DensityUtils.dp2px(getContext(), 2)});
        style.setAntsLineStyle(antsLineStyle);
        return style;
    }

    public ProgressStyle getProgressStyle() {
        if (progressStyle == null) {
            progressStyle = createDefProgressStyle();
        }
        return progressStyle;
    }

    public void setProgressStyle(ProgressStyle progressStyle) {
        this.progressStyle = progressStyle;
    }
}
