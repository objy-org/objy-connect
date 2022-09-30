# SPOO Client

The mapper can be used as OBJY storage for interacting with any SPOO platform. Just define your object wrappers and use the spoo mapper for storage.

# Documentation

Find the full documentation at [spoo.io](https://spoo.io).

# Usage

You need OBJY and this mapper.

## Browser

```html
<script src="https://cdn.jsdelivr.net/npm/objy/dist/browser.js" />
<script src="https://cdn.jsdelivr.net/npm/spoo-client-js/index.js" />
<script>
let spoo = new SPOO(OBJY)

OBJY.define({
	name: "object",
	pluralName: "objects",
	storage: spoo
})

// Login
spoo.connect({client: "myclient", url: "https://mydomain.com/api", username: "user", password: "***"}, () => {
	OBJY.objects({}).get(data => {
		console.log('data:', data)
	}, err => {
		console.log('err:', err)
	})
})
</script>
```

## Node

```shell
npm i objy spoo-client-js --save
```

```javascript
let OBJY = require('objy');
let SPOO = require('spoo-client-js');

let spoo = new SPOO(OBJY)

OBJY.define({
	name: "object",
	pluralName: "objects",
	storage: spoo
})

// Login
spoo.connect({client: "myclient", url: "https://mydomain.com/api", username: "user", password: "***"}, () => {
	OBJY.objects({}).get(data => {
		console.log('data:', data)
	}, err => {
		console.log('err:', err)
	})
})
```