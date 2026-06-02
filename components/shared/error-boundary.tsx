"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // TODO Phase 6: send to Sentry
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="h-7 w-7 text-destructive" aria-hidden />
        <div className="space-y-1">
          <h3 className="font-semibold text-sm">Something went wrong</h3>
          <p className="text-muted-foreground text-xs max-w-xs">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={this.handleReset}>
          Try again
        </Button>
      </div>
    );
  }
}