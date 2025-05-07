// App.jsx
import { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, PlusCircle, ListTodo, LayoutDashboard, NotebookPen } from 'lucide-react';
import { supabase } from './lib/supabase';
import _ from 'lodash';

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
    review5_date: formatDate(review5),
  };
};

export default function App() {
  const [problems, setProblems] = useState([]);
  const [newProblem, setNewProblem] = useState({
    problem_id: '',
    name: '',
    difficulty: '',
    category: '',
    solved_date: formatDate(today),
  });
  const [activeTab, setActiveTab] = useState('today');

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from('problems').select('*');
      if (error) console.error(error);
      else setProblems(data);
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProblem(prev => ({ ...prev, [name]: value }));
  };

  const handleAddProblem = async (e) => {
    e.preventDefault();
    if (!newProblem.problem_id || !newProblem.name) return alert('문제 번호와 이름은 필수입니다.');

    const reviewDates = calculateReviewDates(newProblem.solved_date);
    const { data, error } = await supabase.from('problems').insert([{ ...newProblem, ...reviewDates }]).select();
    if (error) return alert('문제 추가 실패');

    setProblems(prev => [...prev, ...data]);
    setNewProblem({ problem_id: '', name: '', difficulty: '', category: '', solved_date: formatDate(today) });
  };

  const handleReviewToggle = async (id, reviewField) => {
    const target = problems.find(p => p.id === id);
    if (!target) return;
    const newValue = !target[reviewField];
    const { error } = await supabase.from('problems').update({ [reviewField]: newValue }).eq('id', id);
    if (error) return alert('업데이트 실패');
    setProblems(prev => prev.map(p => p.id === id ? { ...p, [reviewField]: newValue } : p));
  };

  const todayStr = formatDate(today);
  const todayReviews = useMemo(() => problems.filter(p => {
    return (
      (!p.review1_done && p.review1_date <= todayStr) ||
      (!p.review2_done && p.review2_date <= todayStr) ||
      (!p.review3_done && p.review3_date <= todayStr) ||
      (!p.review4_done && p.review4_date <= todayStr) ||
      (!p.review5_done && p.review5_date <= todayStr)
    );
  }), [problems]);

  const weeklyReviews = useMemo(() => {
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    const sundayStr = formatDate(sunday);
    const saturdayStr = formatDate(saturday);
    return problems.filter(p => p.solved_date >= sundayStr && p.solved_date <= saturdayStr);
  }, [problems]);

  const renderTabs = () => (
    <div className="flex justify-center space-x-4 mb-6 bg-white/80 p-3 rounded shadow">
      <button className={`${activeTab === 'today' ? 'text-blue-600 font-bold' : ''}`} onClick={() => setActiveTab('today')}><ListTodo size={18}/> 오늘 복습</button>
      <button className={`${activeTab === 'weekly' ? 'text-green-600 font-bold' : ''}`} onClick={() => setActiveTab('weekly')}><Calendar size={18}/> 주간 복습</button>
      <button className={`${activeTab === 'all' ? 'text-purple-600 font-bold' : ''}`} onClick={() => setActiveTab('all')}><LayoutDashboard size={18}/> 전체</button>
      <button className={`${activeTab === 'add' ? 'text-orange-600 font-bold' : ''}`} onClick={() => setActiveTab('add')}><PlusCircle size={18}/> 문제 추가</button>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6 flex items-center justify-center gap-2 text-blue-700">
        <NotebookPen /> 알고리즘 복습 매니저
      </h1>
      {renderTabs()}

      {activeTab === 'today' && (
        <div>
          <h2 className="text-xl font-semibold mb-3">오늘 복습할 문제</h2>
          <ul className="list-disc pl-5">
            {todayReviews.map(p => (
              <li key={p.id}>{p.problem_id} - {p.name}</li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'weekly' && (
        <div>
          <h2 className="text-xl font-semibold mb-3">주간 복습</h2>
          <ul className="list-disc pl-5">
            {weeklyReviews.map(p => (
              <li key={p.id}>{p.problem_id} - {p.name}</li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'all' && (
        <div>
          <h2 className="text-xl font-semibold mb-3">전체 문제 목록</h2>
          <ul className="list-disc pl-5">
            {_.sortBy(problems, ['solved_date']).map(p => (
              <li key={p.id}>{p.problem_id} - {p.name}</li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'add' && (
        <form onSubmit={handleAddProblem} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input name="problem_id" value={newProblem.problem_id} onChange={handleInputChange} placeholder="문제 번호" className="border p-2 rounded" />
          <input name="name" value={newProblem.name} onChange={handleInputChange} placeholder="문제명" className="border p-2 rounded" />
          <input name="difficulty" value={newProblem.difficulty} onChange={handleInputChange} placeholder="난이도" className="border p-2 rounded" />
          <input name="category" value={newProblem.category} onChange={handleInputChange} placeholder="카테고리" className="border p-2 rounded" />
          <input type="date" name="solved_date" value={newProblem.solved_date} onChange={handleInputChange} className="border p-2 rounded col-span-full" />
          <button type="submit" className="bg-blue-600 text-white py-2 rounded col-span-full">추가하기</button>
        </form>
      )}
    </div>
  );
}
