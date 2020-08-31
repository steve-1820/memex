import React from 'react';
import {
  Drawer,
  Checkbox,
  Button,
  Tooltip,
  Spin,
  Select,
  Tag,
  Empty,
} from 'antd';
import './index.less';
import { connect } from 'react-redux';
import BrowserView, { removeViews } from 'react-electron-browser-view';
import {
  HighlightOutlined,
  FieldTimeOutlined,
  EnterOutlined,
  FileAddOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

import rangy from 'rangy';
import { GraphDrawerProps } from './interface';
import 'rangy/lib/rangy-highlighter';
import 'rangy/lib/rangy-classapplier';
import 'rangy/lib/rangy-serializer';
import 'rangy/lib/rangy-selectionsaverestore.js';

const { Option } = Select;

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

class SelectedDocument extends React.Component {
  state = {
    tags: [],
    tagInputValue: '',
    loading: false,
  };

  webview = null;

  componentDidMount(): void {
    this.getTags();
  }

  async getTags() {
    const res = await fetch('http://localhost:3000/tags');
    const tagsData = await res.json();

    const tags = [];

    tagsData.rows.forEach((tag) => {
      tags.push(tag.doc);
    });
    console.log('tags', tags);
    this.setState(
      {
        tags,
      },
      () => {
        this.setState({
          loading: false,
        });
      }
    );
  }

  chooseColor() {
    const { tags } = this.state;

    const colors = [];

    tags.forEach((tag) => {
      colors.push(tag.color);
    });

    for (const tagColor of tagColors) {
      if (!colors.includes(tagColor)) {
        console.log('_chooseColor', tagColor);
        return tagColor;
      }
    }

    return tagColors[Math.floor(Math.random() * (tagColors.length - 1))];
  }

  addTag() {
    const { tagInputValue, tags } = this.state;
    const color = this.chooseColor();
    const tag = {
      color,
      label: tagInputValue,
    };
    this.addTagToDoc(tagInputValue, color);

    let exist = false;
    tags.forEach((tag) => {
      if (tag.label === tagInputValue) {
        exist = true;
      }
    });

    if (!exist) {
      this.setState(
        {
          tags: [...tags, tag],
        },
        () => {
          this.updateDb('http://localhost:3000/tags', tag);
        }
      );
    }
  }

  addTagToDoc(label, color) {
    const { selectedDoc } = this.props;
    const newSelectedDoc = { ...selectedDoc };
    if (!newSelectedDoc.tags) {
      newSelectedDoc.tags = [];
    }
    const tag = {
      color,
      label,
    };

    let exist = false;
    newSelectedDoc.tags.forEach((tag) => {
      if (tag.label === label) {
        exist = true;
      }
    });

    if (!exist) {
      newSelectedDoc.tags.push(tag);
      this.setState(
        {
          selectedDoc: newSelectedDoc,
        },
        () => {
          newSelectedDoc.updatedTime = new Date().getTime();
          this.updateDb(
            `http://localhost:3000/documents/${newSelectedDoc._id}`,
            newSelectedDoc
          );
        }
      );
    }
  }

  removeTagFromDoc(label) {
    const { selectedDoc } = this.props;
    const newSelectedDoc = { ...selectedDoc };
    const findIndex = newSelectedDoc.tags.findIndex((tag, index) => {
      if (tag.label === label) {
        return true;
      }
    });
    if (findIndex > -1) {
      newSelectedDoc.tags.splice(findIndex, 1);
    }
    this.setState(
      {
        selectedDoc: newSelectedDoc,
      },
      () => {
        newSelectedDoc.updatedTime = new Date().getTime();
        this.updateDb(
          `http://localhost:3000/documents/${newSelectedDoc._id}`,
          newSelectedDoc
        );
      }
    );
  }

  async updateDb(endpoint, body, method = 'POST') {
    await fetch(endpoint, {
      method, // or 'PUT'
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  render() {
    const { layout, selectedDoc, resetSelectedDoc } = this.props;
    const { tags, tagInputValue, loading } = this.state;
    const { width } = layout.drawer;

    let readerWidth = '50%';
    if (width) {
      readerWidth = window.innerWidth - width - 48;
    }

    return (
      <div>
        {Object.keys(selectedDoc).length !== 0 ? (
          <div style={{ display: 'flex' }}>
            <div
              style={{
                flex: 1,
                borderRight: '1px solid #EFEFEF',
                padding: 8,
                maxWidth: 250,
              }}
            >
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontWeight: 600 }}>My Tags</div>
                <div
                  style={{
                    display: 'flex',
                    margin: '16px 0',
                    flexWrap: 'wrap',
                  }}
                >
                  {selectedDoc.tags.map((tag) => {
                    return (
                      <div key={`${tag.label}_${tag.color}`}>
                        <Tag
                          style={{ margin: 4 }}
                          closable
                          onClose={() => {
                            this.removeTagFromDoc(tag.label);
                          }}
                          color={tag.color}
                        >
                          {tag.label}
                        </Tag>
                        {/* <div style={{width: '100%', padding: 8, fontSize: 12}}>{highlight.selectedText}</div> */}
                      </div>
                    );
                  })}
                </div>
                <Select
                  notFoundContent={
                    <div className="select-option">
                      <div>
                        <span style={{ fontSize: 12, marginRight: 8 }}>
                          Create
                        </span>
                        <Tag>{tagInputValue}</Tag>
                      </div>
                      <EnterOutlined />
                    </div>
                  }
                  size="small"
                  showSearch
                  placeholder="Type..."
                  // defaultOpen={true}
                  style={{ width: 220 }}
                  // className={contentStyles['tag-input']}
                  value={tagInputValue}
                  onChange={(value) => {
                    this.addTagToDoc(value.split('_')[0], value.split('_')[1]);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  onSearch={(val) => {
                    this.setState({ tagInputValue: val });
                  }}
                  // onBlur={() => {this.handleEditInputConfirm(result.id)}}
                  // onInputKeyDown={(e) => console.log(e)}
                  onKeyDown={(e) => {
                    if (e.keyCode === 13) {
                      this.addTag();
                    }
                  }}
                >
                  {tags.length > 0 ? (
                    <span style={{ fontSize: 10 }}>
                      Choose an existing option or create one
                    </span>
                  ) : (
                    <span style={{ fontSize: 10 }}>
                      Start typing to create a new tag
                    </span>
                  )}

                  {tags.map((tag, index) => {
                    return (
                      <Option
                        key={`unique_tag_selection_${index}`}
                        value={`${tag.label}_${tag.color}`}
                      >
                        <div className="select-option">
                          <Tag color={tag.color}>{tag.label}</Tag>
                          <div className="select-option-enter">
                            <EnterOutlined />
                          </div>
                        </div>
                      </Option>
                    );
                  })}
                </Select>
              </div>
              <div style={{ fontWeight: 600 }}>My Highlights</div>
              {selectedDoc.highlights.map((highlight) => {
                return (
                  <div
                    style={{ display: 'flex', margin: '12px 0px' }}
                    key={highlight.id}
                  >
                    <div style={{ width: 4 }} className={highlight.className} />
                    <div style={{ width: '100%', padding: 8, fontSize: 12 }}>
                      {highlight.selectedText}
                    </div>
                  </div>
                );
              })}
              <div style={{ fontWeight: 600 }}>My Notes</div>
            </div>
            {/* <div */}
            {/*  style={{padding: 16, background: '#f4ecd8', flex: 2}} */}
            {/*  id={'reader'} */}
            {/*  dangerouslySetInnerHTML={{ __html: selectedDoc.content }} */}
            {/* /> */}
            <BrowserView
              ref={(webview) => {
                this.webview = webview;
              }}
              onDomReady={() => {
                // rangy.init()
                // let highlighter = rangy.createHighlighter()
                // let classApplierModule = rangy.modules.ClassApplier
                //
                // const highlightPurple = rangy.createClassApplier('inline-tool-bar--highlight-purple')
                // const highlightBlue = rangy.createClassApplier('inline-tool-bar--highlight-blue')
                // const highlightGreen = rangy.createClassApplier('inline-tool-bar--highlight-green')
                // const highlightOrange = rangy.createClassApplier('inline-tool-bar--highlight-orange')
                // const highlightRed = rangy.createClassApplier('inline-tool-bar--highlight-red')
                //
                // highlighter.addClassApplier(highlightPurple)
                // highlighter.addClassApplier(highlightBlue)
                // highlighter.addClassApplier(highlightGreen)
                // highlighter.addClassApplier(highlightOrange)
                // highlighter.addClassApplier(highlightRed)
                //
                // { selectedDoc.highlights.map((highlight => {
                //   console.log('deserialize')
                //   highlighter.deserialize(highlight.serializedHighlight)
                // })) }
              }}
              style={{ flex: 2, height: window.innerHeight }}
              src={selectedDoc.url}
            />
          </div>
        ) : (
          <div style={{ marginTop: 50 }}>
            <Empty
              description={'<- Select an item in your inbox to preview.'}
            />
          </div>
        )}
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SelectedDocument);
