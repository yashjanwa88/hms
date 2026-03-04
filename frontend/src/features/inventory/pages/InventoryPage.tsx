import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function InventoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Inventory Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Stock Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Inventory module coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
