package com.hecom.reporttable.form.data.format.draw;

/**
 * Description :
 * Created on 2023/11/29.
 */
public class WrapTextResult {
   public  String text;
   float lastLineWidth;

   public WrapTextResult(String text, float lastLineWidth) {
      this.text = text;
      this.lastLineWidth = lastLineWidth;
   }
}
