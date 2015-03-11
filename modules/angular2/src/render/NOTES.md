No view pool on render side
-> the view pool on application side needs
   to decide when a view is really not needed
   any more (i.e. not application nor the pool needs it)
   and then call renderer.destroyView...

