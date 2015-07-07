Shortly.Router = Backbone.Router.extend({
  initialize: function(options){
    this.$el = options.el;
  },

  routes: {
    '':       'index',
    'create': 'create', 
    'logout': 'logout'
  },

  swapView: function(view){
    this.$el.html(view.render().el);
  },

  index: function(){
    var links = new Shortly.Links();
    var linksView = new Shortly.LinksView({ collection: links });
    this.swapView(linksView);
  },

  logout: function(){
    //Force a GET request
    //Currently, the link navigates to "/logout" in the address bar
      //but there is not GET request generated. 
      //The GET request to that endpoint is handled properly in the server
        //and logs the user out.
  },

  create: function(){
    console.log("Router redirect to createLinkView")
    this.swapView(new Shortly.createLinkView());
  }
});
