var Mapper = require('./index.js');
var OBJY = require('objy');

var m = new Mapper(OBJY);


OBJY.define({
	name: "object",
	pluralName: "objects",
	storage: m
})

m.connect({client: "spoo", url: "https://my.piles.cards/api", username: "admin", password: "__..--12345"}, () => {
	console.log('connected');
	OBJY.object({name:"22"}).add(() => {

	})
})


