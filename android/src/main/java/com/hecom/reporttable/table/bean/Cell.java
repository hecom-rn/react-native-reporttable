package com.hecom.reporttable.table.bean;

import android.graphics.Paint;

import com.hecom.reporttable.R;
import com.hecom.reporttable.form.core.TableConfig;

import java.util.ArrayList;

/**
 * 单元格数据
 */
public class Cell {
    /*非优化场景 通过getter setter访问*/
    private int keyIndex;
    private String title;
    private ArrayList<RichText> richText;
    private int backgroundColor = TableConfig.INVALID_COLOR;
    private float fontSize = 0;
    private int textColor = TableConfig.INVALID_COLOR;
    private Paint.Align textAlignment;
    private Icon icon;
    private boolean isOverstriking = false;

    private boolean isForbidden = false; //斜线
    private int classificationLinePosition;

    private int classificationLineColor = TableConfig.INVALID_COLOR;

    private int boxLineColor = TableConfig.INVALID_COLOR;

    private boolean strikethrough = false; //删除线

    private ExtraText extraText; // 后缀标签

    public ArrayList<RichText> getRichText() {
        return richText;
    }

    private CellCache cache;

    public CellCache getCache() {
        return cache;
    }

    public void setCache(CellCache cache) {
        this.cache = cache;
    }

    public void merge(Cell newCell) {
        if (newCell == null) {
            return;
        }
        // keyIndex涉及合并单元格，不能合并
        this.title = newCell.getTitle();
        this.richText = newCell.getRichText();
        this.backgroundColor = newCell.getBackgroundColor();
        this.fontSize = newCell.getFontSize();
        this.textColor = newCell.getTextColor();
        this.textAlignment = newCell.getTextAlignment();
        this.icon = newCell.getIcon();
        this.isOverstriking = newCell.isOverstriking();
        this.isForbidden = newCell.isForbidden();
        this.classificationLinePosition = newCell.getClassificationLinePosition();
        this.classificationLineColor = newCell.getClassificationLineColor();
        this.boxLineColor = newCell.getBoxLineColor();
        this.strikethrough = newCell.isStrikethrough();
        this.extraText = newCell.getExtraText();
        cache = null;
    }

    public void setRichText(ArrayList<RichText> richText) {
        this.richText = richText;
    }

    public void setForbidden(boolean forbidden) {
        isForbidden = forbidden;
    }

    public ExtraText getExtraText() {
        return extraText;
    }

    public void setExtraText(ExtraText extraText) {
        this.extraText = extraText;
    }

    public boolean isStrikethrough() {
        return strikethrough;
    }

    public void setStrikethrough(boolean strikethrough) {
        this.strikethrough = strikethrough;
    }

    public int getBoxLineColor() {
        return boxLineColor;
    }

    public void setBoxLineColor(int boxLineColor) {
        this.boxLineColor = boxLineColor;
    }

    public boolean isForbidden() {
        return isForbidden;
    }

    public void setForbidden(Boolean forbidden) {
        isForbidden = forbidden;
    }

    public int getClassificationLineColor() {
        return classificationLineColor;
    }

    public void setClassificationLineColor(int classificationLineColor) {
        this.classificationLineColor = classificationLineColor;
    }

    public int getClassificationLinePosition() {
        return classificationLinePosition;
    }

    public void setClassificationLinePosition(int classificationLinePosition) {
        this.classificationLinePosition = classificationLinePosition;
    }

    public void setFontSize(float fontSize) {
        this.fontSize = fontSize;
    }

    public float getFontSize() {
        return fontSize;
    }

    public void setTextAlignment(Paint.Align textAlignment) {
        this.textAlignment = textAlignment;
    }

    public int getKeyIndex() {
        return keyIndex;
    }

    public void setKeyIndex(int keyIndex) {
        this.keyIndex = keyIndex;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public int getBackgroundColor() {
        return backgroundColor;
    }

    public void setBackgroundColor(int backgroundColor) {
        this.backgroundColor = backgroundColor;
    }

    public int getTextColor() {
        return textColor;
    }

    public void setTextColor(int textColor) {
        this.textColor = textColor;
    }

    public Icon getIcon() {
        return icon;
    }

    public void setIcon(Icon icon) {
        this.icon = icon;
    }

    public Paint.Align getTextAlignment() {
        return this.textAlignment;
    }

    public boolean isOverstriking() {
        return isOverstriking;
    }

    public void setOverstriking(boolean overstriking) {
        isOverstriking = overstriking;
    }

    public static class RichText {
        private String text;
        private RichTextStyle style;

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }

        public RichTextStyle getStyle() {
            return style;
        }

        public void setStyle(RichTextStyle style) {
            this.style = style;
        }
    }

    public static class RichTextStyle {
        private String textColor;
        private String backgroundColor;

        private float fontSize = -1;

        private float borderRadius;

        private String borderColor;

        private float borderWidth = -1;

        public Boolean isOverstriking = null;

        private Boolean strikethrough = null;

        public Boolean getStrikethrough() {
            return strikethrough;
        }

        public void setStrikethrough(Boolean strikethrough) {
            this.strikethrough = strikethrough;
        }

        public Boolean getOverstriking() {
            return isOverstriking;
        }

        public void setOverstriking(Boolean overstriking) {
            isOverstriking = overstriking;
        }

        public String getTextColor() {
            return textColor;
        }

        public void setTextColor(String textColor) {
            this.textColor = textColor;
        }

