
export enum AvatarStyle {
  PIXAR = 'Pixar 风格',
  VECTOR = '2D 矢量矢量风',
  ANIME = '二次元动漫',
  SKETCH = '手绘素描',
  COMIC = '美漫风格'
}

export interface AppState {
  originalImage: string | null;
  generatedAvatar: string | null;
  isGenerating: boolean;
  style: AvatarStyle;
  error: string | null;
}
