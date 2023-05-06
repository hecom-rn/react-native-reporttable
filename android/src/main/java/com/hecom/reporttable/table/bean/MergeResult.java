package com.hecom.reporttable.table.bean;

/**
 * Description :
 * Created on 2022/11/28.
 */
public class MergeResult {
   public   String[][] data;
   public   TypicalCell[][] maxValues4Column; //每列存3个值，0位置存列标题单元格数据，1位置存字符串最长的单元格，2位置存改列带图标的单元格中字符串最长的单元格数据
   public   String[] maxValues4Row;

   public MergeResult(String[][] data, TypicalCell[][] maxValues4Column, String[] maxValues4Row) {
      this.data = data;
      this.maxValues4Column = maxValues4Column;
      this.maxValues4Row = maxValues4Row;
   }
}
