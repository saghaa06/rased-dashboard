import React from 'react';
import Button from './Button';

type DownloadButtonProps = {
  filename?: string;
  onClick: () => void;
  className?: string;
  children?: React.ReactNode;
};

const DownloadButton: React.FC<DownloadButtonProps> = ({ onClick, className, children }) => {
  return (
    <Button onClick={onClick} className={className}>
      {children}
    </Button>
  );
};

export default DownloadButton;

