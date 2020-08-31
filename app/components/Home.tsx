import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Tooltip } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { connect } from 'react-redux';
import routes from '../constants/routes.json';
import styles from './Home.css';
import { Layout, Header, Footer, Main, Side } from './Layout';
import GraphDrawer from './Core/GraphDrawer';
import SelectedDocumentDrawer from './Core/SelectedDocument/Drawer';
import OperatorBar from './Core/OperatorBar';
import './Layout/index.css';
import { TreeGraphReact } from './Core/Graph';
import Graphin, { Utils } from '../packages/graphin/src';
import Notes from './Core/Notes';
import Inbox from './Core/Inbox';
import TagManagement from './Core/TagManagement';

const hexColor = {
  pink: '#eb2f96',
  magenta: '#eb2f96',
  red: '#f5222d',
  volcano: '#fa541c',
  orange: '#fa8c16',
  yellow: '#fadb14',
  gold: '#faad14',
  cyan: '#13c2c2',
  lime: '#a0d911',
  green: '#52c41a',
  blue: '#1890ff',
  geekblue: '#2f54eb',
  purple: '#722ed1',
};

const mapDispatchToProps = (dispatch) => {
  return {
    // dispatching plain actions
    selectDoc: (payload) => dispatch({ type: 'SELECT_DOCUMENT', payload }),
    resetSelectedDoc: () => dispatch({ type: 'RESET_SELECTED_DOC' }),
  };
};

const mapStateToProps = (state) => ({ layout: state.layout });

const OnlyGraphinReady = (props) => {
  const { children, graphRef } = props;

  if (graphRef && graphRef.current && graphRef.current.graph) {
    const { graph, apis } = graphRef.current;
    const graphProps = {
      graph,
      apis,
    };

    return (
      <div>
        {React.Children.map(children, (child) => {
          // 如果传入的是 DOM 元素或不是合法的 Element，不传入 props
          if (!React.isValidElement(child) || typeof child.type === 'string') {
            return child;
          }
          return React.cloneElement(child, {
            ...graphProps,
          });
        })}
      </div>
    );
  }
  return null;
};

export class Home extends React.Component {
  state = {
    data: [],
    dependencies: {
      nodes: [],
      edges: [],
    },
  };

  graphRef = React.createRef();

  handlingNodeClick = false;

  componentDidMount(): void {
    this.getInbox();
    this.attachNodeClick();
  }

  componentWillUnmount(): void {
    this.removeNodeClick();
  }

  componentDidUpdate(prevProps, prevState): void {
    const { layout } = this.props;

    if (
      layout.page === 'graph' &&
      prevProps.layout &&
      prevProps.layout.page !== layout.page
    ) {
      console.log('page change and attaching nodes');
      this.attachNodeClick();
    } else {
      this.removeNodeClick();
    }
  }

  attachNodeClick() {
    if (this.graphRef && this.graphRef.current) {
      const { graph } = this.graphRef.current;
      graph.on('node:click', this.handleNodeClick.bind(this));
    }
  }

  removeNodeClick() {
    if (this.graphRef && this.graphRef.current) {
      const { graph } = this.graphRef.current;
      graph.off('node:click', this.handleNodeClick.bind(this));
    }
  }

  async handleNodeClick(e) {
    // if you click a node, the event fires multiple times
    if (!this.handlingNodeClick) {
      const { selectDoc } = this.props;
      console.log('node:click', e.item.get('model'));
      const docId = e.item.get('model').id;
      if (!docId || e.item.get('model').type === 'CircleNode') {
        return;
      }
      this.handlingNodeClick = true;
      const res = await fetch(`http://localhost:3000/documents/${docId}`);
      const json = await res.json();

      selectDoc(json);
      this.handlingNodeClick = false;
    }
  }

