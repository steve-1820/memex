import React from 'react';
import { connect, Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { hot } from 'react-hot-loader/root';
import { History } from 'history';
import { Store } from '../store';
import Routes from '../Routes';

type Props = {
  store: Store;
  history: History;
};

// const Root = ({ store, history }: Props) => (
//   <Provider store={store}>
//     <ConnectedRouter history={history}>
//       <Routes />
//     </ConnectedRouter>
//   </Provider>
// );

const mapDispatchToProps = (dispatch) => {
  return {
    // dispatching plain actions
    initialiseNotes: (payload) =>
      dispatch({ type: 'INITIALISE_NOTES', payload }),
  };
};

class Root extends React.Component {
  componentWillMount(): void {
    this.getNotes();
  }

  async getNotes() {
    const { initialiseNotes } = this.props;
    const res = await fetch('http://localhost:3000/notes');
    const notesJson = await res.json();
    const notes = [];
    console.log('notesJson', notesJson);
    notesJson.rows.forEach((row) => {
      notes.push(row.doc);
    });

    initialiseNotes(notes);
  }

  render() {
    const { store, history } = this.props;
    return (
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <Routes />
        </ConnectedRouter>
      </Provider>
    );
  }
}

// export default connect(mapStateToProps, mapDispatchToProps)(GraphDrawer);
export default connect(null, mapDispatchToProps)(hot(Root));
