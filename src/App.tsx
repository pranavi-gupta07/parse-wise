import React, { useState, useMemo } from 'react';
import { StepId } from './types';
import {
  PRESETS,
  validateGrammar,
  computeLeadingTrailing,
  computePrecedenceMatrix,
} from './utils/compilerEngine';
import { Header } from './components/Header';
import { Breadcrumbs } from './components/Breadcrumbs';
import { StepperNav } from './components/StepperNav';
import { Step1Grammar } from './components/Step1Grammar';
import { Step2LeadingTrailing } from './components/Step2LeadingTrailing';
import { Step3PrecedenceTable } from './components/Step3PrecedenceTable';
import { Step4ParseTrace } from './components/Step4ParseTrace';
import { Footer } from './components/Footer';
import { HelpModal } from './components/HelpModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ToolSwitcher, ToolId } from './components/ToolSwitcher';
import { ReStepperNav, ReStepId, RE_STEPS } from './components/re/ReStepperNav';
import { ReStep1Regex } from './components/re/ReStep1Regex';
import { ReStep2SyntaxTree } from './components/re/ReStep2SyntaxTree';
import { ReStep3Followpos } from './components/re/ReStep3Followpos';
import { ReStep4Dfa } from './components/re/ReStep4Dfa';
import { parseRegex, buildDfa, RE_PRESETS } from './utils/reToDfaEngine';

