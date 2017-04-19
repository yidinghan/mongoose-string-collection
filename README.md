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

Quick Snippet 

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



<a name="plugin"></a>

## plugin(schema, options)

a plugin that help schema to build string collection field
which is an array containt batch string
given

**Kind**: global function  

| Param             | Type                        | Description                              |
| ----------------- | --------------------------- | ---------------------------------------- |
| schema            | <code>MongooseSchema</code> | mongoose schema that need to add this plugin |
| options           | <code>object</code>         | plugin configuration                     |
| options.fieldName | <code>string</code>         | the name place in schema                 |
| options.isIndex   | <code>boolean</code>        | whether index in target field            |
| options.isUnique  | <code>boolean</code>        | whether unique the content in the collection |

