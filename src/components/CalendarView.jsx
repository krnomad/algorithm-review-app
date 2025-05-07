import React, { useState } from 'react';
import {
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  format,
} from 'date-fns';
import { supabase } from '../lib/supabase';

const formatDate = (date) => format(date, 'yyyy-MM-dd');

const getColor = (count) => {
  if (count >= 10) return 'bg-red-300';
  if (count >= 5) return 'bg-yellow-200';
  if (count > 0) return 'bg-green-100';
  return 'bg-white';
};

const CalendarView = ({ problems }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const todayStr = formatDate(new Date());

  const start = startOfMonth(viewDate);
  const end = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start, end });

  const reviewMap = {};
  for (const p of problems) {
    for (let i = 1; i <= 5; i++) {
      const date = p[`review${i}_date`];
      const done = p[`review${i}_done`];
      if (!done) {
        if (!reviewMap[date]) reviewMap[date] = [];
        reviewMap[date].push({ ...p, step: i });
      }
    }
  }

  const handleComplete = async (p, step) => {
    const doneKey = `review${step}_done`;
    const { error } = await supabase
      .from('problems')
      .update({ [doneKey]: true })
      .eq('id', p.id);
    if (!error) {
      window.location.reload(); // 간단하게 새로고침
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setViewDate(subMonths(viewDate, 1))}
          className="text-sm px-2 py-1 border rounded"
        >
          ◀ 이전달
        </button>
        <h3 className="text-lg font-semibold">
          {format(viewDate, 'yyyy년 MM월')}
        </h3>
        <button
          onClick={() => setViewDate(addMonths(viewDate, 1))}
          className="text-sm px-2 py-1 border rounded"
        >
          다음달 ▶
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-sm">
        {days.map((day) => {
          const dateStr = formatDate(day);
          const count = reviewMap[dateStr]?.length || 0;
          const isToday = dateStr === todayStr;

          return (
            <div
              key={dateStr}
              className={`border rounded p-2 h-20 flex flex-col items-start justify-start cursor-pointer ${getColor(
                count
              )} ${isToday ? 'border-blue-500' : ''}`}
              onClick={() => setSelectedDate(dateStr)}
            >
              <div className="font-semibold">{day.getDate()}</div>
              {count > 0 && (
                <div className="text-xs mt-1 text-red-700 font-medium">
                  복습 {count}개
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedDate && reviewMap[selectedDate] && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full relative">
            <h3 className="text-lg font-bold mb-4">
              📅 {selectedDate} 복습 예정 문제
            </h3>
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {reviewMap[selectedDate].map((p) => (
                <li key={`${p.id}-${p.step}`} className="text-sm border-b pb-1">
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {p.problem_id} - {p.name}
                  </a>
                  <span className="text-gray-500 ml-1">(R{p.step})</span>
                  <button
                    onClick={() => handleComplete(p, p.step)}
                    className="ml-2 px-2 py-0.5 text-xs bg-green-500 text-white rounded"
                  >
                    복습 완료
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setSelectedDate(null)}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
