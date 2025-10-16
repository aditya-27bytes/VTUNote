import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler,
  zoomPlugin
);

// Enhanced chart options with interactivity
const createChartOptions = (title: string, enableZoom = false) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: title,
      font: {
        size: 16,
        weight: 'bold' as const
      },
      color: '#333'
    },
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12
        }
      },
      onClick: (_e: any, legendItem: any, legend: any) => {
        // Custom legend click behavior
        const index = legendItem.index;
        const ci = legend.chart;
        const meta = ci.getDatasetMeta(index);
        meta.hidden = !meta.hidden;
        ci.update();
      }
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: '#333',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      callbacks: {
        title: (context: any) => {
          return `📅 ${context[0].label}`;
        },
        label: (context: any) => {
          return `${context.dataset.label}: ${context.parsed.y || context.parsed}`;
        },
        afterLabel: (context: any) => {
          // Add additional info based on chart type
          if (context.dataset.label === 'Views') {
            return `📊 ${context.parsed.y} total views`;
          }
          return '';
        }
      }
    },
    zoom: enableZoom ? {
      zoom: {
        wheel: {
          enabled: true,
        },
        pinch: {
          enabled: true,
        },
        mode: 'xy' as const,
      },
      pan: {
        enabled: true,
        mode: 'xy' as const,
      },
      limits: {
        x: { min: 'original' as const, max: 'original' as const },
        y: { min: 'original' as const, max: 'original' as const }
      }
    } : undefined,
  },
  interaction: {
    mode: 'nearest' as const,
    axis: 'x' as const,
    intersect: false,
  },
  scales: {
    x: {
      display: true,
      grid: {
        display: true,
        color: 'rgba(0, 0, 0, 0.1)',
      },
      ticks: {
        color: '#666',
        font: {
          size: 11
        }
      }
    },
    y: {
      display: true,
      grid: {
        display: true,
        color: 'rgba(0, 0, 0, 0.1)',
      },
      ticks: {
        color: '#666',
        font: {
          size: 11
        },
        callback: (value: any) => {
          return value.toLocaleString();
        }
      }
    }
  },
  elements: {
    point: {
      radius: 4,
      hoverRadius: 6,
      borderWidth: 2,
    },
    line: {
      tension: 0.4,
    },
  },
  animation: {
    duration: 1000,
    easing: 'easeInOutQuart' as const,
  },
});

