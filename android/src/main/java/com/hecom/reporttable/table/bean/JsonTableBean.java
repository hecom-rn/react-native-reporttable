package com.hecom.reporttable.table.bean;

public class JsonTableBean {
    /*非优化场景 通过getter setter访问*/
    public int keyIndex;
    public String title;
    public String backgroundColor;
    public Integer fontSize = 0;
    public String textColor;
    public Integer textAlignment;  // 0左 1中 2右  default 0
    public Icon icon;
    public Boolean isOverstriking = null;

    public Boolean isForbidden = null; //斜线
    public int textPaddingHorizontal;
    public int classificationLinePosition;

    public String classificationLineColor;

    public int trianglePosition;

    public String triangleColor;

    public int getTrianglePosition() {
        return trianglePosition;
    }

    public void setTrianglePosition(int trianglePosition) {
        this.trianglePosition = trianglePosition;
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

    public static class Icon {
        private Path path;
        private String width;
        private String height;
        public String name;

        public Path getPath() {
            return path;
        }

        public void setPath(Path path) {
            this.path = path;
        }

        public String getWidth() {
            return width;
        }

        public void setWidth(String width) {
            this.width = width;
        }

        public String getHeight() {
            return height;
        }

        public void setHeight(String height) {
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
