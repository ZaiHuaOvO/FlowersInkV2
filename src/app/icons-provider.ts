import { EnvironmentProviders, importProvidersFrom } from '@angular/core';
import {
  ArrowUpOutline,
  BulbOutline,
  CarOutline,
  CloudOutline,
  EditOutline,
  EyeOutline,
  GithubOutline,
  HeartOutline,
  HomeOutline,
  InfoCircleOutline,
  LinkOutline,
  MailOutline,
  MenuOutline,
  MessageOutline,
  NotificationOutline,
  QqOutline,
  RightOutline,
  SearchOutline,
  SmileOutline,
  ToolOutline,
  UserOutline,
  WechatOutline,
  ZhihuOutline,
} from '@ant-design/icons-angular/icons';
import { IconDefinition } from '@ant-design/icons-angular';
import { NzIconModule } from 'ng-zorro-antd/icon';

const icons: IconDefinition[] = [
  ArrowUpOutline,
  BulbOutline,
  CarOutline,
  CloudOutline,
  EditOutline,
  EyeOutline,
  GithubOutline,
  HeartOutline,
  HomeOutline,
  InfoCircleOutline,
  LinkOutline,
  MailOutline,
  MenuOutline,
  MessageOutline,
  NotificationOutline,
  QqOutline,
  RightOutline,
  SearchOutline,
  SmileOutline,
  ToolOutline,
  UserOutline,
  WechatOutline,
  ZhihuOutline,
];

export function provideNzIcons(): EnvironmentProviders {
  return importProvidersFrom(NzIconModule.forRoot(icons));
}
