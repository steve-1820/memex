import React, { useEffect, useState } from 'react';
import G6 from '@antv/g6';
import insertCss from 'insert-css';

export const TreeGraphReact = ({ dependencies }): ReactElement => {
  const ref = React.useRef(null);

  useEffect(() => {
    let graph = null;
    graph = createGraph(ref, dependencies);
    return () => {
      graph.destroy();
    };
  }, [dependencies]);

  return <div style={{ height: '100%', width: '100%' }} ref={ref} />;
};

insertCss(`
  .g6-minimap-container {
    border: 1px solid #e2e2e2;
  }
  .g6-minimap-viewport {
    border: 2px solid rgb(25, 128, 255);
  }
  .g6-tooltip {
    border: 1px solid #e2e2e2;
    border-radius: 4px;
    font-size: 12px;
    color: #000;
    background-color: rgba(255, 255, 255, 0.9);
    padding: 10px 8px;
    box-shadow: rgb(174, 174, 174) 0px 0px 10px;
  }
`);

const fittingString = (str, maxWidth, fontSize) => {
  const ellipsis = '...';
  const ellipsisLength = G6.Util.getTextSize(ellipsis, fontSize)[0];
  let currentWidth = 0;
  let res = str;
  const pattern = new RegExp('[\u4E00-\u9FA5]+'); // distinguish the Chinese charactors and letters
  str.split('').forEach((letter, i) => {
    if (currentWidth > maxWidth - ellipsisLength) return;
    if (pattern.test(letter)) {
      // Chinese charactors
      currentWidth += fontSize;
    } else {
      // get the width of single letter according to the fontSize
      currentWidth += G6.Util.getLetterWidth(letter, fontSize);
    }
    if (currentWidth > maxWidth - ellipsisLength) {
      res = `${str.substr(0, i)}${ellipsis}`;
    }
  });
  return res;
};

const globalFontSize = 12;

G6.registerNode(
  'card-node',
  {
    drawShape: function drawShape(cfg, group) {
      const outerCircle = 50;
      const innerCircle = 30;

      const shape = group.addShape('circle', {
        attrs: {
          // x: 0,
          // y: 0,
          width: outerCircle,
          height: outerCircle,
          r: outerCircle / 2,
          fill: '#C6E5FF',
          stroke: '#5B8FF9',
          lineWidth: 2,
        },
        name: 'main-box',
        draggable: true,
      });

      group.addShape('image', {
        attrs: {
          x: -innerCircle / 2,
          y: -innerCircle / 2,
          height: innerCircle,
          width: innerCircle,
          img: cfg.img,
          // fill: '#C6E5FF',
        },
        name: 'node-icon',
        draggable: true,
      });
      return shape;
    },
  },
  'single-node'
);

function createGraph(ref: React.MutableRefObject<any>, dependencies) {
  let graph = null;
  const minimap = new G6.Minimap({
    size: [150, 100],
  });

  const width = Math.max(
    (ref.current.scrollWidth * dependencies.nodes.length) / 60,
    ref.current.scrollWidth
  );
  let height = Math.max(
    (ref.current.scrollHeight * dependencies.nodes.length) / 60,
    ref.current.scrollHeight
  );
  height -= 110;

  graph = new G6.Graph({
    container: ref.current,
    width,
    height,
    layout: {
      type: 'force',
      preventOverlap: true,
      nodeSize: 120,
      alphaDecay: 0.01,
    },
    defaultNode: {
      shape: 'card-node',
      // type: 'image',
      // size: 15,
      // color: '#C6E5FF',
      labelCfg: {
        style: {
          fill: '#1890ff',
          fontSize: 12,
          background: {
            fill: '#ffffff',
            stroke: '#9EC9FF',
            padding: [2, 2, 2, 2],
            radius: 2,
          },
        },
        position: 'bottom',
      },
    },
    defaultEdge: {
      size: 1,
      color: '#e2e2e2',
    },
    modes: {
      default: [
        'drag-canvas',
        'drag-node',
        'zoom-canvas',
        {
          type: 'tooltip',
          formatText: function formatText(model) {
            return model.fullLabel;
          },
          offset: 30,
        },
        {
          type: 'edge-tooltip',
          formatText: function formatText(model, e) {
            const edge = e.item;
            return `来源：${edge.getSource().getModel().fullLabel}<br/>去向：${
              edge.getTarget().getModel().fullLabel
            }`;
          },
          offset: 30,
        },
        'activate-relations',
      ],
    },
    nodeStateStyles: {
      active: {
        opacity: 1,
      },
      inactive: {
        opacity: 0.2,
      },
    },
    edgeStateStyles: {
      active: {
        stroke: '#999',
      },
    },
    plugins: [minimap],
  });

  // Modify the label in the data
  dependencies.nodes.forEach(function (node) {
    node.label = fittingString(node.label, node.textSize, globalFontSize);
  });

  graph.data(dependencies);
  graph.render();

  // listen to the node click event
  function handleNodeClick(event) {
    const { item } = event;
    // animately move the graph to focus on the item.
    // the second parameter controlls whether move with animation, the third parameter is the animate configuration
    graph.focusItem(item, true, {
      easing: 'easeCubic',
      duration: 500,
    });
  }

  graph.on('node:click', handleNodeClick);

  return graph;
}

function refreshDragedNodePosition(e) {
  const model = e.item.get('model');
  model.fx = e.x;
  model.fy = e.y;
}
