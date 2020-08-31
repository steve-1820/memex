import React from 'react';
import {
  InboxOutlined,
  SearchOutlined,
  DeploymentUnitOutlined,
  SaveOutlined,
  DeleteOutlined,
  SettingOutlined,
  ReadOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';

import { useDispatch } from 'react-redux';
import ToolBar from '../ToolBar';

export interface OperatorBarProps {}

const OperatorBar: React.FC<OperatorBarProps> = () => {
  const dispatch = useDispatch();

  const menus = [
    {
      id: 'inbox',
      name: 'Inbox',
      icon: <InboxOutlined />,
      onClick: () => {
        dispatch({
          type: 'CHANGE_PAGE',
          payload: {
            page: 'inbox',
          },
        });
      },
    },
    {
      id: 'notes',
      name: 'Notes & Highlights',
      icon: <ReadOutlined />,
      onClick: () => {
        dispatch({
          type: 'CHANGE_PAGE',
          payload: {
            page: 'notes',
          },
        });
      },
    },
    {
      id: 'search',
      name: 'Search',
      icon: <SearchOutlined />,
    },
    {
      id: 'divider1',
      isDivider: true,
    },
    {
      id: 'tag_management',
      name: 'Tag Management',
      icon: <ApartmentOutlined />,
      onClick: () => {
        dispatch({
          type: 'CHANGE_PAGE',
          payload: {
            page: 'tag_management',
          },
        });
      },
    },
    {
      id: 'diffuse',
      name: 'Knowledge Map',
      icon: <DeploymentUnitOutlined />,
      onClick: () => {
        dispatch({
          type: 'CHANGE_PAGE',
          payload: {
            page: 'graph',
          },
        });
      },
    },
    {
      id: 'divider2',
      isDivider: true,
    },

    {
      id: 'save',
      name: 'Save',
      icon: <SaveOutlined />,
    },
    {
      id: 'clear',
      name: 'Delete',
      icon: <DeleteOutlined />,
    },
    {
      id: 'setting',
      name: 'Settings',
      icon: <SettingOutlined />,
    },
  ];
  return (
    <div>
      <ToolBar data={menus} className="operator-bar" />
    </div>
  );
};

export default OperatorBar;
