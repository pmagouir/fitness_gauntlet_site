import { useState } from 'react';
import fitnessData from './data/fitnessData.json';
import Dashboard from './components/Dashboard';
import TestInput from './components/TestInput';
import { getAgeRange } from './utils/fitnessUtils';

function App() {
  const [userProfile, setUserProfile] = useState({
    gender: 'male',
    age: 30,
    weight: 70, // kg
  });
  
  const [testResults, setTestResults] = useState({});

  const handleResultSubmit = (testName, result) => {
    setTestResults(prev => ({
      ...prev,
      [testName]: result,
    }));
  };

  const handleProfileChange = (field, value) => {
    setUserProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const ageRange = getAgeRange(userProfile.age);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Fitness Gauntlet</h1>
          <p className="mt-2 text-gray-600">Comprehensive fitness assessment tool</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  value={userProfile.gender}
                  onChange={(e) => handleProfileChange('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  value={userProfile.age}
                  onChange={(e) => handleProfileChange('age', parseInt(e.target.value))}
                  min="21"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={userProfile.weight}
                  onChange={(e) => handleProfileChange('weight', parseFloat(e.target.value))}
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Dashboard
              fitnessData={fitnessData}
              userProfile={userProfile}
              testResults={testResults}
            />
          </div>
          <div>
            <TestInput
              fitnessData={fitnessData}
              userProfile={userProfile}
              onResultSubmit={handleResultSubmit}
              testResults={testResults}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

