import { TFile } from 'obsidian'
import { useEffect, useState } from 'react'

import { useApp } from '../../contexts/app-context'

export function useActiveFile(): TFile | null {
  const app = useApp()
  const [file, setFile] = useState<TFile | null>(() =>
    app.workspace.getActiveFile(),
  )

  useEffect(() => {
    const update = () => setFile(app.workspace.getActiveFile())
    const refs = [
      app.workspace.on('active-leaf-change', update),
      app.workspace.on('file-open', update),
    ]
    update()
    return () => {
      for (const ref of refs) app.workspace.offref(ref)
    }
  }, [app])

  return file
}