export default function App() {
  const [currentStep, setCurrentStep] = useState<StepId>('grammar');
  const [grammarText, setGrammarText] = useState<string>(PRESETS[0].grammar);
  const [activeNav, setActiveNav] = useState<string>('bottom-up');
  const [viewMode, setViewMode] = useState<'step' | 'all'>('step');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);

  // ── Operation selector + RE → DFA state ──
  const [tool, setTool] = useState<ToolId>('opp');
  const [reStep, setReStep] = useState<ReStepId>('regex');
  const [regexText, setRegexText] = useState<string>(RE_PRESETS[0].regex);
  const [reShowAll, setReShowAll] = useState<boolean>(false);
  const reParse = useMemo(() => parseRegex(regexText), [regexText]);
  const reDfa = useMemo(() => buildDfa(reParse), [reParse]);

  // Compute grammar validation
  const validation = useMemo(() => {
    return validateGrammar(grammarText);
  }, [grammarText]);

  // Compute Leading & Trailing sets
  const setsData = useMemo(() => {
    return computeLeadingTrailing(validation);
  }, [validation]);

  // Compute Precedence Matrix
  const matrixData = useMemo(() => {
    return computePrecedenceMatrix(validation, setsData);
  }, [validation, setsData]);

  // Toggle Dark Mode
  const handleToggleDark = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  const handleLoadPreset = (presetId: string) => {
    const p = PRESETS.find((item) => item.id === presetId);
    if (p) {
      setGrammarText(p.grammar);
    }
  };

  const handleSelectTool = (next: ToolId) => {
    setTool(next);
    setActiveNav(next === 're' ? 'automata' : 'bottom-up');
  };

  const handleSelectNav = (nav: string) => {
    setActiveNav(nav);
    if (nav === 'automata') setTool('re');
    if (nav === 'bottom-up') setTool('opp');
  };

  const goReStep = (step: ReStepId, showAll = false) => {
    if (step !== 'regex' && !reParse.ok) return;
    setReShowAll(showAll);
    setReStep(step);
  };

  // Scroll to top on step change
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep, reStep, tool]);

  const handleSelectStep = (step: StepId) => {
    if (step !== 'grammar' && !validation.isOperatorGrammar) {
      return;
    }
    setCurrentStep(step);
  };

  const handleProceedTo = (step: StepId) => {
    if (step !== 'grammar' && !validation.isOperatorGrammar) {
      return;
    }
    setCurrentStep(step);
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between ${isDark ? 'dark bg-[#12131C] text-gray-100' : 'bg-[#F6F2EA] text-[#191b24]'}`}>
      <div className="w-full">
        {/* Sticky Header */}
        <Header
          activeNav={activeNav}
          onSelectNav={handleSelectNav}
          viewMode={viewMode}
          onToggleViewMode={setViewMode}
          isDark={isDark}
          onToggleDark={handleToggleDark}
          onOpenHelp={() => setIsHelpOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />

        {/* Global Breadcrumb */}
        <div className="pt-[60px]">
          {tool === 'opp' ? (
            <>
            <Breadcrumbs
              engineStatus={
                validation.isOperatorGrammar
                  ? matrixData.isPrecedenceGrammar
                    ? 'Grammar Engine Ready'
                    : `${matrixData.conflicts.length} Conflict${matrixData.conflicts.length === 1 ? '' : 's'} Detected (Ambiguous)`
                  : 'Axiom Violation Detected'
              }
            />

            {/* Stepper Pipeline */}
            <StepperNav
              currentStep={currentStep}
              onSelectStep={handleSelectStep}
              isGrammarValid={validation.isOperatorGrammar}
              hasConflicts={!matrixData.isPrecedenceGrammar}
              conflictsCount={matrixData.conflicts.length}
              rightSlot={<ToolSwitcher tool={tool} onChange={handleSelectTool} />}
            />

            {/* Screen Content Render */}
            <main className="w-full min-h-[calc(100vh-220px)] bg-dot-grid">
              {currentStep === 'grammar' && (
                <Step1Grammar
                  grammarText={grammarText}
                  onChangeGrammar={setGrammarText}
                  validation={validation}
                  onProceed={() => handleProceedTo('sets')}
                />
              )}

              {currentStep === 'sets' && (
                <Step2LeadingTrailing
                  validation={validation}
                  setsData={setsData}
                  onProceed={() => handleProceedTo('table')}
                  onBack={() => handleProceedTo('grammar')}
                />
              )}

              {currentStep === 'table' && (
                <Step3PrecedenceTable
                  validation={validation}
                  setsData={setsData}
                  matrixData={matrixData}
                  onProceed={() => handleProceedTo('trace')}
                  onBack={() => handleProceedTo('sets')}
                  onLoadPreset={handleLoadPreset}
                />
              )}

              {currentStep === 'trace' && (
                <Step4ParseTrace
                  validation={validation}
                  matrixData={matrixData}
                  onBack={() => handleProceedTo('table')}
                />
              )}
            </main>
            </>
          ) : (
            <>
              <Breadcrumbs
                section="Lexical Analysis"
                page="RE → DFA (Direct Method)"
                engineStatus={
                  reParse.ok && reDfa
                    ? `DFA Ready · ${reDfa.states.length} state${reDfa.states.length === 1 ? '' : 's'}`
                    : 'Invalid Regular Expression'
                }
              />
              <ReStepperNav
                currentStep={reStep}
                onSelectStep={(s) => goReStep(s)}
                isRegexValid={reParse.ok}
                dfaStateCount={reDfa?.states.length ?? 0}
                rightSlot={<ToolSwitcher tool={tool} onChange={handleSelectTool} />}
              />
              <main className="w-full min-h-[calc(100vh-220px)] bg-dot-grid">
                {(reStep === 'regex' || !reParse.ok || !reDfa) && (
                  <ReStep1Regex
                    regex={regexText}
                    onChangeRegex={setRegexText}
                    parse={reParse}
                    onProceed={() => {
                      setViewMode('step');
                      goReStep('tree');
                    }}
                    onShowComplete={() => {
                      setViewMode('all');
                      goReStep('dfa', true);
                    }}
                  />
                )}
                {reParse.ok && reDfa && reStep === 'tree' && (
                  <ReStep2SyntaxTree
                    key={`tree-${reParse.augmented}`}
                    parse={reParse}
                    dfa={reDfa}
                    startInAll={reShowAll}
                    globalViewMode={viewMode}
                    onBack={() => goReStep('regex')}
                    onProceed={() => goReStep('followpos')}
                  />
                )}
                {reParse.ok && reDfa && reStep === 'followpos' && (
                  <ReStep3Followpos
                    key={`fp-${reParse.augmented}`}
                    parse={reParse}
                    dfa={reDfa}
                    startInAll={reShowAll}
                    globalViewMode={viewMode}
                    onBack={() => goReStep('tree')}
                    onProceed={() => goReStep('dfa')}
                  />
                )}
                {reParse.ok && reDfa && reStep === 'dfa' && (
                  <ReStep4Dfa
                    key={`dfa-${reParse.augmented}`}
                    parse={reParse}
                    dfa={reDfa}
                    startInAll={reShowAll}
                    globalViewMode={viewMode}
                    onBack={() => goReStep('followpos')}
                  />
                )}
              </main>
            </>
          )}
        </div>
      </div>

      {/* Global Footer */}
      <Footer
        currentStep={currentStep}
        tool={tool}
        reStepLabel={(() => {
          const i = RE_STEPS.findIndex((x) => x.id === reStep);
          return `Step ${i + 1} of 4 · ${RE_STEPS[i].label.slice(2)}`;
        })()}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Modals */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  );
}
