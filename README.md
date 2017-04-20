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

# Methods

### Get Collection

### Add Element

### Remove Element

### Replace Collection

### Batch Replace Collection

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

### Index Element

### Unique In Collection



<a name="plugin"></a>

# plugin(schema, [options])

a plugin that help schema to build string collection field
which is an array containt batch string
given

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

