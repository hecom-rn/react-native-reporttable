package com.hecom.reporttable.form.listener;

/**
 * Created by kevin.bai on 2024/1/2.
 */
public interface OnMeasureListener {
    void onContentSizeChanged(float width, float height);

    void onDidLayout();
}