        public String getBackgroundColor() {
            return backgroundColor;
        }

        public void setBackgroundColor(String backgroundColor) {
            this.backgroundColor = backgroundColor;
        }

        public float getFontSize() {
            return fontSize;
        }

        public void setFontSize(float fontSize) {
            this.fontSize = fontSize;
        }

        public float getBorderRadius() {
            return borderRadius;
        }

        public void setBorderRadius(float borderRadius) {
            this.borderRadius = borderRadius;
        }

        public String getBorderColor() {
            return borderColor;
        }

        public void setBorderColor(String borderColor) {
            this.borderColor = borderColor;
        }

        public float getBorderWidth() {
            return borderWidth;
        }

        public void setBorderWidth(float borderWidth) {
            this.borderWidth = borderWidth;
        }
    }

    public static class Icon {
        public static final int LEFT = 0;
        public static final int TOP = 1;
        public static final int RIGHT = 2;
        public static final int BOTTOM = 3;

        private Path path;
        private int width;
        private int height;
        public String name;

        private int direction = -1;
        private int resourceId = -1;

        public int getDirection() {
            return direction;
        }

        public void setDirection(int direction) {
            this.direction = direction;
        }

        public int getResourceId() {
            return resourceId;
        }

        public void setResourceId(int resourceId) {
            this.resourceId = resourceId;
        }

        public Path getPath() {
            return path;
        }

        public void setPath(Path path) {
            this.path = path;
        }

        public int getWidth() {
            return width;
        }

        public void setWidth(int width) {
            this.width = width;
        }

        public int getHeight() {
            return height;
        }

        public void setHeight(int height) {
            this.height = height;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public void update() {
            if (resourceId == -1) {
                if ("normal".equals(name)) {
                    this.resourceId = R.mipmap.normal;
                    this.direction = RIGHT;
                } else if ("up".equals(name)) {
                    this.resourceId = R.mipmap.up;
                    this.direction = RIGHT;
                } else if ("down".equals(name)) {
                    this.resourceId = R.mipmap.down;
                    this.direction = RIGHT;
                } else if ("dot_new".equals(name)) {
                    this.resourceId = R.mipmap.dot_new;
                    this.direction = LEFT;
                } else if ("dot_edit".equals(name)) {
                    this.resourceId = R.mipmap.dot_edit;
                    this.direction = LEFT;
                } else if ("dot_delete".equals(name)) {
                    this.resourceId = R.mipmap.dot_delete;
                    this.direction = LEFT;
                } else if ("dot_readonly".equals(name)) {
                    this.resourceId = R.mipmap.dot_readonly;
                    this.direction = LEFT;
                } else if ("dot_white".equals(name)) {
                    this.resourceId = R.mipmap.dot_white;
                    this.direction = LEFT;
                } else if ("dot_select".equals(name)) {
                    this.resourceId = R.mipmap.dot_select;
                    this.direction = LEFT;
                } else if ("portal_icon".equals(name)) {
                    this.resourceId = R.mipmap.portal_icon;
                    this.direction = LEFT;
                } else if ("trash".equals(name)) {
                    this.resourceId = R.mipmap.trash;
                    this.direction = RIGHT;
                } else if ("revert".equals(name)) {
                    this.resourceId = R.mipmap.revert;
                    this.direction = RIGHT;
                } else if ("copy".equals(name)) {
                    this.resourceId = R.mipmap.copy;
                    this.direction = RIGHT;
                } else if ("edit".equals(name)) {
                    this.resourceId = R.mipmap.edit;
                    this.direction = RIGHT;
                } else if ("selected".equals(name)) {
                    this.resourceId = R.mipmap.selected;
                    this.direction = RIGHT;
                } else if ("unselected".equals(name)) {
                    this.resourceId = R.mipmap.unselected;
                    this.direction = RIGHT;
                } else if ("unselected_disable".equals(name)) {
                    this.resourceId = R.mipmap.unselected_disable;
                    this.direction = RIGHT;
                } else if ("copy_disable".equals(name)) {
                    this.resourceId = R.mipmap.copy_disable;
                    this.direction = RIGHT;
                } else if ("edit_disable".equals(name)) {
                    this.resourceId = R.mipmap.edit_disable;
                    this.direction = RIGHT;
                } else if ("trash_disable".equals(name)) {
                    this.resourceId = R.mipmap.trash_disable;
                    this.direction = RIGHT;
                } else if ("unSelectIcon".equals(name)) {
                    this.resourceId = R.mipmap.checkbox;
                    this.direction = RIGHT;
                } else if ("selectedIcon".equals(name)) {
                    this.resourceId = R.mipmap.checkbox_hl;
                    this.direction = RIGHT;
                }
            }
        }
    }

    public static class Path {
        private String height;
        private String scale;
        private String uri;
        private String width;
        private boolean __packager_asset;

        public String getHeight() {
            return height;
        }

        public void setHeight(String height) {
            this.height = height;
        }

        public String getScale() {
            return scale;
        }

        public void setScale(String scale) {
            this.scale = scale;
        }

        public String getUri() {
            return uri;
        }

        public void setUri(String uri) {
            this.uri = uri;
        }

        public String getWidth() {
            return width;
        }

        public void setWidth(String width) {
            this.width = width;
        }

        public boolean is__packager_asset() {
            return __packager_asset;
        }

        public void set__packager_asset(boolean __packager_asset) {
            this.__packager_asset = __packager_asset;
        }
    }
}
