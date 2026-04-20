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
  LinkOutline,
  MailOutline,
  MenuOutline,
  MessageOutline,
  QqOutline,
  RightOutline,
  SearchOutline,
  SmileOutline,
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
  LinkOutline,
  MailOutline,
  MenuOutline,
  MessageOutline,
  QqOutline,
  RightOutline,
  SearchOutline,
  SmileOutline,
  UserOutline,
  WechatOutline,
  ZhihuOutline,
];

export function provideNzIcons(): EnvironmentProviders {
  return importProvidersFrom(NzIconModule.forRoot(icons));
}
