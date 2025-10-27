/**
 * Enhanced Visualization Components for Phase 5
 * 
 * This file contains React components for confidence ranges,
 * metrics breakdown, and enhanced chart visualizations.
 */

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Confidence Range Component
interface ConfidenceRangeProps {
  value: number;
  variancePercent: number;
  matchType: string;
  metric: string;
}

export const ConfidenceRange: React.FC<ConfidenceRangeProps> = ({ 
  value, 
  variancePercent, 
  matchType, 
  metric 
}) => {
  const varianceAmount = value * variancePercent;
  const lowerBound = Math.max(0, value - varianceAmount);
  const upperBound = value + varianceAmount;
  
  return (
    <div className="confidence-range">
      <div className="confidence-value">
        {metric === 'ctr' || metric === 'cvr' 
          ? `${(value * 100).toFixed(1)}%` 
          : value.toLocaleString()
        }
      </div>
      <div className="confidence-bounds">
        <span className="variance-indicator">
          ±{(variancePercent * 100).toFixed(0)}%
        </span>
        <div className="bounds-text">
          {lowerBound.toLocaleString()} - {upperBound.toLocaleString()}
        </div>
      </div>
    </div>
  );
};

// Error Range Simulation for Charts
export const simulateErrorRange = (metric: string, matchType: string = 'phrase') => {
  const variancePercentages = {
    exact: 0.01,    // ±1%
    phrase: 0.03,   // ±3%
    broad: 0.05     // ±5%
  };
  
  const variancePercent = variancePercentages[matchType as keyof typeof variancePercentages] || 0.03;
  
  // Sample values for demonstration
  const sampleValues = {
    impressions: 10000,
    clicks: 500,
    conversions: 25,
    cost: 2500,
    revenue: 5000,
    ctr: 0.05,
    cvr: 0.05,
    cpc: 5.0,
    cpa: 100.0,
    roas: 2.0
  };
  
  const value = sampleValues[metric as keyof typeof sampleValues] || 1000;
  const varianceAmount = value * variancePercent;
  
  return {
    min: Math.max(0, value - varianceAmount),
    max: value + varianceAmount,
    variance_percent: variancePercent
  };
};

// Enhanced Area Chart with Error Bars
interface EnhancedAreaChartProps {
  data: any[];
  metric: string;
  matchType: string;
  stroke?: string;
  fill?: string;
}

export const EnhancedAreaChart: React.FC<EnhancedAreaChartProps> = ({
  data,
  metric,
  matchType,
  stroke = "#3b82f6",
  fill = "#93c5fd"
}) => {
  const errorRange = simulateErrorRange(metric, matchType);
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip 
          formatter={(value: any) => [
            metric === 'ctr' || metric === 'cvr' 
              ? `${(value * 100).toFixed(1)}%` 
              : value.toLocaleString(),
            metric
          ]}
        />
        <Area
          type="monotone"
          dataKey={metric}
          stroke={stroke}
          fill={fill}
          fillOpacity={0.2}
        />
        {/* Error bars would be implemented here */}
      </AreaChart>
    </ResponsiveContainer>
  );
};

// Metrics Breakdown Table
interface MetricsBreakdownTableProps {
  data: {
    [matchType: string]: {
      impressions: number;
      ctr: number;
      cvr: number;
      cpc: number;
      cpa: number;
      roas: number;
      cost: number;
      revenue: number;
    };
  };
}

