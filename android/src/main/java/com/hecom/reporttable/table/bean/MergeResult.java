package com.hecom.reporttable.table.bean;

/**
 * Description :
 * Created on 2022/11/28.
 */
public class MergeResult {
   public   String[][] data;
   public   String[] maxValues4Column;
   public   String[] maxValues4Row;

   public MergeResult(String[][] data, String[] maxValues4Column, String[] maxValues4Row) {
      this.data = data;
      this.maxValues4Column = maxValues4Column;
      this.maxValues4Row = maxValues4Row;
   }
}
