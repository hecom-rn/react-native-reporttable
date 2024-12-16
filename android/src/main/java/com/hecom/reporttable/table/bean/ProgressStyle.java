package com.hecom.reporttable.table.bean;

import com.hecom.reporttable.form.core.TableConfig;

/**
 * Created by kevin.bai on 2024/11/18.
 */
public class ProgressStyle {
    private int[] colors; // 横向渐变
    private float height; // 高度，居中显示
    private float radius; // 圆角半径
    private float marginHorizontal; // 左右边距
    private float startRatio; // 开始比例
    private float endRatio; // 结束比例
    private AntsLineStyle antsLineStyle; // 蚂蚁线样式

    public static class AntsLineStyle {
        private int color = TableConfig.INVALID_COLOR; // 颜色
        private float width; // 宽度
        private float[] dashPattern; // 虚线样式
        private float ratio;// 位置比例

        public int getColor() {
            return color;
        }

        public void setColor(int color) {
            this.color = color;
        }

        public float getWidth() {
            return width;
        }

        public void setWidth(float width) {
            this.width = width;
        }

        public float[] getDashPattern() {
            return dashPattern;
        }

        public void setDashPattern(float[] dashPattern) {
            this.dashPattern = dashPattern;
        }

        public float getRatio() {
            return ratio;
        }

        public void setRatio(float ratio) {
            this.ratio = ratio;
        }
    }

    public int[] getColors() {
        return colors;
    }

    public void setColors(int[] colors) {
        this.colors = colors;
    }

    public float getHeight() {
        return height;
    }

    public void setHeight(float height) {
        this.height = height;
    }

    public float getRadius() {
        return radius;
    }

    public void setRadius(float radius) {
        this.radius = radius;
    }

    public float getMarginHorizontal() {
        return marginHorizontal;
    }

    public void setMarginHorizontal(float marginHorizontal) {
        this.marginHorizontal = marginHorizontal;
    }

    public float getStartRatio() {
        return startRatio;
    }

    public void setStartRatio(float startRatio) {
        this.startRatio = startRatio;
    }

    public float getEndRatio() {
        return endRatio;
    }

    public void setEndRatio(float endRatio) {
        this.endRatio = endRatio;
    }

    public AntsLineStyle getAntsLineStyle() {
        return antsLineStyle;
    }

    public void setAntsLineStyle(AntsLineStyle antsLineStyle) {
        this.antsLineStyle = antsLineStyle;
    }
}
