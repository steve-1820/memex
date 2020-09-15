import React from 'react';
import ReactDOM from 'react-dom';
import './index.less';
import {
  Editor,
  EditorState,
  RichUtils,
  getDefaultKeyBinding,
  convertToRaw,
  convertFromRaw,
} from 'draft-js';
import {
  BoldOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  CodeOutlined,
  MenuUnfoldOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { Tooltip } from 'antd';
import { convertToHTML } from 'draft-convert';
import renderHTML from 'react-render-html';
import { connect } from 'react-redux';

const mapDispatchToProps = (dispatch) => {
  return {
    // dispatching plain actions
    addNote: (payload) => dispatch({ type: 'ADD_NOTE', payload }),
    updateNote: (payload) =>
      dispatch({ type: 'UPDATE_NOTE', payload }),
  };
};

class RichEditor extends React.Component {
  constructor(props) {
    super(props);

    if (props.contentState) {
      const contentState = convertFromRaw(props.contentState);
      const editorState = EditorState.createWithContent(contentState);
      this.state = { editorState: editorState };
    } else {
      this.state = { editorState: EditorState.createEmpty() };
    }

    this.focus = () => this.refs.editor.focus();
    this.onChange = (editorState) => this.setState({ editorState });

    this.handleKeyCommand = this._handleKeyCommand.bind(this);
    this.mapKeyToEditorCommand = this._mapKeyToEditorCommand.bind(this);
    this.toggleBlockType = this._toggleBlockType.bind(this);
    this.toggleInlineStyle = this._toggleInlineStyle.bind(this);
  }

  _handleKeyCommand(command, editorState) {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return true;
    }
    return false;
  }

  _mapKeyToEditorCommand(e) {
    if (e.keyCode === 9 /* TAB */) {
      const newEditorState = RichUtils.onTab(
        e,
        this.state.editorState,
        4 /* maxDepth */
      );
      if (newEditorState !== this.state.editorState) {
        this.onChange(newEditorState);
      }
      return;
    }
    return getDefaultKeyBinding(e);
  }

  _toggleBlockType(blockType) {
    this.onChange(RichUtils.toggleBlockType(this.state.editorState, blockType));
  }

  _toggleInlineStyle(inlineStyle) {
    this.onChange(
      RichUtils.toggleInlineStyle(this.state.editorState, inlineStyle)
    );
  }

  async _updateDb(endpoint, body, method = 'POST') {
    return await fetch(endpoint, {
      method, // or 'PUT'
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  async _saveContent() {
    const { editorState } = this.state;
    const { addNote } = this.props;
    const contentState = editorState.getCurrentContent();
    const contentStateRaw = convertToRaw(contentState);

    const time = new Date().getTime();
    const contentObj = {
      id: `note_${  time}`,
      _id: `note_${  time}`, // needed as pouchdb returns _id and we use that for render
      tags: [],
      updatedTime: time,
      createdTime: time,
      content: contentStateRaw,
    };

    const res = await this._updateDb('http://localhost:3000/notes', contentObj);
    if (res.ok) {
      addNote(contentObj);
      this.setState({
        editorState: EditorState.createEmpty(),
      });
    }
  }

  async _updateContent() {
    const { doc, id } = this.props;

    const newDoc = { ...doc}

    const { editorState } = this.state;
    const { updateNote } = this.props;
    const contentState = editorState.getCurrentContent();
    const contentStateRaw = convertToRaw(contentState);

    newDoc.content = contentStateRaw;
    newDoc.updatedTime = new Date().getTime();

    const res = await this._updateDb(`http://localhost:3000/notes/${  id}`, newDoc, 'PUT')

    if (res.ok) {
      updateNote(newDoc);
      this.props.resetReadOnly();
    }
  }

  render() {
    const { editorState } = this.state;
    const { readOnly, id } = this.props;

    // If the user changes block type before entering any text, we can
    // either style the placeholder or hide it. Let's just hide it now.
    let className = 'RichEditor-editor';
    let contentState = editorState.getCurrentContent();
    if (!contentState.hasText()) {
      if (contentState.getBlockMap().first().getType() !== 'unstyled') {
        className += ' RichEditor-hidePlaceholder';
      }
    }

    if (readOnly) {
      try {
        const html = convertToHTML(editorState.getCurrentContent());
        return <div>{renderHTML(html)}</div>;
      } catch (e) {
        return <div>{e.toString()}</div>;
      }
    }

    return (
      <div className="RichEditor-root">
        <div className={className} onClick={this.focus}>
          <Editor
            blockStyleFn={getBlockStyle}
            customStyleMap={styleMap}
            editorState={editorState}
            handleKeyCommand={this.handleKeyCommand}
            keyBindingFn={this.mapKeyToEditorCommand}
            onChange={this.onChange}
            // placeholder="Tell a story..."
            ref="editor"
            spellCheck
          />
        </div>
        <div className="RichEditor-controls-parent">
          <BlockStyleControls
            editorState={editorState}
            onBlockToggle={this.toggleBlockType}
            onStyleToggle={this.toggleInlineStyle}
          />
          {/* <InlineStyleControls */}
          {/*  editorState={editorState} */}
          {/*  onToggle={this.toggleInlineStyle} */}
          {/* /> */}
          <Tooltip title="Send">
            <SendOutlined
              onMouseDown={() => {
                console.log('clicked')
              if (id) {
                this._updateContent()
              } else {
                this._saveContent()
              }
            }}
style={{fontSize: 16, color: '#1890ff', cursor: 'pointer'}} />
          </Tooltip>
        </div>
      </div>
    );
  }
}

export default connect(null, mapDispatchToProps)(RichEditor);

// Custom overrides for "code" style.
const styleMap = {
  CODE: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    fontSize: 16,
    padding: 2,
  },
};

function getBlockStyle(block) {
  switch (block.getType()) {
    case 'blockquote':
      return 'RichEditor-blockquote';
    default:
      return null;
  }
}

class StyleButton extends React.Component {
  constructor() {
    super();
    this.onToggle = (e) => {
      e.preventDefault();
      this.props.onToggle(this.props.style);
    };
  }

  render() {
    let className = 'RichEditor-styleButton';
    if (this.props.active) {
      className += ' RichEditor-activeButton';
    }

    if (this.props.icon) {
      return (
        <Tooltip title={this.props.label}>
          <span
            className={className}
            style={{ fontSize: 16 }}
            onMouseDown={this.onToggle}
          >
            {this.props.icon}
          </span>
        </Tooltip>
      );
    }
    return (
      <Tooltip title={this.props.label}>
        <span className={className} onMouseDown={this.onToggle}>
          {this.props.label}
        </span>
      </Tooltip>
    );
  }
}

const BLOCK_TYPES = [
  { label: 'H1', style: 'header-one' },
  { label: 'H2', style: 'header-two' },
  { label: 'H3', style: 'header-three' },
  // {label: 'H4', style: 'header-four'},
  // {label: 'H5', style: 'header-five'},
  // {label: 'H6', style: 'header-six'},
  { label: 'Blockquote', style: 'blockquote', icon: <MenuUnfoldOutlined /> },
  {
    label: 'Unordered List',
    style: 'unordered-list-item',
    icon: <UnorderedListOutlined />,
  },
  {
    label: 'Ordered List',
    style: 'ordered-list-item',
    icon: <OrderedListOutlined />,
  },
  { label: 'Code Block', style: 'code-block', icon: <CodeOutlined /> },
];

const BlockStyleControls = (props) => {
  const { editorState } = props;
  const selection = editorState.getSelection();
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();

  const currentStyle = props.editorState.getCurrentInlineStyle();

  return (
    <span className="RichEditor-controls">
      {BLOCK_TYPES.map((type) => (
        <StyleButton
          key={type.label}
          active={type.style === blockType}
          label={type.label}
          onToggle={props.onBlockToggle}
          style={type.style}
          icon={type.icon ? type.icon : null}
        />
      )
      )}
      {INLINE_STYLES.map((type) => (
        <StyleButton
          key={type.label}
          active={currentStyle.has(type.style)}
          label={type.label}
          onToggle={props.onStyleToggle}
          style={type.style}
          icon={type.icon ? type.icon : null}
        />
      )
      )}
    </span>
  );
};

var INLINE_STYLES = [
  { label: 'Bold', style: 'BOLD', icon: <BoldOutlined /> },
  { label: 'Italic', style: 'ITALIC', icon: <ItalicOutlined /> },
  { label: 'Underline', style: 'UNDERLINE', icon: <UnderlineOutlined /> },
  // {label: 'Monospace', style: 'CODE'},
];

const InlineStyleControls = (props) => {
  const currentStyle = props.editorState.getCurrentInlineStyle();

  return (
    <span className="RichEditor-controls">
      {INLINE_STYLES.map((type) => (
        <StyleButton
          key={type.label}
          active={currentStyle.has(type.style)}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
          icon={type.icon ? type.icon : null}
        />
      )
      )}
    </span>
  );
};
