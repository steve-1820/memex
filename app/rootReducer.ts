import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import { History } from 'history';

const initialLayoutState = {
  data: {
    nodes: [],
    edges: [],
  },
  inbox: {
    primary: [],
    other: [],
  },
  layout: {
    name: 'force',
    options: {
      preset: {
        name: 'concentric',
      },
    },
  },
  selectedNodes: [],
  drawer: {
    visible: false,
    type: '',
  },
  modal: {
    visible: false,
  },
  searchBar: {
    visible: false,
  },
  page: 'inbox',
};

function layoutReducer(state = initialLayoutState, action: any) {
  const newState = { ...state };
  switch (action.type) {
    case 'TOGGLE_DRAWER':
      newState.drawer = action.payload;
      return newState;
    case 'INBOX_PRIMARY':
      newState.inbox.primary = action.payload;
      return newState;
    case 'CHANGE_PAGE':
      newState.page = action.payload.page;
      return newState;
    default:
      return state;
  }
}

function documentReducer(state = { selectedDoc: {} }, action: any) {
  const newState = { ...state };
  switch (action.type) {
    case 'SELECT_DOCUMENT':
      console.log('SELECT_DOCUMENT', action.payload);
      newState.selectedDoc = action.payload;
      return newState;
    case 'RESET_SELECTED_DOC':
      console.log('RESET_SELECTED_DOC');
      newState.selectedDoc = {};
      return newState;
    default:
      return state;
  }
}

function notesReducer(state = { notes: [] }, action: any) {
  const newState = { ...state };
  switch (action.type) {
    case 'ADD_NOTE': {
      const newArr = [...newState.notes];
      newArr.push(action.payload);
      newState.notes = newArr;
      return newState;
    }
    case 'DELETE_NOTE': {
      const newArr = [...newState.notes];
      const index = newArr.findIndex((note) => {
        return note._id === action.payload.id;
      });
      if (index > -1) {
        newArr.splice(index, 1);
      }
      newState.notes = newArr;
      return newState;
    }
    case 'UPDATE_NOTE': {
      const newArr = [...newState.notes];
      console.log('newArr', newArr);
      const index = newArr.findIndex((note) => {
        return note._id === action.payload.id;
      });
      console.log('index', index, newArr);
      if (index > -1) {
        newArr[index] = { ...action.payload };
      }
      newState.notes = newArr;
      return newState;
    }
    case 'INITIALISE_NOTES': {
      newState.notes = action.payload;
      return newState;
    }
    default:
      return state;
  }
}

export default function createRootReducer(history: History) {
  return combineReducers({
    router: connectRouter(history),
    layout: layoutReducer,
    document: documentReducer,
    note: notesReducer,
  });
}
