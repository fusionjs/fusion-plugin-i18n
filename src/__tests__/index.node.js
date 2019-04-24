/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

import test from 'tape-cup';

import {getSimulator} from 'fusion-test-utils';
import App, {consumeSanitizedHTML} from 'fusion-core';
import type {Context} from 'fusion-core';

import I18n from '../node';
import {I18nLoaderToken} from '../tokens.js';
import {I18nToken} from '../index';

test('translate', async t => {
  const data = {test: 'hello', interpolated: 'hi ${adjective} ${noun}'};
  const app = new App('el', el => el);
  app.register(I18nToken, I18n);
  app.register(I18nLoaderToken, {
    from: () => ({translations: data, locale: 'en_US'}),
  });
  app.middleware({i18n: I18nToken}, ({i18n}) => {
    return (ctx, next) => {
      const translator = i18n.from(ctx);
      t.equals(translator.translate('test'), 'hello');
      t.equals(
        translator.translate('interpolated', {adjective: 'big', noun: 'world'}),
        'hi big world'
      );
      t.equals(
        translator.translate('interpolated', {noun: 'world'}),
        'hi ${adjective} world'
      );
      t.equals(
        translator.translate('interpolated', {adjective: '', noun: 0}),
        'hi  0'
      );
      t.equals(translator.translate('interpolated'), 'hi ${adjective} ${noun}');
      return next();
    };
  });
  const simulator = getSimulator(app);
  await simulator.render('/');
  t.end();
});

test('ssr', async t => {
  const data = {test: 'hello</div>', interpolated: 'hi ${value}'};

  /* eslint-disable import/no-unresolved */
  // $FlowFixMe
  const chunkTranslationMap = require('../chunk-translation-map'); // relative to ./dist-tests
  /* eslint-enable import/no-unresolved */
  chunkTranslationMap.add('a.js', [0], Object.keys(data));

  const ctx: Context = {
    syncChunks: [0],
    preloadChunks: [],
    headers: {'accept-language': 'en-US'},
    element: 'test',
    // $FlowFixMe - Invalid context
    template: {body: []},
    memoized: new Map(),
  };
  const deps = {
    loader: {from: () => ({translations: data, locale: 'en-US'})},
  };

  t.plan(3);
  if (!I18n.provides) {
    t.end();
    return;
  }
  const i18n = I18n.provides(deps);

  if (!I18n.middleware) {
    t.end();
    return;
  }
  await I18n.middleware(deps, i18n)(ctx, () => Promise.resolve());
  t.equals(ctx.template.body.length, 1, 'injects hydration code');
  t.equals(
    // $FlowFixMe
    consumeSanitizedHTML(ctx.template.body[0]).match('hello')[0],
    'hello'
  );
  // $FlowFixMe
  t.equals(consumeSanitizedHTML(ctx.template.body[0]).match('</div>'), null);

  chunkTranslationMap.dispose('a.js', [0], Object.keys(data));
  chunkTranslationMap.translations.clear();
  t.end();
});

test('endpoint', async t => {
  const data = {test: 'hello', interpolated: 'hi ${value}'};

  /* eslint-disable import/no-unresolved */
  // $FlowFixMe
  const chunkTranslationMap = require('../chunk-translation-map'); // relative to ./dist-tests
  /* eslint-enable import/no-unresolved */
  chunkTranslationMap.add('a.js', [0], Object.keys(data));
  // $FlowFixMe - Invalid context
  const ctx: Context = {
    syncChunks: [],
    preloadChunks: [],
    headers: {'accept-language': 'en_US'},
    path: '/_translations',
    querystring: 'ids=0',
    memoized: new Map(),
    body: '',
  };

  const deps = {
    loader: {from: () => ({translations: data, locale: 'en-US'})},
  };

  t.plan(1);
  if (!I18n.provides) {
    t.end();
    return;
  }
  const i18n = I18n.provides(deps);

  if (!I18n.middleware) {
    t.end();
    return;
  }
  await I18n.middleware(deps, i18n)(ctx, () => Promise.resolve());
  t.deepEquals(ctx.body, data, 'injects hydration code');

  chunkTranslationMap.dispose('a.js', [0], Object.keys(data));
  chunkTranslationMap.translations.clear();
  t.end();
});

test('non matched route', async t => {
  const data = {test: 'hello', interpolated: 'hi ${value}'};
  // $FlowFixMe - Invalid context
  const ctx: Context = {
    path: '/_something',
    memoized: new Map(),
    body: '',
  };

  const deps = {
    loader: {from: () => ({translations: data, locale: 'en-US'})},
  };

  t.plan(1);
  if (!I18n.provides) {
    t.end();
    return;
  }
  const i18n = I18n.provides(deps);

  if (!I18n.middleware) {
    t.end();
    return;
  }
  await I18n.middleware(deps, i18n)(ctx, () => Promise.resolve());
  t.notok(ctx.body, 'does not set ctx.body');
  t.end();
});
