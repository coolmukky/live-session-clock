import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Catches render/runtime errors so a bug can't white-screen a live session.
 * Offers a plain reload and a "clear saved data" escape hatch in case a
 * corrupt localStorage entry is the cause.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('Live Session Clock crashed:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="errbound">
        <div className="errbound__card">
          <div className="errbound__mark" aria-hidden>
            ⚠️
          </div>
          <h1 className="errbound__title">Something went wrong</h1>
          <p className="errbound__text">
            The app hit an unexpected error. Reloading usually fixes it. If it
            keeps happening, clearing this browser's saved agenda will reset it.
          </p>
          <pre className="errbound__detail">{this.state.error.message}</pre>
          <div className="errbound__actions">
            <button
              className="btn btn--primary btn--lg"
              onClick={() => window.location.reload()}
            >
              ⟲ Reload
            </button>
            <button
              className="btn btn--ghost btn--lg"
              onClick={() => {
                try {
                  window.localStorage.clear();
                } catch {
                  /* ignore */
                }
                window.location.reload();
              }}
            >
              Clear saved data & reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