  async getInbox() {
    const res = await fetch('http://localhost:3000/documents');
    const inboxItems = await res.json();
    console.log(inboxItems.rows);

    const dependencies = {
      nodes: [],
      edges: [],
    };

    const tags = {};
    const pushedNodeIds = {};

    inboxItems.rows.forEach((row, index1) => {
      if (row.doc.committed) {
        const { hostname } = new URL(row.doc.url);
        let totalClickAndMouseOver = 0;
        for (const element in row.doc.behaviour.elements) {
          const el = row.doc.behaviour.elements[element];
          if (el.stats && el.stats.click) {
            totalClickAndMouseOver += el.stats.click;
          }
          if (el.stats && el.stats.mouseover) {
            totalClickAndMouseOver += el.stats.mouseover;
          }
        }
        dependencies.nodes.push({
          // id: row.doc._id,
          // data: {
          //   id: row.doc._id,
          //   label: row.doc.title,
          //   fullLabel: row.doc.title,
          //   img: 'https://www.google.com/s2/favicons?sz=64&domain_url=' + hostname,
          //   textSize: 140,
          // }
          data: {
            id: row.doc._id,
            label: row.doc.title,
            children: row.doc.children,
            properties: [],
          },
          style: {
            nodeSize: 20 + totalClickAndMouseOver / 2,
          },
          id: row.doc._id,
          label: row.doc.title,
          shape: 'CustomNode',
          img: `https://www.google.com/s2/favicons?sz=64&domain_url=${hostname}`,
        });
        pushedNodeIds[row.doc._id] = true;
        row.doc.tags.forEach((tag) => {
          if (!tags[`${tag.label}_${tag.color}`]) {
            tags[`${tag.label}_${tag.color}`] = [];
          }
          tags[`${tag.label}_${tag.color}`].push(row.doc._id);
        });
      }
    });

    for (const node of dependencies.nodes) {
      // console.log('node', node)
      node.data.children.forEach((child, idx) => {
        // console.log(pushedNodeIds[node.id], pushedNodeIds['document_' + child.id])
        if (pushedNodeIds[node.id] && pushedNodeIds[`document_${child.id}`]) {
          // console.log('add edge')
          dependencies.edges.push({
            source: node.id,
            target: `document_${child.id}`,
            shape: 'CurveEdge',
            style: {
              line: {
                width: 2,
              },
            },
            data: {
              source: node.id,
              target: `document_${child.id}`,
            },
          });
        }
      });
    }

    const completedRelationships = {};

    for (const tag in tags) {
      const label = tag.split('_')[0];
      const color = tag.split('_')[1];
      console.log('color', color);
      dependencies.nodes.push({
        data: {
          id: tag,
          label,
          properties: [],
        },
        style: {
          nodeSize: 20 + tags[tag].length * 10,
          fontSize: 12 + tags[tag].length * 2,
          fontWeight: 'bold',
          primaryColor: hexColor[color],
        },
        id: tag,
        label,
        shape: 'CircleNode',
      });

      tags[tag].forEach((tag1, idx1) => {
        // tags[tag].forEach((tag2, idx2) => {
        //   if (tag1 !== tag2 && !completedRelationships[`${tag1}_${tag2}`] && !completedRelationships[`${tag2}_${tag1}`]) {
        //     dependencies.edges.push({
        //       source: tag1,
        //       target: tag2
        //     })
        //     completedRelationships[`${tag1}_${tag2}`] = true
        //     completedRelationships[`${tag2}_${tag1}`] = true
        //   }
        // })
        dependencies.edges.push({
          source: tag1,
          target: tag,
          shape: 'CurveEdge',
          style: {
            line: {
              width: 2,
            },
          },
          data: {
            source: tag1,
            target: tag,
          },
        });
      });
    }

    this.setState({
      data: inboxItems.rows,
      dependencies,
    });
  }

  getContext() {
    return this;
  }

  renderPage() {
    const { dependencies } = this.state;
    const { layout } = this.props;
    if (layout.page === 'graph') {
      return (
        <Graphin
          ref={this.graphRef}
          data={dependencies}
          layout={{
            name: 'force',
            options: {},
          }}
        />
      );
    }
    if (layout.page === 'notes') {
      return <Notes />;
    }
    if (layout.page === 'inbox') {
      return <Inbox />;
    }
    if (layout.page === 'tag_management') {
      return <TagManagement />;
    }
    return null;
  }

  renderHeader() {
    const { dependencies } = this.state;
    const { layout } = this.props;
    if (layout.page === 'graph') {
      return (
        <span style={{ fontWeight: 600, fontSize: 18 }}>
          <span style={{ marginRight: 16 }}>🗺</span>
          <span>Knowledge Map</span>
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
        </span>
      );
    }
    if (layout.page === 'notes') {
      return (
        <span style={{ fontWeight: 600, fontSize: 18 }}>
          <span style={{ marginRight: 16 }}>📓</span>
          <span>Notes & Highlights</span>
        </span>
      );
    }
    if (layout.page === 'inbox') {
      return (
        <span style={{ fontWeight: 600, fontSize: 18 }}>
          <span style={{ marginRight: 16 }}>📥</span>
          <span>Inbox</span>
        </span>
      );
    }
    if (layout.page === 'tag_management') {
      return (
        <span style={{ fontWeight: 600, fontSize: 18 }}>
          <span style={{ marginRight: 16 }}>🤖</span>
          <span>Tag Management</span>
        </span>
      );
    }
    return null;
  }

  render() {
    const { layout } = this.props;
    return (
      <Layout>
        <Header>{this.renderHeader()}</Header>
        <Side>
          <OperatorBar />
        </Side>
        <Main>
          {/* <Graph data={data} layout={layout} toolbar={toolbar} dispatch={dispatch} store={state} /> */}
          {/* <OnlyGraphinReady graphRef={this.graphRef}> */}
          {/* <GraphDrawer dispatch={dispatch} state={state} /> */}
          {/* <GraphModal dispatch={dispatch} state={state} /> */}
          {/* <SearchBar dispatch={dispatch} state={state} /> */}
          {/* </OnlyGraphinReady> */}
          {/* <TreeGraphReact dependencies={dependencies}/> */}
          {this.renderPage()}
          <GraphDrawer />
          {layout.page !== 'inbox' ? <SelectedDocumentDrawer /> : null}
        </Main>
        {/* <Footer>Footer</Footer> */}
      </Layout>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Home);
