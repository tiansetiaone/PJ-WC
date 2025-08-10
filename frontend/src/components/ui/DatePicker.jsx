import React from 'react';
import { format } from 'date-fns';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import { Button } from './button';

export function DatePicker({
  className = '',
  selected,
  onSelect,
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-start text-left font-normal ${className}`}
        >
          {selected ? format(selected, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          selected={selected}
          onSelect={onSelect}
        />
      </PopoverContent>
    </Popover>
  );
}