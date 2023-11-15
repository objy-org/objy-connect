var CONNECT = require('./index.js');
var OBJY = require('objy');

var spoo = new CONNECT(OBJY)

OBJY.define({
	name: "object",
	pluralName: "objects",
	storage: spoo
})

spoo.connect({client: "spoo", url: "https://my.piles.cards/api"});

spoo.login({username: "admin", password: "Test123!"}, () => {
	console.log('connected');
	/*OBJY.object({name:"22"}).add(() => {

	})*/

	OBJY.objects({}).get(data => {
		console.log('data:', data)

		


	}, err => {
		console.log('err:', err)
	})
})