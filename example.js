var SPOO = require('./index.js');
var OBJY = require('objy');

var spoo = new SPOO(OBJY)

OBJY.define({
	name: "object",
	pluralName: "objects",
	storage: spoo
})

spoo.connect({client: "spoo", url: "https://my.piles.cards/api", username: "admin", password: "__..--12345"}, () => {
	console.log('connected');
	/*OBJY.object({name:"22"}).add(() => {

	})*/

	OBJY.objects({}).get(data => {
		console.log('data:', data)

		data.setName('Thieme2').update();


	}, err => {
		console.log('err:', err)
	})
})