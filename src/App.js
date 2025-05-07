import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar,
  PlusCircle,
  ListTodo,
  LayoutDashboard,
  NotebookPen,
  Trash,
  Edit,
  BarChart3
} from 'lucide-react';
import { supabase } from './lib/supabase';
import _ from 'lodash';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import CalendarView from './components/CalendarView';

const today = new Date();
today.setHours(0, 0, 0, 0);

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
    review1_date: formatDate(review1),
    review2_date: formatDate(review2),
    review3_date: formatDate(review3),
    review4_date: formatDate(review4),
    review5_date: formatDate(review5)
  };
};

export default function App() {
  const [problems, setProblems] = useState([]);
  const [newProblem, setNewProblem] = useState({
    problem_id: '',
    name: '',
    difficulty: '',
    category: '',
    link: '',
    solved_date: formatDate(today)
  });
  const [editProblem, setEditProblem] = useState(null);
  const [activeTab, setActiveTab] = useState('today');
  const [sortKey, setSortKey] = useState('solved_date');
  const [searchQuery, setSearchQuery] = useState('');
  const slideRef = useRef();
  const todayStr = formatDate(today);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from('problems').select('*');
      if (!error) setProblems(data);
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProblem((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditProblem((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProblem = async (e) => {
    e.preventDefault();
    if (!newProblem.problem_id || !newProblem.name) {
      return alert('문제 번호와 이름은 필수입니다.');
    }
    const reviewDates = calculateReviewDates(newProblem.solved_date);
    const { data, error } = await supabase
      .from('problems')
      .insert([{ ...newProblem, ...reviewDates }])
      .select();
    if (!error) {
      setProblems((prev) => [...prev, ...data]);
      setNewProblem({
        problem_id: '',
        name: '',
        difficulty: '',
        category: '',
        link: '',
        solved_date: formatDate(today)
      });
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('problems').delete().eq('id', id);
    if (!error) setProblems(problems.filter((p) => p.id !== id));
  };

  const handleUpdate = async () => {
    const { id, ...fields } = editProblem;
    const { error } = await supabase.from('problems').update(fields).eq('id', id);
    if (!error) {
      setProblems(problems.map((p) => (p.id === id ? editProblem : p)));
      setEditProblem(null);
    }
  };

  const todayReviews = useMemo(() => problems.filter(p => (
    (!p.review1_done && p.review1_date <= todayStr) ||
    (!p.review2_done && p.review2_date <= todayStr) ||
    (!p.review3_done && p.review3_date <= todayStr) ||
    (!p.review4_done && p.review4_date <= todayStr) ||
    (!p.review5_done && p.review5_date <= todayStr)
  )), [problems]);

  const weeklyReviews = useMemo(() => {
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    const sundayStr = formatDate(sunday);
    const saturdayStr = formatDate(saturday);
    return problems.filter(p => p.solved_date >= sundayStr && p.solved_date <= saturdayStr);
  }, [problems]);

  const filteredProblems = useMemo(() =>
    _.sortBy(problems.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())), [sortKey]),
    [problems, sortKey, searchQuery]
  );

  const reviewCounts = useMemo(() => {
    const counts = {};
    problems.forEach((p) => {
      for (let i = 1; i <= 5; i++) {
        const dateKey = `review${i}_date`;
        const doneKey = `review${i}_done`;
        if (p[doneKey]) {
          counts[p[dateKey]] = (counts[p[dateKey]] || 0) + 1;
        }
      }
    });
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [problems]);

  const ReviewCheckboxes = ({ problem }) => {
    return (
      <div className="flex gap-1 items-center text-xs">
        {[1, 2, 3, 4, 5].map((step) => {
          const dateKey = `review${step}_date`;
          const doneKey = `review${step}_done`;
          const isDue = problem[dateKey] <= todayStr && !problem[doneKey];
          return isDue ? (
            <label key={step}>
              <input
                type="checkbox"
                onChange={async () => {
                  const { error } = await supabase.from('problems').update({ [doneKey]: true }).eq('id', problem.id);
                  if (!error) {
                    setProblems(prev => prev.map(p => p.id === problem.id ? { ...p, [doneKey]: true } : p));
                  }
                }}
              /> R{step}
            </label>
          ) : null;
        })}
      </div>
    );
  };

  const ProblemItem = ({ p }) => (
    <div className="border-b py-2 px-2 flex justify-between items-center hover:bg-gray-50">
      <div className="flex flex-col text-sm">
        <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline">
          {p.problem_id} - {p.name}
        </a>
        <span className="text-gray-500">{p.difficulty} | {p.category} | {p.solved_date}</span>
        <ReviewCheckboxes problem={p} />
      </div>
      <div className="flex gap-2">
        <button onClick={() => setEditProblem(p)} className="text-gray-600 hover:text-blue-600"><Edit size={16} /></button>
        <button onClick={() => handleDelete(p.id)} className="text-gray-600 hover:text-red-600"><Trash size={16} /></button>
      </div>
    </div>
  );

  const renderTabs = () => (
    <div className="flex justify-center space-x-2 mb-6 p-2 rounded-xl bg-white/80 backdrop-blur-md shadow-sm">
      <button className={`px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-medium transition ${activeTab === 'today' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`} onClick={() => setActiveTab('today')}><ListTodo size={16} /> 오늘 복습</button>
      <button className={`px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-medium transition ${activeTab === 'weekly' ? 'bg-green-100 text-green-600' : 'text-gray-500 hover:bg-gray-100'}`} onClick={() => setActiveTab('weekly')}><Calendar size={16} /> 주간 복습</button>
      <button className={`px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-medium transition ${activeTab === 'calendar' ? 'bg-yellow-100 text-yellow-600' : 'text-gray-500 hover:bg-gray-100'}`} onClick={() => setActiveTab('calendar')}><Calendar size={16} /> 캘린더</button>
      <button className={`px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-medium transition ${activeTab === 'stats' ? 'bg-pink-100 text-pink-600' : 'text-gray-500 hover:bg-gray-100'}`} onClick={() => setActiveTab('stats')}><BarChart3 size={16} /> 통계</button>
      <button className={`px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-medium transition ${activeTab === 'all' ? 'bg-purple-100 text-purple-600' : 'text-gray-500 hover:bg-gray-100'}`} onClick={() => setActiveTab('all')}><LayoutDashboard size={16} /> 전체</button>
      <button className={`px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-medium transition ${activeTab === 'add' ? 'bg-orange-100 text-orange-600' : 'text-gray-500 hover:bg-gray-100'}`} onClick={() => setActiveTab('add')}><PlusCircle size={16} /> 문제 추가</button>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="relative z-10 p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 flex items-center justify-center gap-2 text-blue-700">
          <NotebookPen /> 알고리즘 복습 매니저
        </h1>
        {renderTabs()}

        {activeTab === 'today' && <div><h2 className="text-xl font-semibold mb-3">오늘 복습할 문제</h2>{todayReviews.map(p => <ProblemItem key={p.id} p={p} />)}</div>}
        {activeTab === 'weekly' && <div><h2 className="text-xl font-semibold mb-3">주간 복습</h2>{weeklyReviews.map(p => <ProblemItem key={p.id} p={p} />)}</div>}
        {activeTab === 'calendar' && <CalendarView problems={problems} />}
        {activeTab === 'stats' && (
          <div>
            <h2 className="text-xl font-semibold mb-3">복습 완료 통계</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reviewCounts}>
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="완료된 리뷰 수" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {activeTab === 'all' && (
          <div>
            <div className="flex justify-between mb-2">
              <input type="text" placeholder="문제명 검색" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="border px-2 py-1 rounded" />
              <select onChange={(e) => setSortKey(e.target.value)} className="border rounded px-2 py-1">
                <option value="solved_date">풀이일자</option>
                <option value="difficulty">난이도</option>
                <option value="problem_id">문제 번호</option>
              </select>
            </div>
            {filteredProblems.map(p => <ProblemItem key={p.id} p={p} />)}
          </div>
        )}
        {activeTab === 'add' && (
          <form onSubmit={handleAddProblem} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input name="problem_id" value={newProblem.problem_id} onChange={handleInputChange} placeholder="문제 번호" className="border p-2 rounded" />
            <input name="name" value={newProblem.name} onChange={handleInputChange} placeholder="문제명" className="border p-2 rounded" />
            <input name="difficulty" value={newProblem.difficulty} onChange={handleInputChange} placeholder="난이도" className="border p-2 rounded" />
            <input name="category" value={newProblem.category} onChange={handleInputChange} placeholder="카테고리" className="border p-2 rounded" />
            <input name="link" value={newProblem.link} onChange={handleInputChange} placeholder="문제 링크 (https://...)" className="border p-2 rounded col-span-full" />
            <input type="date" name="solved_date" value={newProblem.solved_date} onChange={handleInputChange} className="border p-2 rounded col-span-full" />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md col-span-full shadow transition">추가하기</button>
          </form>
        )}
        {editProblem && (
          <div className="fixed top-0 right-0 w-full max-w-sm h-full bg-white shadow-xl p-6 z-50 transition-transform rounded-l-2xl backdrop-blur-md border-l border-slate-200" ref={slideRef}>
            <h3 className="text-lg font-semibold mb-2">문제 수정</h3>
            <input name="name" value={editProblem.name} onChange={handleEditChange} className="w-full border p-2 mb-2 rounded" />
            <input name="difficulty" value={editProblem.difficulty} onChange={handleEditChange} className="w-full border p-2 mb-2 rounded" />
            <input name="category" value={editProblem.category} onChange={handleEditChange} className="w-full border p-2 mb-2 rounded" />
            <input name="link" value={editProblem.link} onChange={handleEditChange} className="w-full border p-2 mb-2 rounded" />
            <div className="flex justify-between mt-4">
              <button onClick={handleUpdate} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition shadow">업데이트</button>
              <button onClick={() => setEditProblem(null)} className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md transition">취소</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
