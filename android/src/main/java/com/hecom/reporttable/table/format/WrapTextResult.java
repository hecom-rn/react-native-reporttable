package com.hecom.reporttable.table.format;

/**
 * Description :
 * Created on 2023/11/29.
 */
public class WrapTextResult {
   public  String text;
   public float lastLineWidth;

   public WrapTextResult(String text, float lastLineWidth) {
      this.text = text;
      this.lastLineWidth = lastLineWidth;
   }
}
