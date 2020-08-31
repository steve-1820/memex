import PouchDB from 'pouchdb';
import * as PouchUpsert from 'pouchdb-upsert';
import * as PouchFind from 'pouchdb-find';
import path from 'path';

PouchDB.plugin(PouchUpsert);
PouchDB.plugin(PouchFind);

const db = new PouchDB(path.join(__dirname, 'mydb'));
console.log('db path', path.join(__dirname, 'mydb'));
db.info()
  .then(function (info) {
    console.log('We can use PouchDB with LevelDB!', info);
  })
  .catch(function (err) {
    console.log('Error for LevelDB');
  });

db.createIndex({
  index: { fields: ['committed'] },
});

export function addRecord(id, data) {
  db.upsert(id, (doc) => {
    if (Object.keys(doc).length !== 0 && doc.constructor === Object) {
      if (doc.updatedTime < data.updatedTime) {
        return data;
      }
      return doc;
    }
    return data;
  })
    .then((response) => {
      console.log(response);
    })
    .catch(function (err) {
      console.log('addRecord error', err);
      throw err;
    });
}

export async function fetchRecord(id) {
  return await db.get(id);
}

export function deleteRecord(id) {
  db.get(id)
    .then(function (doc) {
      return db.remove(doc);
    })
    .catch((err) => {
      throw err;
    });
}

export function fetchRecords() {
  return db.allDocs({
    startkey: 'document',
    endkey: 'document\ufff0',
    include_docs: true,
  });
}

export function fetchTags() {
  return db.allDocs({
    startkey: 'tag',
    endkey: 'tag\ufff0',
    include_docs: true,
  });
}

export function fetchNotes() {
  return db.allDocs({
    startkey: 'note',
    endkey: 'note\ufff0',
    include_docs: true,
  });
}
