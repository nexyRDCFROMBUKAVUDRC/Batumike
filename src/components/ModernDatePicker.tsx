import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';

interface ModernDatePickerProps {
  value: string; // Format YYYY-MM-DD
  onChange: (date: string) => void;
  isConfirmed?: boolean;
  onConfirmationChange?: (confirmed: boolean) => void;
  requiredAge?: number;
}

const MONTHS = [
  { value: 1, name: 'Janvier', short: 'Jan' },
  { value: 2, name: 'Février', short: 'Fév' },
  { value: 3, name: 'Mars', short: 'Mar' },
  { value: 4, name: 'Avril', short: 'Avr' },
  { value: 5, name: 'Mai', short: 'Mai' },
  { value: 6, name: 'Juin', short: 'Juin' },
  { value: 7, name: 'Juillet', short: 'Juil' },
  { value: 8, name: 'Août', short: 'Août' },
  { value: 9, name: 'Septembre', short: 'Sep' },
  { value: 10, name: 'Octobre', short: 'Oct' },
  { value: 11, name: 'Novembre', short: 'Nov' },
  { value: 12, name: 'Décembre', short: 'Déc' },
];

export const ModernDatePicker: React.FC<ModernDatePickerProps> = ({
  value,
  onChange,
  onConfirmationChange,
  requiredAge = 18,
}) => {
  const { theme, isDark } = useTheme();

  const today = new Date();
  const currentFullYear = today.getFullYear();
  const maxAdultYear = currentFullYear - requiredAge;

  const parseDate = (dStr: string) => {
    if (!dStr) return { day: 15, month: 6, year: 2000 };
    const parts = dStr.split('-').map(Number);
    return {
      year: parts[0] || 2000,
      month: parts[1] || 6,
      day: parts[2] || 15,
    };
  };

  const initial = parseDate(value);
  const [day, setDay] = useState<number>(initial.day);
  const [month, setMonth] = useState<number>(initial.month);
  const [year, setYear] = useState<number>(initial.year);

  // Synchronise when external value changes
  useEffect(() => {
    if (value) {
      const p = parseDate(value);
      setDay(p.day);
      setMonth(p.month);
      setYear(p.year);
    }
  }, [value]);

  // Dynamic days count in month (handles leap years)
  const getDaysCount = (y: number, m: number) => {
    return new Date(y, m, 0).getDate();
  };

  const maxDays = getDaysCount(year, month);

  // Auto-correct if day is out of bounds
  useEffect(() => {
    if (day > maxDays) {
      handleDateChange(maxDays, month, year);
    }
  }, [maxDays]);

  const handleDateChange = (newDay: number, newMonth: number, newYear: number) => {
    setDay(newDay);
    setMonth(newMonth);
    setYear(newYear);

    const dStr = String(newDay).padStart(2, '0');
    const mStr = String(newMonth).padStart(2, '0');
    onChange(`${newYear}-${mStr}-${dStr}`);
    if (onConfirmationChange) {
      onConfirmationChange(true);
    }
  };

  // Age calculation
  const calculateAge = (d: number, m: number, y: number) => {
    let age = today.getFullYear() - y;
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    if (currentMonth < m || (currentMonth === m && currentDay < d)) {
      age--;
    }
    return age;
  };

  const currentAge = calculateAge(day, month, year);
  const isAdult = currentAge >= requiredAge;

  // Years array: maxAdultYear down to 1920
  const years = Array.from({ length: maxAdultYear - 1920 + 1 }, (_, i) => maxAdultYear - i);
  const days = Array.from({ length: maxDays }, (_, i) => i + 1);

  return (
    <div className="space-y-2">
      {/* Label date de naissance */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <CalendarIcon size={14} className="text-blue-500" />
          <span>Date de naissance <span className="text-red-500">*</span></span>
        </label>
        <span
          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
            isAdult
              ? 'bg-green-500/15 text-green-500 border border-green-500/30'
              : 'bg-red-500/15 text-red-500 border border-red-500/30'
          }`}
        >
          {isAdult ? (
            <>
              <CheckCircle2 size={12} />
              <span>{currentAge} ans (Éligible 18+)</span>
            </>
          ) : (
            <>
              <AlertCircle size={12} />
              <span>{currentAge} ans (Moins de 18 ans)</span>
            </>
          )}
        </span>
      </div>

      {/* 3 Petits Carrés Alignés Côte à Côte (Format : Jour | Mois | Année) */}
      <div className="grid grid-cols-3 gap-2">
        {/* CARRÉ 1: JOUR */}
        <div className="relative">
          <select
            id="select-birth-day"
            aria-label="Jour de naissance"
            value={day}
            onChange={(e) => handleDateChange(Number(e.target.value), month, year)}
            className="w-full h-11 px-3 pr-8 rounded-xl border-2 text-xs font-bold appearance-none cursor-pointer focus:outline-none focus:border-blue-500 transition-all"
            style={{
              borderColor: theme.border,
              backgroundColor: isDark ? '#1a1a1e' : '#f8fafc',
              color: theme.text,
            }}
          >
            {days.map((d) => (
              <option
                key={d}
                value={d}
                style={{
                  backgroundColor: isDark ? '#1a1a1e' : '#ffffff',
                  color: isDark ? '#ffffff' : '#000000',
                }}
              >
                {d}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400"
          />
        </div>

        {/* CARRÉ 2: MOIS */}
        <div className="relative">
          <select
            id="select-birth-month"
            aria-label="Mois de naissance"
            value={month}
            onChange={(e) => handleDateChange(day, Number(e.target.value), year)}
            className="w-full h-11 px-3 pr-8 rounded-xl border-2 text-xs font-bold appearance-none cursor-pointer focus:outline-none focus:border-blue-500 transition-all capitalize"
            style={{
              borderColor: theme.border,
              backgroundColor: isDark ? '#1a1a1e' : '#f8fafc',
              color: theme.text,
            }}
          >
            {MONTHS.map((m) => (
              <option
                key={m.value}
                value={m.value}
                style={{
                  backgroundColor: isDark ? '#1a1a1e' : '#ffffff',
                  color: isDark ? '#ffffff' : '#000000',
                }}
              >
                {m.short}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400"
          />
        </div>

        {/* CARRÉ 3: ANNÉE */}
        <div className="relative">
          <select
            id="select-birth-year"
            aria-label="Année de naissance"
            value={year}
            onChange={(e) => handleDateChange(day, month, Number(e.target.value))}
            className="w-full h-11 px-3 pr-8 rounded-xl border-2 text-xs font-bold appearance-none cursor-pointer focus:outline-none focus:border-blue-500 transition-all"
            style={{
              borderColor: theme.border,
              backgroundColor: isDark ? '#1a1a1e' : '#f8fafc',
              color: theme.text,
            }}
          >
            {years.map((y) => (
              <option
                key={y}
                value={y}
                style={{
                  backgroundColor: isDark ? '#1a1a1e' : '#ffffff',
                  color: isDark ? '#ffffff' : '#000000',
                }}
              >
                {y}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400"
          />
        </div>
      </div>
    </div>
  );
};
