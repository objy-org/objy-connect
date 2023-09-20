# SPOO Connect

The mapper can be used as OBJY storage for interacting with any SPOO-based platform. Just define your object wrappers and use the connect mapper for storage.

# Documentation

Find the full documentation at [objy.xyz](https://objy.xyz).

# Install

## Browser

```html
<script src="https://cdn.jsdelivr.net/npm/objy/dist/browser.js" />
<script src="https://cdn.jsdelivr.net/npm/objy-connect/index.js" />
```

## Node

```shell
npm i objy objy-connect --save
```

# Usage

With ES6:
```javascript
import CONNECT from "objy-connect";
```

With CommonJS:
```javascript
var CONNECT = require('objy-connect')
```

With `<script src="...">`, the `CONNECT` object will be available automatically.


```javascript
let remote = new CONNECT(OBJY);
remote.connect({client: "myclient", url: "https://mydomain.com/api"})

OBJY.define({
	name: "object",
	pluralName: "objects",
	storage: new CONNECT(OBJY).connect({client: "myclient", url: "https://mydomain.com/api"}),
	templateFamily: null // important
});

// Login
remote.login({username: "user", password: "***"}, () => {
	OBJY.objects({}).get(data => {
		console.log('data:', data)
	}, err => {
		console.log('err:', err)
	})
})
```