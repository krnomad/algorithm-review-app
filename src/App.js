// app.jsx
import { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, PlusCircle, ListTodo, LayoutDashboard, NotebookPen } from 'lucide-react';
import _ from 'lodash';

const today = new Date();
today.setHours(0, 0, 0, 0);

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDayOfWeek = (date) => {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[date.getDay()];
};

const calculateReviewDates = (solvedDate) => {
  const solved = new Date(solvedDate);
  const review1 = new Date(solved);
  review1.setDate(review1.getDate() + 1);
  const review2 = new Date(review1);
  review2.setDate(review2.getDate() + 2);
  const review3 = new Date(review2);
  review3.setDate(review3.getDate() + 4);
  const review4 = new Date(review3);
  review4.setDate(review4.getDate() + 7);
  const review5 = new Date(review4);
  review5.setDate(review5.getDate() + 14);
  return {
    review1Date: formatDate(review1),
    review2Date: formatDate(review2),
    review3Date: formatDate(review3),
    review4Date: formatDate(review4),
    review5Date: formatDate(review5),
  };
};

export default function App() {
  const [problems, setProblems] = useState(() => {
    try {
      const saved = localStorage.getItem('algorithmProblems');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [newProblem, setNewProblem] = useState({
    id: '', name: '', difficulty: '', category: '',
    solvedDate: formatDate(today), review1Date: '', review1Done: false,
    review2Date: '', review2Done: false, review3Date: '', review3Done: false,
    review4Date: '', review4Done: false, review5Date: '', review5Done: false,
  });

  const [activeTab, setActiveTab] = useState('today');

  useEffect(() => {
    localStorage.setItem('algorithmProblems', JSON.stringify(problems));
  }, [problems]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'solvedDate') {
      const dates = calculateReviewDates(value);
      setNewProblem(prev => ({ ...prev, [name]: value, ...dates }));
    } else {
      setNewProblem(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddProblem = (e) => {
    e.preventDefault();
    if (!newProblem.id || !newProblem.name) return alert('문제 번호와 이름을 입력해주세요.');
    if (problems.some(p => p.id === newProblem.id)) return alert('이미 존재하는 문제 번호입니다.');
    const reviewDates = calculateReviewDates(newProblem.solvedDate);
    const completeProblem = { ...newProblem, ...reviewDates };
    setProblems(prev => [...prev, completeProblem]);
    setNewProblem({ id: '', name: '', difficulty: '', category: '', solvedDate: formatDate(today),
      review1Date: '', review1Done: false, review2Date: '', review2Done: false,
      review3Date: '', review3Done: false, review4Date: '', review4Done: false,
      review5Date: '', review5Done: false });
  };

  const handleReviewToggle = (problemId, reviewKey) => {
    setProblems(prev => prev.map(problem => {
      if (problem.id === problemId) {
        const updated = { ...problem, [reviewKey]: !problem[reviewKey] };
        if (!problem[reviewKey]) {
          const dateKey = reviewKey.replace('Done', 'Date');
          updated[dateKey] = formatDate(today);
        }
        return updated;
      }
      return problem;
    }));
  };

  const updateMissedReviews = () => {
    const todayStr = formatDate(today);
    setProblems(prev => prev.map(problem => {
      let updated = { ...problem };
      for (let i = 1; i <= 5; i++) {
        const doneKey = `review${i}Done`;
        const dateKey = `review${i}Date`;
        if (!problem[doneKey] && problem[dateKey] < todayStr) {
          updated[dateKey] = todayStr;
        }
      }
      return updated;
    }));
  };

  useEffect(() => { updateMissedReviews(); }, []);

  const todayReviews = useMemo(() => {
    const todayStr = formatDate(today);
    return problems.filter(p =>
      (!p.review1Done && p.review1Date <= todayStr) ||
      (!p.review2Done && p.review2Date <= todayStr) ||
      (!p.review3Done && p.review3Date <= todayStr) ||
      (!p.review4Done && p.review4Date <= todayStr) ||
      (!p.review5Done && p.review5Date <= todayStr)
    );
  }, [problems]);

  const weeklyReviews = useMemo(() => {
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    const sundayStr = formatDate(sunday);
    const saturdayStr = formatDate(saturday);
    return problems.filter(p => p.solvedDate >= sundayStr && p.solvedDate <= saturdayStr);
  }, [problems]);

  const allProblems = useMemo(() => _.sortBy(problems, ['solvedDate', 'id']), [problems]);

  const renderTabs = () => (
    <div className="flex justify-center space-x-4 mb-6 bg-white/70 backdrop-blur p-2 rounded-lg shadow-md">
      <button
        className={`flex items-center gap-2 px-5 py-2 rounded-lg transition ${
          activeTab === 'today' ? 'bg-sky-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        onClick={() => setActiveTab('today')}
      >
        <ListTodo size={18} /> 오늘 복습
      </button>
      <button
        className={`flex items-center gap-2 px-5 py-2 rounded-lg transition ${
          activeTab === 'weekly' ? 'bg-emerald-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        onClick={() => setActiveTab('weekly')}
      >
        <Calendar size={18} /> 주간 복습
      </button>
      <button
        className={`flex items-center gap-2 px-5 py-2 rounded-lg transition ${
          activeTab === 'all' ? 'bg-neutral-800 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        onClick={() => setActiveTab('all')}
      >
        <LayoutDashboard size={18} /> 전체 목록
      </button>
      <button
        className={`flex items-center gap-2 px-5 py-2 rounded-lg transition ${
          activeTab === 'add' ? 'bg-orange-500 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        onClick={() => setActiveTab('add')}
      >
        <PlusCircle size={18} /> 문제 추가
      </button>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-white via-blue-50 to-purple-100 text-gray-800">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <svg className="absolute w-96 h-96 opacity-10 animate-[spin_20s_linear_infinite]" viewBox="0 0 100 100" style={{ top: '-80px', left: '-80px' }}>
          <polygon points="50,15 90,85 10,85" fill="none" stroke="#60a5fa" strokeWidth="2" />
        </svg>
        <svg className="absolute w-80 h-80 opacity-10 animate-[spin_30s_linear_infinite_reverse]" viewBox="0 0 100 100" style={{ bottom: '-60px', right: '-60px' }}>
          <rect x="20" y="20" width="60" height="60" fill="none" stroke="#a78bfa" strokeWidth="2" />
        </svg>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-extrabold text-center mb-10 text-sky-600 tracking-tight flex items-center justify-center gap-2">
          <NotebookPen size={32} /> 알고리즘 복습 매니저
        </h1>
        {renderTabs()}

        {activeTab === 'add' && (
          <section className="space-y-4 mt-6">
            <h2 className="text-2xl font-semibold text-orange-500">문제 추가</h2>
            <form onSubmit={handleAddProblem} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input name="id" value={newProblem.id} onChange={handleInputChange} placeholder="문제 번호" className="border px-4 py-2 rounded" />
              <input name="name" value={newProblem.name} onChange={handleInputChange} placeholder="문제 이름" className="border px-4 py-2 rounded" />
              <input name="difficulty" value={newProblem.difficulty} onChange={handleInputChange} placeholder="난이도" className="border px-4 py-2 rounded" />
              <input name="category" value={newProblem.category} onChange={handleInputChange} placeholder="카테고리" className="border px-4 py-2 rounded" />
              <input type="date" name="solvedDate" value={newProblem.solvedDate} onChange={handleInputChange} className="border px-4 py-2 rounded col-span-full" />
              <button type="submit" className="bg-orange-500 text-white font-semibold px-6 py-2 rounded shadow hover:bg-orange-600 col-span-full">문제 추가하기</button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
