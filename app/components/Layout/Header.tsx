import React from 'react';
import { LayoutProps } from './types';
import './index.css';

const Header: React.FC<LayoutProps> = (props) => {
  const { children } = props;
  return <div className="graphin-studio-header">{children}</div>;
};

export default Header;
