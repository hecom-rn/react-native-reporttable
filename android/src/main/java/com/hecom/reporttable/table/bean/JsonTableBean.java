package com.hecom.reporttable.table.bean;

public class JsonTableBean {
    private int keyIndex;
    private String title;
    private String backgroundColor;
    private int fontSize = 0;
    private JsonTableBean jsonTableBean;

    public JsonTableBean getJsonTableBean() {
        return jsonTableBean;
    }

    public void setJsonTableBean(JsonTableBean jsonTableBean) {
        this.jsonTableBean = jsonTableBean;
    }

    public JsonTableBean(){}

    public JsonTableBean(String title) {
        this.title = title;
    }

    public JsonTableBean(int keyIndex, String title, String backgroundColor, int fontSize, String textColor) {
        this.keyIndex = keyIndex;
        this.title = title;
        this.backgroundColor = backgroundColor;
        this.fontSize = fontSize;
        this.textColor = textColor;
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

    public int getFontSize() {
        return fontSize;
    }

    public void setFontSize(int fontSize) {
        this.fontSize = fontSize;
    }

    public String getTextColor() {
        return textColor;
    }

    public void setTextColor(String textColor) {
        this.textColor = textColor;
    }

    private String textColor;

    private boolean isLeft;

    public boolean isLeft() {
        return isLeft;
    }

    public void setLeft(boolean left) {
        isLeft = left;
    }

    public boolean isCenter() {
        return isCenter;
    }

    public void setCenter(boolean center) {
        isCenter = center;
    }

    private boolean isCenter;

    public Icon getIcon() {
        return icon;
    }

    public void setIcon(Icon icon) {
        this.icon = icon;
    }

    private Icon icon;

    public class Icon{
        private Path path;
        private String width;
        private String height;
        private String name;
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

    public class Path {
        private String height;
        private String scale;
        private String uri;
        private String width;

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

        private boolean __packager_asset;
    }
}
