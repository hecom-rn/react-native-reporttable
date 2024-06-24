package com.hecom.reporttable.table.bean;

/**
 * Description :
 * Created on 2023/11/29.
 */
public class ExtraText {
    public Style backgroundStyle;
    public Style style;
    public String text;
    public boolean isLeft;

    public ExtraText() {
    }

    public ExtraText(Style backgroundStyle, Style style, String text, boolean isLeft) {
      this.backgroundStyle = backgroundStyle;
      this.style = style;
      this.text = text;
      this.isLeft = isLeft;
   }

    public static class Style {
        public int color;
        public int  width;
        public int  height;
        public int  fontSize;

        public int radius;

        public Style() {
        }

        public Style(int color, int width, int height, int fontSize, int radius) {
            this.color = color;
            this.width = width;
            this.height = height;
            this.fontSize = fontSize;
            this.radius = radius;
        }
    }
}
