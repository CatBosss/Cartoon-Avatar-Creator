
export enum AvatarStyle {
  PIXAR = 'Pixar 风格',
  VECTOR = '2D 矢量矢量风',
  ANIME = '二次元动漫',
  SKETCH = '手绘素描',
  COMIC = '美漫风格',
  CYBERPUNK = '赛博朋克风',
  GOTHIC = '哥特幻想风',
  CLAY = '粘土定格动画'
}

export interface HistoryItem {
  id: string;
  originalImage: string;
  generatedAvatar: string;
  style: AvatarStyle;
  timestamp: number;
}

export interface AppState {
  originalImage: string | null;
  generatedAvatar: string | null;
  isGenerating: boolean;
  style: AvatarStyle;
  error: string | null;
  history: HistoryItem[];
}