// Interactive Chart Wrapper Component
const InteractiveChartWrapper: React.FC<{
  title: string;
  children: React.ReactNode;
  onRefresh?: () => void;
  enableExport?: boolean;
  enableZoom?: boolean;
}> = ({ title, children, onRefresh, enableExport = false, enableZoom = false }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    // Find the chart canvas element
    const chartContainer = document.querySelector('.chart-container canvas');
    if (chartContainer) {
      const canvas = chartContainer as HTMLCanvasElement;
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_chart.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleResetZoom = () => {
    // Find the chart instance and reset zoom
    const chartContainer = document.querySelector('.chart-container canvas');
    if (chartContainer) {
      const chart = (chartContainer as any).__chartjs;
      if (chart && chart.resetZoom) {
        chart.resetZoom();
      }
    }
  };

  return (
    <div className="chart-wrapper interactive">
      <div className="chart-header">
        <h4>{title}</h4>
        <div className="chart-controls">
          {onRefresh && (
            <button 
              className="chart-btn refresh-btn"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh Data"
            >
              {isRefreshing ? '🔄' : '🔄'}
            </button>
          )}
          {enableExport && (
            <button 
              className="chart-btn export-btn"
              onClick={handleExport}
              title="Export Chart"
            >
              📊
            </button>
          )}
          {enableZoom && (
            <>
              <button 
                className="chart-btn zoom-reset-btn"
                onClick={handleResetZoom}
                title="Reset Zoom"
              >
                🎯
              </button>
              <span className="zoom-indicator" title="Zoom & Pan Enabled">
                🔍
              </span>
            </>
          )}
        </div>
      </div>
      <div className="chart-container">
        {children}
      </div>
    </div>
  );
};

// Daily Activity Line Chart with enhanced interactivity
export const DailyActivityChart: React.FC<{ 
  data: Array<{date: string; users: number; notes: number}>;
  onRefresh?: () => void;
}> = ({ data, onRefresh }) => {
  const chartData = {
    labels: data.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: '👥 New Users',
        data: data.map(item => item.users),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(53, 162, 235)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: '📝 New Notes',
        data: data.map(item => item.notes),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(255, 99, 132)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  return (
    <InteractiveChartWrapper 
      title="📈 Daily Activity Trends" 
      onRefresh={onRefresh}
      enableExport={true}
      enableZoom={true}
    >
      <Line data={chartData} options={createChartOptions('Daily Activity Trends', true)} height={300} />
    </InteractiveChartWrapper>
  );
};

// Users by Branch Bar Chart with drill-down capability
export const UsersByBranchChart: React.FC<{ 
  data: Array<{_id: string; count: number}>;
  onRefresh?: () => void;
}> = ({ data, onRefresh }) => {
  const chartData = {
    labels: data.map(item => item._id),
    datasets: [
      {
        label: '👥 Users',
        data: data.map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ],
        borderWidth: 2,
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    ...createChartOptions('Users by Branch'),
    plugins: {
      ...createChartOptions('Users by Branch').plugins,
      tooltip: {
        ...createChartOptions('Users by Branch').plugins.tooltip,
        callbacks: {
          label: (context: any) => {
            const total = data.reduce((sum, item) => sum + item.count, 0);
            const percentage = ((context.parsed.y / total) * 100).toFixed(1);
            return `${context.dataset.label}: ${context.parsed.y} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <InteractiveChartWrapper 
      title="👥 Users by Branch" 
      onRefresh={onRefresh}
      enableExport={true}
    >
      <Bar data={chartData} options={options} height={300} />
    </InteractiveChartWrapper>
  );
};

// Users by Semester Bar Chart
export const UsersBySemesterChart: React.FC<{ 
  data: Array<{_id: number; count: number}>;
  onRefresh?: () => void;
}> = ({ data, onRefresh }) => {
  const chartData = {
    labels: data.map(item => `Semester ${item._id}`),
    datasets: [
      {
        label: '👥 Users',
        data: data.map(item => item.count),
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  return (
    <InteractiveChartWrapper 
      title="📚 Users by Semester" 
      onRefresh={onRefresh}
      enableExport={true}
    >
      <Bar data={chartData} options={createChartOptions('Users by Semester')} height={300} />
    </InteractiveChartWrapper>
  );
};

// Notes by Subject Doughnut Chart with enhanced tooltips
export const NotesBySubjectChart: React.FC<{ 
  data: Array<{_id: string; count: number}>;
  onRefresh?: () => void;
}> = ({ data, onRefresh }) => {
  const chartData = {
    labels: data.map(item => item._id),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF6384',
          '#C9CBCF',
          '#4BC0C0',
          '#FF6384',
        ],
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    ...createChartOptions('Notes by Subject'),
    plugins: {
      ...createChartOptions('Notes by Subject').plugins,
      tooltip: {
        ...createChartOptions('Notes by Subject').plugins.tooltip,
        callbacks: {
          label: (context: any) => {
            const total = data.reduce((sum, item) => sum + item.count, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} notes (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <InteractiveChartWrapper 
      title="📝 Notes by Subject" 
      onRefresh={onRefresh}
      enableExport={true}
    >
      <Doughnut data={chartData} options={options} height={300} />
    </InteractiveChartWrapper>
  );
};

// Notes by Module Bar Chart
export const NotesByModuleChart: React.FC<{ 
  data: Array<{_id: string; count: number}>;
  onRefresh?: () => void;
}> = ({ data, onRefresh }) => {
  const chartData = {
    labels: data.map(item => item._id),
    datasets: [
      {
        label: '📖 Notes',
        data: data.map(item => item.count),
        backgroundColor: 'rgba(153, 102, 255, 0.8)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  return (
    <InteractiveChartWrapper 
      title="📖 Notes by Module" 
      onRefresh={onRefresh}
      enableExport={true}
    >
      <Bar data={chartData} options={createChartOptions('Notes by Module')} height={300} />
    </InteractiveChartWrapper>
  );
};

// Notes by Semester Bar Chart
export const NotesBySemesterChart: React.FC<{ 
  data: Array<{_id: number; count: number}>;
  onRefresh?: () => void;
}> = ({ data, onRefresh }) => {
  const chartData = {
    labels: data.map(item => `Semester ${item._id}`),
    datasets: [
      {
        label: '📖 Notes',
        data: data.map(item => item.count),
        backgroundColor: 'rgba(255, 159, 64, 0.8)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  return (
    <InteractiveChartWrapper 
      title="📚 Notes by Semester" 
      onRefresh={onRefresh}
      enableExport={true}
    >
      <Bar data={chartData} options={createChartOptions('Notes by Semester')} height={300} />
    </InteractiveChartWrapper>
  );
};

// Platform Overview Radar Chart with enhanced styling
export const PlatformOverviewChart: React.FC<{ 
  totalUsers: number;
  totalNotes: number;
  publicNotes: number;
  privateNotes: number;
  recentUsers: number;
  recentNotes: number;
  onRefresh?: () => void;
}> = ({ totalUsers, totalNotes, publicNotes, privateNotes, recentUsers, recentNotes, onRefresh }) => {
  const chartData = {
    labels: ['Total Users', 'Total Notes', 'Public Notes', 'Private Notes', 'Recent Users', 'Recent Notes'],
    datasets: [
      {
        label: 'Platform Metrics',
        data: [totalUsers, totalNotes, publicNotes, privateNotes, recentUsers, recentNotes],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const options = {
    ...createChartOptions('Platform Overview'),
    scales: {
      r: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#666',
          font: {
            size: 11
          },
          callback: (value: any) => {
            return value.toLocaleString();
          }
        }
      }
    }
  };

  return (
    <InteractiveChartWrapper 
      title="🎯 Platform Overview" 
      onRefresh={onRefresh}
      enableExport={true}
    >
      <Radar data={chartData} options={options} height={300} />
    </InteractiveChartWrapper>
  );
};

// Most Viewed Notes Bar Chart with enhanced interactivity
export const MostViewedNotesChart: React.FC<{ 
  notes: Array<{title: string; views: number; subject: string}>;
  onRefresh?: () => void;
}> = ({ notes, onRefresh }) => {
  const chartData = {
    labels: notes.map(note => note.title.length > 20 ? note.title.substring(0, 20) + '...' : note.title),
    datasets: [
      {
        label: '👁️ Views',
        data: notes.map(note => note.views),
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    ...createChartOptions('Most Viewed Notes'),
    plugins: {
      ...createChartOptions('Most Viewed Notes').plugins,
      tooltip: {
        ...createChartOptions('Most Viewed Notes').plugins.tooltip,
        callbacks: {
          title: (context: any) => {
            const noteIndex = context[0].dataIndex;
            return notes[noteIndex]?.title || context[0].label;
          },
          label: (context: any) => {
            const noteIndex = context[0].dataIndex;
            const note = notes[noteIndex];
            return [
              `👁️ Views: ${context.parsed.y}`,
              `📚 Subject: ${note?.subject || 'N/A'}`,
              `📝 Title: ${note?.title || 'N/A'}`
            ];
          }
        }
      }
    }
  };

  return (
    <InteractiveChartWrapper 
      title="🔥 Most Viewed Notes" 
      onRefresh={onRefresh}
      enableExport={true}
      enableZoom={true}
    >
      <Bar data={chartData} options={options} height={300} />
    </InteractiveChartWrapper>
  );
};
