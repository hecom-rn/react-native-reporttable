package com.hecom.reporttable.table.bean;

/**
 * Description :
 * Created on 2023/11/29.
 */
public class ExtraTextConfig {
    public Style backgroundStyle;
    public Style style;
    public String text;
    public boolean isLeft;

    public ExtraTextConfig() {
    }

    public ExtraTextConfig(Style backgroundStyle, Style style, String text, boolean isLeft) {
      this.backgroundStyle = backgroundStyle;
      this.style = style;
      this.text = text;
      this.isLeft = isLeft;
   }
}
