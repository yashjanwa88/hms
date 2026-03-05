import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { visitService } from '../services/visitService';
import { Clock } from 'lucide-react';

export function VisitTimeline({ visitId }: { visitId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['visitTimeline', visitId],
    queryFn: () => visitService.getVisitTimeline(visitId)
  });

  if (isLoading) return <div>Loading timeline...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data?.data?.map((event: any) => (
            <div key={event.id} className="flex gap-3 border-l-2 border-blue-500 pl-4 pb-4">
              <div className="flex-1">
                <p className="font-medium">{event.eventType}</p>
                <p className="text-sm text-gray-600">{event.eventDescription}</p>
                {event.performedByName && (
                  <p className="text-xs text-gray-500">By: {event.performedByName}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(event.eventDateTime).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
