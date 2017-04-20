# mongoose-string-collection

[![Travis](https://img.shields.io/travis/yidinghan/mongoose-string-collection.svg?style=flat-square)]()
[![npm](https://img.shields.io/npm/l/mongoose-string-collection.svg?style=flat-square)]()
[![npm](https://img.shields.io/npm/v/mongoose-string-collection.svg?style=flat-square)]()
[![npm](https://img.shields.io/npm/dm/mongoose-string-collection.svg?style=flat-square)]()
[![David](https://img.shields.io/david/yidinghan/mongoose-string-collection.svg?style=flat-square)]()
[![David](https://img.shields.io/david/dev/yidinghan/mongoose-string-collection.svg?style=flat-square)]()

A mongoose plugin that can help you quickly develop string collection related requirements

# Getting Start

## NPM

Installation

```shell
npm i -S mongoose-string-collection
```

## Usage

Quick code snippet

```javascript
const stringCollection = require('mongoose-string-collection');

schema.plugin(stringCollection);

// init model, etc.

model.addTags({ id: 'thisisid' }, ['thisistag']);
model.getTags({ id: 'thisisid' });
  .then(console.log) // ['thisistag']
model.addTags({ id: 'thisisid' }, ['thisistagbro']);
model.getTags({ id: 'thisisid' });
  .then(console.log) // ['thisistag', 'thisistagbro']
```

# Configuration

### Different Field Name

The default field [mongoose-string-collection](https://github.com/yidinghan/mongoose-string-collection) would add to schema is `tags`

If you want to change the field name, you can configuration by change [default options](#pluginschema-options)

```javascript
schema.plugin(stringCollection, {
  fieldName: 'dingding'
});

// init model, etc.

model.addDingding({ id: 'thisisid' }, ['thisistag']);
model.getDingding({ id: 'thisisid' });
  .then(console.log) // ['thisistag']
```

### Index Elements/Collection

If want to indexs the field created by [mongoose-string-collection](https://github.com/yidinghan/mongoose-string-collection), you can set `options.isIndex` to `true`

```javascript
schema.plugin(stringCollection, {
  isIndex: true
});

// init model, etc.

const elementIndex = model.path('tags').caster.options.index;
// true
```

### Unique In Collection

Sometimes the collection may not be a unique set of elements, but an array.

If you want an array, you can set `options.isUnique` to `false`.

```javascript
schema.plugin(stringCollection, {
  isUnique: true // default also is true
});

// init model, etc.

model.addDingding({ id: 'thisisid' }, ['t', 't1']);
model.getDingding({ id: 'thisisid' });
  .then(console.log) // ['t', 't1']
model.addDingding({ id: 'thisisid' }, ['t', 't2']);
model.getDingding({ id: 'thisisid' });
  .then(console.log) // ['t', 't1', 't2]

// set isUnique to false
schema.plugin(stringCollection, {
  isUnique: false
});

// init model, etc.

model.addDingding({ id: 'thisisid' }, ['t', 't1']);
model.getDingding({ id: 'thisisid' });
  .then(console.log) // ['t', 't1']
model.addDingding({ id: 'thisisid' }, ['t', 't2']);
model.getDingding({ id: 'thisisid' });
  .then(console.log) // ['t', 't1', 't', 't2]
```



# JSDoc

## Objects

<dl>
<dt><a href="#model">model</a> : <code>object</code></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#plugin">plugin(schema, [options])</a></dt>
<dd><p>a plugin that help schema to build string collection field
which is an array containt batch string</p>
</dd>
</dl>

<a name="model"></a>

## model : <code>object</code>
**Kind**: global namespace  

* [model](#model) : <code>object</code>
    * [.get([query])](#model.get) ⇒ <code>Promise.&lt;array&gt;</code>
    * [.remove(query, collection)](#model.remove) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.add(query, collection)](#model.add) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.replace(query, collection)](#model.replace) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.batchReplace(query, collection)](#model.batchReplace) ⇒ <code>Promise.&lt;object&gt;</code>

<a name="model.get"></a>

### model.get([query]) ⇒ <code>Promise.&lt;array&gt;</code>
sugar method that get target filed as single result

**Kind**: static method of <code>[model](#model)</code>  
**Returns**: <code>Promise.&lt;array&gt;</code> - target field  

| Param   | Type                | Default         | Description                              |
| ------- | ------------------- | --------------- | ---------------------------------------- |
| [query] | <code>object</code> | <code>{}</code> | mongoose query that place in this.findOne |

**Example**  
```js
model.getTags({ _id: 'targetnotexists' }).then(console.log);
// undefined

model.insert({ _id: 'test', tags: ['test'] });
model.getTags({ _id: 'test' }).then(console.log);
// ['test]
```
<a name="model.remove"></a>

### model.remove(query, collection) ⇒ <code>Promise.&lt;object&gt;</code>
remove element array from target field

**Kind**: static method of <code>[model](#model)</code>  
**Returns**: <code>Promise.&lt;object&gt;</code> - updated target document  

| Param      | Type                | Description                              |
| ---------- | ------------------- | ---------------------------------------- |
| query      | <code>object</code> | mongoose query to find out update target |
| collection | <code>array</code>  | string collection will remove from target document |

**Example**  
```js
// { _id: 'test', tags: ['t1', 't2'] }
model.removeTags({ _id: 'test' }, ['t1']).then(console.log);
// { _id: 'test', tags: ['t2'] }
model.removeTags({ _id: 'test' }, ['t2']).then(console.log);
// { _id: 'test', tags: [] }
```
<a name="model.add"></a>

### model.add(query, collection) ⇒ <code>Promise.&lt;object&gt;</code>
add string array to target field

**Kind**: static method of <code>[model](#model)</code>  
**Returns**: <code>Promise.&lt;object&gt;</code> - updated target document  

| Param      | Type                | Description                              |
| ---------- | ------------------- | ---------------------------------------- |
| query      | <code>object</code> | mongoose query to find out update target |
| collection | <code>array</code>  | string collection will add to target document |

**Example**  
```js
model.addTags({ _id: 'test' }, ['t1']).then(console.log);
// { _id: 'test', tags: ['t1'] }
model.addTags({ _id: 'test' }, ['t2']).then(console.log);
// { _id: 'test', tags: ['t1', 't2'] }
```
<a name="model.replace"></a>

### model.replace(query, collection) ⇒ <code>Promise.&lt;object&gt;</code>
update document's collection filed,
which is first document find out by given query.
replace collection field with given collection

**Kind**: static method of <code>[model](#model)</code>  
**Returns**: <code>Promise.&lt;object&gt;</code> - mongoose udpate result  

| Param      | Type                | Description                              |
| ---------- | ------------------- | ---------------------------------------- |
| query      | <code>object</code> | mongoose query to find out update target |
| collection | <code>array</code>  | string collection will add to target document |

**Example**  
```js
model.replaceTags({ _id: 'test' }, ['t1']).then(console.log);
// { _id: 'test', tags: ['t1'] }
model.replaceTags({ _id: 'test' }, ['t2', 't3']).then(console.log);
// { _id: 'test', tags: ['t2', 't3'] }
```
<a name="model.batchReplace"></a>

### model.batchReplace(query, collection) ⇒ <code>Promise.&lt;object&gt;</code>
batch update documents' collection filed
by replace it with given collection

**Kind**: static method of <code>[model](#model)</code>  
**Returns**: <code>Promise.&lt;object&gt;</code> - mongoose udpate result  

| Param      | Type                | Description                              |
| ---------- | ------------------- | ---------------------------------------- |
| query      | <code>object</code> | mongoose query to find out update target |
| collection | <code>array</code>  | string collection will add to target document |

**Example**  
```js
model.batchReplaceTags({ _id: 'test' }, ['t1']).then(console.log);
// { "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 }
model.getTags({ _id: 'test' }).then(console.log);
// ['t1']
model.batchReplaceTags({ _id: 'test' }, ['t2', 't3']).then(console.log);
// { "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 }
model.getTags({ _id: 'test' }).then(console.log);
// ['t2', 't3']
```
<a name="plugin"></a>

## plugin(schema, [options])
a plugin that help schema to build string collection field
which is an array containt batch string

**Kind**: global function  

| Param                    | Type                        | Default                       | Description                              |
| ------------------------ | --------------------------- | ----------------------------- | ---------------------------------------- |
| schema                   | <code>MongooseSchema</code> |                               | mongoose schema that use this plugin     |
| [options]                | <code>object</code>         |                               | plugin configuration                     |
| [options.fieldName]      | <code>string</code>         | <code>&quot;tags&quot;</code> | the name place in schema                 |
| [options.isIndex]        | <code>boolean</code>        | <code>false</code>            | whether index in target field            |
| [options.isUnique]       | <code>boolean</code>        | <code>true</code>             | whether unique the content in the collection |
| [options.elementOptions] | <code>object</code>         |                               | collection element options               |
| [options.updateOptions]  | <code>object</code>         |                               | collection default update options      for add, replace and get methods.      you can also override when using the specified method |

