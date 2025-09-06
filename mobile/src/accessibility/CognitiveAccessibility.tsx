/**
 * TailTracker Cognitive Accessibility System
 * 
 * Comprehensive cognitive accessibility features designed to support users
 * with cognitive disabilities, learning differences, attention disorders,
 * memory impairments, and processing differences.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AccessibilityManager from './AccessibilityManager';

interface CognitiveAccessibilityProps {
  children: React.ReactNode;
  complexityLevel?: 'minimal' | 'simple' | 'standard' | 'advanced';
  showProgressIndicators?: boolean;
  enableMemoryAids?: boolean;
  enableReadingAssistance?: boolean;
  singleTaskMode?: boolean;
}

/**
 * Cognitive Load Indicator
 */
interface CognitiveLoadProps {
  currentLoad: 1 | 2 | 3 | 4 | 5; // 1 = very light, 5 = very heavy
  targetLoad: 1 | 2 | 3 | 4 | 5;
  onLoadReduction?: () => void;
}

export const CognitiveLoadIndicator: React.FC<CognitiveLoadProps> = ({
  currentLoad,
  targetLoad,
  onLoadReduction,
}) => {
  const accessibilityManager = AccessibilityManager.getInstance();
  const preferences = accessibilityManager.getPreferences();
  
  const loadLabels = useMemo(() => ({
    1: 'Very Light',
    2: 'Light',
    3: 'Moderate',
    4: 'Heavy',
    5: 'Very Heavy',
  }), []);
  
  const loadColors = {
    1: '#4CAF50', // Green
    2: '#8BC34A', // Light Green
    3: '#FFC107', // Amber
    4: '#FF9800', // Orange
    5: '#F44336', // Red
  };
  
  const shouldShowWarning = currentLoad > targetLoad;
  
  useEffect(() => {
    if (shouldShowWarning && preferences.cognitiveAccessibility.focusReminders) {
      accessibilityManager.announceForAccessibility(
        `Cognitive load is ${loadLabels[currentLoad]}. Consider simplifying the interface.`,
        'medium'
      );
    }
  }, [currentLoad, targetLoad, shouldShowWarning, preferences, accessibilityManager, loadLabels]);
  
  if (!preferences.cognitiveAccessibility.progressIndicators) {
    return null;
  }
  
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: shouldShowWarning ? '#FFF3E0' : '#F5F5F5',
        borderRadius: 8,
        marginVertical: 4,
      }}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={`Cognitive load: ${loadLabels[currentLoad]}`}
      accessibilityValue={{ min: 1, max: 5, now: currentLoad }}
    >
      <Text style={{ fontSize: 12, color: '#666', marginRight: 8 }}>
        Complexity:
      </Text>
      
      {[1, 2, 3, 4, 5].map((level) => (
        <View
          key={level}
          style={{
            width: 16,
            height: 8,
            backgroundColor: level <= currentLoad ? loadColors[currentLoad] : '#E0E0E0',
            marginRight: 2,
            borderRadius: 4,
          }}
          accessible={false}
        />
      ))}
      
      <Text style={{ fontSize: 12, color: loadColors[currentLoad], marginLeft: 8 }}>
        {loadLabels[currentLoad]}
      </Text>
      
      {shouldShowWarning && onLoadReduction && (
        <TouchableOpacity
          onPress={onLoadReduction}
          style={{
            marginLeft: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
            backgroundColor: '#2196F3',
            borderRadius: 4,
          }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Simplify interface"
          accessibilityHint="Reduces cognitive load by simplifying the current screen"
        >
          <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
            SIMPLIFY
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * Memory Aid System
 */
interface MemoryAidProps {
  taskId: string;
  taskName: string;
  steps: {
    id: string;
    description: string;
    completed?: boolean;
    optional?: boolean;
  }[];
  onStepComplete?: (stepId: string) => void;
  showCompletedSteps?: boolean;
}

export const MemoryAidChecklist: React.FC<MemoryAidProps> = ({
  taskId,
  taskName,
  steps,
  onStepComplete,
  showCompletedSteps = true,
}) => {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);
  const accessibilityManager = AccessibilityManager.getInstance();
  const preferences = accessibilityManager.getPreferences();
  
  // Load saved progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const saved = await AsyncStorage.getItem(`memory_aid_${taskId}`);
        if (saved) {
          setCompletedSteps(new Set(JSON.parse(saved)));
        }
      } catch (error) {
        console.error('Failed to load memory aid progress:', error);
      }
    };
    loadProgress();
  }, [taskId]);
  
  // Save progress
  const saveProgress = useCallback(async (newCompletedSteps: Set<string>) => {
    try {
      await AsyncStorage.setItem(
        `memory_aid_${taskId}`,
        JSON.stringify(Array.from(newCompletedSteps))
      );
    } catch (error) {
      console.error('Failed to save memory aid progress:', error);
    }
  }, [taskId]);
  
  const handleStepComplete = useCallback((stepId: string) => {
    const newCompletedSteps = new Set(completedSteps);
    
    if (completedSteps.has(stepId)) {
      newCompletedSteps.delete(stepId);
    } else {
      newCompletedSteps.add(stepId);
    }
    
    setCompletedSteps(newCompletedSteps);
    saveProgress(newCompletedSteps);
    
    const step = steps.find(s => s.id === stepId);
    if (step) {
      accessibilityManager.announceForAccessibility(
        completedSteps.has(stepId) 
          ? `Unchecked: ${step.description}`
          : `Completed: ${step.description}`,
        'medium'
      );
    }
    
    onStepComplete?.(stepId);
  }, [completedSteps, steps, onStepComplete, accessibilityManager, saveProgress]);
  
  const completedCount = steps.filter(step => completedSteps.has(step.id)).length;
  const totalSteps = steps.filter(step => !step.optional).length;
  const progress = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;
  
  if (!preferences.cognitiveAccessibility.progressIndicators) {
    return null;
  }
  
  return (
    <View
      style={{
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#2196F3',
      }}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={`Memory aid for ${taskName}`}
    >
      {/* Header with progress */}
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: isExpanded ? 12 : 0,
        }}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${taskName} checklist. ${completedCount} of ${totalSteps} steps completed.`}
        accessibilityHint={isExpanded ? "Tap to collapse" : "Tap to expand"}
        accessibilityState={{ expanded: isExpanded }}
      >
        <Text style={{ fontSize: 16, fontWeight: 'bold', flex: 1 }}>
          {taskName}
        </Text>
        
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
            {completedCount}/{totalSteps}
          </Text>
          
          <View style={{ width: 60, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2 }}>
            <View
              style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: progress === 100 ? '#4CAF50' : '#2196F3',
                borderRadius: 2,
              }}
            />
          </View>
        </View>
        
        <Text style={{ marginLeft: 12, fontSize: 18, color: '#666' }}>
          {isExpanded ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>
      
      {/* Steps */}
      {isExpanded && (
        <View>
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(step.id);
            const shouldShow = showCompletedSteps || !isCompleted;
            
            if (!shouldShow) return null;
            
            return (
              <TouchableOpacity
                key={step.id}
                onPress={() => handleStepComplete(step.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  paddingVertical: 8,
                  paddingHorizontal: 4,
                  opacity: isCompleted ? 0.7 : 1,
                }}
                accessible={true}
                accessibilityRole="checkbox"
                accessibilityLabel={step.description}
                accessibilityState={{ checked: isCompleted }}
                accessibilityHint={step.optional ? "Optional step" : "Required step"}
              >
                {/* Checkbox */}
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderWidth: 2,
                    borderColor: isCompleted ? '#4CAF50' : '#CCC',
                    backgroundColor: isCompleted ? '#4CAF50' : 'white',
                    borderRadius: 4,
                    marginRight: 12,
                    marginTop: 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  accessible={false}
                >
                  {isCompleted && (
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                      ✓
                    </Text>
                  )}
                </View>
                
                {/* Step description */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      { fontSize: 14, lineHeight: 20 },
                      isCompleted && { textDecorationLine: 'line-through' },
                      step.optional && { fontStyle: 'italic', color: '#666' },
                    ]}
                  >
                    {step.description}
                    {step.optional && ' (optional)'}
                  </Text>
                </View>
                
                {/* Step number */}
                <Text style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>
                  {index + 1}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

/**
 * Reading Assistance Component
 */
interface ReadingAssistanceProps {
  children: React.ReactNode;
  text: string;
  enableDefinitions?: boolean;
  enablePhonetics?: boolean;
  simplifyLanguage?: boolean;
}

export const ReadingAssistance: React.FC<ReadingAssistanceProps> = ({
  children,
  text,
  enableDefinitions = false,
  enablePhonetics = false,
  simplifyLanguage = false,
}) => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [showDefinition, setShowDefinition] = useState(false);
  const [definitions, setDefinitions] = useState<Record<string, string>>({});
  
  const accessibilityManager = AccessibilityManager.getInstance();
  const preferences = accessibilityManager.getPreferences();
  
  const shouldShowReadingAids = preferences.cognitiveAccessibility.readingAssistance ||
    preferences.cognitiveAccessibility.definitionsEnabled ||
    preferences.cognitiveAccessibility.phoneticsEnabled;
  
  // Simplified language dictionary
  const simplificationDict: Record<string, string> = {
    'utilize': 'use',
    'commence': 'start',
    'terminate': 'end',
    'facilitate': 'help',
    'demonstrate': 'show',
    'approximately': 'about',
    'indicate': 'show',
    'subsequently': 'later',
    'previously': 'before',
    'currently': 'now',
  };
  
  // Common definitions for pet care terms
  const petCareDefinitions = useMemo<Record<string, string>>(() => ({
    'vaccination': 'A shot that protects your pet from diseases',
    'microchip': 'A tiny device under your pet\'s skin with ID information',
    'deworming': 'Medicine to remove worms from your pet',
    'spaying': 'Surgery to prevent female pets from having babies',
    'neutering': 'Surgery to prevent male pets from having babies',
    'heartworm': 'A dangerous worm that affects pet hearts',
    'flea': 'Small bugs that bite pets and make them itch',
    'tick': 'Small bugs that attach to pets and can spread disease',
  }), []);
  
  // Commented out unused processedText calculation
  // const processedText = useMemo(() => {
  //   if (!simplifyLanguage || preferences.cognitiveAccessibility.languageLevel !== 'simple') {
  //     return text;
  //   }
  //   
  //   let processed = text;
  //   Object.entries(simplificationDict).forEach(([complex, simple]) => {
  //     const regex = new RegExp(`\\b${complex}\\b`, 'gi');
  //     processed = processed.replace(regex, simple);
  //   });
  //   
  //   return processed;
  // }, [text, simplifyLanguage, preferences.cognitiveAccessibility.languageLevel]);
  
  const handleWordPress = useCallback((word: string) => {
    if (!shouldShowReadingAids) return;
    
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
    setSelectedWord(cleanWord);
    
    // Check if we have a definition
    if (petCareDefinitions[cleanWord]) {
      setDefinitions(prev => ({
        ...prev,
        [cleanWord]: petCareDefinitions[cleanWord],
      }));
      setShowDefinition(true);
      
      accessibilityManager.announceForAccessibility(
        `Definition for ${cleanWord}: ${petCareDefinitions[cleanWord]}`,
        'medium'
      );
    } else {
      accessibilityManager.announceForAccessibility(
        `Selected word: ${cleanWord}. No definition available.`,
        'low'
      );
    }
  }, [shouldShowReadingAids, accessibilityManager, petCareDefinitions]);
  
  return (
    <View>
      {/* Reading assistance tools */}
      {shouldShowReadingAids && (
        <View
          style={{
            backgroundColor: '#E3F2FD',
            padding: 8,
            borderRadius: 8,
            marginBottom: 8,
          }}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel="Reading assistance tools"
        >
          <Text style={{ fontSize: 12, color: '#1565C0', textAlign: 'center' }}>
            📖 Reading assistance active. Tap words for definitions.
          </Text>
        </View>
      )}
      
      {/* Main content */}
      <View>
        {React.cloneElement(children as React.ReactElement, {
          onPress: handleWordPress,
          accessible: true,
          accessibilityHint: shouldShowReadingAids 
            ? "Tap individual words for definitions and reading assistance"
            : undefined,
        })}
      </View>
      
      {/* Definition modal */}
      <Modal
        visible={showDefinition}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDefinition(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 20,
              maxWidth: '90%',
              minWidth: 250,
            }}
            accessible={true}
            accessibilityRole="alert"
            accessibilityLabel="Word definition"
          >
            <Text
              style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}
              accessible={true}
              accessibilityRole="header"
            >
              {selectedWord}
            </Text>
            
            {selectedWord && definitions[selectedWord] && (
              <Text
                style={{ fontSize: 16, lineHeight: 24, marginBottom: 16, textAlign: 'center' }}
                accessible={true}
              >
                {definitions[selectedWord]}
              </Text>
            )}
            
            {enablePhonetics && selectedWord && (
              <Text
                style={{ fontSize: 14, color: '#666', marginBottom: 16, textAlign: 'center', fontStyle: 'italic' }}
                accessible={true}
                accessibilityLabel={`Pronunciation: ${selectedWord}`}
              >
                /{selectedWord}/ {/* Simplified phonetics */}
              </Text>
            )}
            
            <TouchableOpacity
              onPress={() => setShowDefinition(false)}
              style={{
                backgroundColor: '#2196F3',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close definition"
            >
              <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                Got it!
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

/**
 * Single Task Mode Container
 */
interface SingleTaskModeProps {
  children: React.ReactNode;
  taskTitle: string;
  onTaskComplete?: () => void;
  onTaskCancel?: () => void;
  showProgress?: boolean;
  currentStep?: number;
  totalSteps?: number;
}

export const SingleTaskMode: React.FC<SingleTaskModeProps> = ({
  children,
  taskTitle,
  onTaskComplete,
  onTaskCancel,
  showProgress = true,
  currentStep = 1,
  totalSteps = 1,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const accessibilityManager = AccessibilityManager.getInstance();
  const preferences = accessibilityManager.getPreferences();
  
  useEffect(() => {
    if (preferences.cognitiveAccessibility.singleTaskMode) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      accessibilityManager.announceForAccessibility(
        `Single task mode: ${taskTitle}. Focus on this task only.`,
        'high'
      );
    }
  }, [preferences.cognitiveAccessibility.singleTaskMode, taskTitle, accessibilityManager, fadeAnim]);
  
  if (!preferences.cognitiveAccessibility.singleTaskMode) {
    return <>{children}</>;
  }
  
  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
      }}
    >
      {/* Task header */}
      <View
        style={{
          backgroundColor: '#1976D2',
          padding: 16,
          paddingTop: 50, // Account for status bar
        }}
        accessible={true}
        accessibilityRole="header"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}
              accessible={true}
              accessibilityRole="header"
            >
              {taskTitle}
            </Text>
            
            {showProgress && totalSteps > 1 && (
              <Text
                style={{ color: 'white', fontSize: 14, marginTop: 4, opacity: 0.9 }}
                accessible={true}
                accessibilityLabel={`Step ${currentStep} of ${totalSteps}`}
              >
                Step {currentStep} of {totalSteps}
              </Text>
            )}
          </View>
          
          {onTaskCancel && (
            <TouchableOpacity
              onPress={onTaskCancel}
              style={{
                padding: 8,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Cancel task"
              accessibilityHint="Returns to previous screen"
            >
              <Text style={{ color: 'white', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Progress bar */}
        {showProgress && totalSteps > 1 && (
          <View
            style={{
              marginTop: 12,
              height: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              borderRadius: 2,
            }}
            accessible={true}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 1, max: totalSteps, now: currentStep }}
          >
            <View
              style={{
                width: `${(currentStep / totalSteps) * 100}%`,
                height: '100%',
                backgroundColor: 'white',
                borderRadius: 2,
              }}
            />
          </View>
        )}
      </View>
      
      {/* Task content */}
      <ScrollView
        style={{
          flex: 1,
          backgroundColor: '#FAFAFA',
        }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      
      {/* Task completion */}
      {onTaskComplete && (
        <View
          style={{
            padding: 16,
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#E0E0E0',
          }}
        >
          <TouchableOpacity
            onPress={onTaskComplete}
            style={{
              backgroundColor: '#4CAF50',
              padding: 16,
              borderRadius: 8,
              alignItems: 'center',
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Complete task"
            accessibilityHint="Finishes current task and returns to main screen"
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
              Complete Task
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

/**
 * Cognitive Accessibility Provider
 */
export const CognitiveAccessibilityProvider: React.FC<CognitiveAccessibilityProps> = ({
  children,
  complexityLevel = 'standard',
  showProgressIndicators = true,
  enableMemoryAids = true,
  enableReadingAssistance = true,
  singleTaskMode = false,
}) => {
  const accessibilityManager = AccessibilityManager.getInstance();
  // const preferences = accessibilityManager.getPreferences(); // Unused
  
  // Apply cognitive accessibility settings
  useEffect(() => {
    const cognitiveSettings = {
      interfaceComplexity: complexityLevel,
      progressIndicators: showProgressIndicators,
      readingAssistance: enableReadingAssistance,
      singleTaskMode: singleTaskMode,
    };
    
    accessibilityManager.updatePreference('cognitiveAccessibility', cognitiveSettings);
  }, [complexityLevel, showProgressIndicators, enableReadingAssistance, singleTaskMode, accessibilityManager]);
  
  return (
    <View style={{ flex: 1 }}>
      {children}
    </View>
  );
};

export default {
  CognitiveLoadIndicator,
  MemoryAidChecklist,
  ReadingAssistance,
  SingleTaskMode,
  CognitiveAccessibilityProvider,
};