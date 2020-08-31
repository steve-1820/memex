import React from 'react';
import { Drawer } from 'antd';
import { connect } from 'react-redux';
import SelectedDocument from '../index';

const mapStateToProps = (state) => ({
  layout: state.layout,
  selectedDoc: state.document.selectedDoc,
});

const mapDispatchToProps = (dispatch) => {
  return {
    // dispatching plain actions
    handleClose: () =>
      dispatch({
        type: 'TOGGLE_DRAWER',
        payload: { visible: false, type: '', width: null },
      }),
    selectDoc: (payload) => dispatch({ type: 'SELECT_DOCUMENT', payload }),
    resetSelectedDoc: () => dispatch({ type: 'RESET_SELECTED_DOC' }),
  };
};

const tagColors = [
  'green',
  'blue',
  'orange',
  'cyan',
  'magenta',
  'geekblue',
  'purple',
  'gold',
  'red',
  'volcano',
];

class SelectedDocumentDrawer extends React.Component {
  render() {
    const { layout, selectedDoc, resetSelectedDoc } = this.props;
    const { width } = layout.drawer;

    let readerWidth = '50%';
    if (width) {
      readerWidth = window.innerWidth - width - 48;
    }

    return (
      <div>
        <Drawer
          title="Reader"
          width={readerWidth}
          height="100%"
          closable
          style={{ zIndex: 1001 }}
          onClose={() => {
            resetSelectedDoc();
          }}
          placement="right"
          mask={false}
          visible={!!Object.keys(selectedDoc).length}
        >
          <SelectedDocument />
        </Drawer>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SelectedDocumentDrawer);
