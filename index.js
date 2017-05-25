const upperFirst = require('lodash.upperfirst');
const isEmpty = require('lodash.isempty');

/**
 * a plugin that help schema to build string collection field
 * which is an array containt batch string
 *
 * @param {MongooseSchema} schema - mongoose schema that use this plugin
 * @param {object} [options] - plugin configuration
 * @param {string} [options.fieldName=tags] - the name place in schema
 * @param {boolean} [options.isIndex=false] - whether index in target field
 * @param {boolean} [options.isUnique=true] - whether unique the content in the collection
 * @param {number} [options.maxLength=-1] - The maximum size limit for the collection,
 *                  if the input is greater than 0, will be treated as a valid input
 * @param {object} [options.elementOptions] - collection element options
 * @param {object} [options.updateOptions] - collection default update options
 *                  for add, replace and get methods.
 *                  you can also override when using the specified method
 */
const plugin = (schema, options = {}) => {
  const { fieldName = 'tags', isIndex = false, isUnique = true, maxLength = -1 } = options;
  const elementOptions = Object.assign(
    {
      type: String,
      index: isIndex,
    },
    options.elementOptions
  );
  const fieldOptions = {
    type: [elementOptions],
  };
  if (maxLength > 0) {
    fieldOptions.vlaidate = [value => value.length <= 10, `{PATH} exceeds the length limit of ${maxLength}`];
  }

  // after mongoose v4 new is an option
  // to get the updated document
  // instead of updating the previous document
  const defautlUpdateOptions = Object.assign(
    {
      new: true,
      upsert: true,
      multi: true,
    },
    options.updateOptions
  );

  const upperName = upperFirst(fieldName);
  const pushOperator = isUnique ? '$addToSet' : '$push';
  const pullOperator = '$pullAll';
  const methods = {
    get: `get${upperName}`,
    add: `add${upperName}`,
    batchAdd: `batchAdd${upperName}`,
    remove: `remove${upperName}`,
    replace: `replace${upperName}`,
    batchReplace: `batchReplace${upperName}`,
  };
  /**
   * @namespace model
   */
  const model = {};

  /**
   * sugar method that get target filed as single result
   *
   * @memberof model
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
  model.get = function get(query = {}) {
    return this.findOne(query)
      .select(`${fieldName}`)
      .then(document => document && document[fieldName]);
  };

  const updateArguments = (collection, updateOptions) => ({
    updatePatch: {
      $set: {
        [fieldName]: collection,
      },
    },
    operationOpts: Object.assign(defautlUpdateOptions, updateOptions),
  });

  /**
   * remove element array from target field
   *
   * @memberof model
   * @param {object} query - mongoose query to find out update target
   * @param {array} collection - string collection will remove from target document
   * @return {Promise.<object>} updated target document
   * @example
   * // { _id: 'test', tags: ['t1', 't2'] }
   * model.removeTags({ _id: 'test' }, ['t1']).then(console.log);
   * // { _id: 'test', tags: ['t2'] }
   * model.removeTags({ _id: 'test' }, ['t2']).then(console.log);
   * // { _id: 'test', tags: [] }
   */
  model.remove = function remove(query, collection, updateOptions) {
    if (isEmpty(query)) {
      return Promise.reject(new Error('query should not be empty'));
    }

    const updatePatch = {
      [pullOperator]: {
        [fieldName]: collection,
      },
    };
    const { operationOpts } = updateArguments(collection, updateOptions);

    return this.findOneAndUpdate(query, updatePatch, operationOpts).exec();
  };

  /**
   * add string array to target field
   *
   * @memberof model
   * @param {object} query - mongoose query to find out update target
   * @param {array} collection - string collection will add to target document
   * @return {Promise.<object>} updated target document
   * @example
   * model.addTags({ _id: 'test' }, ['t1']).then(console.log);
   * // { _id: 'test', tags: ['t1'] }
   * model.addTags({ _id: 'test' }, ['t2']).then(console.log);
   * // { _id: 'test', tags: ['t1', 't2'] }
   */
  model.add = function add(query, collection, updateOptions) {
    if (isEmpty(query)) {
      return Promise.reject(new Error('query should not be empty'));
    }

    const updatePatch = {
      [pushOperator]: {
        [fieldName]: {
          $each: collection,
        },
      },
    };
    const { operationOpts } = updateArguments(collection, updateOptions);

    return this.findOneAndUpdate(query, updatePatch, operationOpts).exec();
  };

  /**
   * batch add element to collection
   *
   * @memberof model
   * @param {object} query - mongoose query to find out update target
   * @param {array} collection - string collection will add to target document
   * @return {Promise.<object>} mongoose udpate result
   * @example
   * model.batchAddTags({ _id: { $in: ['id1', 'id2] } }, ['t1', 't2']).then(console.log);
   * // { "nMatched" : 2, "nUpserted" : 0, "nModified" : 2 }
   * model.getTags({ _id: 'id1' }).then(console.log);
   * // ['t1', 't2']
   * model.batchAddTags({ _id: { $in: ['id1', 'id2] } }, ['t2', 't3']).then(console.log);
   * // { "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 }
   * model.getTags({ _id: 'id2' }).then(console.log);
   * // ['t1', 't2', 't3']
   */
  model.batchAdd = function batchAdd(query, collection, updateOptions) {
    if (isEmpty(query)) {
      return Promise.reject(new Error('query should not be empty'));
    }

    const updatePatch = {
      [pushOperator]: {
        [fieldName]: {
          $each: collection,
        },
      },
    };
    const { operationOpts } = updateArguments(collection, updateOptions);

    return this.update(query, updatePatch, operationOpts).exec();
  };

  /**
   * update document's collection filed,
   * which is first document find out by given query.
   * replace collection field with given collection
   *
   * @memberof model
   * @param {object} query - mongoose query to find out update target
   * @param {array} collection - string collection will add to target document
   * @return {Promise.<object>} mongoose udpate result
   * @example
   * model.replaceTags({ _id: 'test' }, ['t1']).then(console.log);
   * // { _id: 'test', tags: ['t1'] }
   * model.replaceTags({ _id: 'test' }, ['t2', 't3']).then(console.log);
   * // { _id: 'test', tags: ['t2', 't3'] }
   */
  model.replace = function replace(query, collection, updateOptions) {
    if (isEmpty(query)) {
      return Promise.reject(new Error('query should not be empty'));
    }

    const { updatePatch, operationOpts } = updateArguments(collection, updateOptions);

    return this.findOneAndUpdate(query, updatePatch, operationOpts).exec();
  };

  /**
   * batch update documents' collection filed
   * by replace it with given collection
   *
   * @memberof model
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
  model.batchReplace = function batchReplace(query, collection, updateOptions) {
    if (isEmpty(query)) {
      return Promise.reject(new Error('query should not be empty'));
    }

    const { updatePatch, operationOpts } = updateArguments(collection, updateOptions);

    return this.update(query, updatePatch, operationOpts).exec();
  };

  schema.add({
    [fieldName]: fieldOptions,
  });
  Object.keys(methods).forEach((key) => {
    schema.statics[methods[key]] = model[key];
  }, this);
};

module.exports = plugin;
