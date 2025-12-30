import { useState, useMemo } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import standardsData from '../data/standards.json';
import { calculateComparisonValue, calculateScore, getThresholds, formatSecondsToTime, parseTimeToSeconds } from '../utils/scoring';
import { Dumbbell, Zap, Heart, Shield, ChevronDown } from 'lucide-react';

const domainIcons = {
  Strength: Dumbbell,
  Power: Zap,
  Endurance: Heart,
  Durability: Shield,
};

function GauntletCalculator() {
  const [userBodyweight, setUserBodyweight] = useState(175); // lbs
  const [gender, setGender] = useState('male');
  const [testResults, setTestResults] = useState({});
  const [timeInputs, setTimeInputs] = useState({}); // Store MM:SS strings for time inputs

  const ageRange = '35-39';

  // Get all test names in order
  const allTests = useMemo(() => {
    return Object.values(standardsData.domains).flat();
  }, []);

  // Calculate scores for all tests
  const testScores = useMemo(() => {
    const scores = {};
    
    allTests.forEach(testName => {
      const testData = standardsData.standards[testName];
      if (!testData) return;
      
      const userInput = testResults[testName];
      if (userInput === null || userInput === undefined || userInput === '') {
        scores[testName] = 0;
        return;
      }
      
      const comparisonValue = calculateComparisonValue(testData, userInput, userBodyweight);
      if (comparisonValue === null) {
        scores[testName] = 0;
        return;
      }
      
      const thresholds = getThresholds(testData, gender, ageRange);
      if (!thresholds) {
        scores[testName] = 0;
        return;
      }
      
      scores[testName] = calculateScore(comparisonValue, thresholds, testData.logic);
    });
    
    return scores;
  }, [testResults, userBodyweight, allTests]);

  // Calculate hybrid profile (average of all 12 scores)
  const hybridProfile = useMemo(() => {
    const scores = Object.values(testScores).filter(s => s > 0);
    if (scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }, [testScores]);

  // Calculate domain stats for interpretation
  const domainStats = useMemo(() => {
    const stats = {};
    Object.entries(standardsData.domains).forEach(([domain, tests]) => {
      const domainScores = tests.map(t => testScores[t] || 0).filter(s => s > 0);
      const avgScore = domainScores.length > 0
        ? domainScores.reduce((sum, s) => sum + s, 0) / domainScores.length
        : 0;
      stats[domain] = avgScore;
    });
    return stats;
  }, [testScores, standardsData]);

  // Prepare radar chart data
  const radarData = useMemo(() => {
    const data = allTests.map(testName => {
      // Shorten test names for better display
      const shortName = testName
        .replace('Strict Press', 'Press')
        .replace('100 Burpees', 'Burpees')
        .replace('Farmers Carry', 'Farmers')
        .replace('Dead Hang', 'Hang');
      
      return {
        test: shortName,
        fullTest: testName,
        user: Math.round(testScores[testName] || 0),
        basic: 33,
        athletic: 66,
        elite: 100,
      };
    });
    
    return data;
  }, [testScores, allTests]);

  const handleWeightInput = (testName, value) => {
    setTestResults(prev => ({
      ...prev,
      [testName]: value === '' ? null : parseFloat(value) || null,
    }));
  };

  const handleTimeInput = (testName, value) => {
    // Allow natural typing, auto-format as user types
    let formatted = value;
    
    // Remove non-numeric characters except colon
    formatted = formatted.replace(/[^\d:]/g, '');
    
    // Auto-insert colon after 2 digits if not present
    if (formatted.length >= 2 && !formatted.includes(':')) {
      formatted = formatted.slice(0, 2) + ':' + formatted.slice(2);
    }
    
    // Limit to MM:SS format (max 99:59)
    const parts = formatted.split(':');
    if (parts.length === 2) {
      const minutes = Math.min(99, parseInt(parts[0]) || 0);
      const seconds = Math.min(59, parseInt(parts[1]) || 0);
      formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Store the formatted string for display
    setTimeInputs(prev => ({
      ...prev,
      [testName]: formatted,
    }));
    
    // Parse and store as seconds for calculation
    const seconds = parseTimeToSeconds(formatted);
    setTestResults(prev => ({
      ...prev,
      [testName]: seconds,
    }));
  };

  const handleAbsoluteInput = (testName, value) => {
    setTestResults(prev => ({
      ...prev,
      [testName]: value === '' ? null : parseFloat(value) || null,
    }));
  };

  const renderTestInput = (testName, testData) => {
    const currentValue = testResults[testName];
    const score = testScores[testName] || 0;
    const hasNote = testData.note;
    
    if (testData.calc === 'multiplier') {
      // Weight input (lbs)
      return (
        <div key={testName} className="space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-300">
              {testName} (lbs)
            </label>
            {hasNote && (
              <p className="text-xs text-gray-400 mt-1">{testData.note}</p>
            )}
          </div>
          <input
            type="number"
            value={currentValue || ''}
            onChange={(e) => handleWeightInput(testName, e.target.value)}
            placeholder="Enter weight"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          {currentValue && (
            <div className="text-xs text-cyan-400">
              {(currentValue / userBodyweight).toFixed(2)}x BW • Score: {Math.round(score)}
            </div>
          )}
        </div>
      );
    } else if (testData.unit === 'time') {
      // Time input (MM:SS)
      const timeString = timeInputs[testName] || (currentValue ? formatSecondsToTime(currentValue) : '');
      return (
        <div key={testName} className="space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-300">
              {testName} (MM:SS)
            </label>
            {hasNote && (
              <p className="text-xs text-gray-400 mt-1">{testData.note}</p>
            )}
          </div>
          <input
            type="text"
            value={timeString}
            onChange={(e) => handleTimeInput(testName, e.target.value)}
            placeholder="0:00"
            pattern="[0-9]{1,2}:[0-5][0-9]"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
          />
          {currentValue && (
            <div className="text-xs text-cyan-400">
              Score: {Math.round(score)}
            </div>
          )}
        </div>
      );
    } else {
      // Absolute input (reps, ft, meters)
      return (
        <div key={testName} className="space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-300">
              {testName} ({testData.unit})
            </label>
            {hasNote && (
              <p className="text-xs text-gray-400 mt-1">{testData.note}</p>
            )}
          </div>
          <input
            type="number"
            value={currentValue || ''}
            onChange={(e) => handleAbsoluteInput(testName, e.target.value)}
            placeholder={`Enter ${testData.unit}`}
            step={testData.unit === 'ft' ? '0.1' : '1'}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          {currentValue && (
            <div className="text-xs text-cyan-400">
              Score: {Math.round(score)}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">THE GAUNTLET</h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-center leading-relaxed">
            The Gauntlet is not a competition against others; it is an audit of your capacity. It measures the 12 essential physical attributes of a complete human being. True fitness is not just about being strong or being fast—it is about being dangerous across every time domain and modality. Enter your stats below to see where you stand.
          </p>
        </div>

        {/* Profile Inputs */}
        <div className="bg-slate-800 rounded-lg p-6 max-w-md mx-auto border border-slate-700">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bodyweight (lbs)
              </label>
              <input
                type="number"
                value={userBodyweight}
                onChange={(e) => setUserBodyweight(parseFloat(e.target.value) || 175)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Movement Standards Accordion */}
        <StandardsAccordion />

        {/* Domain Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(standardsData.domains).map(([domain, tests]) => {
            const Icon = domainIcons[domain];
            const domainScores = tests.map(t => testScores[t] || 0).filter(s => s > 0);
            const avgScore = domainScores.length > 0
              ? domainScores.reduce((sum, s) => sum + s, 0) / domainScores.length
              : 0;

            return (
              <div key={domain} className="bg-slate-800 rounded-lg p-6 space-y-4 border border-slate-700">
                <div className="flex items-center gap-3">
                  {Icon && <Icon className="w-6 h-6 text-cyan-400" />}
                  <h2 className="text-xl font-semibold">{domain}</h2>
                </div>
                <div className="text-3xl font-bold text-cyan-400">
                  {Math.round(avgScore)}
                </div>
                <div className="space-y-3">
                  {tests.map(testName => {
                    const testData = standardsData.standards[testName];
                    return renderTestInput(testName, testData);
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Radar Chart */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-semibold mb-6 text-center">Your Hybrid Profile</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#4b5563" />
                <PolarAngleAxis
                  dataKey="test"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  style={{ fontSize: '10px' }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                />
                {/* Basic Ring */}
                <Radar
                  name="Basic"
                  dataKey="basic"
                  stroke="#6b7280"
                  fill="#6b7280"
                  fillOpacity={0.1}
                  strokeWidth={1}
                />
                {/* Athletic Ring */}
                <Radar
                  name="Athletic"
                  dataKey="athletic"
                  stroke="#6b7280"
                  fill="#6b7280"
                  fillOpacity={0.1}
                  strokeWidth={1}
                />
                {/* Elite Ring */}
                <Radar
                  name="Elite"
                  dataKey="elite"
                  stroke="#6b7280"
                  fill="#6b7280"
                  fillOpacity={0.1}
                  strokeWidth={1}
                />
                {/* User's Shape */}
                <Radar
                  name="You"
                  dataKey="user"
                  stroke="#06b6d4"
                  fill="#06b6d4"
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary with Interpretation */}
        <ResultInterpretation 
          hybridProfile={hybridProfile}
          domainStats={domainStats}
        />

        {/* Standards Reference Table */}
        <StandardsTable standardsData={standardsData} />
      </div>
    </div>
  );
}

// Movement Standards Accordion Component
function StandardsAccordion() {
  const [isOpen, setIsOpen] = useState(false);

  const standards = [
    { test: 'Deadlift', rule: 'Conventional or Trap Bar. No straps. Hips must lock out.' },
    { test: 'Strict Press', rule: 'Barbell. No leg drive. Knees locked.' },
    { test: 'Pull-Ups', rule: 'Strict. Chin over bar. Arms fully locked at bottom.' },
    { test: 'Broad Jump', rule: 'Two-footed takeoff and landing. Stick the landing.' },
    { test: 'Grace', rule: '30 Clean & Jerks for time (135lb Men / 95lb Women).' },
    { test: '100 Burpees', rule: 'Chest to deck. Jump and clap overhead. Hips open.' },
    { test: '2k Row', rule: 'Concept2 Rower. Damper of choice.' },
    { test: '5k Run', rule: 'Road or Track. GPS verified or measured course.' },
    { test: 'Farmers Carry', rule: '100% Bodyweight (Total). Max distance without dropping.' },
    { test: 'Dead Hang', rule: 'Passive hang. Time stops when feet touch or grip fails.' },
    { test: 'Plank', rule: 'Forearm plank. Rigid spine. No sagging.' },
    { test: 'Balance', rule: 'Single leg. Hands on hips. Eyes closed.' },
  ];

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
      >
        <span className="font-semibold text-white">View Movement Standards & Rules</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {standards.map(({ test, rule }) => (
              <div key={test} className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="font-semibold text-cyan-400 mb-1">{test}</h4>
                <p className="text-sm text-gray-300">{rule}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Result Interpretation Component
function ResultInterpretation({ hybridProfile, domainStats }) {
  const score = Math.round(hybridProfile);
  
  // Calculate archetype
  const strengthScore = domainStats.Strength || 0;
  const enduranceScore = domainStats.Endurance || 0;
  
  let archetype = 'The Ranger (Well Rounded)';
  
  if (strengthScore > 0 && enduranceScore > 0) {
    const strengthDiff = ((strengthScore - enduranceScore) / Math.max(strengthScore, enduranceScore)) * 100;
    const enduranceDiff = ((enduranceScore - strengthScore) / Math.max(strengthScore, enduranceScore)) * 100;
    
    if (strengthDiff > 15) {
      archetype = 'The Tank (High Force, Low Range)';
    } else if (enduranceDiff > 15) {
      archetype = 'The Scout (High Engine, Low Armor)';
    } else {
      archetype = 'The Ranger (Well Rounded)';
    }
  } else if (strengthScore > 0 && enduranceScore === 0) {
    archetype = 'The Tank (High Force, Low Range)';
  } else if (enduranceScore > 0 && strengthScore === 0) {
    archetype = 'The Scout (High Engine, Low Armor)';
  }
  
  // Determine status narrative
  let status = '';
  let narrative = '';
  
  if (score < 33) {
    status = 'Under Construction';
    narrative = 'You have foundational gaps. Prioritize structural strength and aerobic base.';
  } else if (score >= 33 && score <= 66) {
    status = 'The Fit Executive';
    narrative = 'You are capable and fit, but you lack the elite spike. To progress, you must periodize your training blocks.';
  } else {
    status = 'Hybrid Beast';
    narrative = 'You are in the top 1% of the population. You possess a rare combination of mass and gas.';
  }

  return (
    <div className="space-y-6">
      {/* Hybrid Score */}
      <div className="bg-gradient-to-r from-cyan-600 to-teal-600 rounded-lg p-8 text-center border border-slate-700">
        <h2 className="text-2xl font-semibold mb-2">Your Hybrid Profile</h2>
        <div className="text-6xl font-bold mt-4">{score}</div>
        <p className="text-cyan-100 mt-2">
          Average score across all 12 tests
        </p>
      </div>

      {/* Interpretation Card */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-xl font-semibold mb-4 text-white">Interpretation</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Archetype</p>
            <p className="text-lg font-semibold text-cyan-400">{archetype}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Status</p>
            <p className="text-lg font-semibold text-white">{status}</p>
            <p className="text-gray-300 mt-2">{narrative}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Standards Reference Table Component
function StandardsTable({ standardsData }) {
  const [tableGender, setTableGender] = useState('male');

  const formatStandardValue = (testData, value) => {
    if (testData.calc === 'multiplier') {
      return `${value.toFixed(2)}x BW`;
    } else if (testData.unit === 'time') {
      return formatSecondsToTime(value);
    } else if (testData.unit === 'ft') {
      return `${value.toFixed(1)} ft`;
    } else if (testData.unit === 'meters') {
      return `${value} m`;
    } else {
      return value.toString();
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Standards Reference</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTableGender('male')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              tableGender === 'male'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            Male
          </button>
          <button
            onClick={() => setTableGender('female')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              tableGender === 'female'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            Female
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-4 font-semibold text-gray-300">Domain</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-300">Test</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-300">Unit</th>
              <th className="text-center py-3 px-4 font-semibold text-green-400">Basic</th>
              <th className="text-center py-3 px-4 font-semibold text-blue-400">Athletic</th>
              <th className="text-center py-3 px-4 font-semibold text-purple-400">Elite</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(standardsData.domains).map(([domain, tests]) => {
              const validTests = tests.filter(testName => {
                const testData = standardsData.standards[testName];
                return testData?.[tableGender]?.['35-39'];
              });

              return validTests.map((testName, index) => {
                const testData = standardsData.standards[testName];
                const genderData = testData[tableGender]['35-39'];

                return (
                  <tr
                    key={testName}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                  >
                    {index === 0 && (
                      <td
                        rowSpan={validTests.length}
                        className="py-3 px-4 font-medium text-gray-200 align-top border-r border-slate-700/50"
                      >
                        {domain}
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-white">{testName}</div>
                        {testData.note && (
                          <div className="text-xs text-gray-400 mt-1 italic">{testData.note}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-400 text-sm">
                      {testData.unit === 'time' ? 'MM:SS' : testData.unit}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-green-400">
                      {formatStandardValue(testData, genderData.basic)}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-blue-400">
                      {formatStandardValue(testData, genderData.athletic)}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-purple-400">
                      {formatStandardValue(testData, genderData.elite)}
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GauntletCalculator;

