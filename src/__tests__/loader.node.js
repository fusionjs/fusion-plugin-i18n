/* eslint-env node */

import fs from 'fs';
import test from 'tape-cup';
import App from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';
import I18n from '../node';
import createLoader from '../loader';
import {I18nToken} from '../index.js';

test('loader', async t => {
  fs.mkdirSync('translations');
  fs.writeFileSync('translations/en_US.json', '{"test": "hi ${value}"}');

  const app = new App('el', el => el);
  app.register(I18nToken, I18n);
  app.middleware({i18n: I18nToken}, ({i18n}) => {
    return (ctx, next) => {
      const translator = i18n.from(ctx);
      t.equals(translator.translate('test', {value: 'world'}), 'hi world');
      return next();
    };
  });
  const simulator = getSimulator(app);
  await simulator.render('/');
  fs.unlinkSync('translations/en_US.json');
  fs.rmdirSync('translations');
  t.end();
});

test('no translations dir', t => {
  t.doesNotThrow(createLoader);
  t.end();
});
