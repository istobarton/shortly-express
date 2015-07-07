var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  initialize: function() {
    this.on('creating', function(model, attrs, options){
      var pass = this.get('password')
      this.set('password', bcrypt.hashSync(pass));
    })
  }
});

module.exports = User;



