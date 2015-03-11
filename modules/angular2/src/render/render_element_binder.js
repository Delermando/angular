export class RenderElementBinder {
  textNodeIndices:List<int>;
  nestedProtoView:RenderProtoView;

  constructor() {
    // updated later when text nodes are bound
    this.textNodeIndices = null;
  }
}
