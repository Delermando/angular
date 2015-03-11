# TODOs

1. change shadow DOM emulation to not use directives nor injectors,
   but special case it in the compiler
2. add missing functionality to the render folders

* change original ProtoViews, Views, ViewContainer to include a direct reference
  for a RenderView, RenderProtoView, RenderViewContainer
* add event handling to render layer
* remove direct references in `ProtoView`, `View`, `ViewContainer` to their `Render...`
  partner, add ids to them and do all operations via the `Renderer`


* ViewPool needs to know which views are still in use by Animations
  on the renderer side -> need an event for this...

* Separate ProtoView:
  - ProtoViewBuilder
  - ProtoView (data structure)
  - ViewFactory

