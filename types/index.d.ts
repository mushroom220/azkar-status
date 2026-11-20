declare module 'claude-code' {
  interface PluginState {
    'azkar-status': {
      /** The dhikr the status line shows now, verbatim from the source. */
      current: string | null
    }
  }
}
