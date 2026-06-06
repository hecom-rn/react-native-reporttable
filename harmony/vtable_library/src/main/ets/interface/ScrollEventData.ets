// 滚动事件接口
export interface Trusted {
  isTrusted?: boolean;
}

export interface ScrollEventData {
  scrollTop: number;
  scrollLeft: number;
  scrollHeight: number;
  scrollWidth: number;
  viewHeight: number;
  viewWidth: number;
  scrollDirection?: string;
  scrollRatioY?: number;
  dy?: number;
  event?: Trusted;
}