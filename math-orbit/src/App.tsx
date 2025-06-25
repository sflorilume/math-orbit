import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Target, Clock, Zap, BarChart2, Rocket, BrainCircuit, CheckCircle, XCircle, Award, ArrowLeft, Plus, Minus, X, Divide, Calendar, History, Star } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


// --- HELPERS ---
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const HISTORY_KEY = 'mathOrbitHistory';

// --- COMPONENTS ---

// Component: Represents a single stat card
const StatCard = ({ icon, label, value, color }) => (
    <div className="bg-slate-800/50 p-4 rounded-xl flex items-center space-x-4 border border-slate-700">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-slate-400 text-sm">{label}</p>
            <p className="text-white font-bold text-xl">{value}</p>
        </div>
    </div>
);

// Component: Selection button for the start screen
const SelectionButton = ({ children, onClick, disabled }) => (
    <button 
        onClick={onClick} 
        disabled={disabled}
        className="w-full h-full p-6 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 rounded-xl transform hover:-translate-y-1 transition-all duration-300 disabled:bg-slate-800/20 disabled:text-slate-500 disabled:cursor-not-allowed disabled:transform-none flex flex-col items-center justify-center text-center"
    >
        {children}
    </button>
);

// Component: The main application
export default function App() {
    // --- STATE MANAGEMENT ---
    const [view, setView] = useState('setup'); // 'setup', 'playing', 'results', 'history'
    const [setupStep, setSetupStep] = useState('group'); // 'group', 'difficulty', 'mode'
    
    const [operationGroup, setOperationGroup] = useState(null); // 'A', 'B'
    const [difficulty, setDifficulty] = useState(null); // 'easy', 'medium', 'hard', 'master'
    const [gameMode, setGameMode] = useState(null); // 'time', 'practice', 'streak'
    
    const [problem, setProblem] = useState({});
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState(null); // null, 'correct', 'incorrect'
    const [feedbackText, setFeedbackText] = useState('');

    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [timer, setTimer] = useState(60);
    const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0, problems: [] });
    const [history, setHistory] = useState([]);

    // --- GAME CONFIGURATION ---
    const config = useMemo(() => ({
        levels: {
            easy: { name: "Easy", range: [1, 20], ops: ['+', '-'] },
            medium: { name: "Medium", range: [1, 100], ops: ['+', '-', '*'] },
            hard: { name: "Hard", range: [2, 150], ops: ['+', '-', '*', '/'] },
            master: { name: "Master (6-9)", range: [6, 9], ops: ['*', '/'] } // New specific level
        },
        groups: {
            A: { name: 'Multiplication & Division', ops: ['*', '/'], icon: <div className="flex justify-center gap-2"><X size={24}/><Divide size={24}/></div> },
            B: { name: 'Addition & Subtraction', ops: ['+', '-'], icon: <div className="flex justify-center gap-2"><Plus size={24}/><Minus size={24}/></div> }
        },
        modes: {
            time: { name: "Time Challenge", icon: <Clock className="w-10 h-10 mx-auto mb-2 text-blue-400" /> },
            practice: { name: "Practice Mode", icon: <BrainCircuit className="w-10 h-10 mx-auto mb-2 text-green-400" /> },
            streak: { name: "Streak Mode", icon: <Zap className="w-10 h-10 mx-auto mb-2 text-purple-400" /> }
        }
    }), []);

    // --- HISTORY & LOCALSTORAGE ---
    useEffect(() => {
        try {
            const savedHistory = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
            setHistory(savedHistory);
        } catch (error) {
            console.error("Could not load history from localStorage:", error);
            setHistory([]);
        }
    }, []);

    const goToSetup = useCallback(() => {
        setView('setup');
        setSetupStep('group');
        setOperationGroup(null);
        setDifficulty(null);
        setGameMode(null);
    }, []);

    const saveSession = useCallback((finalStats) => {
        if (!operationGroup || !difficulty || !gameMode) return; // Don't save if settings are incomplete
        const newSession = {
            date: new Date().toISOString(),
            score: finalStats.score,
            accuracy: finalStats.accuracy,
            settings: {
                group: config.groups[operationGroup].name,
                difficulty: config.levels[difficulty].name,
                mode: config.modes[gameMode].name
            }
        };

        setHistory(prevHistory => {
            const updatedHistory = [newSession, ...prevHistory].slice(0, 15);
            try {
                localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
            } catch (error) {
                console.error("Could not save history to localStorage:", error);
            }
            return updatedHistory;
        });
    }, [operationGroup, difficulty, gameMode, config]);
    
    // --- GAME LOGIC ---
    const generateProblem = useCallback(() => {
        const levelConfig = config.levels[difficulty];
        const groupConfig = config.groups[operationGroup];
        
        const availableOps = levelConfig.ops.filter(op => groupConfig.ops.includes(op));
        if (availableOps.length === 0) {
            console.error("No available operations for this group and difficulty.");
            goToSetup();
            return;
        }

        const operator = availableOps[getRandomInt(0, availableOps.length - 1)];
        let num1, num2, answer;

        if (difficulty === 'master') {
            if (operator === '*') {
                num1 = getRandomInt(6, 9);
                num2 = getRandomInt(6, 9);
                answer = num1 * num2;
            } else { // operator is '/'
                const factor1 = getRandomInt(6, 9);
                const factor2 = getRandomInt(6, 9);
                num1 = factor1 * factor2; // Dividend
                num2 = factor2; // Divisor
                answer = factor1; // Quotient
            }
        } else {
             if (operator === '/') {
                answer = getRandomInt(2, 12);
                num2 = getRandomInt(2, 12);
                num1 = num2 * answer;
            } else if (operator === '*') {
                num1 = getRandomInt(2, 12);
                num2 = getRandomInt(2, 12);
                answer = num1 * num2;
            } else { // + or -
                num1 = getRandomInt(...levelConfig.range);
                num2 = getRandomInt(...levelConfig.range);
                if (operator === '-') {
                    if (num1 < num2) [num1, num2] = [num2, num1]; // Ensure positive result
                }
                answer = operator === '+' ? num1 + num2 : num1 - num2;
            }
        }

        setProblem({ num1, num2, operator, answer });
        setUserAnswer('');
        setFeedback(null);
    }, [difficulty, operationGroup, config, goToSetup]);

    const finishGame = useCallback(() => {
        const total = sessionStats.correct + sessionStats.incorrect;
        const accuracy = total > 0 ? Math.round((sessionStats.correct / total) * 100) : 0;
        
        saveSession({ score, accuracy });
        setView('results');
    }, [sessionStats, score, saveSession]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (userAnswer.trim() === '' || feedback) return;

        const isCorrect = parseInt(userAnswer, 10) === problem.answer;
        const newProblemStat = { ...problem, userAnswer, isCorrect };

        setSessionStats(prev => ({ 
            ...prev, 
            correct: prev.correct + (isCorrect ? 1 : 0),
            incorrect: prev.incorrect + (isCorrect ? 0 : 1),
            problems: [...prev.problems, newProblemStat]
        }));
        
        if (isCorrect) {
            setFeedback('correct');
            setFeedbackText('Correct!');
            setScore(prev => prev + 10);
            setStreak(prev => prev + 1);
        } else {
            setFeedback('incorrect');
            setFeedbackText(`Not quite! The answer was ${problem.answer}`);
            setStreak(0);
            if (gameMode === 'streak') {
                finishGame();
            }
        }
        
        setTimeout(() => {
            if (view === 'playing' && (gameMode !== 'streak' || isCorrect)) {
                generateProblem();
            }
        }, 400); // Reduced delay for faster transitions
    };

    // --- USEEFFECT HOOKS ---
    useEffect(() => {
        if (view === 'playing' && gameMode === 'time') {
            if (timer > 0) {
                const interval = setInterval(() => setTimer(t => t - 1), 1000);
                return () => clearInterval(interval);
            } else {
                finishGame();
            }
        }
    }, [view, gameMode, timer, finishGame]);

    useEffect(() => {
        if (view === 'playing') {
            document.getElementById('answer-input')?.focus();
        }
    }, [problem, view]);

    // --- GAME CONTROL FUNCTIONS ---
    const handleSelectGroup = (group) => { setOperationGroup(group); setSetupStep('difficulty'); };
    const handleSelectDifficulty = (level) => { setDifficulty(level); setSetupStep('mode'); };
    
    const startGame = (mode) => {
        setGameMode(mode);
        setScore(0);
        setStreak(0);
        setTimer(60);
        setSessionStats({ correct: 0, incorrect: 0, problems: [] });
        setView('playing');
        generateProblem();
    };

    const backToStep = (step) => setSetupStep(step);
    
    // --- UI RENDERING ---
    const renderSetupScreen = () => {
        const isDifficultyCompatible = (level) => {
            if (!operationGroup) return false;
            return config.levels[level].ops.some(op => config.groups[operationGroup].ops.includes(op));
        };
    
        return (
            <div className="text-center w-full max-w-4xl">
                <div className="flex items-center justify-center gap-4 mb-4">
                    <Rocket className="w-16 h-16 text-purple-400" />
                    <h1 className="text-5xl font-bold text-white tracking-wider">Math Orbit</h1>
                </div>
                <p className="text-slate-300 mb-10 text-lg">Configure your mission or view history</p>
    
                {setupStep !== 'group' && (
                    <button onClick={() => backToStep(setupStep === 'difficulty' ? 'group' : 'difficulty')} className="absolute top-6 left-6 flex items-center gap-2 text-slate-300 hover:text-white transition">
                        <ArrowLeft size={20} /> Back
                    </button>
                )}
    
                {setupStep === 'group' && (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className="md:col-span-1">
                             <SelectionButton onClick={() => setView('history')}>
                                 <History className="w-10 h-10 mx-auto mb-2 text-yellow-400"/>
                                 <span className="text-xl font-semibold">History</span>
                                 <p className="text-sm text-slate-400">View past 15 games</p>
                             </SelectionButton>
                           </div>
                           <div className="md:col-span-2 grid grid-cols-2 gap-6">
                              <SelectionButton onClick={() => handleSelectGroup('A')}>
                                  <div className="mb-2">{config.groups.A.icon}</div>
                                  <span className="text-xl font-semibold">{config.groups.A.name}</span>
                              </SelectionButton>
                               <SelectionButton onClick={() => handleSelectGroup('B')}>
                                  <div className="mb-2">{config.groups.B.icon}</div>
                                  <span className="text-xl font-semibold">{config.groups.B.name}</span>
                              </SelectionButton>
                           </div>
                        </div>
                    </div>
                )}
    
                {setupStep === 'difficulty' && (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">2. Choose Difficulty</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <SelectionButton onClick={() => handleSelectDifficulty('easy')} disabled={!isDifficultyCompatible('easy')}>
                                <span className="text-xl font-semibold">Easy</span><p className="text-sm text-slate-400">Numbers 1-20</p>
                            </SelectionButton>
                            <SelectionButton onClick={() => handleSelectDifficulty('medium')} disabled={!isDifficultyCompatible('medium')}>
                                <span className="text-xl font-semibold">Medium</span><p className="text-sm text-slate-400">Up to 100</p>
                            </SelectionButton>
                            <SelectionButton onClick={() => handleSelectDifficulty('hard')} disabled={!isDifficultyCompatible('hard')}>
                                <span className="text-xl font-semibold">Hard</span><p className="text-sm text-slate-400">Up to 150</p>
                            </SelectionButton>
                            <SelectionButton onClick={() => handleSelectDifficulty('master')} disabled={!isDifficultyCompatible('master')}>
                                <Star className="w-6 h-6 mx-auto mb-1 text-yellow-400" />
                                <span className="text-xl font-semibold">Master</span><p className="text-sm text-slate-400">Focus on 6-9 (×, ÷)</p>
                            </SelectionButton>
                        </div>
                    </div>
                )}
    
                {setupStep === 'mode' && (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">3. Choose Game Mode</h2>
                         <div className="grid md:grid-cols-3 gap-6">
                            <SelectionButton onClick={() => startGame('time')}>{config.modes.time.icon}<h3 className="text-xl font-bold">{config.modes.time.name}</h3></SelectionButton>
                            <SelectionButton onClick={() => startGame('practice')}>{config.modes.practice.icon}<h3 className="text-xl font-bold">{config.modes.practice.name}</h3></SelectionButton>
                            <SelectionButton onClick={() => startGame('streak')}>{config.modes.streak.icon}<h3 className="text-xl font-bold">{config.modes.streak.name}</h3></SelectionButton>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderHistoryScreen = () => {
        // Reverse history for chronological order in chart, and format for chart
        const chartData = history.slice().reverse().map((session, index) => ({
            name: `Game ${index + 1}`,
            score: session.score,
            accuracy: session.accuracy,
        }));

        return (
            <div className="text-white w-full max-w-4xl">
                <div className="flex items-center justify-between mb-8">
                     <button onClick={goToSetup} className="flex items-center gap-2 text-slate-300 hover:text-white transition">
                        <ArrowLeft size={20} /> Back to Setup
                    </button>
                    <h1 className="text-4xl font-bold text-center">Session History</h1>
                    <div style={{width: "130px"}}></div>
                </div>

                {history.length > 1 ? (
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-center">Your Progress</h2>
                         <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis yAxisId="left" stroke="#818cf8" label={{ value: 'Score', angle: -90, position: 'insideLeft', fill: '#818cf8' }}/>
                                <YAxis yAxisId="right" orientation="right" stroke="#4ade80" label={{ value: 'Accuracy (%)', angle: -90, position: 'insideRight', fill: '#4ade80' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={2} activeDot={{ r: 8 }} />
                                <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#4ade80" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                     <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 mb-8 text-center text-slate-400">
                        Play at least two games to see your progress chart.
                    </div>
                )}
                
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 max-h-[40vh] overflow-y-auto">
                     <h3 className="text-xl font-bold mb-4 text-center">Game Log</h3>
                    {history.length > 0 ? (
                        <div className="space-y-4">
                            {history.map((session, index) => (
                                <div key={index} className="bg-slate-700/50 p-4 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div className="flex-1 text-center md:text-left">
                                        <p className="font-bold text-lg">{session.settings.mode}</p>
                                        <p className="text-sm text-slate-300">{session.settings.group} - {session.settings.difficulty}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <Calendar size={16} />
                                        <span>{new Date(session.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="text-center w-20">
                                            <p className="text-slate-400 text-sm">Score</p>
                                            <p className="font-bold text-xl text-white">{session.score}</p>
                                        </div>
                                        <div className="text-center w-20">
                                            <p className="text-slate-400 text-sm">Accuracy</p>
                                            <p className="font-bold text-xl text-green-400">{session.accuracy}%</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-slate-400">No mission history yet. Play a game to see your stats here!</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };
    
    const renderGameScreen = () => (
        <div className="w-full max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6 text-white">
                <div className="flex items-center space-x-4">
                    <StatCard icon={<Target size={24}/>} label="Score" value={score} color="bg-blue-500" />
                    <StatCard icon={<Zap size={24}/>} label="Streak" value={streak} color="bg-purple-500" />
                </div>
                <div className="text-right">
                    <p className="text-sm text-slate-400">{config.groups[operationGroup].name}</p>
                    <p className="text-lg font-bold capitalize text-white">{config.levels[difficulty].name}</p>
                </div>
                {gameMode === 'time' && <StatCard icon={<Clock size={24}/>} label="Time" value={`${timer}s`} color="bg-red-500" />}
            </div>
            <div className={`relative p-8 rounded-xl shadow-2xl transition-all duration-300 ${feedback === 'correct' ? 'bg-green-500/20 border-green-400' : feedback === 'incorrect' ? 'bg-red-500/20 border-red-400' : 'bg-slate-800/60 border-slate-700'} border-2`}>
                {feedback && <div className={`absolute top-4 right-4 flex items-center text-lg font-bold ${feedback === 'correct' ? 'text-green-400' : 'text-red-400'}`}>{feedback === 'correct' ? <CheckCircle className="mr-2" /> : <XCircle className="mr-2" />}{feedbackText}</div>}
                <div className="flex justify-center items-center text-6xl md:text-8xl font-bold text-white space-x-6 h-32">
                    <span>{problem.num1}</span><span className="text-purple-400">{problem.operator}</span><span>{problem.num2}</span>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="mt-8">
                <input id="answer-input" type="number" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} className="w-full text-center text-4xl p-4 rounded-lg bg-slate-900 border-2 border-slate-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition" placeholder="?" disabled={!!feedback}/>
                <button type="submit" className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-2xl py-4 rounded-lg transition-all transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed" disabled={!!feedback || userAnswer === ''}>Submit Answer</button>
            </form>
        </div>
    );

    const renderResultsScreen = () => {
        const total = sessionStats.correct + sessionStats.incorrect;
        const accuracy = total > 0 ? Math.round((sessionStats.correct / total) * 100) : 0;
        
        return (
            <div className="text-center text-white w-full max-w-3xl">
                <Award className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
                <h1 className="text-5xl font-bold mb-2">Session Complete!</h1>
                <p className="text-slate-300 mb-8">Your results have been saved to your history.</p>
                <div className="grid md:grid-cols-3 gap-6 mb-8 text-left">
                    <StatCard icon={<CheckCircle size={28}/>} label="Correct" value={sessionStats.correct} color="bg-green-500" />
                    <StatCard icon={<XCircle size={28}/>} label="Incorrect" value={sessionStats.incorrect} color="bg-red-500" />
                    <StatCard icon={<BarChart2 size={28}/>} label="Accuracy" value={`${accuracy}%`} color="bg-blue-500" />
                </div>
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-2xl font-bold mb-4 text-left">Problem Review</h3>
                    <div className="max-h-60 overflow-y-auto pr-4">
                        {sessionStats.problems.map((p, index) => (
                            <div key={index} className={`flex justify-between items-center p-3 rounded-lg mb-2 ${p.isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                <p className="font-mono text-lg">{p.num1} {p.operator} {p.num2} = {p.answer}</p>
                                {!p.isCorrect && <p className="text-red-400">Your answer: <span className="font-bold">{p.userAnswer || 'N/A'}</span></p>}
                            </div>
                        ))}
                    </div>
                </div>
                <button onClick={goToSetup} className="mt-8 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xl py-3 px-10 rounded-lg transition-all transform hover:scale-105">New Mission</button>
            </div>
        );
    }
    
    // --- MAIN RENDER ---
    const renderView = () => {
        switch (view) {
            case 'playing': return renderGameScreen();
            case 'results': return renderResultsScreen();
            case 'history': return renderHistoryScreen();
            case 'setup':
            default:
                return renderSetupScreen();
        }
    }
    
    return (
        <div className="relative min-h-screen bg-slate-900 font-sans text-white flex flex-col items-center justify-center p-4 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
            <main className="z-10 w-full max-w-4xl flex items-center justify-center">
                {renderView()}
            </main>
        </div>
    );
}


// import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import { Target, Clock, Zap, BarChart2, Rocket, BrainCircuit, CheckCircle, XCircle, Award, ArrowLeft, Plus, Minus, X, Divide, Calendar, History, Star } from 'lucide-react';

// // --- HELPERS ---
// const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
// const HISTORY_KEY = 'mathOrbitHistory';

// // --- COMPONENTS ---

// // Component: Represents a single stat card
// const StatCard = ({ icon, label, value, color }) => (
//     <div className="bg-slate-800/50 p-4 rounded-xl flex items-center space-x-4 border border-slate-700">
//         <div className={`p-3 rounded-full ${color}`}>
//             {icon}
//         </div>
//         <div>
//             <p className="text-slate-400 text-sm">{label}</p>
//             <p className="text-white font-bold text-xl">{value}</p>
//         </div>
//     </div>
// );

// // Component: Selection button for the start screen
// const SelectionButton = ({ children, onClick, disabled }) => (
//     <button 
//         onClick={onClick} 
//         disabled={disabled}
//         className="w-full h-full p-6 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 rounded-xl transform hover:-translate-y-1 transition-all duration-300 disabled:bg-slate-800/20 disabled:text-slate-500 disabled:cursor-not-allowed disabled:transform-none flex flex-col items-center justify-center text-center"
//     >
//         {children}
//     </button>
// );

// // Component: The main application
// export default function App() {
//     // --- STATE MANAGEMENT ---
//     const [view, setView] = useState('setup'); // 'setup', 'playing', 'results', 'history'
//     const [setupStep, setSetupStep] = useState('group'); // 'group', 'difficulty', 'mode'
    
//     const [operationGroup, setOperationGroup] = useState(null); // 'A', 'B'
//     const [difficulty, setDifficulty] = useState(null); // 'easy', 'medium', 'hard', 'master'
//     const [gameMode, setGameMode] = useState(null); // 'time', 'practice', 'streak'
    
//     const [problem, setProblem] = useState({});
//     const [userAnswer, setUserAnswer] = useState('');
//     const [feedback, setFeedback] = useState(null); // null, 'correct', 'incorrect'
//     const [feedbackText, setFeedbackText] = useState('');

//     const [score, setScore] = useState(0);
//     const [streak, setStreak] = useState(0);
//     const [timer, setTimer] = useState(60);
//     const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0, problems: [] });
//     const [history, setHistory] = useState([]);

//     // --- GAME CONFIGURATION ---
//     const config = useMemo(() => ({
//         levels: {
//             easy: { name: "Easy", range: [1, 20], ops: ['+', '-'] },
//             medium: { name: "Medium", range: [1, 100], ops: ['+', '-', '*'] },
//             hard: { name: "Hard", range: [2, 150], ops: ['+', '-', '*', '/'] },
//             master: { name: "Master (6-9)", range: [6, 9], ops: ['*', '/'] } // New specific level
//         },
//         groups: {
//             A: { name: 'Multiplication & Division', ops: ['*', '/'], icon: <div className="flex justify-center gap-2"><X size={24}/><Divide size={24}/></div> },
//             B: { name: 'Addition & Subtraction', ops: ['+', '-'], icon: <div className="flex justify-center gap-2"><Plus size={24}/><Minus size={24}/></div> }
//         },
//         modes: {
//             time: { name: "Time Challenge", icon: <Clock className="w-10 h-10 mx-auto mb-2 text-blue-400" /> },
//             practice: { name: "Practice Mode", icon: <BrainCircuit className="w-10 h-10 mx-auto mb-2 text-green-400" /> },
//             streak: { name: "Streak Mode", icon: <Zap className="w-10 h-10 mx-auto mb-2 text-purple-400" /> }
//         }
//     }), []);

//     // --- HISTORY & LOCALSTORAGE ---
//     useEffect(() => {
//         try {
//             const savedHistory = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
//             setHistory(savedHistory);
//         } catch (error) {
//             console.error("Could not load history from localStorage:", error);
//             setHistory([]);
//         }
//     }, []);

//     const goToSetup = useCallback(() => {
//         setView('setup');
//         setSetupStep('group');
//         setOperationGroup(null);
//         setDifficulty(null);
//         setGameMode(null);
//     }, []);

//     const saveSession = useCallback((finalStats) => {
//         if (!operationGroup || !difficulty || !gameMode) return; // Don't save if settings are incomplete
//         const newSession = {
//             date: new Date().toISOString(),
//             score: finalStats.score,
//             accuracy: finalStats.accuracy,
//             settings: {
//                 group: config.groups[operationGroup].name,
//                 difficulty: config.levels[difficulty].name,
//                 mode: config.modes[gameMode].name
//             }
//         };

//         setHistory(prevHistory => {
//             const updatedHistory = [newSession, ...prevHistory].slice(0, 15);
//             try {
//                 localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
//             } catch (error) {
//                 console.error("Could not save history to localStorage:", error);
//             }
//             return updatedHistory;
//         });
//     }, [operationGroup, difficulty, gameMode, config]);
    
//     // --- GAME LOGIC ---
//     const generateProblem = useCallback(() => {
//         const levelConfig = config.levels[difficulty];
//         const groupConfig = config.groups[operationGroup];
        
//         const availableOps = levelConfig.ops.filter(op => groupConfig.ops.includes(op));
//         if (availableOps.length === 0) {
//             console.error("No available operations for this group and difficulty.");
//             goToSetup();
//             return;
//         }

//         const operator = availableOps[getRandomInt(0, availableOps.length - 1)];
//         let num1, num2, answer;

//         if (difficulty === 'master') {
//             if (operator === '*') {
//                 num1 = getRandomInt(6, 9);
//                 num2 = getRandomInt(6, 9);
//                 answer = num1 * num2;
//             } else { // operator is '/'
//                 const factor1 = getRandomInt(6, 9);
//                 const factor2 = getRandomInt(6, 9);
//                 num1 = factor1 * factor2; // Dividend
//                 num2 = factor2; // Divisor
//                 answer = factor1; // Quotient
//             }
//         } else {
//              if (operator === '/') {
//                 answer = getRandomInt(2, 12);
//                 num2 = getRandomInt(2, 12);
//                 num1 = num2 * answer;
//             } else if (operator === '*') {
//                 num1 = getRandomInt(2, 12);
//                 num2 = getRandomInt(2, 12);
//                 answer = num1 * num2;
//             } else { // + or -
//                 num1 = getRandomInt(...levelConfig.range);
//                 num2 = getRandomInt(...levelConfig.range);
//                 if (operator === '-') {
//                     if (num1 < num2) [num1, num2] = [num2, num1]; // Ensure positive result
//                 }
//                 answer = operator === '+' ? num1 + num2 : num1 - num2;
//             }
//         }

//         setProblem({ num1, num2, operator, answer });
//         setUserAnswer('');
//         setFeedback(null);
//     }, [difficulty, operationGroup, config, goToSetup]);

//     const finishGame = useCallback(() => {
//         const total = sessionStats.correct + sessionStats.incorrect;
//         const accuracy = total > 0 ? Math.round((sessionStats.correct / total) * 100) : 0;
        
//         saveSession({ score, accuracy });
//         setView('results');
//     }, [sessionStats, score, saveSession]);

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         if (userAnswer.trim() === '' || feedback) return;

//         const isCorrect = parseInt(userAnswer, 10) === problem.answer;
//         const newProblemStat = { ...problem, userAnswer, isCorrect };

//         setSessionStats(prev => ({ 
//             ...prev, 
//             correct: prev.correct + (isCorrect ? 1 : 0),
//             incorrect: prev.incorrect + (isCorrect ? 0 : 1),
//             problems: [...prev.problems, newProblemStat]
//         }));
        
//         if (isCorrect) {
//             setFeedback('correct');
//             setFeedbackText('Correct!');
//             setScore(prev => prev + 10);
//             setStreak(prev => prev + 1);
//         } else {
//             setFeedback('incorrect');
//             setFeedbackText(`Not quite! The answer was ${problem.answer}`);
//             setStreak(0);
//             if (gameMode === 'streak') {
//                 finishGame();
//             }
//         }
        
//         setTimeout(() => {
//             if (view === 'playing' && (gameMode !== 'streak' || isCorrect)) {
//                 generateProblem();
//             }
//         }, 400); // Reduced delay for faster transitions
//     };

//     // --- USEEFFECT HOOKS ---
//     useEffect(() => {
//         if (view === 'playing' && gameMode === 'time') {
//             if (timer > 0) {
//                 const interval = setInterval(() => setTimer(t => t - 1), 1000);
//                 return () => clearInterval(interval);
//             } else {
//                 finishGame();
//             }
//         }
//     }, [view, gameMode, timer, finishGame]);

//     useEffect(() => {
//         if (view === 'playing') {
//             document.getElementById('answer-input')?.focus();
//         }
//     }, [problem, view]);

//     // --- GAME CONTROL FUNCTIONS ---
//     const handleSelectGroup = (group) => { setOperationGroup(group); setSetupStep('difficulty'); };
//     const handleSelectDifficulty = (level) => { setDifficulty(level); setSetupStep('mode'); };
    
//     const startGame = (mode) => {
//         setGameMode(mode);
//         setScore(0);
//         setStreak(0);
//         setTimer(60);
//         setSessionStats({ correct: 0, incorrect: 0, problems: [] });
//         setView('playing');
//         generateProblem();
//     };

//     const backToStep = (step) => setSetupStep(step);
    
//     // --- UI RENDERING ---
//     const renderSetupScreen = () => {
//         const isDifficultyCompatible = (level) => {
//             if (!operationGroup) return false;
//             return config.levels[level].ops.some(op => config.groups[operationGroup].ops.includes(op));
//         };
    
//         return (
//             <div className="text-center w-full max-w-4xl">
//                 <div className="flex items-center justify-center gap-4 mb-4">
//                     <Rocket className="w-16 h-16 text-purple-400" />
//                     <h1 className="text-5xl font-bold text-white tracking-wider">Math Orbit</h1>
//                 </div>
//                 <p className="text-slate-300 mb-10 text-lg">Configure your mission or view history</p>
    
//                 {setupStep !== 'group' && (
//                     <button onClick={() => backToStep(setupStep === 'difficulty' ? 'group' : 'difficulty')} className="absolute top-6 left-6 flex items-center gap-2 text-slate-300 hover:text-white transition">
//                         <ArrowLeft size={20} /> Back
//                     </button>
//                 )}
    
//                 {setupStep === 'group' && (
//                     <div>
//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                            <div className="md:col-span-1">
//                              <SelectionButton onClick={() => setView('history')}>
//                                  <History className="w-10 h-10 mx-auto mb-2 text-yellow-400"/>
//                                  <span className="text-xl font-semibold">History</span>
//                                  <p className="text-sm text-slate-400">View past 15 games</p>
//                              </SelectionButton>
//                            </div>
//                            <div className="md:col-span-2 grid grid-cols-2 gap-6">
//                               <SelectionButton onClick={() => handleSelectGroup('A')}>
//                                   <div className="mb-2">{config.groups.A.icon}</div>
//                                   <span className="text-xl font-semibold">{config.groups.A.name}</span>
//                               </SelectionButton>
//                                <SelectionButton onClick={() => handleSelectGroup('B')}>
//                                   <div className="mb-2">{config.groups.B.icon}</div>
//                                   <span className="text-xl font-semibold">{config.groups.B.name}</span>
//                               </SelectionButton>
//                            </div>
//                         </div>
//                     </div>
//                 )}
    
//                 {setupStep === 'difficulty' && (
//                     <div>
//                         <h2 className="text-2xl font-bold text-white mb-6">2. Choose Difficulty</h2>
//                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                             <SelectionButton onClick={() => handleSelectDifficulty('easy')} disabled={!isDifficultyCompatible('easy')}>
//                                 <span className="text-xl font-semibold">Easy</span><p className="text-sm text-slate-400">Numbers 1-20</p>
//                             </SelectionButton>
//                             <SelectionButton onClick={() => handleSelectDifficulty('medium')} disabled={!isDifficultyCompatible('medium')}>
//                                 <span className="text-xl font-semibold">Medium</span><p className="text-sm text-slate-400">Up to 100</p>
//                             </SelectionButton>
//                             <SelectionButton onClick={() => handleSelectDifficulty('hard')} disabled={!isDifficultyCompatible('hard')}>
//                                 <span className="text-xl font-semibold">Hard</span><p className="text-sm text-slate-400">Up to 150</p>
//                             </SelectionButton>
//                             <SelectionButton onClick={() => handleSelectDifficulty('master')} disabled={!isDifficultyCompatible('master')}>
//                                 <Star className="w-6 h-6 mx-auto mb-1 text-yellow-400" />
//                                 <span className="text-xl font-semibold">Master</span><p className="text-sm text-slate-400">Focus on 6-9 (×, ÷)</p>
//                             </SelectionButton>
//                         </div>
//                     </div>
//                 )}
    
//                 {setupStep === 'mode' && (
//                     <div>
//                         <h2 className="text-2xl font-bold text-white mb-6">3. Choose Game Mode</h2>
//                          <div className="grid md:grid-cols-3 gap-6">
//                             <SelectionButton onClick={() => startGame('time')}>{config.modes.time.icon}<h3 className="text-xl font-bold">{config.modes.time.name}</h3></SelectionButton>
//                             <SelectionButton onClick={() => startGame('practice')}>{config.modes.practice.icon}<h3 className="text-xl font-bold">{config.modes.practice.name}</h3></SelectionButton>
//                             <SelectionButton onClick={() => startGame('streak')}>{config.modes.streak.icon}<h3 className="text-xl font-bold">{config.modes.streak.name}</h3></SelectionButton>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         );
//     };

//     const renderHistoryScreen = () => (
//         <div className="text-white w-full max-w-3xl">
//             <div className="flex items-center justify-between mb-8">
//                  <button onClick={goToSetup} className="flex items-center gap-2 text-slate-300 hover:text-white transition">
//                     <ArrowLeft size={20} /> Back to Setup
//                 </button>
//                 <h1 className="text-4xl font-bold text-center">Session History</h1>
//                 <div style={{width: "130px"}}></div>
//             </div>
            
//             <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 max-h-[70vh] overflow-y-auto">
//                 {history.length > 0 ? (
//                     <div className="space-y-4">
//                         {history.map((session, index) => (
//                             <div key={index} className="bg-slate-700/50 p-4 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
//                                 <div className="flex-1 text-center md:text-left">
//                                     <p className="font-bold text-lg">{session.settings.mode}</p>
//                                     <p className="text-sm text-slate-300">{session.settings.group} - {session.settings.difficulty}</p>
//                                 </div>
//                                 <div className="flex items-center gap-2 text-slate-400 text-sm">
//                                     <Calendar size={16} />
//                                     <span>{new Date(session.date).toLocaleDateString()} {new Date(session.date).toLocaleTimeString()}</span>
//                                 </div>
//                                 <div className="flex gap-4">
//                                     <div className="text-center">
//                                         <p className="text-slate-400 text-sm">Score</p>
//                                         <p className="font-bold text-xl text-white">{session.score}</p>
//                                     </div>
//                                     <div className="text-center">
//                                         <p className="text-slate-400 text-sm">Accuracy</p>
//                                         <p className="font-bold text-xl text-green-400">{session.accuracy}%</p>
//                                     </div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 ) : (
//                     <div className="text-center py-10">
//                         <p className="text-slate-400">No mission history yet. Play a game to see your stats here!</p>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
    
//     const renderGameScreen = () => (
//         <div className="w-full max-w-2xl mx-auto">
//             <div className="flex justify-between items-center mb-6 text-white">
//                 <div className="flex items-center space-x-4">
//                     <StatCard icon={<Target size={24}/>} label="Score" value={score} color="bg-blue-500" />
//                     <StatCard icon={<Zap size={24}/>} label="Streak" value={streak} color="bg-purple-500" />
//                 </div>
//                 <div className="text-right">
//                     <p className="text-sm text-slate-400">{config.groups[operationGroup].name}</p>
//                     <p className="text-lg font-bold capitalize text-white">{config.levels[difficulty].name}</p>
//                 </div>
//                 {gameMode === 'time' && <StatCard icon={<Clock size={24}/>} label="Time" value={`${timer}s`} color="bg-red-500" />}
//             </div>
//             <div className={`relative p-8 rounded-xl shadow-2xl transition-all duration-300 ${feedback === 'correct' ? 'bg-green-500/20 border-green-400' : feedback === 'incorrect' ? 'bg-red-500/20 border-red-400' : 'bg-slate-800/60 border-slate-700'} border-2`}>
//                 {feedback && <div className={`absolute top-4 right-4 flex items-center text-lg font-bold ${feedback === 'correct' ? 'text-green-400' : 'text-red-400'}`}>{feedback === 'correct' ? <CheckCircle className="mr-2" /> : <XCircle className="mr-2" />}{feedbackText}</div>}
//                 <div className="flex justify-center items-center text-6xl md:text-8xl font-bold text-white space-x-6 h-32">
//                     <span>{problem.num1}</span><span className="text-purple-400">{problem.operator}</span><span>{problem.num2}</span>
//                 </div>
//             </div>
//             <form onSubmit={handleSubmit} className="mt-8">
//                 <input id="answer-input" type="number" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} className="w-full text-center text-4xl p-4 rounded-lg bg-slate-900 border-2 border-slate-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition" placeholder="?" disabled={!!feedback}/>
//                 <button type="submit" className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-2xl py-4 rounded-lg transition-all transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed" disabled={!!feedback || userAnswer === ''}>Submit Answer</button>
//             </form>
//         </div>
//     );

//     const renderResultsScreen = () => {
//         const total = sessionStats.correct + sessionStats.incorrect;
//         const accuracy = total > 0 ? Math.round((sessionStats.correct / total) * 100) : 0;
        
//         return (
//             <div className="text-center text-white w-full max-w-3xl">
//                 <Award className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
//                 <h1 className="text-5xl font-bold mb-2">Session Complete!</h1>
//                 <p className="text-slate-300 mb-8">Your results have been saved to your history.</p>
//                 <div className="grid md:grid-cols-3 gap-6 mb-8 text-left">
//                     <StatCard icon={<CheckCircle size={28}/>} label="Correct" value={sessionStats.correct} color="bg-green-500" />
//                     <StatCard icon={<XCircle size={28}/>} label="Incorrect" value={sessionStats.incorrect} color="bg-red-500" />
//                     <StatCard icon={<BarChart2 size={28}/>} label="Accuracy" value={`${accuracy}%`} color="bg-blue-500" />
//                 </div>
//                 <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
//                     <h3 className="text-2xl font-bold mb-4 text-left">Problem Review</h3>
//                     <div className="max-h-60 overflow-y-auto pr-4">
//                         {sessionStats.problems.map((p, index) => (
//                             <div key={index} className={`flex justify-between items-center p-3 rounded-lg mb-2 ${p.isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
//                                 <p className="font-mono text-lg">{p.num1} {p.operator} {p.num2} = {p.answer}</p>
//                                 {!p.isCorrect && <p className="text-red-400">Your answer: <span className="font-bold">{p.userAnswer || 'N/A'}</span></p>}
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//                 <button onClick={goToSetup} className="mt-8 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xl py-3 px-10 rounded-lg transition-all transform hover:scale-105">New Mission</button>
//             </div>
//         );
//     }
    
//     // --- MAIN RENDER ---
//     const renderView = () => {
//         switch (view) {
//             case 'playing': return renderGameScreen();
//             case 'results': return renderResultsScreen();
//             case 'history': return renderHistoryScreen();
//             case 'setup':
//             default:
//                 return renderSetupScreen();
//         }
//     }
    
//     return (
//         <div className="relative min-h-screen bg-slate-900 font-sans text-white flex flex-col items-center justify-center p-4 overflow-hidden">
//             <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
//             <main className="z-10 w-full max-w-4xl flex items-center justify-center">
//                 {renderView()}
//             </main>
//         </div>
//     );
// }
