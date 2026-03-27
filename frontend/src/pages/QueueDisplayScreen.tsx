import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { queueService } from '@/services/queueService';
import type { QueueDisplay } from '@/types';

export function QueueDisplayScreen() {
  const [searchParams] = useSearchParams();
  const doctorId = searchParams.get('doctorId') || undefined;
  const tenantId = searchParams.get('tenantId') || localStorage.getItem('tenantId') || undefined;
  const [currentTime, setCurrentTime] = useState(new Date());

  // Auto-refresh every 5 seconds
  const { data: queueData } = useQuery({
    queryKey: ['queue-display', doctorId, tenantId],
    queryFn: () => queueService.getQueueDisplay(doctorId, tenantId),
    refetchInterval: 5000, // 5 seconds
  });

  const queue: QueueDisplay | undefined = queueData?.data;

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">
              Patient Queue
            </h1>
            <p className="text-xl text-gray-600 mt-2">
              {queue?.doctorName || 'All Doctors'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-indigo-600">
              {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })}
            </div>
            <div className="text-xl text-gray-600 mt-1">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Token - Large Display */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-2xl text-gray-600 mb-4">NOW SERVING</div>
            {queue?.currentToken ? (
              <>
                <div className="text-9xl font-bold text-indigo-600 mb-6">
                  {queue.currentToken.tokenNumber}
                </div>
                <div className="text-4xl text-gray-700">
                  {queue.currentToken.patientName}
                </div>
                {queue.currentToken.priority === 2 && (
                  <div className="mt-4 inline-block bg-red-100 text-red-600 px-6 py-3 rounded-full text-xl font-semibold">
                    🚨 EMERGENCY
                  </div>
                )}
              </>
            ) : (
              <div className="text-6xl text-gray-400 py-12">
                No Patient Currently
              </div>
            )}
          </div>

          {/* Next Token */}
          {queue?.nextToken && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg p-8 mt-6 text-center">
              <div className="text-xl text-gray-600 mb-2">NEXT</div>
              <div className="text-6xl font-bold text-green-600 mb-3">
                {queue.nextToken.tokenNumber}
              </div>
              <div className="text-2xl text-gray-700">
                {queue.nextToken.patientName}
              </div>
            </div>
          )}
        </div>

        {/* Waiting Queue */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-800">
                Waiting
              </h2>
              <div className="bg-indigo-100 text-indigo-600 px-4 py-2 rounded-full text-2xl font-bold">
                {queue?.totalWaiting || 0}
              </div>
            </div>

            {queue?.averageWaitTimeMinutes !== undefined && queue.averageWaitTimeMinutes > 0 && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded">
                <div className="text-sm text-amber-700">Average Wait Time</div>
                <div className="text-2xl font-bold text-amber-900">
                  ~{Math.round(queue.averageWaitTimeMinutes)} mins
                </div>
              </div>
            )}

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {queue?.waitingQueue && queue.waitingQueue.length > 0 ? (
                queue.waitingQueue.map((token) => (
                  <div
                    key={token.tokenNumber}
                    className={`p-5 rounded-xl border-2 ${
                      token.priority === 2
                        ? 'bg-red-50 border-red-300'
                        : token.priority === 1
                        ? 'bg-yellow-50 border-yellow-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`text-3xl font-bold ${
                          token.priority === 2
                            ? 'text-red-600'
                            : token.priority === 1
                            ? 'text-yellow-600'
                            : 'text-gray-700'
                        }`}>
                          {token.tokenNumber}
                        </div>
                        <div>
                          <div className="text-lg font-medium text-gray-800">
                            {token.patientName}
                          </div>
                          {token.priority === 2 && (
                            <div className="text-xs text-red-600 font-semibold">
                              EMERGENCY
                            </div>
                          )}
                          {token.priority === 1 && (
                            <div className="text-xs text-yellow-600 font-semibold">
                              SENIOR CITIZEN
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {Math.round(token.waitTimeMinutes)}m
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-12 text-xl">
                  No patients waiting
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-600">
        <p className="text-lg">
          Thank you for your patience • Please be ready when your number is called
        </p>
      </div>
    </div>
  );
}
