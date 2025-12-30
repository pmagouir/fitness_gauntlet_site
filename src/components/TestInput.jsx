import { useState } from 'react';
import { getAgeRange, calculateLevel, calculateScore, getLevelColor, formatResult } from '../utils/fitnessUtils';
import { cn } from '../utils/cn';
import { Plus, Check, X } from 'lucide-react';

function TestInput({ fitnessData, userProfile, onResultSubmit, testResults }) {
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [showInput, setShowInput] = useState(false);

  const ageRange = getAgeRange(userProfile.age);

  const handleTestSelect = (testName) => {
    setSelectedTest(testName);
    setInputValue(testResults[testName]?.toString() || '');
    setShowInput(true);
  };

  const handleSubmit = () => {
    const value = parseFloat(inputValue);
    if (!isNaN(value) && selectedTest) {
      onResultSubmit(selectedTest, value);
      setShowInput(false);
      setSelectedTest(null);
      setInputValue('');
    }
  };

  const handleCancel = () => {
    setShowInput(false);
    setSelectedTest(null);
    setInputValue('');
  };

  const getTestStandards = (testName) => {
    const testData = fitnessData.tests[testName];
    if (!testData) return null;
    
    const standards = testData[userProfile.gender]?.[ageRange];
    if (!standards) return null;
    
    return { ...standards, unit: testData.unit, type: testData.type };
  };

  const getPreviewScore = () => {
    if (!selectedTest || !inputValue) return null;
    const value = parseFloat(inputValue);
    if (isNaN(value)) return null;
    
    const testData = fitnessData.tests[selectedTest];
    const score = calculateScore(testData, userProfile.gender, ageRange, value);
    const level = calculateLevel(testData, userProfile.gender, ageRange, value);
    
    return { score: Math.round(score), level };
  };

  const preview = getPreviewScore();
  const standards = selectedTest ? getTestStandards(selectedTest) : null;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Enter Test Results</h2>
        
        {!showInput ? (
          <div className="space-y-4">
            {Object.entries(fitnessData.domains).map(([domain, tests]) => (
              <div key={domain}>
                <button
                  onClick={() => setSelectedDomain(selectedDomain === domain ? null : domain)}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-between"
                >
                  <span className="font-medium text-gray-900">{domain}</span>
                  <span className="text-sm text-gray-500">
                    {tests.filter(t => testResults[t] !== undefined && testResults[t] !== null).length} / {tests.length}
                  </span>
                </button>
                
                {selectedDomain === domain && (
                  <div className="mt-2 ml-4 space-y-2">
                    {tests.map((testName) => {
                      const hasResult = testResults[testName] !== undefined && testResults[testName] !== null;
                      const testData = fitnessData.tests[testName];
                      
                      return (
                        <button
                          key={testName}
                          onClick={() => handleTestSelect(testName)}
                          className={cn(
                            "w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center justify-between",
                            hasResult
                              ? "bg-green-50 hover:bg-green-100 border border-green-200"
                              : "bg-white hover:bg-gray-50 border border-gray-200"
                          )}
                        >
                          <div>
                            <span className="font-medium text-gray-900">{testName}</span>
                            {hasResult && (
                              <span className="ml-2 text-sm text-gray-600">
                                ({formatResult(testResults[testName], testData.unit)})
                              </span>
                            )}
                          </div>
                          {hasResult ? (
                            <Check className="w-5 h-5 text-green-600" />
                          ) : (
                            <Plus className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{selectedTest}</h3>
              {standards && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Standards for {userProfile.gender}, age {ageRange}:</p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Basic: </span>
                      <span className="font-medium">{formatResult(standards.basic, standards.unit)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Athletic: </span>
                      <span className="font-medium">{formatResult(standards.athletic, standards.unit)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Elite: </span>
                      <span className="font-medium">{formatResult(standards.elite, standards.unit)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {standards.type === 'high' ? 'Higher is better' : 'Lower is better'}
                  </p>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your result ({standards?.unit || 'value'})
              </label>
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter result"
                autoFocus
              />
            </div>

            {preview && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Preview Score</p>
                    <p className="text-2xl font-bold text-blue-600">{preview.score}</p>
                  </div>
                  <div>
                    <span className={cn("px-3 py-1 rounded text-sm font-medium", getLevelColor(preview.level))}>
                      {preview.level}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={!inputValue || isNaN(parseFloat(inputValue))}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Save Result
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Progress</h3>
        <div className="space-y-3">
          {Object.entries(fitnessData.domains).map(([domain, tests]) => {
            const completed = tests.filter(t => testResults[t] !== undefined && testResults[t] !== null).length;
            const total = tests.length;
            const percentage = (completed / total) * 100;
            
            return (
              <div key={domain}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{domain}</span>
                  <span className="text-gray-600">{completed}/{total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TestInput;

