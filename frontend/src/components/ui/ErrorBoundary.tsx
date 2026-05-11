import { Component, type ReactNode } from 'react'
type Props = {
  children: ReactNode
  fallback?: string
}
type State = {
  hasError: boolean
  error?: Error
}
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }
  componentDidCatch(error: Error, info: unknown) {
    console.error('ErrorBoundary caught error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-[#2a1f1f] bg-[#180d12] p-6 text-sm text-[#ef9aa9] shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
          <p className="font-semibold">Something went wrong</p>
          <p className="mt-2 text-xs text-[#c67f7f]">
            {this.props.fallback || 'An error occurred while rendering this section.'}
          </p>
          {import.meta.env.MODE === 'development' && this.state.error && (
            <pre className="mt-3 overflow-auto rounded bg-[#0a0808] p-2 text-[10px] text-[#ff6b6b]">
              {this.state.error.message}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
