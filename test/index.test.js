/* eslint no-underscore-dangle: 0 */
const test = require('ava').test;
const Promise = require('bluebird');
const mongoose = require('mongoose');

const stringColleciton = require('../');

mongoose.Promise = Promise;
const db = mongoose.createConnection('localhost');
const getModel = (schema) => {
  const collectionId = mongoose.Types.ObjectId().toString();
  const collectionName = `tmp${collectionId}`;

  return db.model(collectionName, schema);
};
const minimalValidate = (t, pathOption, casterType = 'String') => {
  t.is(pathOption.instance, 'Array');
  t.is(pathOption.caster.instance, casterType);
};

test.after.always('clean up tmp collection', () => {
  const dropCollection = collectionName =>
    Promise.fromNode((callback) => {
      db.db.dropCollection(collectionName, callback);
    });

  return Promise.fromNode(callback => db.db.listCollections({ name: /^tmp/ }).toArray(callback))
    .map(collection => collection.name)
    .map(dropCollection);
});

test('batchRemove: should success batchRemove original collection', (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton);
  const model = getModel(schema);

  const bus = {};
  return model
    .create({ tags: ['t', 't1'] })
    .then((doc) => {
      t.truthy(doc);
      bus.docId = doc._id;

      return model.batchRemoveTags({ _id: doc._id }, ['t1']);
    })
    .then(({ nModified }) => {
      t.is(nModified, 1);

      return model.findById(bus.docId);
    })
    .then(doc => t.deepEqual(doc.tags.toObject(), ['t']));
});

test('batchRemove: should success Remove tags to collections', (t) => {
  const schema = new mongoose.Schema({ id: Number });
  schema.plugin(stringColleciton, { isUnique: true });
  const model = getModel(schema);

  return model
    .create([{ tags: ['t', 't1'], id: 1 }, { tags: ['t1'], id: 2 }])
    .then((docs) => {
      t.truthy(docs);

      return model.batchRemoveTags({ id: { $in: [1, 2] } }, ['t1']);
    })
    .then(({ nModified }) => {
      t.is(nModified, 2);

      return Promise.all([model.findOne({ id: 1 }), model.findOne({ id: 2 })]);
    })
    .then(([doc1, doc2]) => {
      t.deepEqual(doc1.tags.toObject(), ['t']);
      t.deepEqual(doc2.tags.toObject(), []);
    });
});

test('batchRemove: should reject emtpy query error', async (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton);
  const model = getModel(schema);

  const promise = model.batchRemoveTags();
  await t.throws(promise, 'query should not be empty');
});


test('maxLength: should not have size limit without input', (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton);
  const pathOption = schema.path('tags');

  t.truthy(pathOption);
  t.is(pathOption.validators.length, 0, 'no customised validator');
});

test('maxLength: should have 1 validator', (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton, {
    maxLength: 2,
  });
  const pathOption = schema.path('tags');

  t.truthy(pathOption);
  t.is(pathOption.validators.length, 1, '1 customised validator');
});

test('maxLength: should faild on validate when add element more then limit', async (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton, {
    maxLength: 2,
  });

  const model = getModel(schema);

  const promise = model.create({ tags: ['t', 't1'] }).then((doc) => {
    t.truthy(doc);
    doc.tags.push('t2');
    return doc.save();
  });

  await t.throws(
    promise,
    error => error.errors.tags.message === 'tags exceeds the length limit of 2'
  );
});

test('elementOptions: should override default element options with type:ObjectId', (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton, {
    elementOptions: {
      type: mongoose.Schema.Types.ObjectId,
    },
  });
  const pathOption = schema.path('tags');

  t.truthy(pathOption);
  minimalValidate(t, pathOption, 'ObjectID');
});

test('elementOptions: should use ObjectI in the database', (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton, {
    elementOptions: {
      type: mongoose.Schema.Types.ObjectId,
    },
  });
  const model = getModel(schema);
  const bus = {
    foo: mongoose.Types.ObjectId(),
    bar: mongoose.Types.ObjectId(),
  };

  return model
    .create({ tags: [bus.foo] })
    .then((doc) => {
      t.truthy(doc);

      return model.addTags({ _id: doc._id }, [bus.bar]);
    })
    .then((doc) => {
      t.deepEqual(doc.tags.toObject(), [bus.foo, bus.bar]);

      return model.findById(doc._id);
    })
    .then(doc => t.deepEqual(doc.tags.toObject(), [bus.foo, bus.bar]));
});

