"use client";

import React from 'react';
import { Event } from '@/lib/types';
import { ResponsiveCirclePacking } from '@nivo/circle-packing';

interface EventsBubbleChartProps {
  events: Event[];
}

const EventsBubbleChart: React.FC<EventsBubbleChartProps> = ({ events }) => {
  const data = {
    name: 'Events',
    children: events.map(event => ({
      name: event.eventType,
      value: 1,
    })),
  };

  return (
    <div style={{ height: '400px' }}>
      <ResponsiveCirclePacking
        data={data}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        id="name"
        value="value"
        colors={{ scheme: 'nivo' }}
        labelsSkipRadius={10}
        labelTextColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
        borderWidth={2}
        borderColor={{ from: 'color' }}
        animate={true}
        motionConfig="gentle"
        // motionStiffness={90}
      />
    </div>
  );
};

export default EventsBubbleChart;