import React from 'react';

interface TicketHeaderProps {
  heading?: string;
  highlight?: string;
  description?: string;
}

const TicketHeader: React.FC<TicketHeaderProps> = ({
  heading = 'My',
  highlight = 'Tickets',
  description = 'Manage and track all your support tickets',
}) => (
  <div className="mb-12">
    <h1 className="text-6xl font-light mb-4">
      {heading}{' '}
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-600">
        {highlight}
      </span>
    </h1>
    {description && <p className="text-gray-400 text-lg">{description}</p>}
  </div>
);

export default TicketHeader;
