import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { queueService } from '@/services/queueService';
import type { QueueDisplay } from '@/types';
import { Activity, Clock, Users } from 'lucide-react';

function pad(n: number) { return String(n).padStart(2, '0'); }

export function QueueDisplayScreen() {
  const [searchParams] = useSearchParams();
  const doctorId = searchParams.get('doctorId') ?? undefined;
  const tenantId = searchParams.get('tenantId') ?? localStorage.getItem('tenantId') ?? undefined;
  const [now, setNow] = useState(new Date());

  const { data: queueData } = useQuery({
    queryKey: ['queue-display', doctorId, tenantId],
    queryFn: () => queueService.getQueueDisplay(doctorId, tenantId),
    refetchInterval: 5000,
  });

  const queue: QueueDisplay | undefined = queueData?.data;

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = `${pad(now.getHours() % 12 || 12)}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col select-none overflow-hidden">

      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">MedLedger HMS</p>
            <p className="text-xs text-slate-400 mt-0.5">{queue?.doctorName ?? 'All Doctors'}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-black text-white tabular-nums">{timeStr}</p>
          <p className="text-xs text-slate-400 mt-0.5">{dateStr}</p>
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Current + Next — 2/3 width */}
        <div className="flex flex-col flex-[2] border-r border-slate-800 overflow-hidden">

          {/* NOW SERVING */}
          <div className="flex flex-1 flex-col items-center justify-center p-10 bg-gradient-to-br from-slate-900 to-slate-950">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 mb-6">
              Now Serving
            </p>

            {queue?.currentToken ? (
              <>
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl scale-150" />
                  <div className="relative flex h-52 w-52 items-center justify-center rounded-full border-4 border-primary/30 bg-primary/5 pulse-ring">
                    <span className="token-xl text-primary">
                      {queue.currentToken.tokenNumber}
                    </span>
                  </div>
                </div>

                <p className="mt-8 text-3xl font-bold text-white text-center">
                  {queue.currentToken.patientName}
                </p>

                {queue.currentToken.priority === 2 && (
                  <span className="mt-4 status-emergency text-sm px-4 py-1.5">
                    🚨 Emergency Priority
                  </span>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 text-slate-600">
                <Users className="h-20 w-20 opacity-20" />
                <p className="text-2xl font-semibold">No Patient Currently</p>
                <p className="text-sm">Waiting for next token to be called</p>
              </div>
            )}
          </div>

          {/* NEXT */}
          {queue?.nextToken && (
            <div className="flex items-center justify-between px-10 py-5 bg-emerald-950/40 border-t border-emerald-900/40 shrink-0">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-1">Up Next</p>
                <p className="text-xl font-semibold text-white">{queue.nextToken.patientName}</p>
              </div>
              <span className="token-md text-emerald-400">{queue.nextToken.tokenNumber}</span>
            </div>
          )}
        </div>

        {/* Waiting list — 1/3 width */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 shrink-0">
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Waiting</p>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-bold">
              {queue?.totalWaiting ?? 0}
            </span>
          </div>

          {/* Avg wait */}
          {(queue?.averageWaitTimeMinutes ?? 0) > 0 && (
            <div className="flex items-center gap-2 px-6 py-3 bg-amber-950/30 border-b border-amber-900/30 shrink-0">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <p className="text-xs text-amber-300">
                Avg wait: <strong>~{Math.round(queue!.averageWaitTimeMinutes)} min</strong>
              </p>
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {queue?.waitingQueue?.length ? (
              queue.waitingQueue.map((token, i) => (
                <div
                  key={token.tokenNumber}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-colors ${
                    token.priority === 2
                      ? 'bg-red-950/40 border-red-800/50'
                      : token.priority === 1
                      ? 'bg-amber-950/30 border-amber-800/40'
                      : i === 0
                      ? 'bg-emerald-950/30 border-emerald-800/40'
                      : 'bg-slate-800/40 border-slate-700/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`token-md shrink-0 ${
                      token.priority === 2 ? 'text-red-400' :
                      token.priority === 1 ? 'text-amber-400' :
                      i === 0 ? 'text-emerald-400' : 'text-slate-300'
                    }`}>
                      {token.tokenNumber}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{token.patientName}</p>
                      {token.priority === 2 && <p className="text-xs text-red-400 font-semibold">EMERGENCY</p>}
                      {token.priority === 1 && <p className="text-xs text-amber-400 font-semibold">SENIOR CITIZEN</p>}
                      {i === 0 && token.priority === 0 && <p className="text-xs text-emerald-400 font-semibold">NEXT</p>}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 shrink-0 ml-2">
                    {Math.round(token.waitTimeMinutes)}m
                  </span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3 py-16">
                <Users className="h-12 w-12 opacity-20" />
                <p className="text-sm">No patients waiting</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="shrink-0 border-t border-slate-800 bg-slate-900/60 px-8 py-3 text-center">
        <p className="text-xs text-slate-500">
          Please be ready when your token number is called • Thank you for your patience
        </p>
      </footer>
    </div>
  );
}
