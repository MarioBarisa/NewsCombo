import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const projectRoot = fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, '');
const require = createRequire(`${projectRoot}/package.json`);
const { parse, compileScript, compileTemplate } = require('@vue/compiler-sfc');
const vueUrl = pathToFileURL(`${projectRoot}/node_modules/vue/index.mjs`).href;
const { createRenderer, nextTick } = await import(vueUrl);
const algorithmUrl = pathToFileURL(`${projectRoot}/src/Services/recommender.js`).href;
const asModule = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
let fetchCalls = 0;
globalThis.fetch = () => { fetchCalls++; throw new Error('Test ne smije pristupati mreži.'); };
globalThis.Document = class {};
globalThis.ShadowRoot = class {};
globalThis.document = { activeElement: null };

async function compileComponent(relativePath, replacements = {}) {
  const filename = `${projectRoot}/${relativePath}`;
  // Provjera logike bez CSS prijelaza.
  const { descriptor, errors } = parse((await readFile(filename, 'utf8')).replace(/<TransitionGroup/g, '<ol').replace(/<\/TransitionGroup>/g, '</ol>'));
  assert.equal(errors.length, 0);
  const script = compileScript(descriptor, { id: relativePath, inlineTemplate: true });
  const moduleMap = {
    '@iconify/vue': asModule('export const Icon = { render() { return null; } };'),
    '@iconify-icons/lucide/monitor-smartphone': asModule('export default {};'),
    '@iconify-icons/lucide/refresh-cw': asModule('export default {};'),
    '@iconify-icons/lucide/shield-check': asModule('export default {};'),
    vue: vueUrl, '../Services/recommender.js': algorithmUrl, ...replacements };
  const code = script.content.replace(/from\s+(['"])([^'"]+)\1/g, (match, quote, name) => {
    assert.ok(moduleMap[name], `Nepoznat uvoz: ${name}`);
    return `from ${JSON.stringify(moduleMap[name])}`;
  });
  const url = asModule(code);
  const component = (await import(url)).default;
  if (!descriptor.scriptSetup) {
    const template = compileTemplate({ source: descriptor.template.content, filename, id: relativePath });
    assert.equal(template.errors.length, 0);
    const templateCode = template.code.replace(/from ["']vue["']/g, 'from ' + JSON.stringify(vueUrl));
    component.render = (await import(asModule(templateCode))).render;
  }
  return { url, component };
}

function node(type, value = '') {
  return {
    type, text: value, children: [], props: {}, parent: null, open: false, value: '', checked: false,
    tagName: type.toUpperCase(), listeners: {},
    querySelectorAll() { return all(this, child => child.type === 'li'); },
    animate(frames, options) {
      if (globalThis.__timelineAnimate) return globalThis.__timelineAnimate(frames, options);
      return { finished: Promise.resolve(), cancel() {} };
    },
    getRootNode() { return globalThis.document; },
    addEventListener(name, handler) { this.listeners[name] = handler; },
    removeEventListener(name) { delete this.listeners[name]; },
    showModal() { this.open = true; },
    close() { this.open = false; this.props.onClose?.({}); },
    focus() { globalThis.document.activeElement = this; }
  };
}
function insert(child, parent, anchor) {
  if (child.parent) {
    const oldIndex = child.parent.children.indexOf(child);
    if (oldIndex !== -1) child.parent.children.splice(oldIndex, 1);
  }
  const index = anchor ? parent.children.indexOf(anchor) : -1;
  if (index === -1) parent.children.push(child);
  else parent.children.splice(index, 0, child);
  child.parent = parent;
}
const renderer = createRenderer({
  createElement: type => node(type), createText: value => node('#text', value), createComment: value => node('#comment', value),
  insert,
  remove(element) { if (element.parent) element.parent.children.splice(element.parent.children.indexOf(element), 1); },
  setText(element, value) { element.text = value; },
  setElementText(element, value) { element.text = value; element.children = []; },
  patchProp(element, key, previous, value) { element.props[key] = value; if (key === 'value') { element.value = value; element._value = value; } },
  parentNode: element => element.parent,
  nextSibling(element) { return element.parent?.children[element.parent.children.indexOf(element) + 1] || null; },
  insertStaticContent(value, parent, anchor) { const element = node('#static', value); insert(element, parent, anchor); return [element, element]; }
});
function all(root, predicate) {
  const found = [];
  function visit(element) { if (predicate(element)) found.push(element); for (const child of element.children) visit(child); }
  visit(root);
  return found;
}
const text = element => element.type === '#comment' ? '' : `${element.text} ${element.children.map(text).join(' ')}`.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
function find(root, predicate) { const result = all(root, predicate)[0]; assert.ok(result, 'Element mora postojati.'); return result; }
function button(root, label) { return find(root, element => element.type === 'button' && (element.props['aria-label'] === label || text(element) === label)); }
async function click(element) { await element.props.onClick({ preventDefault() {}, stopPropagation() {} }); await nextTick(); }
function times(root) { return all(root, element => element.type === 'time').map(text); }



export { compileComponent, node, renderer, all, text, find, button, click, times, asModule, vueUrl, algorithmUrl, fetchCalls };
