import Orb from './orb'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4 fade-in">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="w-64 h-64 relative">
          <Orb 
            hue={120} 
            hoverIntensity={0.3} 
            rotateOnHover={true}
          />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
          Привет!
          </h2>
          <p className="text-muted-foreground">
          Это новый чат
          </p>
        </div>
      </div>
    </div>
  )
}
