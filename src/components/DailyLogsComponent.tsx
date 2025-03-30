import React from 'react';

interface DailyLog {
  date: string;
  driving_hours: number;
  on_duty_not_driving_hours: number;
  off_duty_hours: number;
  total_hours: number;
}

interface DailyLogsComponentProps {
  dailyLogs: DailyLog[];
}

const DailyLogsComponent: React.FC<DailyLogsComponentProps> = ({ dailyLogs }) => {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Daily Logs</h3>
      {dailyLogs.length > 0 ? (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Driving (hrs)</th>
              <th className="p-2 border">On-Duty (hrs)</th>
              <th className="p-2 border">Off-Duty (hrs)</th>
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
                <td className="p-2 border">{log.total_hours.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-600">No daily logs available.</p>
      )}
    </div>
  );
};

export default DailyLogsComponent;
