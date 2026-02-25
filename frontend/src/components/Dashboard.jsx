import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { adminAPI } from '../services/api';
import { FaMoneyBillWave, FaUsers, FaGem, FaChartLine, FaCoins, FaPercentage } from 'react-icons/fa';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line 
} from 'recharts';

const Dashboard = ({ token }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentLoans, setRecentLoans] = useState([]);
  const [loanStats, setLoanStats] = useState({
    active: 0,
    closed: 0,
    defaulted: 0
  });

  useEffect(() => {
    fetchDashboardData();
    fetchRecentLoans();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setMetrics(response.data.data);
      
      if (response.data.data) {
        setLoanStats({
          active: response.data.data.activeCustomerLoans || 0,
          closed: response.data.data.closedLoans || 0,
          defaulted: response.data.data.defaultedLoans || 0
        });
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentLoans = async () => {
    try {
      const response = await adminAPI.getCustomerLoans();
      const loansData = Array.isArray(response.data.data) ? response.data.data : [];
      setRecentLoans(loansData.slice(-5));
    } catch (err) {
      console.error('Failed to fetch recent loans:', err);
      setRecentLoans([]); 
    }
  };

  const handleSaveSnapshot = async () => {
    try {
      await adminAPI.saveSnapshot();
      alert('Dashboard snapshot saved successfully!');
    } catch (err) {
      console.error('Failed to save snapshot:', err);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // Ensure loanStatusData is always an array
  const loanStatusData = [
    { name: 'Active Loans', value: Number(loanStats.active) || 0 },
    { name: 'Closed Loans', value: Number(loanStats.closed) || 0 },
    { name: 'Defaulted', value: Number(loanStats.defaulted) || 0 }
  ].filter(item => item.value > 0);

  // If all values are zero, show at least one data point
  if (loanStatusData.length === 0) {
    loanStatusData.push({ name: 'No Loans', value: 1 });
  }

  const COLORS = ['#667eea', '#00b894', '#ff6b6b', '#fdcb6e'];

  // Ensure monthlyData is always an array
  const monthlyData = Array.isArray(metrics?.monthlyLoanTrend) 
    ? metrics.monthlyLoanTrend 
    : [
        { name: 'Jan', amount: 0 },
        { name: 'Feb', amount: 0 },
        { name: 'Mar', amount: 0 },
        { name: 'Apr', amount: 0 },
        { name: 'May', amount: 0 },
        { name: 'Jun', amount: 0 }
      ];

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard Overview</h1>
        <button className="snapshot-button" onClick={handleSaveSnapshot}>
          Save Snapshot
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <FaMoneyBillWave />
          </div>
          <div className="metric-info">
            <h3>Total Investment</h3>
            <p className="metric-value">{formatCurrency(metrics?.totalInvestment)}</p>
            <span className="metric-change positive">+12.5%</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <FaPercentage />
          </div>
          <div className="metric-info">
            <h3>Receivable Interest</h3>
            <p className="metric-value">{formatCurrency(metrics?.totalReceivableInterest)}</p>
            <span className="metric-change positive">+8.2%</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <FaCoins />
          </div>
          <div className="metric-info">
            <h3>Payable Interest</h3>
            <p className="metric-value">{formatCurrency(metrics?.totalPayableInterest)}</p>
            <span className="metric-change negative">-2.1%</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <FaUsers />
          </div>
          <div className="metric-info">
            <h3>Total Customers</h3>
            <p className="metric-value">{metrics?.totalCustomers || 0}</p>
            <span className="metric-change positive">+{metrics?.totalCustomers || 0}</span>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h2>Loan Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={loanStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                isAnimationActive={false}
              >
                {loanStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Monthly Loan Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#667eea" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="summary-section">
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Net Profit</h3>
            <p className="profit-value">{formatCurrency(metrics?.netProfit)}</p>
            <p className="profit-detail">Receivable: {formatCurrency(metrics?.totalReceivableInterest)}</p>
            <p className="profit-detail">Payable: {formatCurrency(metrics?.totalPayableInterest)}</p>
          </div>

          <div className="summary-card">
            <h3>Bank Loans</h3>
            <p className="profit-value">{formatCurrency(metrics?.totalBankLoans)}</p>
            <p className="profit-detail">Active Loans: {metrics?.activeBankLoans || 0}</p>
            <p className="profit-detail">Gold Pledged: {metrics?.totalGoldWeightPledged?.toFixed(2)}g</p>
          </div>
        </div>

        <div className="recent-loans-card">
          <h3>Recent Loans</h3>
          <div className="recent-loans-list">
            {recentLoans.length > 0 ? (
              recentLoans.map(loan => (
                <div key={loan.id} className="recent-loan-item">
                  <span className="loan-amount">{formatCurrency(loan.principalAmount)}</span>
                  <span className="loan-status" data-status={loan.status?.toLowerCase()}>
                    {loan.status}
                  </span>
                  <span className="loan-date">{new Date(loan.createdAt).toLocaleDateString()}</span>
                </div>
              ))
            ) : (
              <p className="no-data">No recent loans</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;