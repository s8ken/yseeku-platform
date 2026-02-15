'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useTutorialStore, TutorialStep } from '@/store/useTutorialStore';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import gsap from 'gsap';

export const TutorialTour: React.FC = () => {
  const { 
    isActive, 
    currentStepIndex, 
    steps, 
    stopTutorial, 
    nextStep, 
    previousStep 
  } = useTutorialStore();
  
  const router = useRouter();
  const pathname = usePathname();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const currentStep = steps[currentStepIndex];

  // Update target rect when step changes or window resizes
  useEffect(() => {
    if (!isActive || !currentStep) return;

    const updateRect = () => {
      if (currentStep.targetId) {
        const element = document.getElementById(currentStep.targetId);
        if (element) {
          setTargetRect(element.getBoundingClientRect());
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          setTargetRect(null);
        }
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);
    
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [isActive, currentStep, currentStepIndex]);

  // Handle path changes
  useEffect(() => {
    if (isActive && currentStep?.path && pathname !== currentStep.path) {
      router.push(currentStep.path);
    }
  }, [isActive, currentStep, pathname, router]);

  // Animate card entry
  useEffect(() => {
    if (isActive && cardRef.current) {
      gsap.fromTo(cardRef.current, 
        { opacity: 0, scale: 0.9, y: 10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, [isActive, currentStepIndex]);

  if (!isActive || !currentStep) return null;

  const getCardStyle = () => {
    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'fixed' as const,
        zIndex: 100,
      };
    }

    const padding = 12;
    const { top, left, width, height } = targetRect;
    const position = currentStep.position || 'bottom';

    switch (position) {
      case 'top':
        return {
          top: top - padding,
          left: left + width / 2,
          transform: 'translate(-50%, -100%)',
          position: 'absolute' as const,
          zIndex: 100,
        };
      case 'right':
        return {
          top: top + height / 2,
          left: left + width + padding,
          transform: 'translate(0, -50%)',
          position: 'absolute' as const,
          zIndex: 100,
        };
      case 'left':
        return {
          top: top + height / 2,
          left: left - padding,
          transform: 'translate(-100%, -50%)',
          position: 'absolute' as const,
          zIndex: 100,
        };
      case 'bottom':
      default:
        return {
          top: top + height + padding,
          left: left + width / 2,
          transform: 'translate(-50%, 0)',
          position: 'absolute' as const,
          zIndex: 100,
        };
    }
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Overlay backdrop with a hole for the target */}
      <div 
        className="absolute inset-0 bg-black/40 pointer-events-auto"
        onClick={stopTutorial}
        style={{
          clipPath: targetRect ? `polygon(
            0% 0%, 0% 100%, 
            ${targetRect.left}px 100%, 
            ${targetRect.left}px ${targetRect.top}px, 
            ${targetRect.right}px ${targetRect.top}px, 
            ${targetRect.right}px ${targetRect.bottom}px, 
            ${targetRect.left}px ${targetRect.bottom}px, 
            ${targetRect.left}px 100%, 
            100% 100%, 100% 0%
          )` : 'none'
        }}
      />

      <Card 
        ref={cardRef}
        className="w-[320px] shadow-2xl pointer-events-auto border-emerald-500/30 bg-card text-card-foreground"
        style={getCardStyle()}
      >
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-emerald-500" />
            {currentStep.title}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2" onClick={stopTutorial}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="py-2">
          <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
            {currentStep.content}
          </div>
        </CardContent>
        <CardFooter className="pt-2 flex justify-between items-center">
          <div className="text-xs text-muted-foreground font-medium">
            Step {currentStepIndex + 1} of {steps.length}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={previousStep}
              disabled={currentStepIndex === 0}
              className="h-8 px-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={nextStep}
              className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700"
            >
              {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}
              {currentStepIndex !== steps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
