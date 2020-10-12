// @ts-ignore
import express from 'express';
// @ts-ignore
import bodyParser from 'body-parser';
import {
  addRecord,
  fetchRecords,
  fetchRecord,
  fetchTags,
  fetchNotes,
  deleteRecord,
} from './db';

var cors = require('cors')

const app = express();

function asyncWrapper(fn) {
  return (req, res, next) => {
    return Promise.resolve(fn(req))
      .then((result) => res.send(result))
      .catch((err) => next(err));
  };
}

app.options('*', cors())

app.use(bodyParser.json({ limit: '200mb' }));

app.post('/documents', cors(), (req: any, res: any) => {
  if (Object.keys(req.body).length !== 0 && req.body.constructor === Object) {
    for (const key in req.body) {
      if (req.body[key].title && req.body[key].excerpt) {
        console.log('adding key', key);
        addRecord(`document_${key}`, req.body[key]);
      }
    }
  }
  res.sendStatus(200);
});

app.put('/documents', cors(), (req: any, res: any) => {
  console.log(req.body);
  if (req.body.length > 0) {
    req.body.forEach((doc) => {
      console.log('updating key', doc._id);
      addRecord(doc._id, doc);
    });
  }
  res.sendStatus(200);
});

app.get('/documents/:documentId', cors(), async (req: any, res: any) => {
  if (req.params && req.params.documentId) {
    const { documentId } = req.params;
    console.log('getting key', documentId, req.body);
    // asyncWrapper(fetchRecord(documentId))
    const data = await fetchRecord(documentId);
    // console.log('data', data)
    res.send(data);
  }
  res.send(500);
});

app.post('/documents/:documentId', cors(), (req: any, res: any) => {
  if (req.params && req.params.documentId) {
    const { documentId } = req.params;
    console.log('updating key', documentId, req.body);
    addRecord(documentId, req.body);
  }
  res.sendStatus(200);
});

app.post('/tags', cors(), (req: any, res: any) => {
  if (req.body && req.body.color && req.body.label) {
    console.log(req.body);
    addRecord(`tag_${req.body.color}_${req.body.label}`, req.body);
  }
  res.sendStatus(200);
});

app.post('/notes', cors(), (req: any, res: any) => {
  if (req.body) {
    console.log(req.body);
    addRecord(req.body.id, req.body);
  }
  res.sendStatus(200);
});

app.delete('/notes/:notesId', cors(), (req: any, res: any) => {
  if (req.params && req.params.notesId) {
    const { notesId } = req.params;
    console.log('deleting key', notesId, req.body);
    deleteRecord(notesId);
  }
  res.sendStatus(200);
});

app.put('/notes/:notesId', cors(), (req: any, res: any) => {
  try {
    if (req.params && req.params.notesId) {
      const { notesId } = req.params;
      console.log('updating note key', notesId, req.body);
      addRecord(notesId, req.body);
    }
    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(500);
  }
});

app.get('/documents', cors(), asyncWrapper(fetchRecords));

app.get('/tags', cors(), asyncWrapper(fetchTags));

app.get('/notes', cors(), asyncWrapper(fetchNotes));

app.listen(3000, () => console.log('Example app listening on port 3000!'));
