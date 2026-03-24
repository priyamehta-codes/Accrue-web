import React, { useCallback } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar, PieChart as PieIcon, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Loader from '../components/newloader';
import useCachedFetch from '../hooks/useCachedFetch';
import { getAnalytics, getCachedAnalytics } from '../api/analytics';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0);

const Analytics = () => {
  const fetch = useCallback(getAnalytics, []);
  const { data, isLoading } = useCachedFetch(fetch, getCachedAnalytics);

  if (isLoading && !data) {
    return (
      <Layout>
        <div className="loading-overlay">
          <Loader />
          <p style={{ marginTop: 12, color: 'var(--text-3)', fontWeight: 600 }}>Analyzing your finances...</p>
        </div>
      </Layout>
    );
  }

  const d = data || { monthTotal: 0, yearTotal: 0, categoryData: [], trendData: [] };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <Link to="/dashboard" className="breadcrumb">
            <ArrowLeft size={12} /> Back to Dashboard
          </Link>
          <h1 className="page-title" style={{ marginTop: 4 }}>Analytics</h1>
          <p className="page-subtitle">Deep dive into your spending habits</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">This Month</span>
          <span className="stat-value" style={{ color: 'var(--danger)' }}>{fmt(d.monthTotal)}</span>
          <div className="stat-icon" style={{ background: 'var(--danger-dim)', color: 'var(--danger)' }}>
            <TrendingDown size={18} />
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-label">This Year</span>
          <span className="stat-value" style={{ color: 'var(--accent-light)' }}>{fmt(d.yearTotal)}</span>
          <div className="stat-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)' }}>
            <Calendar size={18} />
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginTop: 24 }}>
        {/* Category Breakdown */}
        <div className="card fade-up">
          <div className="section-header">
            <span className="section-title">Spending by Category</span>
            <PieIcon size={16} color="var(--text-3)" />
          </div>
          <div style={{ height: 320, minHeight: 320, width: '100%', marginTop: 20 }}>
            {d.categoryData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={d.categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {d.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => fmt(value)}
                    contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>No transactions this month</p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="card fade-up">
          <div className="section-header">
            <span className="section-title">6-Month Trend</span>
            <TrendingUp size={16} color="var(--text-3)" />
          </div>
          <div style={{ height: 320, minHeight: 320, width: '100%', marginTop: 20 }}>
            {d.trendData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-3)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-3)' }} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip 
                    formatter={(value) => fmt(value)}
                    cursor={{ fill: 'var(--bg-hover)' }}
                    contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}
                  />
                  <Bar dataKey="expense" fill="var(--accent-light)" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>No enough data for trend analysis</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
