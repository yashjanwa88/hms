import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Activity, 
  Calendar, 
  FileText, 
  Pill, 
  User, 
  Stethoscope, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { patientService } from '../services/patientService';

interface TimelineItemProps {
  date: string;
  title: string;
  description: string;
  type: 'visit' | 'diagnosis' | 'medication' | 'lab' | 'billing';
  status?: string;
  doctor?: string;
  isLast?: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ 
  date, title, description, type, status, doctor, isLast 
}) => {
  const icons = {
    visit: { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100' },
    diagnosis: { icon: Stethoscope, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    medication: { icon: Pill, color: 'text-amber-600', bg: 'bg-amber-100' },
    lab: { icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    billing: { icon: FileText, color: 'text-rose-600', bg: 'bg-rose-100' },
  };

  const { icon: Icon, color, bg } = icons[type];

  return (
    <div className="relative flex gap-6 pb-8">
      {!isLast && (
        <div className="absolute left-6 top-12 bottom-0 w-px bg-slate-200" />
      )}
      <div className={cn("relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm", bg)}>
        <Icon className={cn("h-6 w-6", color)} />
      </div>
      <div className="flex-1 pt-1">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5 whitespace-nowrap">
            <Clock className="h-3.5 w-3.5" />
            {new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <p className="mt-1 text-slate-600 leading-relaxed">{description}</p>
        <div className="mt-3 flex items-center gap-3">
          {doctor && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <User className="h-3 w-3" />
              {doctor}
            </div>
          )}
          {status && (
            <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest px-1.5 h-4">
              {status}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export function PatientHistoryTimeline({ patientId }: { patientId: string }) {
  const { data: timelineData, isLoading } = useQuery({
    queryKey: ['patient-timeline', patientId],
    queryFn: () => patientService.getPatientTimeline(patientId, { pageSize: 10 }),
  });

  const events = timelineData?.data?.items || [];

  if (isLoading) return <div className="animate-pulse space-y-4">
    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-3xl" />)}
  </div>;

  return (
    <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          Clinical History Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        {events.length > 0 ? (
          <div className="max-w-3xl">
            {events.map((item: any, i: number) => (
              <TimelineItem 
                key={i} 
                date={item.eventDate}
                title={item.eventTitle}
                description={item.eventDescription}
                type={item.eventType}
                doctor={item.doctorName}
                status={item.status}
                isLast={i === events.length - 1} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400 font-medium">No clinical history recorded yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
