package com.hecom.reporttable.table.bean;

import android.graphics.Color;

import com.hecom.reporttable.RNReportTableManager;
import com.hecom.reporttable.table.deserializer.ItemCommonStyleConfigDeserializer;

/**
 * 表格单元格通用配置 Description : Created on 2022/11/25.
 *
 * {@link RNReportTableManager}中setData函数处理该类的反序列化时，使用了特殊的反序列化器， 后续添加属性时需要同步修改反序列化器
 *
 * @see ItemCommonStyleConfigDeserializer
 */
public class ItemCommonStyleConfig {
    public static final String DEFAULT_BACKGROUND_COLOR = "#FFFFFF";
    public static final String DEFALUT_TEXT_COLOR = "#222222";
    public String backgroundColor = DEFAULT_BACKGROUND_COLOR;
    public String textColor = DEFALUT_TEXT_COLOR;
    public int fontSize = 14;
    public int textPaddingHorizontal = 12;
    public int textAlignment = 0;
    public boolean isOverstriking = false;
    public int splitLineColor = Color.parseColor("#e8e8e8"); // default #e8e8e8
    public int classificationLineColor = Color.parseColor("#9cb3c8"); // default #9cb3c8


    public int getSplitLineColor() {
        return splitLineColor;
    }

    public void setSplitLineColor(int splitLineColor) {
        this.splitLineColor = splitLineColor;
    }

    public int getClassificationLineColor() {
        return classificationLineColor;
    }

    public void setClassificationLineColor(int classificationLineColor) {
        this.classificationLineColor = classificationLineColor;
    }


    public String getBackgroundColor() {
        return backgroundColor;
    }

    public void setBackgroundColor(String backgroundColor) {
        this.backgroundColor = backgroundColor;
    }

    public String getTextColor() {
        return textColor;
    }

    public void setTextColor(String textColor) {
        this.textColor = textColor;
    }

    public int getFontSize() {
        return fontSize;
    }

    public void setFontSize(int fontSize) {
        this.fontSize = fontSize;
    }

    public int getTextPaddingHorizontal() {
        return textPaddingHorizontal;
    }

    public void setTextPaddingHorizontal(int textPaddingHorizontal) {
        this.textPaddingHorizontal = textPaddingHorizontal;
    }

    public int getTextAlignment() {
        return textAlignment;
    }

    public void setTextAlignment(int textAlignment) {
        this.textAlignment = textAlignment;
    }

    public boolean isOverstriking() {
        return isOverstriking;
    }

    public void setOverstriking(boolean overstriking) {
        isOverstriking = overstriking;
    }
}
