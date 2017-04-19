const upperFirst = require('lodash.upperfirst');
const isEmpty = require('lodash.isempty');

/**
 * a plugin that help schema to build string collection field
 * which is an array containt batch string
 * given
 *
 * @param {MongooseSchema} schema - mongoose schema that use this plugin
 * @param {object} [options] - plugin configuration
 * @param {string} [options.fieldName=tags] - the name place in schema
 * @param {boolean} [options.isIndex=false] - whether index in target field
 * @param {boolean} [options.isUnique=true] - whether unique the content in the collection
 * @param {object} [options.elementOptions] - collection element options
 * @param {object} [options.updateOptions] - collection default update options
 *      for add, replace and get methods.
 *      you can also override when using the specified method
 */
const plugin = (schema, options = {}) => {
  const {
    fieldName = 'tags',
    isIndex = false,
    isUnique = true,
  } = options;

  const upperName = upperFirst(fieldName);
  const updateOperator = isUnique ? '$addToSet' : '$push';
  const methods = {
    get: `get${upperName}`,
    add: `add${upperName}`,
    replace: `replace${upperName}`,
    batchReplace: `batchReplace${upperName}`,
  };
  const elementOptions = Object.assign({
    type: String,
    index: isIndex,
  }, options.elementOptions);
  // after mongoose v4 new is an option
  // to get the updated document
  // instead of updating the previous document
  const defautlUpdateOptions = Object.assign({
    new: true,
    upsert: true,
  }, options.updateOptions);

  schema.add({
    [fieldName]: [elementOptions],
  });

  /**
   * sugar method that get target filed as single result
   *
   * @param {object} [query={}] - mongoose query that place in this.findOne
   * @return {Promise.<array>} target field
   * @example
   * model.getTags({ _id: 'targetnotexists' }).then(console.log);
   * // undefined
   *
   * model.insert({ _id: 'test', tags: ['test'] });
   * model.getTags({ _id: 'test' }).then(console.log);
   * // ['test]
   */
  schema.statics[methods.get] = function get(query = {}) {
    return this.findOne(query).select(`${fieldName}`).then(document => document && document[fieldName]);
  };

  /**
   * add string array to target field
   *
   * @param {object} query - mongoose query to find out update target
   * @param {array} collection - string collection will add to target document
   * @return {Promise.<object>} updated target document
   * @example
   * model.addTags({ _id: 'test' }, ['t1']).then(console.log);
   * // { _id: 'test', tags: ['t1'] }
   * model.addTags({ _id: 'test' }, ['t2']).then(console.log);
   * // { _id: 'test', tags: ['t1', 't2'] }
   */
  schema.statics[methods.add] = function add(query, collection, updateOptions) {
    if (isEmpty(query)) {
      return Promise.reject(new Error('query should not be empty'));
    }

    const updatePatch = {
      [updateOperator]: {
        [fieldName]: {
          $each: collection,
        },
      },
    };
    const operationOpts = Object.assign(defautlUpdateOptions, updateOptions);

    return this.findOneAndUpdate(query, updatePatch, operationOpts).exec();
  };

  /**
   * update document's collection filed,
   * which is first document find out by given query.
   * replace collection field with given collection
   *
   * @param {object} query - mongoose query to find out update target
   * @param {array} collection - string collection will add to target document
   * @return {Promise.<object>} mongoose udpate result
   * @example
   * model.replaceTags({ _id: 'test' }, ['t1']).then(console.log);
   * // { _id: 'test', tags: ['t1'] }
   * model.replaceTags({ _id: 'test' }, ['t2', 't3']).then(console.log);
   * // { _id: 'test', tags: ['t2', 't3'] }
   */
  schema.statics[methods.replace] = function replace(query, collection, updateOptions) {
    if (isEmpty(query)) {
      return Promise.reject(new Error('query should not be empty'));
    }

    const updatePatch = {
      $set: {
        [fieldName]: collection,
      },
    };
    const operationOpts = Object.assign(defautlUpdateOptions, updateOptions);

    return this.findOneAndUpdate(query, updatePatch, operationOpts).exec();
  };

  /**
   * batch update documents' collection filed
   * by replace it with given collection
   *
   * @param {object} query - mongoose query to find out update target
   * @param {array} collection - string collection will add to target document
   * @return {Promise.<object>} mongoose udpate result
   * @example
   * model.batchReplaceTags({ _id: 'test' }, ['t1']).then(console.log);
   * // { "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 }
   * model.getTags({ _id: 'test' }).then(console.log);
   * // ['t1']
   * model.batchReplaceTags({ _id: 'test' }, ['t2', 't3']).then(console.log);
   * // { "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 }
   * model.getTags({ _id: 'test' }).then(console.log);
   * // ['t2', 't3']
   */
  schema.statics[methods.batchReplace] = function batchReplace(query, collection, updateOptions) {
    if (isEmpty(query)) {
      return Promise.reject(new Error('query should not be empty'));
    }

    const updatePatch = {
      $set: {
        [fieldName]: collection,
      },
    };
    const operationOpts = Object.assign(defautlUpdateOptions, updateOptions);

    return this.update(query, updatePatch, operationOpts).exec();
  };
};

module.exports = plugin;
