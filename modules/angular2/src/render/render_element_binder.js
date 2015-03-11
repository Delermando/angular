export class RenderElementBinder {
  textNodeIndices:List<int>;
  nestedProtoView:RenderProtoView;

  constructor(nestedProtoView:RenderProtoView) {
    // updated later when text nodes are bound
    this.textNodeIndices = null;
  }
}
