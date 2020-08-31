import React from 'react';
import { Drawer, Checkbox, Button, Tooltip, Spin, Tabs, Tag } from 'antd';
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
import { GraphDrawerProps } from './interface';

const { TabPane } = Tabs;

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

class GraphDrawer extends React.Component {
  state = {
    data: [],
    selectedDoc: null,
    docsToCommit: [],
    loading: false,
  };

  webview = null;

  componentDidMount(): void {
    removeViews();
    this.getInbox();
  }

  async getInbox() {
    this.setState({
      loading: true,
    });
    const res = await fetch('http://localhost:3000/documents');
    const inboxItems = await res.json();
    this.setState(
      {
        data: inboxItems.rows,
      },
      () => {
        this.setState({
          loading: false,
        });
      }
    );
  }

  selectDoc(doc) {
    const { selectDoc } = this.props;
    if (doc.doc) {
      selectDoc(doc.doc);
    }
  }

  resetSelectedDoc() {
    const { resetSelectedDoc } = this.props;
    resetSelectedDoc();
  }

  getIcon(url) {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?sz=64&domain_url=${hostname}`;
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

  commitDocument(document) {
    this.setState({
      docsToCommit: [...this.state.docsToCommit, document],
    });
  }

  async confirmCommitDocs() {
    const { docsToCommit } = this.state;
    const newDocsToCommit = docsToCommit.map((doc) => {
      doc.doc.committed = true;
      doc.doc.updatedTime = new Date().getTime();
      return doc.doc;
    });
    await this.updateDb(
      'http://localhost:3000/documents',
      newDocsToCommit,
      'PUT'
    );
    await this.getInbox();
  }

  renderUserBehaviour(behaviour, highlights) {
    const scrollLength =
      behaviour.page && behaviour.page.scrollLength
        ? behaviour.page.scrollLength
        : 0;
    const timeOnPage =
      behaviour.page && behaviour.page.timeOnPage
        ? behaviour.page.timeOnPage / 60
        : 0;
    let totalClicks = 0;
    let totalHover = 0;
    if (behaviour.elements && Object.keys(behaviour.elements).length > 0) {
      for (const element in behaviour.elements) {
        const el = behaviour.elements[element];
        if (el.stats && el.stats.click) {
          totalClicks += el.stats.click;
        }
        if (el.stats && el.stats.mouseover) {
          totalHover += el.stats.mouseover;
        }
      }
    }
    return (
      <>
        <span>
          <HighlightOutlined />:{highlights.length}
        </span>
        <span className="stat-separator" />
        <span>
          <FieldTimeOutlined />:{timeOnPage.toFixed(1)}m
        </span>
        <span className="stat-separator" />
        <span>
          Scroll:
          {scrollLength}
          px
        </span>
        <span className="stat-separator" />
        <span>
          Clicks:
          {totalClicks}{' '}
        </span>
        <span className="stat-separator" />
        <span>
          Hover:
          {totalHover}{' '}
        </span>
      </>
    );
  }

  renderInboxItem(item) {
    return (
      <div
        onClick={() => {
          this.selectDoc(item);
        }}
        className="inbox-item-container"
        key={item.id}
      >
        <div className="inbox-item-header">
          <Checkbox
            onClick={(e) => {
              e.stopPropagation();
              this.commitDocument(item);
            }}
            style={{ marginRight: 8 }}
          />
          <span className="inbox-item-title">{item.doc.title}</span>
        </div>
        <div className="inbox-item-body">
          <span>
            <img
              style={{ marginRight: 8 }}
              height="12"
              width="12"
              src={this.getIcon(item.doc.url)}
            />
            <span>{new URL(item.doc.url).hostname}</span>
          </span>
          <span className="inbox-item-date">
            {new Date(item.doc.createdTime).toDateString()}
          </span>
        </div>
        <div style={{ fontSize: 12 }} className="text-max-two-lines">
          {item.doc.excerpt}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '4px 0',
            fontSize: 11,
          }}
        >
          {this.renderUserBehaviour(item.doc.behaviour, item.doc.highlights)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0' }}>
          {item.doc.tags.map((tag) => {
            return (
              <Tag
                key={`${tag.label}_${tag.color}`}
                style={{ margin: '4px 4px 4px 0' }}
                color={tag.color}
              >
                {tag.label}
              </Tag>
            );
          })}
        </div>
      </div>
    );
  }

  render() {
    const { handleClose, layout, selectedDoc } = this.props;
    const { data, loading } = this.state;
    const { visible, width, title, closeMask = false } = layout.drawer;

    return (
      <div>
        <Drawer
          width={width}
          title={title}
          style={{ left: 48 }}
          placement="left"
          closable
          mask={!closeMask}
          onClose={() => {
            handleClose();
            this.resetSelectedDoc();
          }}
          visible={visible}
        >
          {loading ? (
            <div className="loading-screen">
              <Spin />
            </div>
          ) : null}
          <div className="inbox-drawer-header">
            <div>
              <Checkbox />
            </div>
            <div>
              <Tooltip placement="left" title="Commit">
                <Button
                  style={{ border: 'none' }}
                  onClick={() => {
                    this.confirmCommitDocs();
                  }}
                  shape="circle"
                  icon={<FileAddOutlined style={{ fontSize: 14 }} />}
                />
              </Tooltip>
              <Tooltip placement="left" title="Refresh">
                <Button
                  style={{ border: 'none' }}
                  onClick={() => {
                    this.getInbox();
                  }}
                  shape="circle"
                  icon={<ReloadOutlined style={{ fontSize: 14 }} />}
                />
              </Tooltip>
            </div>
          </div>
          <div style={{ padding: '0px 16px' }}>
            <Tabs defaultActiveKey="1">
              <TabPane tab="Uncommitted" key="uncommitted">
                {data.map((item: any) => {
                  if (!item.doc.committed) {
                    return this.renderInboxItem(item);
                  }
                })}
              </TabPane>
              <TabPane tab="Committed" key="committed">
                {data.map((item: any) => {
                  if (item.doc.committed) {
                    return this.renderInboxItem(item);
                  }
                })}
              </TabPane>
            </Tabs>
          </div>
        </Drawer>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(GraphDrawer);
