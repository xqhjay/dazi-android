// 字集管理：加载内置字集，按字频排序
import top0 from "@/data/top0-500.json";
import top501 from "@/data/top501-1000.json";
import top1001 from "@/data/top1001-1500.json";

export interface CharsetFile {
  title: string;
  words: string[];
  wordsPerGroup: number;
}

export interface Charset extends CharsetFile {
  id: string;
}

// 内置三套字集，按字频排序
export const CHARSETS: Charset[] = [
  { id: "top0-500", ...top0 },
  { id: "top501-1000", ...top501 },
  { id: "top1001-1500", ...top1001 },
];

export function getCharset(id: string): Charset | undefined {
  return CHARSETS.find((c) => c.id === id);
}

export const DEFAULT_CHARSET_ID = "top0-500";
