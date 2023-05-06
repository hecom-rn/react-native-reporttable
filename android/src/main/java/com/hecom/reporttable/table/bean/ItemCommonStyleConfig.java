package com.hecom.reporttable.table.bean;

/**
 * Description :
 * Created on 2022/11/25.
 */
public class ItemCommonStyleConfig {
   public static final String DEFAULT_BACKGROUND_COLOR="#FFFFFF";
   public static final  String DEFALUT_TEXT_COLOR="#222222";
   public String backgroundColor= DEFAULT_BACKGROUND_COLOR;
   public String textColor= DEFALUT_TEXT_COLOR;
   public int fontSize = 14;
   public int textPaddingHorizontal = 12;
   public int textAlignment =0 ;
   public boolean isOverstriking = false;

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

   public int getFontSize() {
      return fontSize;
   }

   public void setFontSize(int fontSize) {
      this.fontSize = fontSize;
   }

   public int getTextPaddingHorizontal() {
      return textPaddingHorizontal;
   }

   public void setTextPaddingHorizontal(int textPaddingHorizontal) {
      this.textPaddingHorizontal = textPaddingHorizontal;
   }

   public int getTextAlignment() {
      return textAlignment;
   }

   public void setTextAlignment(int textAlignment) {
      this.textAlignment = textAlignment;
   }

   public boolean isOverstriking() {
      return isOverstriking;
   }

   public void setOverstriking(boolean overstriking) {
      isOverstriking = overstriking;
   }
}
