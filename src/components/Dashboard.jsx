import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { getAgeRange, calculateScore, calculateLevel, getLevelColor, formatResult } from '../utils/fitnessUtils';
import { cn } from '../utils/cn';
import { Activity, TrendingUp, Award, Target } from 'lucide-react';

function Dashboard({ fitnessData, userProfile, testResults }) {
  const ageRange = getAgeRange(userProfile.age);

  const domainStats = useMemo(() => {
    const stats = {};
    
    Object.entries(fitnessData.domains).forEach(([domain, tests]) => {
      const domainResults = tests
        .map(testName => {
          const result = testResults[testName];
          if (result === null || result === undefined) return null;
          
          const testData = fitnessData.tests[testName];
          const score = calculateScore(testData, userProfile.gender, ageRange, result);
          const level = calculateLevel(testData, userProfile.gender, ageRange, result);
          
          return { testName, score, level, result };
        })
        .filter(r => r !== null);
      
      const avgScore = domainResults.length > 0
        ? domainResults.reduce((sum, r) => sum + r.score, 0) / domainResults.length
        : 0;
      
      stats[domain] = {
        tests: domainResults,
        avgScore,
        completed: domainResults.length,
        total: tests.length,
      };
    });
    
    return stats;
  }, [fitnessData, userProfile, testResults, ageRange]);

  const chartData = useMemo(() => {
    return Object.entries(domainStats).map(([domain, stats]) => ({
      domain,
      score: Math.round(stats.avgScore),
    }));
  }, [domainStats]);

  const radarData = useMemo(() => {
    return Object.entries(domainStats).map(([domain, stats]) => ({
      domain,
      score: Math.round(stats.avgScore),
      fullMark: 100,
    }));
  }, [domainStats]);

  const testDetails = useMemo(() => {
    return Object.entries(testResults)
      .filter(([_, result]) => result !== null && result !== undefined)
      .map(([testName, result]) => {
        const testData = fitnessData.tests[testName];
        const score = calculateScore(testData, userProfile.gender, ageRange, result);
        const level = calculateLevel(testData, userProfile.gender, ageRange, result);
        
        // Find which domain this test belongs to
        const domain = Object.entries(fitnessData.domains).find(([_, tests]) =>
          tests.includes(testName)
        )?.[0];
        
        return {
          testName,
          domain,
          result,
          score: Math.round(score),
          level,
          unit: testData.unit,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [testResults, fitnessData, userProfile, ageRange]);

  const overallScore = useMemo(() => {
    const allScores = testDetails.map(t => t.score);
    return allScores.length > 0
      ? Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length)
      : 0;
  }, [testDetails]);

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Overall Fitness Score</h2>
            <p className="text-blue-100 mt-1">
              {testDetails.length} of {Object.keys(fitnessData.tests).length} tests completed
            </p>
          </div>
          <div className="text-6xl font-bold">{overallScore}</div>
        </div>
      </div>

      {/* Domain Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(domainStats).map(([domain, stats]) => (
          <div key={domain} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{domain}</h3>
              <div className="text-3xl font-bold text-blue-600">
                {Math.round(stats.avgScore)}
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-4">
              {stats.completed}/{stats.total} tests completed
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${stats.avgScore}%` }}
              />
            </div>
            <div className="mt-4 space-y-2">
              {stats.tests.map(({ testName, score, level }) => (
                <div key={testName} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{testName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">{score}</span>
                    <span className={cn("px-2 py-1 rounded text-xs font-medium", getLevelColor(level))}>
                      {level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Domain Scores</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="domain" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="score" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Fitness Profile</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="domain" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Test Results Table */}
      {testDetails.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Test Results</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Result
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {testDetails.map(({ testName, domain, result, score, level, unit }) => (
                  <tr key={testName}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {testName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {domain}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatResult(result, unit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {score}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn("px-2 py-1 rounded text-xs font-medium", getLevelColor(level))}>
                        {level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

