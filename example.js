var Mapper = require('./index.js');
var OBJY = require('objy');

var m = new Mapper(OBJY);

m.connect({workspace: "spoo"})