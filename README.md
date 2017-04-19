# mongoose-string-collection
A mongoose plugin that can help you quickly develop string collection related requirements

<a name="plugin"></a>

## plugin(schema, options)
a plugin that help schema to build string collection field
which is an array containt batch string
given

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| schema | <code>MongooseSchema</code> | mongoose schema that need to add this plugin |
| options | <code>object</code> | plugin configuration |
| options.fieldName | <code>string</code> | the name place in schema |
| options.isIndex | <code>boolean</code> | whether index in target field |
| options.isUnique | <code>boolean</code> | whether unique the content in the collection |

