# SPOO Client

The mapper can be used as OBJY storage for interacting with any SPOO platform. Just define your object wrappers and use the spoo mapper for storage.

# Documentation

Find the full documentation at [spoo.io](https://spoo.io).

# Usage

You need OBJY and this mapper.

## Browser

```html
<script src="https://cdn.jsdelivr.net/npm/objy/dist/browser.js">
<script src="https://cdn.jsdelivr.net/npm/objy-mapper-spoo/index.js">
```

## Node

```javascript
let OBJY = require('objy');
let SPOO = require('objy-mapper-spoo');

let spoo = new SPOO(OBJY)

OBJY.define({
	name: "object",
	pluralName: "objects",
	storage: spoo
})

// Login
spoo.connect({client: "spoo", url: "https://mydomain.com/api", username: "user", password: "***"}, () => {
	OBJY.objects({}).get(data => {
		console.log('data:', data)
	}, err => {
		console.log('err:', err)
	})
})
```