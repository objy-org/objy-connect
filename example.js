var Mapper = require('./index.js');
var OBJY = require('objy');

var m = new Mapper(OBJY)

OBJY.define({
	name: "object",
	pluralName: "objects",
	storage: m
})

m.connect({client: "spoo", url: "https://my.piles.cards/api", username: "admin", password: "__..--12345"}, () => {
	console.log('connected');
	/*OBJY.object({name:"22"}).add(() => {

	})*/

	OBJY.object("62a070638fb0b441b460180c").get(data => {
		console.log('data:', data)

		data.addProperty('sgag', 2);
		console.log(OBJY.handlerSequence)
	}, err => {
		console.log('err:', err)
	})
})


