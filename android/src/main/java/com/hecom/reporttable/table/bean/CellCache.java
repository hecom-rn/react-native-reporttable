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
}
