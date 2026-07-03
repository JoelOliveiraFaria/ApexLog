function App() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white m-0 p-0">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-emerald-400">
          ApexLog Dashboard
        </h1>
        <p className="mt-2 text-slate-400 font-medium">
          O motor de telemetria está pronto a ser desenhado.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Conectado com Sucesso
        </div>
      </div>
    </div>
  )
}

export default App