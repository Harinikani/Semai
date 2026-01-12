import React from 'react';

const PageHeader = ({ title, subtitle }) => {
  return (
    <div className="mb-2 text-center">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
};

export default PageHeader;