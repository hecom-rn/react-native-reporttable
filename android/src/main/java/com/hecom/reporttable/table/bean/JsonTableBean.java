package com.hecom.reporttable.table.bean;

import java.util.ArrayList;

public class JsonTableBean {
    /*非优化场景 通过getter setter访问*/
    public int keyIndex;
    public String title;
    public ArrayList<RichText> richText;
    public String backgroundColor;
    public Integer fontSize = 0;
    public String textColor;
    public Integer textAlignment;  // 0左 1中 2右  default 0
    public Icon icon;
    public Boolean isOverstriking = false;

    public Boolean isForbidden = false; //斜线
    public int textPaddingHorizontal;
    public int classificationLinePosition;

    public String classificationLineColor;

    public int trianglePosition;

    public String triangleColor;

    public String asteriskColor; //必填

    public Boolean strikethrough = null; //删除线

    public ExtraTextConfig extraText; // 后缀标签

    public Boolean getStrikethrough() {
        return strikethrough;
    }

    public void setStrikethrough(Boolean strikethrough) {
        this.strikethrough = strikethrough;
    }

    public int getTrianglePosition() {
        return trianglePosition;
    }

    public void setTrianglePosition(int trianglePosition) {
        this.trianglePosition = trianglePosition;
    }

    public String getAsteriskColor() {
        return asteriskColor;
    }

    public void setAsteriskColor(String asteriskColor) {
        this.asteriskColor = asteriskColor;
    }

    public String getTriangleColor() {
        return triangleColor;
    }

    public void setTriangleColor(String triangleColor) {
        this.triangleColor = triangleColor;
    }

    public Boolean getForbidden() {
        return isForbidden;
    }

    public void setForbidden(Boolean forbidden) {
        isForbidden = forbidden;
    }

    public String getClassificationLineColor() {
        return classificationLineColor;
    }

    public void setClassificationLineColor(String classificationLineColor) {
        this.classificationLineColor = classificationLineColor;
    }

    public int getTextPaddingHorizontal() {
        return textPaddingHorizontal;
    }

    public void setTextPaddingHorizontal(int textPaddingHorizontal) {
        this.textPaddingHorizontal = textPaddingHorizontal;
    }

    public int getClassificationLinePosition() {
        return classificationLinePosition;
    }

    public void setClassificationLinePosition(int classificationLinePosition) {
        this.classificationLinePosition = classificationLinePosition;
    }

    public JsonTableBean() {
    }

    public JsonTableBean(String title) {
        this.title = title;
    }

    public void setFontSize(Integer fontSize) {
        this.fontSize = fontSize;
    }

    public Integer getFontSize() {
        return fontSize;
    }

    public void setTextAlignment(Integer textAlignment) {
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

    public Icon getIcon() {
        return icon;
    }

    public void setIcon(Icon icon) {
        this.icon = icon;
    }

    public Integer getTextAlignment() {
        return this.textAlignment;
    }

    public Boolean getOverstriking() {
        return isOverstriking;
    }

    public void setOverstriking(Boolean overstriking) {
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
        private Path path;
        private int width;
        private int height;
        public String name;

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
