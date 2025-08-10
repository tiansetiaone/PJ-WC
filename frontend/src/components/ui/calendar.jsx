import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, 
         eachDayOfInterval, isSameMonth, isSameDay, addDays } from 'date-fns';

export const Calendar = ({ 
  selected, 
  onSelect, 
  className = '',
  mode = 'single'
}) => {
  const [currentMonth, setCurrentMonth] = useState(selected || new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`bg-white rounded-md shadow-md p-4 w-[280px] ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <button onClick={prevMonth} className="p-1 rounded hover:bg-gray-100">
          &lt;
        </button>
        <h2 className="font-medium">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-100">
          &gt;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {monthDays.map(day => {
          const isSelected = selected && isSameDay(day, selected);
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <button
              key={day.toString()}
              onClick={() => onSelect(day)}
              className={`p-2 rounded-full text-sm
                ${isSelected ? 'bg-blue-500 text-white' : ''}
                ${!isCurrentMonth ? 'text-gray-300' : 'hover:bg-gray-100'}
              `}
              disabled={!isCurrentMonth}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
};