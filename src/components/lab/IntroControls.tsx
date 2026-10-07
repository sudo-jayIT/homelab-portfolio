"use client";

/**
 * Top-right intro controls (spec 01 sections 2.3, 5.3), shown in phases
 * intro and booting. The wrapper is uppercase but Tailwind preflight resets
 * button text-transform, so the labels render lowercase (as the original).
 * "back to the page" is hidden during the first-visit opening.
 */

export interface IntroControlsProps {
  /** First-visit autoplay intro: no "back to the page". */
  firstVisit: boolean;
  onBack: () => void;
  onSkip: () => void;
}

export function IntroControls({ firstVisit, onBack, onSkip }: IntroControlsProps) {
  return (
    <div className="absolute right-5 top-5 z-[60] flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.25em] sm:right-8 sm:top-7">
      {firstVisit ? null : (
        <button type="button" onClick={onBack} className="text-gray-2 transition-colors hover:text-mint">
          back to the page
        </button>
      )}
      <button type="button" onClick={onSkip} className="text-gray-2 transition-colors hover:text-mint">
        skip intro →
      </button>
    </div>
  );
}
