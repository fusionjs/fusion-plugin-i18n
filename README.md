# fusion-plugin-i18n

Adds I18n (Internationalization) support to a FusionJS app

For date i18n, consider using [date-fns](https://date-fns.org/)

If you're using React, you should use [`fusion-plugin-i18n-react`](../fusion-plugin-i18n-react) instead of this package.

---

### Installation

```sh
yarn add fusion-plugin-i18n
```

---

### Example

```js
// src/main.js
import React from 'react';
import App from 'fusion-react';
import Internationalization from 'fusion-plugin-i18n';
// TODO: Implement this plugin
import TranslationsLoader from 'fusion-plugin-translations-loader-file';
import fetch from 'unfetch';
import Hello from './hello';

export default () => {
  const app = new App(<div></div>);

  const I18n = app.plugin(Internationalization, __BROWSER__ ? {fetch} : {TranslationsLoader});

  app.plugin(Hello, {I18n});

  return app;
}

// src/hello.js
export default ({I18n}) => (ctx, next) => {
  // use the service
  if (__NODE__ && ctx.path === '/hello') {
    const i18n = I18n.of(ctx);
    ctx.body = {
      message: i18n.translate('test', {name: 'world'}), // hello world
    }
  }
  return next();
}

// translations/en-US.json
{
  test: "hello ${name}"
}
```

---

### API

#### Instance methods

```js
const {translate} = app.plugin(Internationalization, __BROWSER__ ? {fetch} : {TranslationsLoader}).of();
```

- `translate: (key: string, interpolations: Object) => string`
