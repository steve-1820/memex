import React from 'react';
import RichEditor from '../Editor';
import './index.less';
import { Tag, Tooltip } from 'antd';
import { connect } from 'react-redux';
import {
  CommentOutlined,
  TagsOutlined,
  DeleteOutlined,
  FormOutlined,
} from '@ant-design/icons';

const mapStateToProps = (state) => ({ notes: state.note.notes });
const mapDispatchToProps = (dispatch) => {
  return {
    // dispatching plain actions
    deleteNote: (payload) => dispatch({ type: 'DELETE_NOTE', payload }),
  };
};

class Notes extends React.Component {
  state = {
    highlights: [],
    notes: [],
    highlightsAndNotes: [],
    readOnlyId: null,
  };

  componentDidMount(): void {
    this.getHighlights();
  }

  componentDidUpdate(prevProps, prevState): void {
    const { highlights } = this.state;
    const { notes } = this.props;

    if (highlights !== prevState.highlights || notes !== prevProps.notes) {
      this.mergeHighlightsAndNotes();
    }
  }

  mergeHighlightsAndNotes() {
    const { highlights } = this.state;
    const { notes } = this.props;
    const newArray = highlights.concat(notes);
    newArray.sort((a, b) => {
      if (!a.updatedTime) {
        return 1;
      }
      if (!b.updatedTime) {
        return -1;
      }
      if (a.updatedTime > b.updatedTime) {
        return -1;
      }
      return 1;
    });

    this.setState({
      highlightsAndNotes: newArray,
    });
  }

  async getHighlights() {
    const res = await fetch('http://localhost:3000/documents');
    const inboxItems = await res.json();
    const highlights = [];
    inboxItems.rows.forEach((row) => {
      if (row.doc.highlights.length !== 0) {
        highlights.push(row.doc);
      }
    });

    this.setState({
      highlights,
    });
  }

  getIcon(url) {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?sz=64&domain_url=${hostname}`;
  }

  async deleteNote(id) {
    const res = await fetch(`http://localhost:3000/notes/${id}`, {
      method: 'DELETE', // or 'PUT'
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (res.ok) {
      const { deleteNote } = this.props;
      deleteNote({ id });
    }
  }

  async editNote(id) {
    this.setState({
      readOnlyId: id,
    });
  }

  renderExtraOptions(id) {
    return (
      <div className="extra-options">
        <Tooltip
          title="Edit card"
          onClick={() => {
            this.editNote(id);
          }}
        >
          <FormOutlined className="option-icon" />
        </Tooltip>
        <Tooltip title="Add to card">
          <CommentOutlined className="option-icon" />
        </Tooltip>
        <Tooltip title="Add tags">
          <TagsOutlined className="option-icon" />
        </Tooltip>
        <Tooltip title="Delete">
          <DeleteOutlined
            onClick={() => {
              this.deleteNote(id);
            }}
            className="option-icon"
          />
        </Tooltip>
      </div>
    );
  }

  render() {
    const { highlightsAndNotes, readOnlyId } = this.state;
    return (
      <div style={{ padding: 32 }}>
        <RichEditor />
        {highlightsAndNotes.map((doc) => {
          if (doc._id.includes('document')) {
            return doc.highlights.map((highlight) => {
              return (
                <div
                  className="highlight-container"
                  key={`notes_${highlight.id}`}
                >
                  <div style={{ width: 4 }} className={highlight.className} />
                  <div className="highlight-body">
                    <div className="header">
                      <div>
                        <img
                          style={{ marginRight: 8 }}
                          height="12"
                          width="12"
                          src={this.getIcon(doc.url)}
                        />
                        <span>{new URL(doc.url).hostname}</span>
                      </div>
                      <span className="date">
                        {new Date(doc.createdTime).toDateString()}
                      </span>
                    </div>
                    <div className="tag-container">
                      {doc.tags.map((tag) => {
                        return (
                          <Tag
                            key={`${tag.label}_${tag.color}`}
                            className="tag-margin"
                            color={tag.color}
                          >
                            {tag.label}
                          </Tag>
                        );
                      })}
                    </div>
                    <div className="text">{highlight.selectedText}</div>
                  </div>
                </div>
              );
            });
          }
          if (doc._id.includes('note')) {
            return (
              <div className="note-card" key={doc._id}>
                <div
                  style={{ width: 4, backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
                />
                <div style={{ flex: 1, padding: 8 }}>
                  <div className="header">
                    <div>
                      <span>📝</span>
                    </div>
                    <span className="date">
                      {new Date(doc.createdTime).toDateString()}
                    </span>
                  </div>
                  <div className="tag-container">
                    {doc.tags &&
                      doc.tags.map((tag) => {
                        return (
                          <Tag
                            key={`${tag.label}_${tag.color}`}
                            className="tag-margin"
                            color={tag.color}
                          >
                            {tag.label}
                          </Tag>
                        );
                      })}
                  </div>
                  <div style={{ width: '100%', fontSize: 12 }}>
                    <RichEditor
                      contentState={doc.content}
                      id={doc._id}
                      doc={doc}
                      readOnly={readOnlyId !== doc._id}
                      resetReadOnly={() => {
                        this.setState({ readOnlyId: null });
                      }}
                    />
                  </div>
                  {this.renderExtraOptions(doc._id)}
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Notes);