test('elementOptions: should override default element options', (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton, {
    elementOptions: {
      index: true,
    },
  });
  const pathOption = schema.path('tags');

  t.truthy(pathOption);
  minimalValidate(t, pathOption);
  t.true(pathOption.caster.options.index);
});

test('updateOptions: should override default update options', (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton, {
    updateOptions: {
      new: false,
    },
  });
  const model = getModel(schema);

  const bus = {};
  return model
    .create({ tags: ['t', 't1'] })
    .then((doc) => {
      t.truthy(doc);
      bus.docId = doc._id;

      return model.addTags({ _id: doc._id }, ['t2']);
    })
    .then((doc) => {
      t.deepEqual(doc.tags.toObject(), ['t', 't1']);

      return model.findById(bus.docId);
    })
    .then(doc => t.deepEqual(doc.tags.toObject(), ['t', 't1', 't2']));
});

test('updateOptions: should override default update options on specify method', (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton, {
    updateOptions: {
      new: false,
    },
  });
  const model = getModel(schema);

  const bus = {};
  return model
    .create({ tags: ['t', 't1'] })
    .then((doc) => {
      t.truthy(doc);
      bus.docId = doc._id;

      return model.addTags({ _id: doc._id }, ['t2'], { new: true });
    })
    .then((doc) => {
      t.deepEqual(doc.tags.toObject(), ['t', 't1', 't2']);

      return model.findById(bus.docId);
    })
    .then(doc => t.deepEqual(doc.tags.toObject(), ['t', 't1', 't2']));
});

test('fieldName: should exists target filed name', (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton);
  const pathOption = schema.path('tags');

  t.truthy(pathOption);
  minimalValidate(t, pathOption);
  t.false(pathOption.caster.options.index);
});

test('fieldName: should index in caster field', (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton, { isIndex: true });
  const pathOption = schema.path('tags');

  t.truthy(pathOption);
  t.true(pathOption.caster.options.index);
});

test('fieldName: should use input field name', (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton, { fieldName: 't' });
  const pathOption = schema.path('t');

  minimalValidate(t, pathOption);
});

test('get: should success get collection', (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton);
  const model = getModel(schema);

  return model.create({ tags: ['t3'] }).then(doc => model.getTags({ _id: doc._id })).then((tags) => {
    t.deepEqual(tags.toObject(), ['t3']);
  });
});

test('get: should still get tags withou input', (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton);
  const model = getModel(schema);

  return model
    .create({ tags: ['t3'] })
    .then(() => model.getTags())
    .then(tags => t.deepEqual(tags.toObject(), ['t3']));
});

test('add: should success add to collection', (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton);
  const model = getModel(schema);

  const bus = {};
  return model
    .create({ tags: ['test'] })
    .then((doc) => {
      t.truthy(doc);
      bus.docId = doc._id;

      return model.addTags({ _id: doc._id }, ['test2']);
    })
    .then(() => model.findById(bus.docId))
    .then(doc => t.deepEqual(doc.tags.toObject(), ['test', 'test2']));
});

test('add: should success add to collection with unique opions', (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton, { isUnique: false });
  const model = getModel(schema);

  const bus = {};
  return model
    .create({ tags: ['t', 't1'] })
    .then((doc) => {
      t.truthy(doc);
      bus.docId = doc._id;

      return model.addTags({ _id: doc._id }, ['t1']);
    })
    .then(() => model.findById(bus.docId))
    .then(doc => t.deepEqual(doc.tags.toObject(), ['t', 't1', 't1']));
});

test('add: should success add to collection with unique opions', (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton, { isUnique: true });
  const model = getModel(schema);

  const bus = {};
  return model
    .create({ tags: ['t', 't1'] })
    .then((doc) => {
      t.truthy(doc);
      bus.docId = doc._id;

      return model.addTags({ _id: doc._id }, ['t1']);
    })
    .then((doc) => {
      t.deepEqual(doc.tags.toObject(), ['t', 't1']);

      return model.findById(bus.docId);
    })
    .then(doc => t.deepEqual(doc.tags.toObject(), ['t', 't1']));
});

test('add: should reject emtpy query error', async (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton);
  const model = getModel(schema);

  const promise = model.addTags();
  await t.throws(promise, 'query should not be empty');
});

