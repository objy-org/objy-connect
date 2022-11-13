# OBJY Connect Client

The mapper can be used as OBJY storage for interacting with any OBJY Connect platform. Just define your object wrappers and use the connect mapper for storage.

# Documentation

Find the full documentation at [objy.xyz](https://objy.xyz).

# Usage

You need OBJY and this mapper.

## Browser

```html
<script src="https://cdn.jsdelivr.net/npm/objy/dist/browser.js" />
<script src="https://cdn.jsdelivr.net/npm/objy-connect/index.js" />
<script>
let remote = new CONNECT(OBJY)

OBJY.define({
	name: "object",
	pluralName: "objects",
	storage: remote
})

// Login
remote.connect({client: "myclient", url: "https://mydomain.com/api", username: "user", password: "***"}, () => {
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
npm i objy objy-connect --save
```

```javascript
let OBJY = require('objy');
let CONNECT = require('objy-connect');

let remote = new CONNECT(OBJY)

OBJY.define({
	name: "object",
	pluralName: "objects",
	storage: remote
})

// Login
remote.connect({client: "myclient", url: "https://mydomain.com/api", username: "user", password: "***"}, () => {
	OBJY.objects({}).get(data => {
		console.log('data:', data)
	}, err => {
		console.log('err:', err)
	})
})
```