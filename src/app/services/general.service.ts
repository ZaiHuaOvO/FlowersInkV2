import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GeneralService {
  colors = [
    'pink',
    'red',
    'yellow',
    'orange',
    'cyan',
    'green',
    'blue',
    'purple',
    'geekblue',
    'magenta',
    'volcano',
    'gold',
    'lime',
  ];
  constructor() {}

  getTagList(dataArray: { tag: string }[]) {
    const tagCountMap: { [key: string]: number } = {};
    let lastColor: string | null = null;

    // 统计 tag 出现的次数
    dataArray.forEach((item) => {
      if (tagCountMap[item.tag]) {
        tagCountMap[item.tag]++;
      } else {
        tagCountMap[item.tag] = 1;
      }
    });

    // 生成 tagList 并附加 color 字段
    const tagList = Object.keys(tagCountMap).map((tag) => {
      const color = this.getRandomColor(lastColor);
      lastColor = color; // 更新上一次的颜色为当前选择的颜色
      return {
        tag: tag,
        count: tagCountMap[tag],
        color: color,
      };
    });

    tagList.unshift({
      tag: '全部',
      count: dataArray.length,
      color: '',
    });

    return tagList;
  }

  // 用来随机选择一个颜色，并避免连续重复的函数
  getRandomColor(lastColor: string | null): string {
    let newColor: string;
    do {
      newColor = this.colors[Math.floor(Math.random() * this.colors.length)];
    } while (newColor === lastColor); // 确保颜色不会连续重复
    return newColor;
  }
}