test('batchAdd: should success add tags to collections', (t) => {
  const schema = new mongoose.Schema({ id: Number });
  schema.plugin(stringColleciton, { isUnique: true });
  const model = getModel(schema);

  return model
    .create([{ tags: ['t', 't1'], id: 1 }, { tags: ['t', 't1'], id: 2 }])
    .then((docs) => {
      t.truthy(docs);

      return model.batchAddTags({ id: { $in: [1, 2] } }, ['t3']);
    })
    .then(({ nModified }) => {
      t.is(nModified, 2);

      return model.find();
    })
    .then((docs) => {
      t.is(docs.length, 2);
      docs.forEach((doc) => {
        t.deepEqual(doc.tags.toObject(), ['t', 't1', 't3']);
      });
    });
});

test('batchAdd: should reject emtpy query error', async (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton);
  const model = getModel(schema);

  const promise = model.batchAddTags();
  await t.throws(promise, 'query should not be empty');
});

test('remove: should success remove from collection', (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton);
  const model = getModel(schema);

  const bus = {};
  return model
    .create({ tags: ['t', 't1', 't2'] })
    .then((doc) => {
      t.truthy(doc);
      bus.docId = doc._id;

      return model.removeTags({ _id: doc._id }, ['t', 't2']);
    })
    .then(() => model.findById(bus.docId))
    .then(doc => t.deepEqual(doc.tags.toObject(), ['t1']));
});

test('remove: should success remove all elements', (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton);
  const model = getModel(schema);

  const bus = {};
  return model
    .create({ tags: ['t', 't1', 't2'] })
    .then((doc) => {
      t.truthy(doc);
      bus.docId = doc._id;

      return model.removeTags({ _id: doc._id }, ['t', 't2']);
    })
    .then((doc) => {
      t.deepEqual(doc.tags.toObject(), ['t1']);

      return model.removeTags({ _id: doc._id }, ['t', 't1']);
    })
    .then((doc) => {
      t.deepEqual(doc.tags.toObject(), []);
      return model.findById(bus.docId);
    })
    .then(doc => t.deepEqual(doc.tags.toObject(), []));
});

test('remove: should reject emtpy query error', async (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton);
  const model = getModel(schema);

  const promise = model.removeTags();
  await t.throws(promise, 'query should not be empty');
});

test('replace: should success replace original collection', (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton);
  const model = getModel(schema);

  const bus = {};
  return model
    .create({ tags: ['t', 't1'] })
    .then((doc) => {
      t.truthy(doc);
      bus.docId = doc._id;

      return model.replaceTags({ _id: doc._id }, ['t2']);
    })
    .then((doc) => {
      t.deepEqual(doc.tags.toObject(), ['t2']);

      return model.findById(doc._id);
    })
    .then(doc => t.deepEqual(doc.tags.toObject(), ['t2']));
});

test('replace: should reject emtpy query error', async (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton);
  const model = getModel(schema);

  const promise = model.replaceTags();
  await t.throws(promise, 'query should not be empty');
});

test('batchReplace: should success batchReplace original collection', (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton);
  const model = getModel(schema);

  const bus = {};
  return model
    .create({ tags: ['t', 't1'] })
    .then((doc) => {
      t.truthy(doc);
      bus.docId = doc._id;

      return model.batchReplaceTags({ _id: doc._id }, ['t2']);
    })
    .then(({ nModified }) => {
      t.is(nModified, 1);

      return model.findById(bus.docId);
    })
    .then(doc => t.deepEqual(doc.tags.toObject(), ['t2']));
});

test('batchReplace: should success Replace tags to collections', (t) => {
  const schema = new mongoose.Schema({ id: Number });
  schema.plugin(stringColleciton, { isUnique: true });
  const model = getModel(schema);

  return model
    .create([{ tags: ['t', 't1'], id: 1 }, { tags: ['t', 't1'], id: 2 }])
    .then((docs) => {
      t.truthy(docs);

      return model.batchReplaceTags({ id: { $in: [1, 2] } }, ['t3']);
    })
    .then(({ nModified }) => {
      t.is(nModified, 2);

      return model.find();
    })
    .then((docs) => {
      t.is(docs.length, 2);
      docs.forEach((doc) => {
        t.deepEqual(doc.tags.toObject(), ['t3']);
      });
    });
});

test('batchReplace: should reject emtpy query error', async (t) => {
  const schema = new mongoose.Schema();
  schema.plugin(stringColleciton);
  const model = getModel(schema);

  const promise = model.batchReplaceTags();
  await t.throws(promise, 'query should not be empty');
});
