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

}
