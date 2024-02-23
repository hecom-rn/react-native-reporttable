package com.hecom.reporttable.table;

import android.util.AttributeSet;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.hecom.reporttable.form.core.SmartTable;
import com.hecom.reporttable.form.listener.OnContentSizeChangeListener;
import com.hecom.reporttable.form.listener.OnTableChangeListener;
import com.hecom.reporttable.form.matrix.MatrixHelper;
import com.hecom.reporttable.form.utils.DensityUtils;
import com.hecom.reporttable.table.bean.TableConfigBean;
import com.hecom.reporttable.table.lock.LockHelper;

/**
 * 基于SmartTable定制的表格组件
 *
 * 针对SmartTable的设置代码尽量封装在这里
 *
 * Created by kevin.bai on 2024/2/2.
 * 由于目前很多外挂的数据都保存在ReportTableStore中，而ReportTableStore之前是单例的，
 * 导致如果出现多个表格实例会有串数据的情况，暂时将ReportTableStore放到表格中
 */
public class HecomTable extends SmartTable<String> {
    private ReportTableStore mStore;


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

    private void init(final ThemedReactContext context){
        this.mStore = new ReportTableStore(context, this);
        this.getConfig().setTableGridFormat(new HecomGridFormat(this));
        this.getConfig().setContentCellBackgroundFormat(new BackgroundFormat(this));

        this.setZoom(true, 2, 0.5f);

        final OnTableChangeListener listener = getMatrixHelper().getOnTableChangeListener();

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
       getMeasurer().setOnContentSizeChangeListener(new OnContentSizeChangeListener() {
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
        });
    }

    public LockHelper getLockHelper() {
        return mStore.mLockHelper;
    }

    public void setData(String json, TableConfigBean configBean) {
        mStore.setReportTableData(json, configBean);
    }
}
