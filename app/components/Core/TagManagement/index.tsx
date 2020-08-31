// import React from 'react';
import './index.less';
import { connect } from 'react-redux';
import React, { useEffect, useState } from 'react';
import G6 from '@antv/g6';

const mapStateToProps = (state) => ({ notes: state.note.notes });
const mapDispatchToProps = (dispatch) => {
  return {
    // dispatching plain actions
    deleteNote: (payload) => dispatch({ type: 'DELETE_NOTE', payload }),
  };
};

// export const TreeGraphReact = ({ dependencies }): ReactElement => {
//   const ref = React.useRef(null);
//
//   useEffect(() => {
//     let graph = null
//     graph = createGraph(ref, dependencies);
//     return () => {
//       graph.destroy();
//     };
//   }, [dependencies])
//
//   return  <div style={{height: '100%', width: '100%'}} ref={ref} />
// };

class TagManagement extends React.Component {
  state = {};

  ref = React.createRef();

  graph = null;

  componentDidMount(): void {
    this.graph = createGraph(this.ref);
  }

  componentWillUnmount(): void {
    this.graph && this.graph.destroy();
  }

  render() {
    return (
      <div
        style={{ height: '100%', width: '100%', background: 'white' }}
        ref={this.ref}
      />
    );
  }
}

function createGraph(ref: React.MutableRefObject<any>) {
  const container = ref.current;
  const descriptionDiv = document.createElement('div');
  descriptionDiv.innerHTML =
    'Move a subtree to a new parent by dragging the root node of the subtree.';
  container.appendChild(descriptionDiv);

  fetch(
    'https://gw.alipayobjects.com/os/antvdemo/assets/data/algorithm-category.json'
  )
    .then((res) => res.json())
    .then((data) => {
      const width = ref.current.scrollWidth;
      const height = ref.current.scrollHeight || 500;
      const graph = new G6.TreeGraph({
        container: ref.current,
        width,
        height,
        modes: {
          default: [
            'drag-canvas',
            'zoom-canvas',
            {
              type: 'drag-node',
              enableDelegate: true,
            },
          ],
        },
        defaultNode: {
          size: [26, 26],
          anchorPoints: [
            [0, 0.5],
            [1, 0.5],
          ],
          style: {
            fill: '#C6E5FF',
            stroke: '#5B8FF9',
          },
        },
        defaultEdge: {
          type: 'cubic-horizontal',
          style: {
            stroke: '#A3B1BF',
          },
        },
        nodeStateStyles: {
          closest: {
            fill: '#f00',
          },
        },
        layout: {
          type: 'compactBox',
          direction: 'LR',
          getId: function getId(d) {
            return d.id;
          },
          getHeight: function getHeight() {
            return 16;
          },
          getWidth: function getWidth() {
            return 16;
          },
          getVGap: function getVGap() {
            return 10;
          },
          getHGap: function getHGap() {
            return 100;
          },
        },
      });

      graph.node(function (node) {
        return {
          label: node.id,
          labelCfg: {
            offset: 10,
            position:
              node.children && node.children.length > 0 ? 'left' : 'right',
          },
        };
      });

      graph.data(data);
      graph.render();
      graph.fitView();

      let minDisNode;
      graph.on('node:dragstart', (e) => {
        minDisNode = undefined;
      });
      graph.on('node:drag', (e) => {
        minDisNode = undefined;
        const { item } = e;
        const model = item.getModel();
        const nodes = graph.getNodes();
        let minDis = Infinity;
        nodes.forEach((inode) => {
          graph.setItemState(inode, 'closest', false);
          const node = inode.getModel();
          if (node.id === model.id) return;
          const dis =
            (node.x - e.x) * (node.x - e.x) + (node.y - e.y) * (node.y - e.y);
          if (dis < minDis) {
            minDis = dis;
            minDisNode = inode;
          }
        });
        if (minDis < 2000) graph.setItemState(minDisNode, 'closest', true);
        else minDisNode = undefined;
      });

      graph.on('node:dragend', (e) => {
        if (!minDisNode) {
          descriptionDiv.innerHTML =
            'Failed. No node close to the dragged node.';
          return;
        }
        const { item } = e;
        const id = item.getID();
        const data = graph.findDataById(id);
        // if the minDisNode is a descent of the dragged node, return
        let isDescent = false;
        const minDisNodeId = minDisNode.getID();
        G6.Util.traverseTree(data, (d) => {
          if (d.id === minDisNodeId) isDescent = true;
        });
        if (isDescent) {
          descriptionDiv.innerHTML =
            'Failed. The target node is a descendant of the dragged node.';
          return;
        }

        const removed = graph.removeChild(id);
        setTimeout(() => {
          const newParentData = graph.findDataById(minDisNodeId);
          if (newParentData.children) newParentData.children.push(data);
          else newParentData.children = [data];
          graph.layout();
          descriptionDiv.innerHTML = 'Success.';
        }, 600);
      });

      return graph;
    });
}

export default connect(mapStateToProps, mapDispatchToProps)(TagManagement);
