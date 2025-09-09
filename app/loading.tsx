export default function RootLoading() {
  return (
    <div className="flex flex-1 items-center justify-center p-6 animate-in fade-in">
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/70 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    </div>
  )
}
