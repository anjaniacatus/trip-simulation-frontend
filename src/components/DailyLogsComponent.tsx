// src/components/DailyLogsComponent.tsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DailyLog {
  date: string;
  driving_hours: number;
  on_duty_not_driving_hours: number;
  off_duty_hours: number;
  sleeper_berth_hours: number;
  total_hours: number;
}

interface Activity {
  start_time: string;
  end_time: string;
  activity_type: string;
}

interface DailyLogsComponentProps {
  dailyLogs: DailyLog[];
  activities: Activity[];
}

const DailyLogsComponent: React.FC<DailyLogsComponentProps> = ({ dailyLogs, activities }) => {
  // CSV Download Function
  const downloadLogSheetsCSV = () => {
    const headers = ['Start Time', 'End Time', 'Activity Type'];
    const rows = activities.map(activity => [
      activity.start_time,
      activity.end_time,
      activity.activity_type,
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trip_log_sheets_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Chart Data Preparation
  const chartData: ChartData<'line'> = {
    labels: activities.flatMap(activity => [
      new Date(activity.start_time).toLocaleTimeString(),
      new Date(activity.end_time).toLocaleTimeString(),
    ]),
    datasets: [
      {
        label: 'Activity',
        data: activities.flatMap(activity => {
          const value = {
            'DRIVING': 4,
            'ON_DUTY_NOT_DRIVING': 3,
            'OFF_DUTY': 2,
            'SLEEPER_BERTH': 1,
          }[activity.activity_type] || 0;
          return [value, value];
        }),
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        fill: false,
        stepped: true,  // Step chart for discrete activity changes
      },
    ],
  };

  // Chart Options with corrected scale configuration
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Trip Activity Timeline',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const index = Math.floor(context.dataIndex / 2);
            const activity = activities[index];
            return `${activity.activity_type} (${activity.start_time} - ${activity.end_time})`;
          },
        },
      },
    },
    scales: {
      y: {
        min: 0,           // Moved here from ticks
        max: 4,           // Moved here from ticks
        title: {
          display: true,
          text: 'Activity',
        },
        ticks: {
          callback: (value: number | string) => {
            return {
              4: 'Driving',
              3: 'On-Duty',
              2: 'Off-Duty',
              1: 'Sleeper Berth',
            }[Number(value)] || '';
          },
          stepSize: 1,
        },
      },
      x: {
        title: {
          display: true,
          text: 'Time',
        },
      },
    },
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Daily Logs</h3>
        <button
          onClick={downloadLogSheetsCSV}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Download Log Sheets (CSV)
        </button>
      </div>
      {dailyLogs.length > 0 ? (
        <>
          <table className="w-full text-left border-collapse mb-4">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Driving (hrs)</th>
                <th className="p-2 border">On-Duty (hrs)</th>
                <th className="p-2 border">Off-Duty (hrs)</th>
                <th className="p-2 border">Sleeper (hrs)</th>
                <th className="p-2 border">Total (hrs)</th>
              </tr>
            </thead>
            <tbody>
              {dailyLogs.map((log, index) => (
                <tr key={index} className="even:bg-gray-50">
                  <td className="p-2 border">{log.date}</td>
                  <td className="p-2 border">{log.driving_hours.toFixed(2)}</td>
                  <td className="p-2 border">{log.on_duty_not_driving_hours.toFixed(2)}</td>
                  <td className="p-2 border">{log.off_duty_hours.toFixed(2)}</td>
                  <td className="p-2 border">{log.sleeper_berth_hours.toFixed(2)}</td>
                  <td className="p-2 border">{log.total_hours.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4">
            <h4 className="text-md font-semibold text-gray-700 mb-2">Activity Timeline</h4>
            <div className="bg-gray-50 p-4 rounded border">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        </>
      ) : (
        <p className="text-gray-600">No daily logs available.</p>
      )}
    </div>
  );
};

export default DailyLogsComponent;