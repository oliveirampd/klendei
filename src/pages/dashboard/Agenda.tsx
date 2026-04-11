import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function Agenda() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Agenda</h1>
      <Card>
        <CardContent className="py-12 text-center">
          <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Visualização da agenda em breve.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Use a página inicial para ver os agendamentos de hoje.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
