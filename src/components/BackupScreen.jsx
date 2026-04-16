export default function BackupScreen({ state, setState }) {
  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `fittrack-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
  }

  const importData = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setState(JSON.parse(text))
  }

  return (
    <div className="card">
      <h2 className="mb-3 text-lg font-semibold">Backup</h2>
      <div className="flex flex-wrap gap-2">
        <button onClick={exportData}>Export JSON</button>
        <label className="secondary cursor-pointer border px-3 py-2">
          Import JSON
          <input type="file" accept="application/json" className="hidden" onChange={importData} />
        </label>
      </div>
    </div>
  )
}
