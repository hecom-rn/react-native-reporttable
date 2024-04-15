package com.hecom.reporttable.table.bean;

/**
 * 单元格缓存
 * <p>
 * 缓存单元格的宽高和设置好span的文本
 * <p>
 *
 */
public class CellCache {
    private final CharSequence text;
    private final float width;
    private final int height;

    /**
     * 绘制宽度
     * 由于合并单元格，实际绘制的宽度与测量宽度不一定一致，单独记录绘制宽度
     */
    private float drawWidth;

    public CellCache(CharSequence text, float width, int height) {
        this.text = text;
        this.width = width;
        this.height = height;
    }

    public int getHeight() {
        return height;
    }

    public CharSequence getText() {
        return text;
    }

    public float getWidth() {
        return width;
    }

    public float getDrawWidth() {
        return drawWidth;
    }

    public void setDrawWidth(float drawWidth) {
        this.drawWidth = drawWidth;
    }
}
