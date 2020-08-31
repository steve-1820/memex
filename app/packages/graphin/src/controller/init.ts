import G6, { Graph as GraphType } from '@antv/g6';
import insertCss from 'insert-css';
import { GraphinProps, ExtendedGraphOptions } from '../types';

export interface BehaviorModeItem {
  type: string;
  [key: string]: string | number | boolean | undefined;
}

interface BehaviorsMode {
  [mode: string]: (BehaviorModeItem | string)[];
}

export const initGraphAfterRender = (
  props: GraphinProps,
  graphDOM: HTMLDivElement,
  instance: GraphType
) => {
  const { options = {} } = props;
  const { pan, zoom } = options;

  // 平移
  if (pan) instance.moveTo(pan.x, pan.y);

  // 缩放
  if (zoom) instance.zoomTo(zoom, pan!);
};

insertCss(`
  .g6-minimap-container {
    border: 1px solid #e2e2e2;
    position: absolute !important;
    bottom: 16px;
    left: 16px;
    background: #FFFFFF;
    overflow: hidden;
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

const initGraph = (
  props: GraphinProps,
  graphDOM: HTMLDivElement,
  behaviorsMode: BehaviorsMode
) => {
  const { clientWidth, clientHeight } = graphDOM;
  /** default options  */
  const minimap = new G6.Minimap({
    size: [150, 100],
  });

  const grid = new G6.Grid();

  // take into account the minimap
  const height = clientHeight - 100;
  const defaultOptions: Partial<ExtendedGraphOptions> = {
    // initial canvas
    container: graphDOM,
    renderer: 'canvas',
    width: clientWidth,
    height: clientHeight,
    // initial viewport state:
    zoom: 1,
    // pan: { x: clientWidth / 2, y: clientHeight / 2 },
    // interaction options:
    minZoom: 0.2,
    maxZoom: 10,
    // rendering options:
    animate: true,
    animateCfg: {
      onFrame: undefined,
      duration: 500,
      easing: 'easeLinear',
    },
    plugins: [minimap, grid],
    modes: {
      default: [],
    },
    // Graphin unique options
    disablePan: false, // 禁止画布平移
    disableZoom: false, // 禁用画布缩放
    disableDrag: true, // 禁用节点拖拽
    wheelSensitivity: 1, // 缩放的敏感度，我们在内部有不同设备的最佳匹配
    // 必须将 groupByTypes 设置为 false，带有 combo 的图中元素的视觉层级才能合理:https://g6.antv.vision/zh/docs/manual/middle/combo
    groupByTypes: false,

    // 默认关闭多边设置
    autoPolyEdge: false,
    // 默认开启多边设置
    autoLoopEdge: true,
  };

  /** merged options */
  const options: Partial<ExtendedGraphOptions> = {
    ...defaultOptions,
    ...(props.options || {}),
  };

  /** deconstruct g6 Options */
  const {
    disableZoom, // 禁用画布缩放
    disablePan, // 禁用移动画布
    disableDrag, // 禁用节点拖拽
    disableClick, // 禁止节点点击
    disableBrush, // 禁止框选
    wheelSensitivity, // 缩放的敏感度，我们在内部有不同设备的最佳匹配
    pan, // 默认移动到位置
    zoom, // 默认缩放比例

    modes, // 需要内置default mode

    ...g6Options
  } = options as ExtendedGraphOptions;

  /** Graphin built-in g6 behaviors */
  const innerBehaviors = [
    // 拖拽画布
    {
      type: 'drag-canvas',
      disable: disablePan,
      options: {},
    },
    // 缩放画布
    {
      type: 'zoom-canvas',
      disable: disableZoom,
      options: {
        sensitivity: wheelSensitivity,
      },
    },
    // 画布框选
    {
      type: 'brush-select',
      disable: disableBrush,
      options: {
        trigger: 'shift',
        includeEdges: false,
      },
    },
    // 点击选择
    {
      type: 'click-select',
      disable: disableClick,
      options: {
        multiple: true, // 允许多选
        trigger: 'alt',
      },
    },
    // 拖拽节点
    {
      type: 'drag-node',
      disable: disableDrag,
      options: {},
    },
    // combo
    {
      type: 'drag-combo',
      options: {},
    },
    {
      type: 'collapse-expand-combo',
      options: {},
    },
  ];
  const defaultModes = innerBehaviors
    .filter((c) => {
      return !c.disable;
    })
    .map((c) => {
      return {
        type: c.type,
        ...c.options,
      };
    });

  const instance: GraphType = new G6.Graph({
    ...g6Options,
    modes: {
      ...behaviorsMode, // Add multiple G6 behavior modes
      default: [...defaultModes, ...modes!.default!, ...behaviorsMode.default],
    },
  });

  // close local refresh issue to avoid clip ghost
  instance.get('canvas').set('localRefresh', false);

  // 平移
  if (pan) instance.moveTo(pan.x, pan.y);

  // 缩放
  if (zoom) instance.zoomTo(zoom, pan!);

  return {
    options: options || defaultOptions,
    instance,
    width: clientWidth,
    height: clientHeight,
  };
};

export default initGraph;
