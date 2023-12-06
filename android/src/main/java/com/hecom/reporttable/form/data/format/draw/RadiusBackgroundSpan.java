package com.hecom.reporttable.form.data.format.draw;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.text.style.ReplacementSpan;

/**
 * Description :
 * Created on 2023/11/30.
 */
public class RadiusBackgroundSpan  extends ReplacementSpan {
   private final int foregroundColor;
   private final int height;
   private final int fontSize;
   private int backgroundColor;
   private int cornerRadius;
   private int width;

   public RadiusBackgroundSpan(int backgroundColor, int foregroundColor, int cornerRadius, int width, int height,  int fontSize) {
      this.backgroundColor = backgroundColor;
      this.foregroundColor = foregroundColor;
      this.cornerRadius = cornerRadius;
      this.width = width;
      this.height = height;
      this.fontSize = fontSize;
   }

   @Override
   public int getSize(Paint paint, CharSequence text, int start, int end, Paint.FontMetricsInt fm) {
//      return Math.round(paint.measureText(text, start, end));
      return this.width;
   }

   @Override
   public void draw(Canvas canvas, CharSequence text, int start, int end, float x, int top, int y, int bottom, Paint paint) {
      // 保存原始画笔颜色和样式
      int originalColor = paint.getColor();
      Paint.Style originalStyle = paint.getStyle();

      // 绘制圆角矩形背景
      paint.setColor(backgroundColor);
      paint.setStyle(Paint.Style.FILL);
//      RectF rect = new RectF(x, top, x + paint.measureText(text, start, end), bottom);
      RectF rect = new RectF(x, top, x + this.width, bottom);
      canvas.drawRoundRect(rect, cornerRadius, cornerRadius, paint);

      // 绘制文字
      paint.setColor(foregroundColor);
      paint.setTextSize(10);
      canvas.drawText(text, start, end, x, y, paint);

      paint.setColor(originalColor);
      paint.setStyle(originalStyle);
   }
}