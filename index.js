const _ = require('lodash');

/**
 * a plugin that help schema to build string collection field
 * which is an array containt batch string
 * given
 *
 * @param {MongooseSchema} schema - mongoose schema that need to add this plugin
 * @param {object} options - plugin configuration
 * @param {string} options.fieldName - the name place in schema
 * @param {boolean} options.isIndex - whether index in target field
 * @param {boolean} options.isUnique - whether unique the content in the collection
 */
const plugin = (schema, options = {}) => {
  const {
    fieldName = 'tags',
    isIndex = false,
    isUnique = true,
  } = options;

  const upperName = _.upperFirst(fieldName);
  const updateOperator = isUnique ? '$addToSet' : '$push';
  const methods = {
    get: `get${upperName}`,
    add: `add${upperName}`,
    replace: `replace${upperName}`,
    batchReplace: `batchReplace${upperName}`,
  };

  schema.add({
    [fieldName]: [{
      type: String,
      index: isIndex,
    }]
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
  schema.statics[methods.get] = function getCollection(query = {}) {
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
  schema.statics[methods.add] = function addCollection(query, collection) {
    if (_.isEmpty(query)) {
      return Promise.reject(new Error('query should not be empty'));
    }

    const updatePatch = {
      [updateOperator]: {
        [fieldName]: {
          $each: collection,
        },
      },
    };
    // new to get the updated document not the preUpdate one
    const opts = {
      new: true,
      upsert: true,
    };

    return this.findOneAndUpdate(query, updatePatch, opts).exec().tapCatch(console.log);
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
  schema.statics[methods.replace] = function replaceCollection(query, collection) {
    if (_.isEmpty(query)) {
      return Promise.reject(new Error('query should not be empty'));
    }

    const updatePatch = {
      $set: {
        [fieldName]: collection,
      }
    };
    // new to get the updated document not the preUpdate one
    const opts = {
      new: true,
      upsert: true,
    };

    return this.findOneAndUpdate(query, updatePatch, opts).exec();
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
  schema.statics[methods.batchReplace] = function replaceCollection(query, collection) {
    if (_.isEmpty(query)) {
      return Promise.reject(new Error('query should not be empty'));
    }

    const updatePatch = {
      $set: {
        [fieldName]: collection,
      }
    };
    const opts = {
      upsert: true,
    };

    return this.update(query, updatePatch, opts).exec();
  };
};

module.exports = plugin;