export const MetricsBreakdownTable: React.FC<MetricsBreakdownTableProps> = ({ data }) => {
  const matchTypes = Object.keys(data);
  
  return (
    <div className="metrics-breakdown-table">
      <h3 className="text-lg font-semibold mb-4">Metrics Breakdown by Match Type</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Match Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Impressions
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CTR
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CVR
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CPC
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CPA
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ROAS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {matchTypes.map((matchType) => (
              <tr key={matchType} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">
                  {matchType}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {data[matchType].impressions.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {data[matchType].ctr.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {data[matchType].cvr.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  ${data[matchType].cpc.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  ${data[matchType].cpa.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {data[matchType].roas.toFixed(2)}x
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Chart Cards Component
interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, children, className = "" }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
};

// Performance Distribution Chart
interface PerformanceDistributionProps {
  data: any[];
  metric: string;
}

export const PerformanceDistribution: React.FC<PerformanceDistributionProps> = ({ 
  data, 
  metric 
}) => {
  return (
    <ChartCard title={`${metric.toUpperCase()} Distribution`}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="range" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// Match Type Performance Pie Chart
interface MatchTypePieChartProps {
  data: {
    matchType: string;
    value: number;
    color: string;
  }[];
}

export const MatchTypePieChart: React.FC<MatchTypePieChartProps> = ({ data }) => {
  return (
    <ChartCard title="Performance by Match Type">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ matchType, percent }) => `${matchType} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// Top Performers Component
interface TopPerformersProps {
  performers: {
    rank: number;
    keyword: string;
    match_type: string;
    metric_value: number;
    impressions: number;
    clicks: number;
    conversions: number;
    cost: number;
    revenue: number;
    roas: number;
  }[];
  metric: string;
}

export const TopPerformers: React.FC<TopPerformersProps> = ({ performers, metric }) => {
  return (
    <ChartCard title={`Top 10 Performers by ${metric.toUpperCase()}`}>
      <div className="space-y-3">
        {performers.map((performer) => (
          <div key={performer.rank} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-500">#{performer.rank}</span>
              <div>
                <div className="font-medium text-gray-900">{performer.keyword}</div>
                <div className="text-sm text-gray-500 capitalize">{performer.match_type}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">
                {metric === 'roas' 
                  ? `${performer.metric_value.toFixed(2)}x`
                  : metric === 'ctr' || metric === 'cvr'
                  ? `${(performer.metric_value * 100).toFixed(1)}%`
                  : performer.metric_value.toLocaleString()
                }
              </div>
              <div className="text-sm text-gray-500">
                {performer.impressions.toLocaleString()} impressions
              </div>
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
};

// Main Enhanced Visualization Dashboard
interface EnhancedVisualizationDashboardProps {
  simulationData: any;
  confidenceRanges: any;
  metricsBreakdown: any;
}

export const EnhancedVisualizationDashboard: React.FC<EnhancedVisualizationDashboardProps> = ({
  simulationData,
  confidenceRanges,
  metricsBreakdown
}) => {
  return (
    <div className="space-y-6">
      {/* Summary Table */}
      <ChartCard title="Campaign Performance Summary">
        <MetricsBreakdownTable data={metricsBreakdown.summary_table} />
      </ChartCard>
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance by Match Type */}
        <MatchTypePieChart 
          data={[
            { matchType: 'Exact', value: 12430, color: '#3b82f6' },
            { matchType: 'Phrase', value: 21030, color: '#10b981' },
            { matchType: 'Broad', value: 32120, color: '#f59e0b' }
          ]} 
        />
        
        {/* Top Performers */}
        <TopPerformers 
          performers={metricsBreakdown.top_performers || []} 
          metric="roas" 
        />
      </div>
      
      {/* Confidence Ranges Display */}
      <ChartCard title="Confidence Ranges">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(confidenceRanges).slice(0, 3).map(([keyword, ranges]: [string, any]) => (
            <div key={keyword} className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">{keyword}</h4>
              <div className="space-y-2">
                {Object.entries(ranges).slice(0, 3).map(([metric, range]: [string, any]) => (
                  <ConfidenceRange
                    key={metric}
                    value={range.lower_bound + (range.upper_bound - range.lower_bound) / 2}
                    variancePercent={range.variance_percentage}
                    matchType="phrase"
                    metric={metric}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
};

export default EnhancedVisualizationDashboard;
